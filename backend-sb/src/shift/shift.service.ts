import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shift } from './entities/shift.entity.js';
import { Departemen } from '../departemen/entities/departemen.entity.js';
import { CreateShiftDto } from './dto/create-shift.dto.js';
import { UpdateShiftDto } from './dto/update-shift.dto.js';

@Injectable()
export class ShiftService {
  constructor(
    @InjectRepository(Shift)
    private readonly shiftRepo: Repository<Shift>,
    @InjectRepository(Departemen)
    private readonly deptRepo: Repository<Departemen>,
  ) {}

  private isManagedByAdminOrHrd(dept?: Departemen | null): boolean {
    if (!dept) return false;
    const managers = Array.isArray(dept.pengelola)
      ? dept.pengelola
      : dept.pengelola
      ? [dept.pengelola]
      : [];
    const hasAdminOrHrd = managers.some(
      (m: any) => m.role === 'Admin' || m.role === 'HRD',
    );
    const isBackoffice =
      dept.namaDepartemen?.toLowerCase().replace(/[\s\-_]/g, '') ===
      'backoffice';
    return hasAdminOrHrd || isBackoffice;
  }

  async create(
    dto: CreateShiftDto,
    user?: { role: string; idDepartemen?: number },
  ): Promise<Shift> {
    if (user?.role === 'SPV') {
      throw new ForbiddenException(
        'Hanya Admin dan HRD yang dapat menambah daftar shift. Supervisor hanya mengatur jadwal shift.',
      );
    }

    if (dto.idDepartemen) {
      const dept = await this.deptRepo.findOne({
        where: { idDepartemen: dto.idDepartemen },
        relations: { pengelola: true },
      });
      if (dept && this.isManagedByAdminOrHrd(dept)) {
        throw new BadRequestException(
          'Departemen yang dikelola oleh Admin & HRD memiliki jadwal kerja tetap kantor (08:45 - 17:00, Minggu Libur) dan tidak menggunakan daftar shift.',
        );
      }
    }

    const shift = this.shiftRepo.create(dto);
    return this.shiftRepo.save(shift);
  }

  async findAll(userRole?: string, idDepartemen?: number): Promise<Shift[]> {
    const allShifts = await this.shiftRepo.find({
      relations: { departemen: { pengelola: true } },
      order: { idShift: 'ASC' },
    });

    // Departemen yang dikelola Admin & HRD tidak memiliki daftar shift
    const nonAdminHrdShifts = allShifts.filter(
      (s) => !this.isManagedByAdminOrHrd(s.departemen),
    );

    if (userRole === 'SPV') {
      if (!idDepartemen) return [];
      return nonAdminHrdShifts.filter(
        (s) =>
          s.idDepartemen === idDepartemen ||
          s.idDepartemen === null ||
          s.idDepartemen === undefined,
      );
    }

    return nonAdminHrdShifts;
  }

  async findOne(id: number): Promise<Shift> {
    const shift = await this.shiftRepo.findOne({
      where: { idShift: id },
      relations: { departemen: { pengelola: true } },
    });
    if (!shift) {
      throw new NotFoundException(`Shift dengan ID ${id} tidak ditemukan`);
    }
    return shift;
  }

  async update(
    id: number,
    dto: UpdateShiftDto,
    user?: { role: string; idDepartemen?: number },
  ): Promise<Shift> {
    if (user?.role === 'SPV') {
      throw new ForbiddenException(
        'Hanya Admin dan HRD yang dapat mengubah daftar shift. Supervisor hanya mengatur jadwal shift.',
      );
    }

    const shift = await this.findOne(id);

    if (dto.idDepartemen) {
      const dept = await this.deptRepo.findOne({
        where: { idDepartemen: dto.idDepartemen },
        relations: { pengelola: true },
      });
      if (dept && this.isManagedByAdminOrHrd(dept)) {
        throw new BadRequestException(
          'Departemen yang dikelola oleh Admin & HRD memiliki jadwal kerja tetap kantor (08:45 - 17:00, Minggu Libur) dan tidak menggunakan daftar shift.',
        );
      }
    }

    Object.assign(shift, dto);
    return this.shiftRepo.save(shift);
  }

  async remove(
    id: number,
    user?: { role: string; idDepartemen?: number },
  ): Promise<void> {
    if (user?.role === 'SPV') {
      throw new ForbiddenException(
        'Hanya Admin dan HRD yang dapat menghapus daftar shift. Supervisor hanya mengatur jadwal shift.',
      );
    }

    const shift = await this.findOne(id);
    await this.shiftRepo.remove(shift);
  }
}
