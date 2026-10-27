import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HariLibur } from './entities/hari-libur.entity.js';
import { Karyawan } from '../karyawan/entities/karyawan.entity.js';
import { JadwalKerja } from '../jadwal-kerja/entities/jadwal-kerja.entity.js';
import { Departemen } from '../departemen/entities/departemen.entity.js';
import { Shift } from '../shift/entities/shift.entity.js';
import { CreateHariLiburDto } from './dto/create-hari-libur.dto.js';
import { UpdateHariLiburDto } from './dto/update-hari-libur.dto.js';
import { OpicaHolidayService } from './opica-holiday.service.js';
import { KebijakanLiburService } from '../kebijakan-libur/kebijakan-libur.service.js';

@Injectable()
export class HariLiburService {
  constructor(
    @InjectRepository(HariLibur)
    private readonly hariLiburRepo: Repository<HariLibur>,
    @InjectRepository(Karyawan)
    private readonly karyawanRepo: Repository<Karyawan>,
    @InjectRepository(JadwalKerja)
    private readonly jadwalRepo: Repository<JadwalKerja>,
    @InjectRepository(Departemen)
    private readonly deptRepo: Repository<Departemen>,
    @InjectRepository(Shift)
    private readonly shiftRepo: Repository<Shift>,
    private readonly opicaService: OpicaHolidayService,
    private readonly kebijakanLibur?: KebijakanLiburService,
  ) {}

  private async applyHolidayToAllSchedules(
    tanggal: string,
    nama: string,
    isLibur: boolean,
    idShift: number | null,
    idUser: number,
  ): Promise<number> {
    const activeEmployees = await this.karyawanRepo.find({
      where: { statusAktif: 'aktif' },
      relations: { departemen: { pengelola: true } },
    });

    let count = 0;
    for (const emp of activeEmployees) {
      // Jadwal karyawan yang dikelola Admin & HRD tidak boleh diubah biar hari penting
      const dept = emp.departemen;
      const isManagedByAdminOrHrd =
        !dept ||
        !dept.pengelola ||
        dept.pengelola.length === 0 ||
        dept.pengelola.some((u) => u.role === 'Admin' || u.role === 'HRD');

      if (isManagedByAdminOrHrd) {
        continue;
      }

      // Karyawan SPV: Timpa jadwal mereka sesuai pengaturan HRD
      const existing = await this.jadwalRepo.findOne({
        where: {
          idKaryawan: emp.idKaryawan,
          tanggal: tanggal as any,
        },
      });

      if (existing) {
        if (
          existing.isCuti ||
          ['pengajuan_cuti', 'regular_off', 'pertukaran_jadwal'].includes(
            existing.sumberUpload,
          )
        ) {
          continue;
        }
        existing.idShift = isLibur ? (null as any) : idShift;
        existing.shift = null as any;
        existing.isCuti = false;
        existing.isLibur = isLibur;
        existing.keterangan = isLibur ? nama : `Shift HRD: ${nama}`;
        existing.sumberUpload = 'hari_penting';
        existing.idUser = idUser;
        await this.jadwalRepo.save(existing);
      } else {
        const newJadwal = this.jadwalRepo.create({
          idKaryawan: emp.idKaryawan,
          tanggal: tanggal as any,
          idShift: isLibur ? (null as any) : idShift,
          isCuti: false,
          isLibur: isLibur,
          keterangan: isLibur ? nama : `Shift HRD: ${nama}`,
          sumberUpload: 'hari_penting',
          idUser: idUser,
        });
        await this.jadwalRepo.save(newJadwal);
      }
      count++;
    }

    return count;
  }

  async create(
    dto: CreateHariLiburDto,
    user: { idUser: number; role: string },
  ) {
    const existing = await this.hariLiburRepo.findOne({
      where: { tanggal: dto.tanggal },
    });
    if (existing) {
      throw new ConflictException(
        `Tanggal ${dto.tanggal} sudah terdaftar sebagai hari penting: "${existing.nama}"`,
      );
    }

    const isLibur = dto.isLibur ?? true;
    if (!isLibur && !dto.idShift) {
      throw new BadRequestException(
        'Shift wajib dipilih jika hari penting tetap merupakan hari kerja',
      );
    }
    const shiftExist = dto.idShift
      ? await this.shiftRepo.findOne({ where: { idShift: dto.idShift } })
      : null;
    if (dto.idShift && !shiftExist) {
      throw new NotFoundException(
        `Shift dengan ID ${dto.idShift} tidak ditemukan`,
      );
    }

    const hariLibur = this.hariLiburRepo.create({
      nama: dto.nama,
      tanggal: dto.tanggal,
      keterangan: dto.keterangan || null,
      isLibur,
      idShift: isLibur ? null : shiftExist!.idShift,
      idUser: user.idUser,
    });

    const saved = await this.hariLiburRepo.save(hariLibur);

    // Otomatis menimpa seluruh jadwal karyawan SPV pada hari tersebut
    const totalUpdated = await this.applyHolidayToAllSchedules(
      saved.tanggal,
      saved.nama,
      saved.isLibur,
      saved.idShift,
      user.idUser,
    );

    return {
      message: `Hari penting "${saved.nama}" berhasil disimpan. ${totalUpdated} jadwal karyawan operasional (SPV) otomatis diperbarui (karyawan Admin/HRD tetap jadwal kantor default).`,
      data: saved,
      totalKaryawanDiupdate: totalUpdated,
    };
  }

