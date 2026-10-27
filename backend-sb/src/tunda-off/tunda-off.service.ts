import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { PengajuanTundaOff } from './entities/pengajuan-tunda-off.entity.js';
import { Karyawan } from '../karyawan/entities/karyawan.entity.js';
import { JadwalKerja } from '../jadwal-kerja/entities/jadwal-kerja.entity.js';
import { User } from '../user/entities/user.entity.js';
import { NotificationService } from '../notification/notification.service.js';
import { AturanPengajuanService } from '../aturan-pengajuan/aturan-pengajuan.service.js';
import {
  ApprovalTundaOffDto,
  CreateTundaOffDto,
} from './dto/tunda-off.dto.js';
import {
  businessToday,
  normalizeDateOnly,
} from '../common/utils/business-date.util.js';

@Injectable()
export class TundaOffService {
  constructor(
    @InjectRepository(PengajuanTundaOff)
    private readonly tundaOffRepo: Repository<PengajuanTundaOff>,
    @InjectRepository(Karyawan)
    private readonly karyawanRepo: Repository<Karyawan>,
    @InjectRepository(JadwalKerja)
    private readonly jadwalRepo: Repository<JadwalKerja>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly notificationService: NotificationService,
    private readonly dataSource: DataSource,
    private readonly aturan?: AturanPengajuanService,
  ) {}

  /**
   * Pengajuan tunda off dari mobile (semua divisi boleh, alasan wajib jelas).
   * Tanggal off asal harus hari libur terjadwal; tanggal off baru harus hari kerja terjadwal.
   */
  async create(
    idKaryawan: number,
    dto: CreateTundaOffDto,
  ): Promise<PengajuanTundaOff> {
    const karyawan = await this.karyawanRepo.findOne({
      where: { idKaryawan },
      relations: { departemen: { pengelola: true } },
    });
    if (!karyawan) {
      throw new NotFoundException('Karyawan tidak ditemukan');
    }

    const tglAsal = normalizeDateOnly(dto.tanggalOffAsal);
    const tglBaru = normalizeDateOnly(dto.tanggalOffBaru);
    const today = businessToday();
    if (tglAsal === tglBaru) {
      throw new BadRequestException(
        'Tanggal off asal dan tanggal pengganti tidak boleh sama',
      );
    }
    if (tglAsal < today || tglBaru < today) {
      throw new BadRequestException(
        'Pengajuan tunda off tidak dapat menggunakan tanggal yang sudah lewat',
      );
    }

    const jadwalAsal = await this.jadwalRepo.findOne({
      where: { idKaryawan, tanggal: tglAsal as any },
    });
    if (!jadwalAsal || !jadwalAsal.isLibur) {
      throw new BadRequestException(
        `Tanggal ${tglAsal} bukan hari off terjadwal Anda. Tunda off hanya untuk hari libur terjadwal.`,
      );
    }
    const jadwalBaru = await this.jadwalRepo.findOne({
      where: { idKaryawan, tanggal: tglBaru as any },
    });
    if (!jadwalBaru || jadwalBaru.isLibur || !jadwalBaru.idShift) {
      throw new BadRequestException(
        `Tanggal ${tglBaru} bukan hari kerja terjadwal Anda, sehingga tidak dapat dijadikan hari off pengganti.`,
      );
    }
    if (jadwalAsal.isCuti || jadwalBaru.isCuti) {
      throw new BadRequestException(
        'Tanggal yang dipilih bertabrakan dengan jadwal cuti',
      );
    }

    const aktif = await this.tundaOffRepo.findOne({
      where: [
        {
          idKaryawan,
          status: In(['menunggu_spv', 'menunggu_hrd']),
          tanggalOffAsal: tglAsal as any,
        },
        {
          idKaryawan,
          status: In(['menunggu_spv', 'menunggu_hrd']),
          tanggalOffBaru: tglBaru as any,
        },
      ],
    });
    if (aktif) {
      throw new BadRequestException(
        'Masih ada pengajuan tunda off aktif untuk tanggal tersebut',
      );
    }
    await this.aturan?.cekBatas(idKaryawan, 'tunda_off', tglAsal);

    const managers = Array.isArray(karyawan.departemen?.pengelola)
      ? karyawan.departemen.pengelola
      : [];
    const hasSpv = managers.some((m: any) => m.role === 'SPV');

    const pengajuan = this.tundaOffRepo.create({
      idKaryawan,
      tanggalOffAsal: tglAsal as any,
      tanggalOffBaru: tglBaru as any,
      alasan: dto.alasan,
      status: this.aturan ? await this.aturan.statusAwal(karyawan) : hasSpv ? 'menunggu_spv' : 'menunggu_hrd',
    });
    const saved = await this.tundaOffRepo.save(pengajuan);

    try {
      if (hasSpv) {
        const spvUsers = await this.userRepo.find({
          where: { role: 'SPV', idDepartemen: karyawan.idDepartemen },
        });
        for (const spv of spvUsers) {
          await this.notificationService.createNotification({
            idUser: spv.idUser,
            title: 'Pengajuan Tunda Off Baru',
            message: `${karyawan.nama} mengajukan tunda off: masuk kerja pada ${tglAsal} dan off diganti ke ${tglBaru}. Alasan: ${dto.alasan}. Menunggu persetujuan Anda.`,
            type: 'tunda_off',
          });
        }
      } else {
        const hrdUsers = await this.userRepo.find({
          where: [{ role: 'HRD' }, { role: 'Admin' }],
        });
        for (const hrd of hrdUsers) {
          await this.notificationService.createNotification({
            idUser: hrd.idUser,
            title: 'Pengajuan Tunda Off Baru',
            message: `${karyawan.nama} mengajukan tunda off: masuk kerja pada ${tglAsal} dan off diganti ke ${tglBaru}. Alasan: ${dto.alasan}.`,
            type: 'tunda_off',
          });
        }
      }
    } catch (e) {
      console.error('Failed sending tunda off notification:', e);
    }

    return this.findOne(saved.idTundaOff);
  }

