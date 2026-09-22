import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SaldoRo } from './entities/saldo-ro.entity.js';
import { PengajuanRo } from './entities/pengajuan-ro.entity.js';
import { Karyawan } from '../karyawan/entities/karyawan.entity.js';
import { JadwalKerja } from '../jadwal-kerja/entities/jadwal-kerja.entity.js';
import { HariLibur } from '../hari-libur/entities/hari-libur.entity.js';
import { User } from '../user/entities/user.entity.js';
import { NotificationService } from '../notification/notification.service.js';
import { CreatePengajuanRoDto } from './dto/create-pengajuan-ro.dto.js';
import { ApprovalRoDto } from './dto/approval-ro.dto.js';
import { checkIndonesianHoliday } from '../hari-libur/indonesia-holidays.util.js';
import {
  addCalendarMonths,
  businessToday,
  normalizeDateOnly,
} from '../common/utils/business-date.util.js';

export function allocateRoBalances(
  balances: SaldoRo[],
  dates: string[],
): SaldoRo[] {
  const remaining = [...balances].sort(
    (a, b) =>
      normalizeDateOnly(a.tanggalKadaluarsa).localeCompare(
        normalizeDateOnly(b.tanggalKadaluarsa),
      ) || a.idSaldoRo - b.idSaldoRo,
  );
  return dates.map((target) => {
    const index = remaining.findIndex(
      (saldo) =>
        target.slice(0, 7) >
          normalizeDateOnly(saldo.tanggalPerolehan).slice(0, 7) &&
        target <= normalizeDateOnly(saldo.tanggalKadaluarsa),
    );
    if (index < 0) {
      throw new BadRequestException(
        `Tidak ada saldo RO yang sah untuk tanggal ${target}. RO baru dapat dipakai mulai bulan berikutnya dan tetap dapat dipakai pada tanggal kedaluwarsa.`,
      );
    }
    return remaining.splice(index, 1)[0];
  });
}