  async findAll(): Promise<HariLibur[]> {
    return this.hariLiburRepo.find({
      order: { tanggal: 'ASC' },
      relations: { user: true, shift: true },
    });
  }

  async findOne(id: number): Promise<HariLibur> {
    const hariLibur = await this.hariLiburRepo.findOne({
      where: { idHariLibur: id },
      relations: { user: true, shift: true },
    });
    if (!hariLibur) {
      throw new NotFoundException(
        `Hari penting dengan ID ${id} tidak ditemukan`,
      );
    }
    return hariLibur;
  }

  async findByDate(tanggal: string): Promise<HariLibur | null> {
    return this.hariLiburRepo.findOne({
      where: { tanggal },
      relations: { shift: true },
    });
  }

  async update(
    id: number,
    dto: UpdateHariLiburDto,
    user: { idUser: number; role: string },
  ) {
    const hariLibur = await this.findOne(id);
    const oldDate = hariLibur.tanggal;

    if (dto.tanggal && dto.tanggal !== oldDate) {
      const conflict = await this.hariLiburRepo.findOne({
        where: { tanggal: dto.tanggal },
      });
      if (conflict && conflict.idHariLibur !== id) {
        throw new ConflictException(
          `Tanggal ${dto.tanggal} sudah terdaftar sebagai hari penting lain: "${conflict.nama}"`,
        );
      }

      // Reset jadwal lama yang tadinya di-set oleh hari penting ini
      await this.jadwalRepo.update(
        { tanggal: oldDate as any, sumberUpload: 'hari_penting' },
        { isLibur: false, idShift: null as any, keterangan: null as any },
      );
    }

    const isLibur = dto.isLibur ?? hariLibur.isLibur;
    const targetShiftId =
      dto.idShift !== undefined ? dto.idShift : hariLibur.idShift;
    if (!isLibur && !targetShiftId) {
      throw new BadRequestException(
        'Shift wajib dipilih jika hari penting tetap merupakan hari kerja',
      );
    }
    const shiftExist = targetShiftId
      ? await this.shiftRepo.findOne({ where: { idShift: targetShiftId } })
      : null;
    if (targetShiftId && !shiftExist) {
      throw new NotFoundException(
        `Shift dengan ID ${targetShiftId} tidak ditemukan`,
      );
    }

    Object.assign(hariLibur, {
      ...dto,
      isLibur,
      idShift: isLibur ? null : shiftExist!.idShift,
      idUser: user.idUser,
    });

    const saved = await this.hariLiburRepo.save(hariLibur);

    // Terapkan ke jadwal karyawan di tanggal baru/terkini
    const totalUpdated = await this.applyHolidayToAllSchedules(
      saved.tanggal,
      saved.nama,
      saved.isLibur,
      saved.idShift,
      user.idUser,
    );

    return {
      message: `Hari penting "${saved.nama}" berhasil diperbarui`,
      data: saved,
      totalKaryawanDiupdate: totalUpdated,
    };
  }

  async remove(id: number): Promise<{ message: string }> {
    const hariLibur = await this.findOne(id);

    // Reset status libur pada jadwal_kerja untuk tanggal tersebut
    await this.jadwalRepo.update(
      { tanggal: hariLibur.tanggal as any, sumberUpload: 'hari_penting' },
      { isLibur: false, idShift: null as any, keterangan: null as any },
    );

    await this.hariLiburRepo.remove(hariLibur);

    return {
      message: `Hari penting "${hariLibur.nama}" pada tanggal ${hariLibur.tanggal} berhasil dihapus dan status libur pada jadwal karyawan telah direset`,
    };
  }