  async findOne(id: number): Promise<PengajuanTundaOff> {
    const item = await this.tundaOffRepo.findOne({
      where: { idTundaOff: id },
      relations: {
        karyawan: { departemen: true, jabatan: true },
        userSpv: true,
        userHrd: true,
      },
    });
    if (!item) {
      throw new NotFoundException(
        `Pengajuan tunda off dengan ID ${id} tidak ditemukan`,
      );
    }
    return item;
  }

  getMyPengajuan(idKaryawan: number): Promise<PengajuanTundaOff[]> {
    return this.tundaOffRepo.find({
      where: { idKaryawan },
      order: { idTundaOff: 'DESC' },
    });
  }

  async cancel(id: number, idKaryawan: number): Promise<PengajuanTundaOff> {
    const item = await this.findOne(id);
    if (item.idKaryawan !== idKaryawan) {
      throw new ForbiddenException(
        'Anda hanya dapat membatalkan pengajuan Anda sendiri',
      );
    }
    if (!['menunggu_spv', 'menunggu_hrd'].includes(item.status)) {
      throw new BadRequestException(
        `Pengajuan dengan status "${item.status}" tidak dapat dibatalkan`,
      );
    }
    item.status = 'dibatalkan';
    return this.tundaOffRepo.save(item);
  }

  async getForSpv(user: {
    role: string;
    idDepartemen?: number;
  }): Promise<PengajuanTundaOff[]> {
    const qb = this.tundaOffRepo
      .createQueryBuilder('tunda')
      .leftJoinAndSelect('tunda.karyawan', 'karyawan')
      .leftJoinAndSelect('karyawan.departemen', 'departemen')
      .leftJoinAndSelect('tunda.userSpv', 'userSpv')
      .leftJoinAndSelect('tunda.userHrd', 'userHrd')
      .orderBy('tunda.id_tunda_off', 'DESC');
    if (user.role === 'SPV') {
      if (!user.idDepartemen) return [];
      qb.andWhere('karyawan.id_departemen = :idDept', {
        idDept: user.idDepartemen,
      });
    }
    return qb.getMany();
  }

  getForHrd(): Promise<PengajuanTundaOff[]> {
    return this.tundaOffRepo.find({
      relations: {
        karyawan: { departemen: true },
        userSpv: true,
        userHrd: true,
      },
      order: { idTundaOff: 'DESC' },
    });
  }

  /** Persetujuan Tahap 1 oleh SPV */
  async respondSpv(
    id: number,
    userSpv: { idUser: number; role: string; idDepartemen?: number },
    dto: ApprovalTundaOffDto,
  ): Promise<PengajuanTundaOff> {
    const item = await this.findOne(id);
    if (item.status !== 'menunggu_spv') {
      throw new BadRequestException(
        `Pengajuan tidak dapat diproses SPV karena status saat ini adalah "${item.status}"`,
      );
    }
    if (
      userSpv.role === 'SPV' &&
      (!userSpv.idDepartemen ||
        item.karyawan?.idDepartemen !== userSpv.idDepartemen)
    ) {
      throw new ForbiddenException(
        'Anda hanya dapat memproses pengajuan karyawan di departemen Anda sendiri',
      );
    }

    item.idUserSpv = userSpv.idUser;
    item.catatanSpv = dto.catatan || null;
    item.tanggalApprovalSpv = new Date();
    item.status = dto.setuju ? 'menunggu_hrd' : 'ditolak_spv';
    await this.tundaOffRepo.save(item);

    try {
      if (dto.setuju) {
        const hrdUsers = await this.userRepo.find({
          where: [{ role: 'HRD' }, { role: 'Admin' }],
        });
        for (const hrd of hrdUsers) {
          await this.notificationService.createNotification({
            idUser: hrd.idUser,
            title: 'Pengajuan Tunda Off Menunggu HRD',
            message: `Pengajuan tunda off ${item.karyawan?.nama} telah disetujui SPV dan memerlukan persetujuan akhir HRD.`,
            type: 'tunda_off',
          });
        }
      } else {
        await this.notificationService.createNotification({
          idKaryawan: item.idKaryawan,
          title: 'Pengajuan Tunda Off Ditolak SPV',
          message: `Pengajuan tunda off Anda ditolak oleh Supervisor.${dto.catatan ? ` Catatan: "${dto.catatan}"` : ''}`,
          type: 'tunda_off',
        });
      }
    } catch (e) {
      console.error('Failed sending tunda off SPV notification:', e);
    }

    return this.findOne(id);
  }

