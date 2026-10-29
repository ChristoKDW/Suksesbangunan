import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, IsNull, LessThanOrEqual, Repository } from 'typeorm';
import { PengajuanPencairan } from './entities/pengajuan-pencairan.entity.js';
import { ApprovalPencairanDto, CreatePencairanDto } from './dto/pencairan.dto.js';
import { Karyawan } from '../karyawan/entities/karyawan.entity.js';
import { SaldoRo } from '../regular-off/entities/saldo-ro.entity.js';
import { User } from '../user/entities/user.entity.js';
import { NotificationService } from '../notification/notification.service.js';
import { PengajuanIzinService } from '../pengajuan-izin/pengajuan-izin.service.js';
import { AturanPengajuanService } from '../aturan-pengajuan/aturan-pengajuan.service.js';
import { businessToday } from '../common/utils/business-date.util.js';

const LABEL = { ro: 'RO', cuti: 'Cuti' } as const;
const RELATIONS = { karyawan: { departemen: true, jabatan: true }, userSpv: true, userHrd: true };

type WebUser = { idUser: number; role: string; idDepartemen?: number };

/**
 * Pencairan (diuangkan) saldo RO & cuti tahunan lewat pengajuan mobile.
 * Alur SPV → HRD (pemohon SPV / kantor langsung HRD). Saldo dikunci saat diajukan,
 * dibayar di payroll periode cut-off tempat HRD menyetujui (1 hari = gaji pokok ÷ hari kerja periode).
 */
@Injectable()
export class PencairanService {
  constructor(
    @InjectRepository(PengajuanPencairan)
    private readonly repo: Repository<PengajuanPencairan>,
    @InjectRepository(Karyawan)
    private readonly karyawanRepo: Repository<Karyawan>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly notificationService: NotificationService,
    private readonly izinService: PengajuanIzinService,
    private readonly aturan?: AturanPengajuanService,
  ) {}

  /** Saldo yang bisa dicairkan: RO tersedia (belum kedaluwarsa) & sisa cuti tahun berjalan. */
  async getSaldo(idKaryawan: number) {
    const ro = await this.dataSource
      .getRepository(SaldoRo)
      .createQueryBuilder('s')
      .where('s.id_karyawan = :idKaryawan', { idKaryawan })
      .andWhere("s.status = 'tersedia'")
      .andWhere('s.tanggal_kadaluarsa >= :today', { today: businessToday() })
      .getCount();
    const cuti = await this.izinService.getSaldoCuti(idKaryawan);
    return { ro, cuti };
  }

  async ajukan(idKaryawan: number, dto: CreatePencairanDto) {
    const k = await this.karyawanRepo.findOne({
      where: { idKaryawan },
      relations: { departemen: { pengelola: true }, jabatan: true },
    });
    if (!k) throw new NotFoundException('Karyawan tidak ditemukan');
    if ((k.statusKaryawan || 'Internal') === 'External') {
      throw new BadRequestException('Karyawan External tidak dapat mengajukan pencairan');
    }
    await this.aturan?.cekBatas(idKaryawan, 'pencairan');
    const status = this.aturan ? await this.aturan.statusAwal(k) : 'menunggu_hrd';
    const tahun = Number(businessToday().slice(0, 4));

    const saved = await this.dataSource.transaction('SERIALIZABLE', async (manager) => {
      const repo = manager.getRepository(PengajuanPencairan);
      if (dto.jenis === 'cuti') {
        const saldo = await this.izinService.getSaldoCuti(idKaryawan, tahun);
        if (!saldo.hakCuti) {
          throw new BadRequestException('Anda belum memiliki hak cuti tahunan dari HRD.');
        }
        if (dto.jumlahHari > saldo.sisa) {
          throw new BadRequestException(
            `Sisa cuti tahun ${tahun} hanya ${saldo.sisa} hari. Anda mengajukan pencairan ${dto.jumlahHari} hari.`,
          );
        }
      }
      const p = await repo.save(
        repo.create({
          idKaryawan,
          jenis: dto.jenis,
          jumlahHari: dto.jumlahHari,
          tahun: dto.jenis === 'cuti' ? tahun : null,
          alasan: dto.alasan || null,
          status,
        }),
      );
      if (dto.jenis === 'ro') {
        // Kunci saldo RO paling cepat kedaluwarsa (FIFO)
        const saldoRepo = manager.getRepository(SaldoRo);
        const saldo = await saldoRepo
          .createQueryBuilder('s')
          .setLock('pessimistic_write')
          .where('s.id_karyawan = :idKaryawan', { idKaryawan })
          .andWhere("s.status = 'tersedia'")
          .andWhere('s.tanggal_kadaluarsa >= :today', { today: businessToday() })
          .orderBy('s.tanggal_kadaluarsa', 'ASC')
          .addOrderBy('s.id_saldo_ro', 'ASC')
          .take(dto.jumlahHari)
          .getMany();
        if (saldo.length < dto.jumlahHari) {
          throw new BadRequestException(
            `Saldo RO tersedia hanya ${saldo.length} hari. Anda mengajukan pencairan ${dto.jumlahHari} hari.`,
          );
        }
        for (const s of saldo) {
          s.status = 'diajukan';
          s.idPencairan = p.idPencairan;
        }
        await saldoRepo.save(saldo);
      }
      return p;
    });

    await this.notifyApprover(
      status,
      k,
      `Pengajuan Pencairan ${LABEL[dto.jenis]} Baru`,
      `${k.nama} mengajukan pencairan ${LABEL[dto.jenis]} ${dto.jumlahHari} hari. Menunggu persetujuan Anda.`,
    );
    return this.findOne(saved.idPencairan);
  }