  /**
   * Mengambil kalender hari libur nasional, cuti bersama, hari peringatan nasional (Opica),
   * beserta hari penting kustom perusahaan dari database.
   */
  async getNationalCalendar(year: number, month?: number) {
    // 1. Ambil event resmi dari Opica (libur nasional, cuti bersama, hari nasional)
    const opicaEvents = await this.opicaService.getEvents(year, month);

    // 2. Ambil juga hari libur kustom perusahaan dari database
    const dbHolidays = await this.hariLiburRepo.find({
      relations: { shift: true },
    });

    const dbMap = new Map<string, HariLibur>();
    for (const item of dbHolidays) {
      if (item.tanggal && item.tanggal.startsWith(String(year))) {
        if (month) {
          const m = parseInt(item.tanggal.substring(5, 7), 10);
          if (m !== month) continue;
        }
        dbMap.set(item.tanggal, item);
      }
    }

    const merged: Array<{
      date: string;
      localName: string;
      name?: string;
      type: 'libur_nasional' | 'cuti_bersama' | 'hari_nasional' | 'company_holiday';
      category?: string;
      isLibur: boolean;
      keterangan?: string | null;
      description?: string | null;
      shift?: any;
    }> = [];

    for (const event of opicaEvents) {
      const customDb = dbMap.get(event.date);
      if (customDb) {
        merged.push({
          date: event.date,
          localName: customDb.nama,
          name: customDb.nama,
          type: 'company_holiday',
          category: 'perusahaan',
          isLibur: customDb.isLibur,
          keterangan: customDb.keterangan,
          description: customDb.keterangan || event.description,
          shift: customDb.shift,
        });
        dbMap.delete(event.date);
      } else {
        merged.push({
          date: event.date,
          localName: event.name,
          name: event.name,
          type: event.type,
          category: event.category || 'nasional',
          isLibur: event.isLibur,
          keterangan: event.description,
          description: event.description,
        });
      }
    }

    // Tambahkan sisa custom holiday di DB yang belum masuk
    for (const [_, item] of dbMap.entries()) {
      merged.push({
        date: item.tanggal,
        localName: item.nama,
        name: item.nama,
        type: 'company_holiday',
        category: 'perusahaan',
        isLibur: item.isLibur,
        keterangan: item.keterangan,
        description: item.keterangan,
        shift: item.shift,
      });
    }

    // Status libur nasional & cuti bersama mengikuti Kebijakan Tanggal Merah perusahaan
    if (this.kebijakanLibur) {
      const awal = `${year}-${String(month ?? 1).padStart(2, '0')}-01`;
      const akhir = month
        ? `${year}-${String(month).padStart(2, '0')}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`
        : `${year}-12-31`;
      const merah = await this.kebijakanLibur.tanggalMerahDalamRentang(awal, akhir);
      for (const item of merged) {
        if (item.type === 'libur_nasional' || item.type === 'cuti_bersama') {
          item.isLibur = merah.has(item.date);
        }
      }
    }

    merged.sort((a, b) => a.date.localeCompare(b.date));

    // Siapkan juga index by date untuk kemudahan lookup
    const byDate: Record<string, typeof merged> = {};
    for (const item of merged) {
      if (!byDate[item.date]) byDate[item.date] = [];
      byDate[item.date].push(item);
    }

    return {
      status: 'success',
      year,
      month: month || null,
      count: merged.length,
      data: merged,
      byDate,
    };
  }

  /**
   * Cek apakah suatu tanggal adalah hari libur (dari DB atau libur nasional/cuti bersama resmi)
   */
  async isHolidayOrCutiBersama(dateStr: string): Promise<{
    isLibur: boolean;
    nama: string;
    type: string;
  } | null> {
    // 1. Cek DB dulu
    const dbHoliday = await this.hariLiburRepo.findOne({
      where: { tanggal: dateStr },
      relations: { shift: true },
    });
    if (dbHoliday) {
      return {
        isLibur: dbHoliday.isLibur,
        nama: dbHoliday.nama,
        type: 'company_holiday',
      };
    }

    // 2. Cek libur nasional & cuti bersama resmi via Opica / util
    try {
      const year = parseInt(dateStr.substring(0, 4), 10);
      const month = parseInt(dateStr.substring(5, 7), 10);
      const events = await this.opicaService.getEvents(year, month);
      const match = events.find((e) => e.date === dateStr && e.isLibur);
      if (match) {
        return {
          isLibur: true,
          nama: match.name,
          type: match.type,
        };
      }
    } catch {
      // Fallback lokal jika ada kendala
      const { checkIndonesianHoliday } =
        await import('./indonesia-holidays.util.js');
      const official = checkIndonesianHoliday(dateStr);
      if (official) {
        return {
          isLibur: true,
          nama: official.localName,
          type: official.type,
        };
      }
    }

    return null;
  }
}
