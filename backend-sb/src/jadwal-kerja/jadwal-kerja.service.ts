import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import * as ExcelJS from 'exceljs';
import type { Response } from 'express';
import { JadwalKerja } from './entities/jadwal-kerja.entity.js';
import { Karyawan } from '../karyawan/entities/karyawan.entity.js';
import { Departemen } from '../departemen/entities/departemen.entity.js';
import { HariLibur } from '../hari-libur/entities/hari-libur.entity.js';
import { Shift } from '../shift/entities/shift.entity.js';
import { User } from '../user/entities/user.entity.js';
import { CreateJadwalKerjaDto } from './dto/create-jadwal-kerja.dto.js';
import { UpdateJadwalKerjaDto } from './dto/update-jadwal-kerja.dto.js';
import { BulkJadwalKerjaItemDto } from './dto/bulk-jadwal-kerja.dto.js';
import { matchUserName } from '../karyawan/name-matcher.util.js';

@Injectable()
export class JadwalKerjaService {
  constructor(
    @InjectRepository(JadwalKerja)
    private readonly jadwalRepo: Repository<JadwalKerja>,
    @InjectRepository(Karyawan)
    private readonly karyawanRepo: Repository<Karyawan>,
    @InjectRepository(Departemen)
    private readonly deptRepo: Repository<Departemen>,
    @InjectRepository(HariLibur)
    private readonly hariLiburRepo: Repository<HariLibur>,
    @InjectRepository(Shift)
    private readonly shiftRepo: Repository<Shift>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  private isBackoffice(name?: string): boolean {
    if (!name) return false;
    const clean = name.toLowerCase().replace(/[\s\-_]/g, '');
    return clean === 'backoffice';
  }

  isManagedByAdminOrHrd(dept?: Departemen | null): boolean {
    if (!dept) return true;
    if (this.isBackoffice(dept.namaDepartemen)) return true;
    if (!dept.pengelola || dept.pengelola.length === 0) return true;
    return dept.pengelola.some((u) => u.role === 'Admin' || u.role === 'HRD');
  }

  async getOrCreateDefaultAdminShift(): Promise<Shift> {
    let shift = await this.shiftRepo.findOne({
      where: { jamMulai: '08:45:00', jamSelesai: '17:00:00' },
    });
    if (!shift) {
      shift = await this.shiftRepo.findOne({
        where: { namaShift: 'Reguler Pagi (Default)' },
      });
    }
    const officeDept = await this.deptRepo.findOne({
      where: [
        { namaDepartemen: 'Office' },
        { namaDepartemen: 'Kantor' },
        { namaDepartemen: 'Backoffice' },
      ],
    });
    if (!shift) {
      shift = this.shiftRepo.create({
        namaShift: 'Reguler Pagi (Default)',
        jamMulai: '08:45:00',
        jamSelesai: '17:00:00',
        idDepartemen: officeDept?.idDepartemen || null,
      });
      shift = await this.shiftRepo.save(shift);
    } else if (officeDept && !shift.idDepartemen) {
      shift.idDepartemen = officeDept.idDepartemen;
      await this.shiftRepo.save(shift);
    }
    return shift;
  }

  private async validateKaryawanAccess(
    karyawanIds: number[],
    user: { idUser: number; role: string; idDepartemen?: number },
  ) {
    if (karyawanIds.length === 0) return;

    // Admin & HRD memiliki otoritas penuh untuk mengatur seluruh jadwal (Supervisor, staf operasional, maupun staf kantor)
    if (user.role === 'Admin' || user.role === 'HRD') {
      return;
    }

    const karyawanList = await this.karyawanRepo.find({
      where: { idKaryawan: In(karyawanIds) },
      relations: { departemen: { pengelola: true }, jabatan: true },
    });

    const users = await this.userRepo.find({ relations: { departemen: true } });

    // Ambil semua ID departemen yang dikelola oleh user SPV ini (dari user.idDepartemen, departemen_pengelola, dan karyawan linked)
    const managedDepts = await this.deptRepo.find({
      relations: { pengelola: true },
    });
    const allowedDeptIds = new Set<number>();
    if (user.idDepartemen) allowedDeptIds.add(Number(user.idDepartemen));
    managedDepts.forEach((d) => {
      if (
        (d.idPengelola && Number(d.idPengelola) === Number(user.idUser)) ||
        d.pengelola?.some((p) => Number(p.idUser) === Number(user.idUser))
      ) {
        allowedDeptIds.add(Number(d.idDepartemen));
      }
    });

    if (user.idUser) {
      const userInDb = await this.userRepo.findOne({
        where: { idUser: user.idUser },
      });
      if (userInDb?.nama) {
        const allKaryawan = await this.karyawanRepo.find();
        const matched = allKaryawan.find((k) => matchUserName(k.nama, userInDb.nama));
        if (matched?.idDepartemen) {
          allowedDeptIds.add(Number(matched.idDepartemen));
        }
      }
    }

    for (const emp of karyawanList) {
      const matchedUser = users.find((u) => matchUserName(emp.nama, u.nama));
      const isRoleSpv = matchedUser?.role === 'SPV';
      const jabatanName = emp.jabatan?.namaJabatan?.toLowerCase() || '';
      const isJabatanSpv =
        jabatanName.includes('supervisor') ||
        jabatanName.includes('spv') ||
        jabatanName.includes('leader');
      const isEmpSpv = isRoleSpv || isJabatanSpv;

      if (isEmpSpv) {
        // SPV tidak boleh mengatur jadwal dirinya sendiri atau sesama SPV. Jadwal SPV diatur oleh HRD.
        throw new ForbiddenException(
          `Supervisor tidak dapat mengatur jadwal kerja dirinya sendiri atau sesama Supervisor (${emp.nama}). Jadwal Supervisor ditentukan oleh HRD.`,
        );
      }

      // Validasi departemen: Staf harus berada di departemen yang dikelola oleh SPV ini
      if (!emp.idDepartemen || !allowedDeptIds.has(Number(emp.idDepartemen))) {
        throw new ForbiddenException(
          `Supervisor hanya dapat mengatur jadwal staf di departemen yang Anda kelola (${emp.nama} bukan di departemen yang Anda pimpin).`,
        );
      }
    }
  }

  async create(
    dto: CreateJadwalKerjaDto,
    user: { idUser: number; role: string; idDepartemen?: number },
  ): Promise<JadwalKerja> {
    await this.validateKaryawanAccess([dto.idKaryawan], user);

    const holiday = await this.hariLiburRepo.findOne({
      where: { tanggal: dto.tanggal, isLibur: true },
    });

    const isLiburExplicit = dto.idShift ? false : !dto.isCuti;

    const existing = await this.jadwalRepo.findOne({
      where: {
        idKaryawan: dto.idKaryawan,
        tanggal: dto.tanggal as any,
      },
    });

    if (existing) {
      Object.assign(existing, {
        ...dto,
        isLibur: isLiburExplicit,
        keterangan: holiday ? holiday.nama : dto.keterangan || null,
        idUser: user.idUser,
        sumberUpload: dto.sumberUpload || 'manual',
      });
      return this.jadwalRepo.save(existing);
    }

    const jadwal = new JadwalKerja();
    Object.assign(jadwal, {
      ...dto,
      isLibur: isLiburExplicit,
      keterangan: holiday ? holiday.nama : dto.keterangan || null,
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
      const holiday = await this.hariLiburRepo.findOne({
        where: { tanggal: item.tanggal, isLibur: true },
      });

      const isLiburExplicit = item.idShift ? false : !item.isCuti;

      const existing = await this.jadwalRepo.findOne({
        where: {
          idKaryawan: item.idKaryawan,
          tanggal: item.tanggal as any,
        },
      });

      if (existing) {
        existing.idShift = item.idShift || (null as any);
        existing.isCuti = item.isCuti || false;
        existing.isLibur = isLiburExplicit;
        existing.keterangan =
          item.keterangan || (holiday ? holiday.nama : null);
        existing.idUser = user.idUser;
        existing.sumberUpload = 'manual';
        results.push(await this.jadwalRepo.save(existing));
      } else {
        const created = this.jadwalRepo.create({
          idKaryawan: item.idKaryawan,
          idShift: item.idShift || (null as any),
          isCuti: item.isCuti || false,
          isLibur: isLiburExplicit,
          keterangan: item.keterangan || (holiday ? holiday.nama : null),
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
      throw new BadRequestException(
        'Tidak ada data valid ditemukan di file Excel',
      );
    }

    return this.createBulk(items, user);
  }

  async findAll(user?: {
    role: string;
    idDepartemen?: number;
  }): Promise<JadwalKerja[]> {
    const query = this.jadwalRepo
      .createQueryBuilder('j')
      .leftJoinAndSelect('j.karyawan', 'karyawan')
      .leftJoinAndSelect('karyawan.departemen', 'departemen')
      .leftJoinAndSelect('j.shift', 'shift')
      .leftJoinAndSelect('j.user', 'user')
      .orderBy('j.tanggal', 'DESC');

    if (user?.role === 'SPV') {
      const managedDepts = await this.deptRepo.find({
        relations: { pengelola: true },
      });
      const allowedDeptIds = new Set<number>();
      if (user.idDepartemen) allowedDeptIds.add(Number(user.idDepartemen));
      managedDepts.forEach((d) => {
        if (
          (d.idPengelola && Number(d.idPengelola) === Number((user as any)?.idUser)) ||
          d.pengelola?.some((p) => Number(p.idUser) === Number((user as any)?.idUser))
        ) {
          allowedDeptIds.add(Number(d.idDepartemen));
        }
      });
      if ((user as any)?.idUser) {
        const userInDb = await this.userRepo.findOne({
          where: { idUser: (user as any).idUser },
        });
        if (userInDb?.nama) {
          const allKaryawan = await this.karyawanRepo.find();
          const matched = allKaryawan.find((k) => matchUserName(k.nama, userInDb.nama));
          if (matched?.idDepartemen) {
            allowedDeptIds.add(Number(matched.idDepartemen));
          }
        }
      }

      if (allowedDeptIds.size > 0) {
        query.where('karyawan.id_departemen IN (:...deptIds)', {
          deptIds: Array.from(allowedDeptIds),
        });
      }
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
      throw new NotFoundException(
        `Jadwal kerja dengan ID ${id} tidak ditemukan`,
      );
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

    // 1. Cek terlebih dahulu apakah ada jadwal kerja eksplisit di database
    const existingJadwal = await this.jadwalRepo.findOne({
      where: {
        idKaryawan,
        tanggal: tanggalStr as any,
      },
      relations: { shift: true, karyawan: true },
    });

    if (existingJadwal) {
      return existingJadwal;
    }

    // 2. Jika tidak ada jadwal manual di database, cek apakah karyawan di departemen Office/Backoffice
    const emp = await this.karyawanRepo.findOne({
      where: { idKaryawan },
      relations: { departemen: { pengelola: true } },
    });

    if (emp && this.isManagedByAdminOrHrd(emp.departemen)) {
      // 1. Cek apakah ada Hari Penting / Hari Libur di DB
      const dbHoliday = await this.hariLiburRepo.findOne({
        where: { tanggal: tanggalStr as any },
      });
      if (dbHoliday && dbHoliday.isLibur) {
        const libur = new JadwalKerja();
        libur.idKaryawan = idKaryawan;
        libur.tanggal = tanggalStr as any;
        libur.isCuti = false;
        libur.isLibur = true;
        libur.keterangan = dbHoliday.nama;
        libur.shift = null as any;
        return libur;
      }

      // 2. Cek apakah Hari Libur Nasional atau Cuti Bersama resmi Indonesia
      const { checkIndonesianHoliday } =
        await import('../hari-libur/indonesia-holidays.util.js');
      const officialHoliday = checkIndonesianHoliday(tanggalStr);
      if (officialHoliday) {
        const libur = new JadwalKerja();
        libur.idKaryawan = idKaryawan;
        libur.tanggal = tanggalStr as any;
        libur.isCuti = false;
        libur.isLibur = true;
        libur.keterangan = officialHoliday.isCollectiveLeave
          ? `Cuti Bersama: ${officialHoliday.localName}`
          : `Libur Nasional: ${officialHoliday.localName}`;
        libur.shift = null as any;
        return libur;
      }

      // 3. Libur Hari Minggu
      const parts = String(tanggalStr).split('-');
      const dateObj = new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2]),
      );
      const dayOfWeek = dateObj.getDay();

      if (dayOfWeek === 0) {
        const liburMinggu = new JadwalKerja();
        liburMinggu.idKaryawan = idKaryawan;
        liburMinggu.tanggal = tanggalStr as any;
        liburMinggu.isCuti = false;
        liburMinggu.isLibur = true;
        liburMinggu.keterangan = 'Libur Hari Minggu';
        liburMinggu.shift = null as any;
        return liburMinggu;
      } else {
        const defaultShift = await this.getOrCreateDefaultAdminShift();
        const jadwalDefault = new JadwalKerja();
        jadwalDefault.idKaryawan = idKaryawan;
        jadwalDefault.tanggal = tanggalStr as any;
        jadwalDefault.isCuti = false;
        jadwalDefault.isLibur = false;
        jadwalDefault.idShift = defaultShift.idShift;
        jadwalDefault.shift = defaultShift;
        return jadwalDefault;
      }
    }

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
        keterangan: jadwal.keterangan || null,
        message: 'Hari ini Anda sedang cuti',
      };
    }
    if (jadwal.isLibur) {
      return {
        hasJadwal: true,
        isCuti: false,
        isLibur: true,
        keterangan: jadwal.keterangan || 'Hari Libur Resmi / Hari Penting',
        message: `Hari ini libur: ${jadwal.keterangan || 'Hari Libur Resmi / Hari Penting'}`,
      };
    }
    if (!jadwal.shift) {
      return {
        hasJadwal: true,
        isCuti: false,
        isLibur: true,
        keterangan: jadwal.keterangan || 'Hari Libur Anda',
        message: 'Hari ini adalah hari libur Anda',
      };
    }
    return {
      hasJadwal: true,
      isCuti: false,
      isLibur: false,
      keterangan: jadwal.keterangan || null,
      idJadwal: jadwal.idJadwal || 0,
      shift: {
        idShift: jadwal.shift.idShift,
        namaShift: jadwal.shift.namaShift,
        jamMulai: jadwal.shift.jamMulai,
        jamSelesai: jadwal.shift.jamSelesai,
      },
    };
  }

  /**
   * Jadwal kerja seminggu ke depan untuk karyawan tertentu (mobile).
   */
  async findWeeklyByKaryawan(idKaryawan: number): Promise<JadwalKerja[]> {
    const now = new Date();
    const startOfWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);

    const emp = await this.karyawanRepo.findOne({
      where: { idKaryawan },
      relations: { departemen: { pengelola: true } },
    });

    if (emp && this.isManagedByAdminOrHrd(emp.departemen)) {
      const defaultShift = await this.getOrCreateDefaultAdminShift();
      const { checkIndonesianHoliday } =
        await import('../hari-libur/indonesia-holidays.util.js');
      const list: JadwalKerja[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek.getTime() + i * 24 * 60 * 60 * 1000);
        const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const item = new JadwalKerja();
        item.idKaryawan = idKaryawan;
        item.tanggal = dStr as any;
        item.isCuti = false;
        const officialHoliday = checkIndonesianHoliday(dStr);
        if (officialHoliday) {
          item.isLibur = true;
          item.keterangan = officialHoliday.isCollectiveLeave
            ? `Cuti Bersama: ${officialHoliday.localName}`
            : `Libur Nasional: ${officialHoliday.localName}`;
          item.shift = null as any;
        } else if (d.getDay() === 0) {
          item.isLibur = true;
          item.keterangan = 'Libur Hari Minggu';
          item.shift = null as any;
        } else {
          item.isLibur = false;
          item.idShift = defaultShift.idShift;
          item.shift = defaultShift;
        }
        list.push(item);
      }
      return list;
    }

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
    const totalDays = new Date(year, month, 0).getDate();
    const endOfMonth = new Date(year, month - 1, totalDays, 23, 59, 59);

