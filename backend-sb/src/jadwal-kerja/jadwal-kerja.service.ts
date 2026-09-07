import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { JadwalKerja } from './entities/jadwal-kerja.entity.js';
import { Karyawan } from '../karyawan/entities/karyawan.entity.js';
import { Departemen } from '../departemen/entities/departemen.entity.js';
import { CreateJadwalKerjaDto } from './dto/create-jadwal-kerja.dto.js';
import { UpdateJadwalKerjaDto } from './dto/update-jadwal-kerja.dto.js';
import { BulkJadwalKerjaItemDto } from './dto/bulk-jadwal-kerja.dto.js';

@Injectable()
export class JadwalKerjaService {
  constructor(
    @InjectRepository(JadwalKerja)
    private readonly jadwalRepo: Repository<JadwalKerja>,
    @InjectRepository(Karyawan)
    private readonly karyawanRepo: Repository<Karyawan>,
    @InjectRepository(Departemen)
    private readonly deptRepo: Repository<Departemen>,
  ) {}

  private isBackoffice(name?: string): boolean {
    if (!name) return false;
    const clean = name.toLowerCase().replace(/[\s\-_]/g, '');
    return clean === 'backoffice';
  }

  private async validateKaryawanAccess(
    karyawanIds: number[],
    user: { idUser: number; role: string; idDepartemen?: number },
  ) {
    if (karyawanIds.length === 0) return;

    const karyawanList = await this.karyawanRepo.find({
      where: { idKaryawan: In(karyawanIds) },
      relations: { departemen: true },
    });

    for (const emp of karyawanList) {
      const isEmpBackoffice = this.isBackoffice(emp.departemen?.namaDepartemen);

      if (user.role === 'SPV') {
        if (!user.idDepartemen || emp.idDepartemen !== user.idDepartemen) {
          throw new ForbiddenException(
            `Supervisor hanya dapat mengatur jadwal karyawan di departemennya sendiri (${emp.nama} bukan di departemen Anda)`,
          );
        }
        if (isEmpBackoffice) {
          throw new ForbiddenException(
            'Jadwal kerja karyawan Backoffice hanya dapat diatur oleh HRD dan Admin',
          );
        }
      } else if (isEmpBackoffice && user.role !== 'Admin' && user.role !== 'HRD') {
        throw new ForbiddenException(
          'Jadwal kerja karyawan Backoffice hanya dapat diatur oleh HRD dan Admin',
        );
      }
    }
  }

  async create(
    dto: CreateJadwalKerjaDto,
    user: { idUser: number; role: string; idDepartemen?: number },
  ): Promise<JadwalKerja> {
    await this.validateKaryawanAccess([dto.idKaryawan], user);

    const existing = await this.jadwalRepo.findOne({
      where: {
        idKaryawan: dto.idKaryawan,
        tanggal: dto.tanggal as any,
      },
    });

    if (existing) {
      Object.assign(existing, {
        ...dto,
        idUser: user.idUser,
        sumberUpload: dto.sumberUpload || 'manual',
      });
      return this.jadwalRepo.save(existing);
    }

    const jadwal = new JadwalKerja();
    Object.assign(jadwal, {
      ...dto,
      idUser: user.idUser,
      sumberUpload: dto.sumberUpload || 'manual',
    });
    return this.jadwalRepo.save(jadwal);
  }

  async createBulk(
    items: BulkJadwalKerjaItemDto[],
    user: { idUser: number; role: string; idDepartemen?: number },
  ): Promise<JadwalKerja[]> {
    if (items.length === 0) return [];

    const empIds = Array.from(new Set(items.map((i) => i.idKaryawan)));
    await this.validateKaryawanAccess(empIds, user);

    const results: JadwalKerja[] = [];
    for (const item of items) {
      const existing = await this.jadwalRepo.findOne({
        where: {
          idKaryawan: item.idKaryawan,
          tanggal: item.tanggal as any,
        },
      });

      if (existing) {
        existing.idShift = item.idShift || null as any;
        existing.isCuti = item.isCuti || false;
        existing.idUser = user.idUser;
        existing.sumberUpload = 'manual';
        results.push(await this.jadwalRepo.save(existing));
      } else {
        const created = this.jadwalRepo.create({
          idKaryawan: item.idKaryawan,
          idShift: item.idShift || null as any,
          isCuti: item.isCuti || false,
          tanggal: item.tanggal as any,
          idUser: user.idUser,
          sumberUpload: 'manual',
        });
        results.push(await this.jadwalRepo.save(created));
      }
    }

    return results;
  }

  async importExcel(
    buffer: Buffer | ArrayBufferLike,
    user: { idUser: number; role: string; idDepartemen?: number },
  ): Promise<JadwalKerja[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new BadRequestException('File Excel tidak memiliki worksheet');
    }

