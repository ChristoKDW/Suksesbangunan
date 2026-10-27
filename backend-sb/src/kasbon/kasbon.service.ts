import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Not, Repository } from 'typeorm';
import { Kasbon, KasbonCicilan } from './entities/kasbon.entity.js';
import { Karyawan } from '../karyawan/entities/karyawan.entity.js';
import { ApprovalKasbonDto, CreateKasbonDto, PengajuanKasbonDto } from './dto/kasbon.dto.js';
import { NotificationService } from '../notification/notification.service.js';
import { AturanPengajuanService } from '../aturan-pengajuan/aturan-pengajuan.service.js';
import { businessToday } from '../common/utils/business-date.util.js';

export interface RencanaCicilan {
  adaKasbon: boolean; // karyawan punya kasbon aktif/lunas yang relevan
  total: number; // total potongan kasbon periode ini
  sisaSetelah: number; // total sisa pinjaman setelah potongan periode ini
  items: { idKasbon: number; nominal: number }[];
}

const rp = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;

/** Bulan periode gaji berikutnya (YYYY-MM) sebagai default mulai potong. */
function periodeBerikut(): string {
  const [y, m] = businessToday().split('-').map(Number);
  const d = new Date(Date.UTC(y, m, 1)); // bulan depan
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

@Injectable()
export class KasbonService {
  constructor(
    @InjectRepository(Kasbon)
    private readonly kasbonRepo: Repository<Kasbon>,
    @InjectRepository(KasbonCicilan)
    private readonly cicilanRepo: Repository<KasbonCicilan>,
    @InjectRepository(Karyawan)
    private readonly karyawanRepo: Repository<Karyawan>,
    private readonly notificationService: NotificationService,
    private readonly aturan?: AturanPengajuanService,
  ) {}

  // ======================= Ringkasan & daftar =======================

  /** Lengkapi kasbon dengan total terbayar, sisa, dan riwayat cicilan. */
  private async withSaldo(list: Kasbon[]) {
    if (list.length === 0) return [];
    const cicilan = await this.cicilanRepo.find({
      where: { idKasbon: In(list.map((k) => k.idKasbon)) },
      order: { periodeAkhir: 'ASC' },
    });
    return list.map((k) => {
      const riwayat = cicilan.filter((c) => c.idKasbon === k.idKasbon);
      const terbayar = riwayat.reduce((s, c) => s + Number(c.nominal), 0);
      return {
        ...k,
        terbayar,
        sisa: Math.max(0, Number(k.jumlah) - terbayar),
        riwayat: riwayat.map((c) => ({
          idGaji: c.idGaji,
          periodeAkhir: c.periodeAkhir,
          nominal: Number(c.nominal),
        })),
      };
    });
  }

  async findAll(status?: string) {
    const list = await this.kasbonRepo.find({
      where: status && status !== 'semua' ? { status: status as any } : {},
      relations: { karyawan: { departemen: true } },
      order: { createdAt: 'DESC' },
    });
    return this.withSaldo(list);
  }

  async findMine(idKaryawan: number) {
    const list = await this.kasbonRepo.find({
      where: { idKaryawan },
      order: { createdAt: 'DESC' },
    });
    const data = await this.withSaldo(list);
    return {
      totalSisa: data
        .filter((k) => k.status === 'aktif')
        .reduce((s, k) => s + k.sisa, 0),
      kasbon: data,
    };
  }

  private async getOrFail(id: number) {
    const k = await this.kasbonRepo.findOne({
      where: { idKasbon: id },
      relations: { karyawan: true },
    });
    if (!k) throw new NotFoundException('Data kasbon tidak ditemukan');
    return k;
  }

  private async assertKaryawanInternal(idKaryawan: number) {
    const karyawan = await this.karyawanRepo.findOne({ where: { idKaryawan } });
    if (!karyawan) throw new NotFoundException('Karyawan tidak ditemukan');
    if ((karyawan.statusKaryawan || 'Internal') === 'External') {
      throw new BadRequestException(
        'Karyawan External tidak digaji oleh perusahaan sehingga tidak dapat kasbon.',
      );
    }
    return karyawan;
  }

  private validasiNominal(jumlah: number, cicilan: number) {
    if (cicilan > jumlah) {
      throw new BadRequestException('Cicilan per bulan tidak boleh melebihi jumlah kasbon');
    }
  }

  // ======================= Pencatatan & persetujuan =======================

  /** HRD mencatat kasbon → langsung aktif dan dipotong otomatis di payroll. */
  async create(dto: CreateKasbonDto, idUser: number) {
    const karyawan = await this.assertKaryawanInternal(dto.idKaryawan);
    this.validasiNominal(dto.jumlah, dto.cicilanPerBulan);
    const saved = await this.kasbonRepo.save(
      this.kasbonRepo.create({
        idKaryawan: dto.idKaryawan,
        jumlah: Math.round(dto.jumlah),
        cicilanPerBulan: Math.round(dto.cicilanPerBulan),
        mulaiPeriode: dto.mulaiPeriode,
        alasan: dto.alasan ?? null,
        catatanHrd: dto.catatanHrd ?? null,
        status: 'aktif',
        sumber: 'hrd',
        idUserHrd: idUser,
        tanggalDiproses: new Date(),
      }),
    );
    await this.notify(
      dto.idKaryawan,
      'Kasbon Tercatat',
      `Kasbon ${rp(dto.jumlah)} untuk ${karyawan.nama} dicatat HRD. Cicilan ${rp(dto.cicilanPerBulan)} dipotong otomatis dari gaji mulai periode ${dto.mulaiPeriode}.`,
    );
    return (await this.withSaldo([saved]))[0];
  }

  /** Karyawan mengajukan kasbon dari mobile (menunggu persetujuan HRD). */
  async ajukan(idKaryawan: number, dto: PengajuanKasbonDto) {
    const karyawan = await this.assertKaryawanInternal(idKaryawan);
    this.validasiNominal(dto.jumlah, dto.cicilanPerBulan);
    // Batas kasbon berjalan (menunggu/aktif) sekaligus — diatur HRD, default 1
    await this.aturan?.cekBatas(idKaryawan, 'kasbon');
    const saved = await this.kasbonRepo.save(
      this.kasbonRepo.create({
        idKaryawan,
        jumlah: Math.round(dto.jumlah),
        cicilanPerBulan: Math.round(dto.cicilanPerBulan),
        mulaiPeriode: periodeBerikut(),
        alasan: dto.alasan,
        status: 'menunggu',
        sumber: 'mobile',
      }),
    );
    try {
      await this.notificationService.createNotification({
        title: 'Pengajuan Kasbon Baru',
        message: `${karyawan.nama} mengajukan kasbon ${rp(dto.jumlah)} (cicilan ${rp(dto.cicilanPerBulan)}/bulan). Mohon diproses di menu Kasbon.`,
        type: 'kasbon',
      });
    } catch {
      // notifikasi opsional
    }
    return (await this.withSaldo([saved]))[0];
  }

  async approval(id: number, dto: ApprovalKasbonDto, idUser: number) {
    const k = await this.getOrFail(id);
    if (k.status !== 'menunggu') {
      throw new BadRequestException(`Kasbon sudah diproses (status: ${k.status})`);
    }
    if (dto.setuju) {
      if (dto.cicilanPerBulan) k.cicilanPerBulan = Math.round(dto.cicilanPerBulan);
      if (dto.mulaiPeriode) k.mulaiPeriode = dto.mulaiPeriode;
      this.validasiNominal(Number(k.jumlah), Number(k.cicilanPerBulan));
    }
    k.status = dto.setuju ? 'aktif' : 'ditolak';
    k.catatanHrd = dto.catatanHrd ?? null;
    k.idUserHrd = idUser;
    k.tanggalDiproses = new Date();
    await this.kasbonRepo.save(k);
    await this.notify(
      k.idKaryawan,
      dto.setuju ? 'Kasbon Disetujui' : 'Kasbon Ditolak',
      dto.setuju
        ? `Kasbon ${rp(k.jumlah)} disetujui. Cicilan ${rp(k.cicilanPerBulan)} dipotong otomatis dari gaji mulai periode ${k.mulaiPeriode}.`
        : `Pengajuan kasbon ${rp(k.jumlah)} ditolak HRD.${k.catatanHrd ? ` Catatan: "${k.catatanHrd}"` : ''}`,
    );
    return (await this.withSaldo([k]))[0];
  }

  /** Hentikan kasbon (mis. dilunasi tunai). Cicilan yang sudah terpotong tetap tercatat. */
  async batalkan(id: number, catatan: string | undefined, idUser: number) {
    const k = await this.getOrFail(id);
    if (!['menunggu', 'aktif'].includes(k.status)) {
      throw new BadRequestException(`Kasbon berstatus ${k.status} tidak dapat dibatalkan`);
    }
    k.status = 'dibatalkan';
    k.catatanHrd = catatan || k.catatanHrd;
    k.idUserHrd = idUser;
    k.tanggalDiproses = new Date();
    await this.kasbonRepo.save(k);
    return (await this.withSaldo([k]))[0];
  }

  /** Karyawan membatalkan pengajuannya sendiri selama belum diproses. */
  async batalkanPengajuan(id: number, idKaryawan: number) {
    const k = await this.getOrFail(id);
    if (k.idKaryawan !== idKaryawan) throw new NotFoundException('Data kasbon tidak ditemukan');
    if (k.status !== 'menunggu') {
      throw new BadRequestException('Hanya pengajuan yang menunggu yang dapat dibatalkan');
    }
    k.status = 'dibatalkan';
    await this.kasbonRepo.save(k);
    return (await this.withSaldo([k]))[0];
  }

  private async notify(idKaryawan: number, title: string, message: string) {
    try {
      await this.notificationService.createNotification({ idKaryawan, title, message, type: 'kasbon' });
    } catch {
      // notifikasi opsional
    }
  }

  // ======================= Integrasi payroll =======================

  /**
   * Hitung potongan kasbon untuk satu slip gaji. Kasbon aktif (dan yang sempat
   * lunas oleh slip ini) dipotong mulai bulan periodenya, maksimal cicilan
   * per bulan, maksimal sisa pinjaman, dan tidak membuat THP minus.
   * Cicilan slip yang sedang dihitung ulang (excludeIdGaji) diabaikan.
   */
  async rencanaCicilan(
    idKaryawan: number,
    periodeAkhir: string,
    batasPotongan: number,
    excludeIdGaji?: number,
  ): Promise<RencanaCicilan> {
    const bulan = periodeAkhir.slice(0, 7);
    const list = await this.kasbonRepo.find({
      where: { idKaryawan, status: In(['aktif', 'lunas']) },
      order: { createdAt: 'ASC' },
    });
    const relevan = list.filter((k) => k.mulaiPeriode <= bulan);
    if (relevan.length === 0) return { adaKasbon: false, total: 0, sisaSetelah: 0, items: [] };

    const cicilan = await this.cicilanRepo.find({
      where: {
        idKasbon: In(relevan.map((k) => k.idKasbon)),
        ...(excludeIdGaji ? { idGaji: Not(excludeIdGaji) } : {}),
      },
    });
    let batas = Math.max(0, Math.round(batasPotongan));
    let total = 0;
    let sisaSetelah = 0;
    const items: RencanaCicilan['items'] = [];
    for (const k of relevan) {
      const terbayar = cicilan
        .filter((c) => c.idKasbon === k.idKasbon)
        .reduce((s, c) => s + Number(c.nominal), 0);
      const sisa = Math.max(0, Number(k.jumlah) - terbayar);
      const nominal = Math.min(Number(k.cicilanPerBulan), sisa, batas);
      if (nominal > 0) {
        items.push({ idKasbon: k.idKasbon, nominal });
        batas -= nominal;
        total += nominal;
      }
      sisaSetelah += sisa - nominal;
    }
    return { adaKasbon: true, total, sisaSetelah, items };
  }

  /** Simpan cicilan slip (hapus yang lama → tulis ulang) & perbarui status lunas. */
  async simpanCicilan(
    idGaji: number,
    periodeAkhir: string,
    rencana: RencanaCicilan,
    manager?: EntityManager,
  ) {
    const repo = manager?.getRepository(KasbonCicilan) ?? this.cicilanRepo;
    const lama = await repo.find({ where: { idGaji } });
    await repo.delete({ idGaji });
    for (const item of rencana.items) {
      await repo.save(
        repo.create({ idKasbon: item.idKasbon, idGaji, periodeAkhir, nominal: item.nominal }),
      );
    }
    const terdampak = new Set([...lama.map((c) => c.idKasbon), ...rencana.items.map((i) => i.idKasbon)]);
    await this.perbaruiStatus([...terdampak], manager);
  }

  private async perbaruiStatus(ids: number[], manager?: EntityManager) {
    if (ids.length === 0) return;
    const kasbonRepo = manager?.getRepository(Kasbon) ?? this.kasbonRepo;
    const list = await kasbonRepo.find({ where: { idKasbon: In(ids), status: In(['aktif', 'lunas']) } });
    const saldo = await this.withSaldo(list);
    for (const k of saldo) {
      const status = k.sisa <= 0 ? 'lunas' : 'aktif';
      if (status !== k.status) {
        await kasbonRepo.update(k.idKasbon, { status });
        if (status === 'lunas') {
          await this.notify(k.idKaryawan, 'Kasbon Lunas 🎉', `Kasbon ${rp(k.jumlah)} Anda telah lunas melalui potongan gaji.`);
        }
      }
    }
  }

  /** Slip gaji ini memiliki cicilan kasbon otomatis (potongan pinjaman dikunci). */
  async adaCicilanUntukGaji(idGaji: number) {
    return (await this.cicilanRepo.count({ where: { idGaji } })) > 0;
  }
}