    const emp = await this.karyawanRepo.findOne({
      where: { idKaryawan },
      relations: { departemen: { pengelola: true } },
    });

    if (emp && this.isManagedByAdminOrHrd(emp.departemen)) {
      const defaultShift = await this.getOrCreateDefaultAdminShift();
      const { checkIndonesianHoliday } =
        await import('../hari-libur/indonesia-holidays.util.js');
      const list: JadwalKerja[] = [];
      for (let d = 1; d <= totalDays; d++) {
        const dateObj = new Date(year, month - 1, d);
        const dStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const item = new JadwalKerja();
        item.idKaryawan = idKaryawan;
        item.tanggal = dStr as any;
        item.isCuti = false;
        const officialHoliday = checkIndonesianHoliday(dStr);
        if (officialHoliday) {
          item.isLibur = true;
          item.keterangan = officialHoliday.isCollectiveLeave
            ? `Cuti Bersama: ${officialHoliday.localName}`
            : `Libur Nasional: ${officialHoliday.localName}`;
          item.shift = null as any;
        } else if (dateObj.getDay() === 0) {
          item.isLibur = true;
          item.keterangan = 'Libur Hari Minggu';
          item.shift = null as any;
        } else {
          item.isLibur = false;
          item.idShift = defaultShift.idShift;
          item.shift = defaultShift;
        }
        list.push(item);
      }
      return list;
    }

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
    periodeAwal: string,
    periodeAkhir: string,
  ): Promise<JadwalKerja[]> {
    return this.jadwalRepo.find({
      where: {
        idKaryawan,
        isCuti: true,
        tanggal: Between(periodeAwal as any, periodeAkhir as any),
      },
    });
  }

  async findByKaryawanAndPeriode(
    idKaryawan: number,
    periodeAwal: string,
    periodeAkhir: string,
  ): Promise<JadwalKerja[]> {
    return this.jadwalRepo.find({
      where: {
        idKaryawan,
        tanggal: Between(periodeAwal as any, periodeAkhir as any),
      },
      relations: { shift: true },
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

  async deleteRange(
    dto: { idKaryawan: number[]; startDate: string; endDate: string },
    user: { idUser: number; role: string; idDepartemen?: number },
  ): Promise<{ deletedCount: number; message: string }> {
    if (!dto.idKaryawan || dto.idKaryawan.length === 0) {
      throw new BadRequestException('Daftar ID Karyawan tidak boleh kosong');
    }
    if (!dto.startDate || !dto.endDate) {
      throw new BadRequestException('Rentang tanggal (startDate & endDate) wajib diisi');
    }

    await this.validateKaryawanAccess(dto.idKaryawan, user);

    const deleteRes = await this.jadwalRepo
      .createQueryBuilder()
      .delete()
      .from(JadwalKerja)
      .where('id_karyawan IN (:...empIds)', { empIds: dto.idKaryawan })
      .andWhere('tanggal BETWEEN :startDate AND :endDate', {
        startDate: dto.startDate,
        endDate: dto.endDate,
      })
      .execute();

    return {
      deletedCount: deleteRes.affected || 0,
      message: `${deleteRes.affected || 0} jadwal kerja berhasil dihapus dari rentang ${dto.startDate} s/d ${dto.endDate}`,
    };
  }

  async exportJadwalExcel(
    res: Response,
    year: number,
    month: number,
    idDepartemen?: number,
    user?: { role: string; idDepartemen?: number },
  ) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    const monthName = monthNames[month - 1] || `Bulan ${month}`;

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    // 1. Libur nasional dan perusahaan
    const { checkIndonesianHoliday } = await import('../hari-libur/indonesia-holidays.util.js');
    const dbHolidays = await this.hariLiburRepo.find({
      where: { tanggal: Between(startDate as any, endDate as any) },
    });

    const dayMeta: { day: number; label: string; isSunday: boolean; holidayName?: string }[] = [];
    const dayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dateObj = new Date(year, month - 1, d);
      const isSunday = dateObj.getDay() === 0;
      const offHoliday = checkIndonesianHoliday(dStr);
      const dbH = dbHolidays.find((h) => h.tanggal === dStr && h.isLibur);
      const holidayName = dbH ? dbH.nama : offHoliday ? offHoliday.localName : undefined;
      dayMeta.push({
        day: d,
        label: dayLabels[dateObj.getDay()],
        isSunday,
        holidayName,
      });
    }

    // 2. Fetch departemen & karyawan
    const targetDeptId = user?.role === 'SPV' ? user.idDepartemen : idDepartemen;

    const karyawanWhere: any = { statusAktif: 'aktif' };
    if (targetDeptId) {
      karyawanWhere.idDepartemen = targetDeptId;
    }

    const [allKaryawan, allUsers, jadwalRecords] = await Promise.all([
      this.karyawanRepo.find({
        where: karyawanWhere,
        relations: { departemen: { pengelola: true }, jabatan: true },
        order: { nama: 'ASC' },
      }),
      this.userRepo.find({ relations: { departemen: true } }),
      this.jadwalRepo.find({
        where: { tanggal: Between(startDate as any, endDate as any) },
        relations: { shift: true },
      }),
    ]);

    // Map jadwal: `${idKaryawan}-${day}` -> JadwalKerja
    const schedLookup = new Map<string, JadwalKerja>();
    jadwalRecords.forEach((j) => {
      const tglStr = String(j.tanggal).slice(0, 10);
      const dayNum = Number(tglStr.split('-')[2]);
      schedLookup.set(`${j.idKaryawan}-${dayNum}`, j);
    });

    // 3. Klasifikasi Karyawan (Supervisor vs Staf)
    const enrichedList = allKaryawan.map((emp) => {
      const matchedUser = allUsers.find((u) => matchUserName(emp.nama, u.nama));
      const isRoleSpv = matchedUser?.role === 'SPV';
      const jabName = emp.jabatan?.namaJabatan?.toLowerCase() || '';
      const isJabatanSpv =
        jabName.includes('supervisor') || jabName.includes('spv') || jabName.includes('leader');
      const isSupervisor = isRoleSpv || isJabatanSpv;
      return {
        ...emp,
        isSupervisor,
      };
    });

    // 4. Kelompokkan per Departemen
    const deptGroups = new Map<number | string, { namaDepartemen: string; employees: typeof enrichedList }>();
    enrichedList.forEach((emp) => {
      const dId = emp.idDepartemen || 'tanpa_dept';
      const dName = emp.departemen?.namaDepartemen || 'Tanpa Departemen';
      if (!deptGroups.has(dId)) {
        deptGroups.set(dId, { namaDepartemen: dName, employees: [] });
      }
      deptGroups.get(dId)!.employees.push(emp);
    });

    // Urutkan setiap kelompok: Supervisor TERLEBIH DAHULU di atas, baru Staf
    deptGroups.forEach((group) => {
      group.employees.sort((a, b) => {
        if (a.isSupervisor && !b.isSupervisor) return -1;
        if (!a.isSupervisor && b.isSupervisor) return 1;
        return a.nama.localeCompare(b.nama);
      });
    });

    // 5. Bangun Workbook ExcelJS
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CV Sukses Bangunan (LARAS)';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(`Jadwal ${monthName} ${year}`);

    // Title Block
    sheet.mergeCells('A1', 'E1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'JADWAL KERJA CV SUKSES BANGUNAN';
    titleCell.font = { bold: true, size: 14, color: { argb: 'FF1E3A8A' } };

    sheet.mergeCells('A2', 'E2');
    const subCell = sheet.getCell('A2');
    subCell.value = `Periode: ${monthName} ${year} · Gabungan Supervisor & Karyawan per Departemen`;
    subCell.font = { italic: true, size: 10, color: { argb: 'FF475569' } };

    // Header Table (Row 4)
    const headerRowValues: any[] = ['No', 'Nama Karyawan', 'Departemen', 'Jabatan', 'Peran'];
    dayMeta.forEach((d) => {
      headerRowValues.push(`${d.day}\n${d.label}`);
    });
    const headerRow = sheet.addRow(headerRowValues);
    headerRow.height = 30;

    // Styling Header Row
    headerRow.eachCell((cell, colNumber) => {
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } };

      if (colNumber <= 5) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1E3A8A' }, // Navy blue
        };
      } else {
        const meta = dayMeta[colNumber - 6];
        if (meta && (meta.isSunday || meta.holidayName)) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFDC2626' }, // Merah libur
          };
        } else {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2563EB' }, // Royal blue
          };
        }
      }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    let rowNumber = 1;
    deptGroups.forEach((group) => {
      // Baris Sekat Header Departemen
      const deptHeaderRow = sheet.addRow([`DEPARTEMEN: ${group.namaDepartemen.toUpperCase()} (${group.employees.length} Orang)`]);
      sheet.mergeCells(`A${deptHeaderRow.number}`, `${sheet.getColumn(headerRowValues.length).letter}${deptHeaderRow.number}`);
      deptHeaderRow.height = 24;
      deptHeaderRow.getCell(1).font = { bold: true, size: 10, color: { argb: 'FF1E3A8A' } };
      deptHeaderRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEEF2FF' }, // Soft indigo fill
      };
      deptHeaderRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      deptHeaderRow.getCell(1).border = {
        top: { style: 'medium', color: { argb: 'FF93C5FD' } },
        bottom: { style: 'medium', color: { argb: 'FF93C5FD' } },
      };

      // Baris per karyawan
      group.employees.forEach((emp) => {
        const isManagedAdmin = this.isManagedByAdminOrHrd(emp.departemen);
        const rowData: any[] = [
          rowNumber++,
          emp.nama,
          emp.departemen?.namaDepartemen || '-',
          emp.jabatan?.namaJabatan || 'Staf',
          emp.isSupervisor ? '👑 SUPERVISOR' : 'STAF',
        ];

        for (let d = 1; d <= daysInMonth; d++) {
          const meta = dayMeta[d - 1];
          const j = schedLookup.get(`${emp.idKaryawan}-${d}`);

          if (isManagedAdmin) {
            if (j?.isCuti) {
              rowData.push('CUTI');
            } else if (meta.holidayName) {
              rowData.push('LIBUR');
            } else if (meta.isSunday) {
              rowData.push('OFF');
            } else {
              rowData.push('08:45-17:00');
            }
          } else {
            if (j?.isCuti) {
              rowData.push('CUTI');
            } else if (j?.isLibur) {
              rowData.push('OFF');
            } else if (j?.shift) {
              rowData.push(j.shift.namaShift);
            } else {
              rowData.push('—');
            }
          }
        }

        const dataRow = sheet.addRow(rowData);
        dataRow.height = 20;

        // Styling data cells
        dataRow.eachCell((cell, colNumber) => {
          cell.alignment = {
            horizontal: colNumber === 2 || colNumber === 3 || colNumber === 4 ? 'left' : 'center',
            vertical: 'middle',
          };
          cell.font = { size: 9 };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          };

          // Supervisor Row Highlight
          if (emp.isSupervisor) {
            if (colNumber <= 5) {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFFBEB' }, // Soft amber highlight for supervisor
              };
            }
            if (colNumber === 5) {
              cell.font = { bold: true, size: 9, color: { argb: 'FFB45309' } };
            }
          }

          // Nilai sel tanggal
          if (colNumber > 5) {
            const val = String(cell.value || '');
            if (val === 'CUTI') {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
              cell.font = { bold: true, size: 8, color: { argb: 'FF92400E' } };
            } else if (val === 'OFF' || val === 'LIBUR') {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
              cell.font = { size: 8, color: { argb: 'FF64748B' } };
            } else if (val !== '—') {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
              cell.font = { bold: true, size: 8, color: { argb: 'FF0369A1' } };
            } else {
              cell.font = { size: 8, color: { argb: 'FF94A3B8' } };
            }
          }
        });
      });
    });

    // Column widths
    sheet.getColumn(1).width = 5;  // No
    sheet.getColumn(2).width = 25; // Nama Karyawan
    sheet.getColumn(3).width = 22; // Departemen
    sheet.getColumn(4).width = 20; // Jabatan
    sheet.getColumn(5).width = 16; // Peran
    for (let col = 6; col <= headerRowValues.length; col++) {
      sheet.getColumn(col).width = 11;
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Jadwal_Kerja_Lengkap_${year}_${String(month).padStart(2, '0')}.xlsx"`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }
}