    const items: BulkJadwalKerjaItemDto[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header

      const idKaryawan = Number(row.getCell(1).value);
      const tanggalRaw = row.getCell(2).value;
      const idShift = Number(row.getCell(3).value);

      if (!idKaryawan || !tanggalRaw || !idShift) {
        return; // skip invalid rows
      }

      let tanggal: string;
      if (tanggalRaw instanceof Date) {
        tanggal = tanggalRaw.toISOString().split('T')[0];
      } else {
        tanggal = String(tanggalRaw);
      }

      items.push({
        idKaryawan,
        idShift,
        tanggal,
      });
    });

    if (items.length === 0) {
      throw new BadRequestException('Tidak ada data valid ditemukan di file Excel');
    }

    return this.createBulk(items, user);
  }

  async findAll(user?: { role: string; idDepartemen?: number }): Promise<JadwalKerja[]> {
    const query = this.jadwalRepo
      .createQueryBuilder('j')
      .leftJoinAndSelect('j.karyawan', 'karyawan')
      .leftJoinAndSelect('karyawan.departemen', 'departemen')
      .leftJoinAndSelect('j.shift', 'shift')
      .leftJoinAndSelect('j.user', 'user')
      .orderBy('j.tanggal', 'DESC');

    if (user?.role === 'SPV') {
      if (!user.idDepartemen) {
        return [];
      }
      query.where('karyawan.id_departemen = :idDepartemen', {
        idDepartemen: user.idDepartemen,
      });
    }

    const results = await query.getMany();

    if (user?.role === 'SPV') {
      return results.filter(
        (j) => !this.isBackoffice(j.karyawan?.departemen?.namaDepartemen),
      );
    }

    return results;
  }

  async findOne(id: number): Promise<JadwalKerja> {
    const jadwal = await this.jadwalRepo.findOne({
      where: { idJadwal: id },
      relations: { karyawan: true, shift: true, user: true },
    });
    if (!jadwal) {
      throw new NotFoundException(`Jadwal kerja dengan ID ${id} tidak ditemukan`);
    }
    return jadwal;
  }

  async findByKaryawanAndTanggal(
    idKaryawan: number,
    tanggal: Date | string,
  ): Promise<JadwalKerja | null> {
    const tanggalStr =
      tanggal instanceof Date
        ? `${tanggal.getFullYear()}-${String(tanggal.getMonth() + 1).padStart(2, '0')}-${String(tanggal.getDate()).padStart(2, '0')}`
        : tanggal;

    return this.jadwalRepo
      .createQueryBuilder('j')
      .leftJoinAndSelect('j.shift', 'shift')
      .where('j.id_karyawan = :idKaryawan', { idKaryawan })
      .andWhere('j.tanggal = :tanggal', { tanggal: tanggalStr })
      .getOne();
  }

  /**
   * Jadwal kerja hari ini untuk karyawan tertentu (mobile).
   */
  async findTodayByKaryawan(idKaryawan: number) {
    const now = new Date();
    const jadwal = await this.findByKaryawanAndTanggal(idKaryawan, now);
    if (!jadwal) {
      return {
        hasJadwal: false,
        message: 'Anda belum punya jadwal kerja, hubungi supervisor',
      };
    }
    if (jadwal.isCuti) {
      return {
        hasJadwal: true,
        isCuti: true,
        isLibur: false,
        message: 'Hari ini Anda sedang cuti',
      };
    }
    if (!jadwal.shift) {
      return {
        hasJadwal: true,
        isCuti: false,
        isLibur: true,
        message: 'Hari ini adalah hari libur Anda',
      };
    }
    return {
      hasJadwal: true,
      isCuti: false,
      isLibur: false,
      idJadwal: jadwal.idJadwal,
      shift: {
        idShift: jadwal.shift.idShift,
        namaShift: jadwal.shift.namaShift,
        jamMulai: jadwal.shift.jamMulai,
        jamSelesai: jadwal.shift.jamSelesai,
        jamMulaiIstirahat: jadwal.shift.jamMulaiIstirahat,
        jamSelesaiIstirahat: jadwal.shift.jamSelesaiIstirahat,
      },
    };
  }

  /**
   * Jadwal kerja seminggu ke depan untuk karyawan tertentu (mobile).
   */
  async findWeeklyByKaryawan(idKaryawan: number): Promise<JadwalKerja[]> {
    const now = new Date();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);

    return this.jadwalRepo.find({
      where: {
        idKaryawan,
        tanggal: Between(startOfWeek, endOfWeek),
      },
      relations: { shift: true },
      order: { tanggal: 'ASC' },
    });
  }

  /**
   * Jadwal kerja satu bulan penuh untuk karyawan tertentu (mobile calendar).
   */
  async findMonthlyByKaryawan(
    idKaryawan: number,
    year: number,
    month: number,
  ): Promise<JadwalKerja[]> {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    return this.jadwalRepo.find({
      where: {
        idKaryawan,
        tanggal: Between(startOfMonth, endOfMonth),
      },
      relations: { shift: true },
      order: { tanggal: 'ASC' },
    });
  }

  async findCutiByKaryawanAndPeriode(
    idKaryawan: number,
    periodeAwal: Date,
    periodeAkhir: Date,
  ): Promise<JadwalKerja[]> {
    return this.jadwalRepo.find({
      where: {
        idKaryawan,
        isCuti: true,
        tanggal: Between(periodeAwal, periodeAkhir),
      },
    });
  }

  async update(
    id: number,
    dto: UpdateJadwalKerjaDto,
    user: { idUser: number; role: string; idDepartemen?: number },
  ): Promise<JadwalKerja> {
    const jadwal = await this.findOne(id);
    await this.validateKaryawanAccess([jadwal.idKaryawan], user);

    if (dto.idKaryawan && dto.idKaryawan !== jadwal.idKaryawan) {
      await this.validateKaryawanAccess([dto.idKaryawan], user);
    }

    Object.assign(jadwal, dto);
    return this.jadwalRepo.save(jadwal);
  }

  async remove(
    id: number,
    user: { idUser: number; role: string; idDepartemen?: number },
  ): Promise<void> {
    const jadwal = await this.findOne(id);
    await this.validateKaryawanAccess([jadwal.idKaryawan], user);
    await this.jadwalRepo.remove(jadwal);
  }
}