  /**
   * Persetujuan akhir HRD: jika disetujui, jadwal otomatis ditukar —
   * tanggal off asal menjadi hari kerja (memakai shift hari pengganti),
   * tanggal pengganti menjadi hari off.
   */
  async respondHrd(
    id: number,
    userHrd: { idUser: number; role: string },
    dto: ApprovalTundaOffDto,
  ): Promise<PengajuanTundaOff> {
    await this.dataSource.transaction(async (manager) => {
      const tundaRepo = manager.getRepository(PengajuanTundaOff);
      const jadwalRepo = manager.getRepository(JadwalKerja);
      const item = await tundaRepo
        .createQueryBuilder('tunda')
        .setLock('pessimistic_write')
        .where('tunda.id_tunda_off = :id', { id })
        .getOne();
      if (!item) {
        throw new NotFoundException(
          `Pengajuan tunda off dengan ID ${id} tidak ditemukan`,
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
        await tundaRepo.save(item);
        return;
      }

      const tglAsal = normalizeDateOnly(item.tanggalOffAsal);
      const tglBaru = normalizeDateOnly(item.tanggalOffBaru);
      const lockJadwal = (tanggal: string) =>
        jadwalRepo
          .createQueryBuilder('jadwal')
          .setLock('pessimistic_write')
          .where('jadwal.id_karyawan = :idKaryawan', {
            idKaryawan: item.idKaryawan,
          })
          .andWhere('jadwal.tanggal = :tanggal', { tanggal })
          .getOne();

      const jadwalAsal = await lockJadwal(tglAsal);
      const jadwalBaru = await lockJadwal(tglBaru);
      if (!jadwalAsal || !jadwalAsal.isLibur) {
        throw new BadRequestException(
          `Jadwal ${tglAsal} sudah berubah dan bukan lagi hari off; persetujuan dibatalkan`,
        );
      }
      if (!jadwalBaru || jadwalBaru.isLibur || !jadwalBaru.idShift) {
        throw new BadRequestException(
          `Jadwal ${tglBaru} sudah berubah dan bukan lagi hari kerja; persetujuan dibatalkan`,
        );
      }

      // Tukar: hari off asal menjadi hari kerja memakai shift hari pengganti
      const shiftPengganti = jadwalBaru.idShift;
      Object.assign(jadwalAsal, {
        isLibur: false,
        idShift: shiftPengganti,
        shift: null,
        isCuti: false,
        keterangan: `Tunda Off - masuk kerja (Pengajuan #${item.idTundaOff})`,
        sumberUpload: 'tunda_off',
        idUser: userHrd.idUser,
      });
      Object.assign(jadwalBaru, {
        isLibur: true,
        idShift: null,
        shift: null,
        isCuti: false,
        keterangan: `Tunda Off - libur pengganti (Pengajuan #${item.idTundaOff})`,
        sumberUpload: 'tunda_off',
        idUser: userHrd.idUser,
      });
      await jadwalRepo.save(jadwalAsal);
      await jadwalRepo.save(jadwalBaru);
      await tundaRepo.save(item);
    });

    const result = await this.findOne(id);
    try {
      if (dto.setuju) {
        await this.notificationService.createNotification({
          idKaryawan: result.idKaryawan,
          title: 'Pengajuan Tunda Off Disetujui HRD',
          message: `Pengajuan tunda off Anda disetujui. Anda masuk kerja pada ${normalizeDateOnly(result.tanggalOffAsal)} dan hari off Anda dipindah ke ${normalizeDateOnly(result.tanggalOffBaru)}. Jadwal sudah otomatis diperbarui.`,
          type: 'tunda_off',
        });
        if (result.idUserSpv) {
          await this.notificationService.createNotification({
            idUser: result.idUserSpv,
            title: 'Pengajuan Tunda Off Disetujui HRD',
            message: `Pengajuan tunda off karyawan ${result.karyawan?.nama} telah disetujui HRD dan jadwal telah diperbarui.`,
            type: 'tunda_off',
          });
        }
      } else {
        await this.notificationService.createNotification({
          idKaryawan: result.idKaryawan,
          title: 'Pengajuan Tunda Off Ditolak HRD',
          message: `Pengajuan tunda off Anda ditolak oleh HRD.${dto.catatan ? ` Catatan: "${dto.catatan}"` : ''}`,
          type: 'tunda_off',
        });
      }
    } catch (e) {
      console.error('Failed sending tunda off HRD notification:', e);
    }
    return result;
  }
}