@Injectable()
export class RegularOffService {
  constructor(
    @InjectRepository(SaldoRo)
    private readonly saldoRoRepo: Repository<SaldoRo>,
    @InjectRepository(PengajuanRo)
    private readonly pengajuanRoRepo: Repository<PengajuanRo>,
    @InjectRepository(Karyawan)
    private readonly karyawanRepo: Repository<Karyawan>,
    @InjectRepository(JadwalKerja)
    private readonly jadwalRepo: Repository<JadwalKerja>,
    @InjectRepository(HariLibur)
    private readonly hariLiburRepo: Repository<HariLibur>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly notificationService: NotificationService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Cek apakah karyawan merupakan karyawan operasional (dikelola SPV)
   */
  isOperasionalKaryawan(karyawan: Karyawan): boolean {
    if (!karyawan || !karyawan.departemen) return false;
    const deptName = (karyawan.departemen.namaDepartemen || '')
      .toLowerCase()
      .replace(/[\s\-_]/g, '');

    const managers = Array.isArray(karyawan.departemen.pengelola)
      ? karyawan.departemen.pengelola
      : (karyawan.departemen as any).pengelola
        ? [(karyawan.departemen as any).pengelola]
        : [];

    const hasSpv = managers.some((m: any) => m.role === 'SPV');
    const isManagedByAdminOrHrd = managers.some(
      (m: any) => m.role === 'Admin' || m.role === 'HRD',
    );

    return (
      hasSpv &&
      !isManagedByAdminOrHrd &&
      deptName !== 'backoffice' &&
      deptName !== 'kantor'
    );
  }

  /**
   * Helper kalkulasi tanggal kadaluarsa 3 bulan kalender setelah tanggal perolehan
   */
  hitungTanggalKadaluarsa(tanggalStr: string): string {
    return addCalendarMonths(tanggalStr, 3);
  }

  /**
   * Helper hitung sisa hari sebelum tanggal kadaluarsa
   */
  hitungSisaHari(tanggalKadaluarsaStr: string): number {
    const today = new Date(`${businessToday()}T00:00:00.000Z`);
    const expDate = new Date(
      `${normalizeDateOnly(tanggalKadaluarsaStr)}T00:00:00.000Z`,
    );
    return Math.round((expDate.getTime() - today.getTime()) / 86400000);
  }

  /**
   * Cek apakah suatu tanggal adalah hari libur nasional resmi dan BUKAN hari Minggu
   */
  async cekLiburNasionalBukanMinggu(
    tanggalStr: string,
  ): Promise<{ isLiburNasional: boolean; namaLibur: string | null }> {
    const parts = tanggalStr.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    if (d.getDay() === 0) {
      // Hari Minggu
      return { isLiburNasional: false, namaLibur: null };
    }

    // 1. Cek tabel hari_libur di DB
    const dbHoliday = await this.hariLiburRepo.findOne({
      where: { tanggal: tanggalStr as any, isLibur: true },
    });
    if (dbHoliday) {
      return { isLiburNasional: true, namaLibur: dbHoliday.nama };
    }

    // 2. Cek utilitas kalender libur nasional Indonesia
    const officialHoliday = checkIndonesianHoliday(tanggalStr);
    if (officialHoliday && officialHoliday.isNationalHoliday) {
      return { isLiburNasional: true, namaLibur: officialHoliday.localName };
    }

    return { isLiburNasional: false, namaLibur: null };
  }

  /**
   * Cek eligibility karyawan operasional untuk mengakses menu RO
   */
  async checkEligibility(idKaryawan: number) {
    const k = await this.karyawanRepo.findOne({
      where: { idKaryawan },
      relations: { departemen: { pengelola: true } },
    });
    if (!k || !k.departemen) {
      return {
        isOperasional: false,
        namaDepartemen: null,
        reason: 'Departemen karyawan tidak ditemukan',
      };
    }

    const isOperasional = this.isOperasionalKaryawan(k);
    return {
      isOperasional,
      namaDepartemen: k.departemen.namaDepartemen,
      reason: isOperasional
        ? null
        : 'Fitur Regular Off (RO) hanya berlaku untuk karyawan operasional. Karyawan kantor otomatis libur pada Hari Libur Nasional.',
    };
  }

  /**
   * Generate saldo RO jika karyawan operasional hadir/absen pada hari libur nasional (bukan hari Minggu)
   */
  async createSaldoRoIfEligible(
    idKaryawan: number,
    tanggalStr: string,
  ): Promise<SaldoRo | null> {
    const k = await this.karyawanRepo.findOne({
      where: { idKaryawan },
      relations: { departemen: { pengelola: true } },
    });
    if (!k || !this.isOperasionalKaryawan(k)) {
      return null;
    }

    const { isLiburNasional, namaLibur } =
      await this.cekLiburNasionalBukanMinggu(tanggalStr);
    if (!isLiburNasional || !namaLibur) {
      return null;
    }

    // Cek apakah sudah pernah ada saldo RO untuk karyawan ini di tanggal libur nasional tsb
    const existing = await this.saldoRoRepo.findOne({
      where: {
        idKaryawan,
        tanggalLiburNasional: tanggalStr,
      },
    });
    if (existing) {
      return existing;
    }

    const tanggalKadaluarsa = this.hitungTanggalKadaluarsa(tanggalStr);

    const saldo = this.saldoRoRepo.create({
      idKaryawan,
      tanggalLiburNasional: tanggalStr,
      namaHariLibur: namaLibur,
      tanggalPerolehan: tanggalStr,
      tanggalKadaluarsa,
      status: 'tersedia',
      keterangan: `Diperoleh dari masuk kerja pada Hari Libur Nasional (${namaLibur}). Masa berlaku 3 bulan.`,
    });

    const saved = await this.saldoRoRepo.save(saldo);

    try {
      await this.notificationService.createNotification({
        idKaryawan,
        title: 'Saldo Regular Off (RO) Bertambah!',
        message: `Anda memperoleh 1 hak Regular Off (RO) karena bekerja pada hari libur nasional (${namaLibur}). RO dapat digunakan mulai bulan depan dan berlaku sampai ${tanggalKadaluarsa}.`,
        type: 'regular_off',
      });
    } catch (e) {
      console.error('Failed sending notification for RO earn:', e);
    }

    return saved;
  }

  /**
   * Dapatkan seluruh saldo RO karyawan, otomatis update yang kadaluarsa dan hitung sisa hari
   */
  async getMySaldoRo(idKaryawan: number) {
    const todayStr = businessToday();

    // Auto-expire saldo yang sudah lewat kadaluarsa dan masih berstatus 'tersedia'
    await this.saldoRoRepo
      .createQueryBuilder()
      .update(SaldoRo)
      .set({ status: 'hangus' })
      .where('id_karyawan = :idKaryawan', { idKaryawan })
      .andWhere('status = :status', { status: 'tersedia' })
      .andWhere('tanggal_kadaluarsa < :todayStr', { todayStr })
      .execute();

    const list = await this.saldoRoRepo.find({
      where: { idKaryawan },
      order: { tanggalKadaluarsa: 'ASC', createdAt: 'DESC' },
    });

    const items = list.map((s) => {
      const sisaHari = this.hitungSisaHari(s.tanggalKadaluarsa);
      let statusKeterangan = '';
      if (s.status === 'hangus' || (s.status === 'tersedia' && sisaHari < 0)) {
        statusKeterangan = 'Hangus';
      } else if (s.status === 'digunakan') {
        statusKeterangan = 'Sudah Digunakan';
      } else if (s.status === 'diajukan') {
        statusKeterangan = 'Sedang Diajukan';
      } else {
        statusKeterangan =
          sisaHari === 0 ? 'Hangus hari ini' : `Sisa ${sisaHari} hari lagi`;
      }

      return {
        ...s,
        sisaHari: Math.max(0, sisaHari),
        statusKeterangan,
      };
    });

    const totalTersedia = items.filter(
      (s) => s.status === 'tersedia' && s.sisaHari >= 0,
    ).length;
    const totalDiajukan = items.filter((s) => s.status === 'diajukan').length;
    const totalDigunakan = items.filter((s) => s.status === 'digunakan').length;
    const totalHangus = items.filter((s) => s.status === 'hangus').length;

    return {
      totalTersedia,
      totalDiajukan,
      totalDigunakan,
      totalHangus,
      items,
    };
  }

  /**
   * Karyawan mengajukan penggunaan Regular Off (RO)
   */
  async createPengajuanRo(idKaryawan: number, dto: CreatePengajuanRoDto) {
    const { tanggalDipilih, alasan } = dto;
    if (!tanggalDipilih || tanggalDipilih.length === 0) {
      throw new BadRequestException(
        'Pilih minimal 1 tanggal untuk libur Regular Off (RO)',
      );
    }

    // Pastikan tidak ada duplikasi tanggal dalam array
    const uniqueDates = Array.from(new Set(tanggalDipilih));
    if (uniqueDates.length !== tanggalDipilih.length) {
      throw new BadRequestException(
        'Terdapat tanggal duplikat dalam pengajuan Anda',
      );
    }

    // Urutkan tanggal yang dipilih
    uniqueDates.sort();
    const todayStr = businessToday();
    for (const date of uniqueDates) {
      try {
        normalizeDateOnly(date);
      } catch (error) {
        throw new BadRequestException((error as Error).message);
      }
      if (date < todayStr) {
        throw new BadRequestException(`Tanggal RO ${date} sudah lewat`);
      }
    }

    const { savedPengajuan, k } = await this.dataSource.transaction(
      'SERIALIZABLE',
      async (manager) => {
        const karyawanRepo = manager.getRepository(Karyawan);
        const saldoRepo = manager.getRepository(SaldoRo);
        const pengajuanRepo = manager.getRepository(PengajuanRo);
        const jadwalRepo = manager.getRepository(JadwalKerja);
        const k = await karyawanRepo.findOne({
          where: { idKaryawan },
          relations: { departemen: { pengelola: true } },
        });
        if (!k || !this.isOperasionalKaryawan(k)) {
          throw new BadRequestException(
            'Hanya karyawan operasional yang dapat mengajukan Regular Off (RO)',
          );
        }

        await saldoRepo
          .createQueryBuilder()
          .update(SaldoRo)
          .set({ status: 'hangus' })
          .where('id_karyawan = :idKaryawan', { idKaryawan })
          .andWhere("status = 'tersedia'")
          .andWhere('tanggal_kadaluarsa < :todayStr', { todayStr })
          .execute();

        const saldoTersedia = await saldoRepo
          .createQueryBuilder('saldo')
          .setLock('pessimistic_write')
          .where('saldo.id_karyawan = :idKaryawan', { idKaryawan })
          .andWhere("saldo.status = 'tersedia'")
          .andWhere('saldo.tanggal_kadaluarsa >= :todayStr', { todayStr })
          .orderBy('saldo.tanggal_kadaluarsa', 'ASC')
          .addOrderBy('saldo.id_saldo_ro', 'ASC')
          .getMany();

        const saldoDialokasikan = allocateRoBalances(
          saldoTersedia,
          uniqueDates,
        );

        for (const tgl of uniqueDates) {
          const existingJadwal = await jadwalRepo.findOne({
            where: { idKaryawan, tanggal: tgl as any },
          });
          if (existingJadwal?.isCuti || existingJadwal?.isLibur) {
            throw new BadRequestException(
              `Tanggal ${tgl} sudah merupakan cuti/libur dan tidak dapat digunakan untuk RO`,
            );
          }
          const existingPengajuan = await pengajuanRepo
            .createQueryBuilder('p')
            .where('p.id_karyawan = :idKaryawan', { idKaryawan })
            .andWhere(
              "p.status IN ('menunggu_spv', 'menunggu_hrd', 'disetujui')",
            )
            .andWhere(":tgl = ANY(string_to_array(p.tanggal_dipilih, ','))", {
              tgl,
            })
            .getOne();
          if (existingPengajuan) {
            throw new BadRequestException(
              `Anda sudah memiliki pengajuan RO aktif untuk tanggal ${tgl}`,
            );
          }
        }

        const savedPengajuan = await pengajuanRepo.save(
          pengajuanRepo.create({
            idKaryawan,
            tanggalDipilih: uniqueDates,
            jumlahHari: uniqueDates.length,
            alasan: alasan || null,
            status: 'menunggu_spv',
          }),
        );
        for (const saldo of saldoDialokasikan) {
          saldo.status = 'diajukan';
          saldo.idPengajuanRo = savedPengajuan.idPengajuanRo;
        }
        await saldoRepo.save(saldoDialokasikan);
        return { savedPengajuan, k };
      },
    );

    // Kirim notifikasi ke SPV
    try {
      const spvUsers = await this.userRepo.find({
        where: {
          role: 'SPV',
          idDepartemen: k.idDepartemen,
        },
      });
      for (const spv of spvUsers) {
        await this.notificationService.createNotification({
          idUser: spv.idUser,
          title: 'Pengajuan Regular Off (RO) Baru',
          message: `${k.nama} mengajukan libur Regular Off (RO) sebanyak ${uniqueDates.length} hari (${uniqueDates.join(', ')}). Menunggu persetujuan Anda.`,
          type: 'regular_off',
        });
      }
    } catch (e) {
      console.error('Failed sending notification to SPV for RO:', e);
    }

    return this.findOnePengajuan(savedPengajuan.idPengajuanRo);
  }

  /**
   * Persetujuan Tahap 1 oleh Supervisor (SPV)
   */
  async respondSpv(
    idPengajuan: number,
    userSpv: { idUser: number; role: string; idDepartemen?: number },
    dto: ApprovalRoDto,
  ): Promise<PengajuanRo> {
    const pengajuan = await this.findOnePengajuan(idPengajuan);

    if (pengajuan.status !== 'menunggu_spv') {
      throw new BadRequestException(
        `Pengajuan tidak dapat diproses SPV karena status saat ini adalah "${pengajuan.status}"`,
      );
    }

    if (
      userSpv.role === 'SPV' &&
      (!userSpv.idDepartemen ||
        pengajuan.karyawan?.idDepartemen !== userSpv.idDepartemen)
    ) {
      throw new ForbiddenException(
        'Anda hanya dapat memproses pengajuan karyawan di departemen Anda sendiri',
      );
    }

    pengajuan.idUserSpv = userSpv.idUser;
    pengajuan.catatanSpv = dto.catatan || null;
    pengajuan.tanggalApprovalSpv = new Date();

    if (dto.setuju) {
      pengajuan.status = 'menunggu_hrd';
      await this.pengajuanRoRepo.save(pengajuan);

      // Notifikasi ke HRD
      try {
        const hrdUsers = await this.userRepo.find({
          where: [{ role: 'HRD' }, { role: 'Admin' }],
        });
        for (const hrd of hrdUsers) {
          await this.notificationService.createNotification({
            idUser: hrd.idUser,
            title: 'Pengajuan RO Menunggu Persetujuan HRD',
            message: `Pengajuan Regular Off (RO) ${pengajuan.karyawan?.nama} (${pengajuan.jumlahHari} hari) telah disetujui SPV dan memerlukan persetujuan akhir HRD.`,
            type: 'regular_off',
          });
        }
      } catch (e) {
        console.error('Failed sending notification to HRD for RO:', e);
      }
    } else {
      pengajuan.status = 'ditolak_spv';
      await this.pengajuanRoRepo.save(pengajuan);

      // Kembalikan saldo RO ke 'tersedia'
      await this.saldoRoRepo.update(
        { idPengajuanRo: pengajuan.idPengajuanRo },
        { status: 'tersedia', idPengajuanRo: null },
      );

      // Notifikasi ke karyawan
      try {
        await this.notificationService.createNotification({
          idKaryawan: pengajuan.idKaryawan,
          title: 'Pengajuan RO Ditolak SPV',
          message: `Pengajuan Regular Off (RO) Anda ditolak oleh Supervisor.${dto.catatan ? ` Catatan: "${dto.catatan}"` : ''}. Saldo RO Anda telah dikembalikan.`,
          type: 'regular_off',
        });
      } catch (e) {
        console.error('Failed sending rejection notification to employee:', e);
      }
    }

    return this.findOnePengajuan(idPengajuan);
  }

  /**
   * Persetujuan Akhir oleh HRD:
   * Jika disetujui, jadwal kerja pada tanggal-tanggal RO tersebut otomatis di-update menjadi libur RO,
   * MENGABAIKAN jadwal yang dibuat oleh SPV sebelumnya!
   */
  async respondHrd(
    idPengajuan: number,
    userHrd: { idUser: number; role: string },
    dto: ApprovalRoDto,
  ): Promise<PengajuanRo> {
    await this.dataSource.transaction(async (manager) => {
      const pengajuanRepo = manager.getRepository(PengajuanRo);
      const saldoRepo = manager.getRepository(SaldoRo);
      const jadwalRepo = manager.getRepository(JadwalKerja);
      const item = await pengajuanRepo
        .createQueryBuilder('pengajuan')
        .setLock('pessimistic_write')
        .where('pengajuan.id_pengajuan_ro = :idPengajuan', { idPengajuan })
        .getOne();
      if (!item) {
        throw new NotFoundException(
          `Pengajuan RO dengan ID ${idPengajuan} tidak ditemukan`,
        );
      }
      if (item.status !== 'menunggu_hrd') {
        throw new BadRequestException(
          `Pengajuan tidak dapat diproses HRD karena status saat ini adalah "${item.status}"`,
        );
      }

      item.idUserHrd = userHrd.idUser;
      item.catatanHrd = dto.catatan || null;
      item.tanggalApprovalHrd = new Date();
      item.status = dto.setuju ? 'disetujui' : 'ditolak_hrd';
      if (!dto.setuju) {
        await pengajuanRepo.save(item);
        await saldoRepo.update(
          { idPengajuanRo: item.idPengajuanRo },
          { status: 'tersedia', idPengajuanRo: null },
        );
        return item;
      }

      const allocatedBalances = await saldoRepo.find({
        where: { idPengajuanRo: item.idPengajuanRo },
        lock: { mode: 'pessimistic_write' },
      });
      if (
        allocatedBalances.length !== item.jumlahHari ||
        allocatedBalances.some((saldo) => saldo.status !== 'diajukan')
      ) {
        throw new BadRequestException(
          'Alokasi saldo RO tidak lagi valid; persetujuan dibatalkan',
        );
      }
      await pengajuanRepo.save(item);
      for (const saldo of allocatedBalances) {
        saldo.status = 'digunakan';
      }
      await saldoRepo.save(allocatedBalances);
      for (const tgl of item.tanggalDipilih) {
        let jadwal = await jadwalRepo
          .createQueryBuilder('jadwal')
          .setLock('pessimistic_write')
          .where('jadwal.id_karyawan = :idKaryawan', {
            idKaryawan: item.idKaryawan,
          })
          .andWhere('jadwal.tanggal = :tgl', { tgl })
          .getOne();
        jadwal ??= jadwalRepo.create({
          idKaryawan: item.idKaryawan,
          tanggal: tgl as any,
        });
        Object.assign(jadwal, {
          isLibur: true,
          idShift: null,
          shift: null,
          isCuti: false,
          keterangan: `RO (Regular Off) - Pengajuan #${item.idPengajuanRo}`,
          sumberUpload: 'regular_off',
          idUser: userHrd.idUser,
        });
        await jadwalRepo.save(jadwal);
      }
      return item;
    });
    const result = await this.findOnePengajuan(idPengajuan);

    if (dto.setuju) {
      // Notifikasi ke karyawan
      try {
        await this.notificationService.createNotification({
          idKaryawan: result.idKaryawan,
          title: 'Pengajuan RO Disetujui HRD',
          message: `Selamat, pengajuan Regular Off (RO) Anda untuk tanggal ${result.tanggalDipilih.join(', ')} telah disetujui HRD. Jadwal kerja Anda telah otomatis diperbarui menjadi libur RO.`,
          type: 'regular_off',
        });

        if (result.idUserSpv) {
          await this.notificationService.createNotification({
            idUser: result.idUserSpv,
            title: 'Pengajuan RO Disetujui HRD',
            message: `Pengajuan Regular Off (RO) karyawan ${result.karyawan?.nama} telah disetujui HRD dan jadwal telah diperbarui menjadi libur RO.`,
            type: 'regular_off',
          });
        }
      } catch (e) {
        console.error('Failed sending approval notification for RO:', e);
      }
    } else {
      // Notifikasi ke karyawan
      try {
        await this.notificationService.createNotification({
          idKaryawan: result.idKaryawan,
          title: 'Pengajuan RO Ditolak HRD',
          message: `Pengajuan Regular Off (RO) Anda ditolak oleh HRD.${dto.catatan ? ` Catatan: "${dto.catatan}"` : ''}. Saldo RO Anda telah dikembalikan.`,
          type: 'regular_off',
        });
      } catch (e) {
        console.error('Failed sending rejection notification for RO:', e);
      }
    }

    return result;
  }

  /**
   * Batalkan pengajuan oleh karyawan sebelum persetujuan final HRD.
   */
  async cancelPengajuan(
    idPengajuan: number,
    idKaryawan: number,
  ): Promise<PengajuanRo> {
    await this.dataSource.transaction(async (manager) => {
      const pengajuanRepo = manager.getRepository(PengajuanRo);
      const saldoRepo = manager.getRepository(SaldoRo);
      const pengajuan = await pengajuanRepo
        .createQueryBuilder('pengajuan')
        .setLock('pessimistic_write')
        .where('pengajuan.id_pengajuan_ro = :idPengajuan', { idPengajuan })
        .getOne();
      if (!pengajuan) {
        throw new NotFoundException(
          `Pengajuan RO dengan ID ${idPengajuan} tidak ditemukan`,
        );
      }
      if (pengajuan.idKaryawan !== idKaryawan) {
        throw new ForbiddenException(
          'Anda tidak memiliki akses untuk membatalkan pengajuan ini',
        );
      }
      if (!['menunggu_spv', 'menunggu_hrd'].includes(pengajuan.status)) {
        throw new BadRequestException(
          'Pengajuan hanya dapat dibatalkan sebelum persetujuan final HRD',
        );
      }
      pengajuan.status = 'dibatalkan';
      await pengajuanRepo.save(pengajuan);
      await saldoRepo.update(
        { idPengajuanRo: pengajuan.idPengajuanRo },
        { status: 'tersedia', idPengajuanRo: null },
      );
    });

    return this.findOnePengajuan(idPengajuan);
  }

  /**
   * Detail pengajuan RO
   */
  async findOnePengajuan(idPengajuan: number): Promise<PengajuanRo> {
    const p = await this.pengajuanRoRepo.findOne({
      where: { idPengajuanRo: idPengajuan },
      relations: {
        karyawan: { departemen: true, jabatan: true },
        userSpv: true,
        userHrd: true,
        saldoRoList: true,
      },
    });
    if (!p) {
      throw new NotFoundException(
        `Pengajuan RO dengan ID ${idPengajuan} tidak ditemukan`,
      );
    }
    return p;
  }

  /**
   * Daftar pengajuan RO milik karyawan login
   */
  async getMyPengajuan(idKaryawan: number): Promise<PengajuanRo[]> {
    return this.pengajuanRoRepo.find({
      where: { idKaryawan },
      order: { createdAt: 'DESC' },
      relations: {
        karyawan: { departemen: true, jabatan: true },
        userSpv: true,
        userHrd: true,
        saldoRoList: true,
      },
    });
  }

  /**
   * Daftar pengajuan RO untuk Supervisor (SPV)
   */
  async getPengajuanForSpv(userSpv: {
    idUser: number;
    role: string;
    idDepartemen?: number;
  }): Promise<PengajuanRo[]> {
    if (userSpv.role === 'SPV' && !userSpv.idDepartemen) {
      return [];
    }
    const qb = this.pengajuanRoRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.karyawan', 'k')
      .leftJoinAndSelect('k.departemen', 'd')
      .leftJoinAndSelect('k.jabatan', 'j')
      .leftJoinAndSelect('p.userSpv', 'spv')
      .leftJoinAndSelect('p.userHrd', 'hrd')
      .leftJoinAndSelect('p.saldoRoList', 's')
      .orderBy('p.createdAt', 'DESC');

    if (userSpv.role === 'SPV') {
      qb.where('k.id_departemen = :idDepartemen', {
        idDepartemen: userSpv.idDepartemen,
      });
    }

    return qb.getMany();
  }

  /**
   * Daftar pengajuan RO untuk HRD / Admin
   */
  async getPengajuanForHrd(): Promise<PengajuanRo[]> {
    return this.pengajuanRoRepo.find({
      order: { createdAt: 'DESC' },
      relations: {
        karyawan: { departemen: true, jabatan: true },
        userSpv: true,
        userHrd: true,
        saldoRoList: true,
      },
    });
  }
}