  /** SPV memproses tahap 1 (staf departemennya); HRD/Admin memproses tahap akhir. */
  async approval(id: number, user: WebUser, dto: ApprovalPencairanDto) {
    const tahapSpv = user.role === 'SPV';
    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(PengajuanPencairan);
      const p = await repo.findOne({ where: { idPencairan: id }, lock: { mode: 'pessimistic_write' } });
      if (!p) throw new NotFoundException(`Pengajuan pencairan #${id} tidak ditemukan`);
      const k = await manager.getRepository(Karyawan).findOne({ where: { idKaryawan: p.idKaryawan } });

      if (tahapSpv) {
        if (p.status !== 'menunggu_spv') {
          throw new BadRequestException(`Pengajuan tidak dapat diproses SPV (status: ${p.status})`);
        }
        if (!user.idDepartemen || k?.idDepartemen !== user.idDepartemen) {
          throw new ForbiddenException('Anda hanya dapat memproses pengajuan karyawan di departemen Anda');
        }
        p.idUserSpv = user.idUser;
        p.catatanSpv = dto.catatan || null;
        p.status = dto.setuju ? 'menunggu_hrd' : 'ditolak_spv';
      } else {
        // HRD/Admin: menunggu_spv boleh diproses sebagai cadangan SPV, langsung final
        if (!['menunggu_spv', 'menunggu_hrd'].includes(p.status)) {
          throw new BadRequestException(`Pengajuan sudah diproses (status: ${p.status})`);
        }
        p.idUserHrd = user.idUser;
        p.catatanHrd = dto.catatan || null;
        p.status = dto.setuju ? 'disetujui' : 'ditolak_hrd';
        if (dto.setuju) p.tanggalDisetujui = businessToday();
      }
      await repo.save(p);

      if (p.jenis === 'ro' && p.status !== 'menunggu_hrd') {
        await this.lepasSaldoRo(manager, p, p.status === 'disetujui');
      }
    });

    const p = await this.findOne(id);
    const label = `Pencairan ${LABEL[p.jenis]} ${p.jumlahHari} hari`;
    if (p.status === 'menunggu_hrd') {
      await this.notifyApprover(p.status, p.karyawan, `${label} Menunggu HRD`, `${label} ${p.karyawan?.nama} telah disetujui SPV dan memerlukan persetujuan HRD.`);
    } else {
      const catatan = p.catatanHrd || p.catatanSpv;
      await this.notify(
        p.idKaryawan,
        p.status === 'disetujui' ? `${label} Disetujui` : `${label} Ditolak`,
        p.status === 'disetujui'
          ? `${label} disetujui HRD dan akan dibayarkan pada slip gaji periode berjalan.`
          : `${label} ditolak.${catatan ? ` Catatan: "${catatan}"` : ''} Saldo dikembalikan.`,
      );
    }
    return p;
  }

  /** Karyawan membatalkan pengajuannya sebelum disetujui HRD. */
  async batal(id: number, idKaryawan: number) {
    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(PengajuanPencairan);
      const p = await repo.findOne({ where: { idPencairan: id }, lock: { mode: 'pessimistic_write' } });
      if (!p) throw new NotFoundException(`Pengajuan pencairan #${id} tidak ditemukan`);
      if (p.idKaryawan !== idKaryawan) throw new ForbiddenException('Bukan pengajuan Anda');
      if (!['menunggu_spv', 'menunggu_hrd'].includes(p.status)) {
        throw new BadRequestException('Pengajuan hanya dapat dibatalkan sebelum disetujui HRD');
      }
      p.status = 'dibatalkan';
      await repo.save(p);
      if (p.jenis === 'ro') await this.lepasSaldoRo(manager, p, false);
    });
    return this.findOne(id);
  }

  findMine(idKaryawan: number) {
    return this.repo.find({ where: { idKaryawan }, relations: RELATIONS, order: { createdAt: 'DESC' } });
  }

  /** SPV: pengajuan departemennya; HRD/Admin: semua. */
  async findAll(user: WebUser) {
    if (user.role === 'SPV') {
      if (!user.idDepartemen) return [];
      return this.repo.find({
        where: { karyawan: { idDepartemen: user.idDepartemen } },
        relations: RELATIONS,
        order: { createdAt: 'DESC' },
      });
    }
    return this.repo.find({ relations: RELATIONS, order: { createdAt: 'DESC' } });
  }

  async findOne(id: number) {
    const p = await this.repo.findOne({ where: { idPencairan: id }, relations: RELATIONS });
    if (!p) throw new NotFoundException(`Pengajuan pencairan #${id} tidak ditemukan`);
    return p;
  }

  // ======================= Integrasi payroll =======================

  /**
   * Pencairan yang dibayar di slip periode ini: disetujui HRD paling lambat tanggal akhir
   * periode dan belum dibayar di slip lain (idempoten saat Generate ulang).
   */
  untukSlip(idKaryawan: number, periodeAkhir: string, idGaji?: number) {
    return this.repo.find({
      where: [
        { idKaryawan, status: 'disetujui', tanggalDisetujui: LessThanOrEqual(periodeAkhir), idGaji: IsNull() },
        ...(idGaji ? [{ idKaryawan, status: 'disetujui' as const, idGaji }] : []),
      ],
    });
  }

  /** Catat slip & nominal per pencairan setelah slip disimpan. */
  async tandaiSlip(idGaji: number, list: PengajuanPencairan[], tarifHarian: number) {
    const ids = new Set(list.map((p) => p.idPencairan));
    // Lepas pencairan yang sebelumnya menempel di slip ini tapi kini tidak termasuk
    const lama = await this.repo.find({ where: { idGaji } });
    for (const p of lama.filter((x) => !ids.has(x.idPencairan))) {
      await this.repo.update(p.idPencairan, { idGaji: null, nominal: 0 });
    }
    for (const p of list) {
      await this.repo.update(p.idPencairan, { idGaji, nominal: Math.round(tarifHarian * p.jumlahHari) });
    }
  }

  // ======================= Helper =======================

  private async lepasSaldoRo(manager: EntityManager, p: PengajuanPencairan, dipakai: boolean) {
    const saldoRepo = manager.getRepository(SaldoRo);
    if (!dipakai) {
      await saldoRepo.update({ idPencairan: p.idPencairan }, { status: 'tersedia', idPencairan: null });
      return;
    }
    const saldo = await saldoRepo.find({ where: { idPencairan: p.idPencairan, status: 'diajukan' } });
    if (saldo.length !== p.jumlahHari) {
      throw new BadRequestException('Alokasi saldo RO tidak lagi valid; persetujuan dibatalkan');
    }
    for (const s of saldo) {
      s.status = 'digunakan';
      s.keterangan = `Dicairkan (Pencairan #${p.idPencairan})`;
    }
    await saldoRepo.save(saldo);
  }

  private async notifyApprover(status: string, k: Karyawan | undefined, title: string, message: string) {
    try {
      const users = await this.userRepo.find({
        where:
          status === 'menunggu_spv'
            ? [{ role: 'SPV' as any, idDepartemen: k?.idDepartemen ?? -1 }]
            : [{ role: 'HRD' as any }, { role: 'Admin' as any }],
      });
      for (const u of users) {
        await this.notificationService.createNotification({ idUser: u.idUser, title, message, type: 'pencairan' });
      }
    } catch (e) {
      console.error('Gagal kirim notifikasi pencairan:', e);
    }
  }

  private async notify(idKaryawan: number, title: string, message: string) {
    try {
      await this.notificationService.createNotification({ idKaryawan, title, message, type: 'pencairan' });
    } catch (e) {
      console.error('Gagal kirim notifikasi pencairan:', e);
    }
  }
}
