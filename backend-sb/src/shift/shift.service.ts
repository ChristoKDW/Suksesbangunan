import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
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

  private isBackoffice(name?: string): boolean {
    if (!name) return false;
    const clean = name.toLowerCase().replace(/[\s\-_]/g, '');
    return clean === 'backoffice';
  }

  async create(dto: CreateShiftDto, user?: { role: string; idDepartemen?: number }): Promise<Shift> {
    if (user?.role === 'SPV') {
      if (!user.idDepartemen) {
        throw new ForbiddenException('SPV tidak memiliki departemen yang terdaftar');
      }
      dto.idDepartemen = user.idDepartemen;

      const dept = await this.deptRepo.findOne({ where: { idDepartemen: user.idDepartemen } });
      if (dept && this.isBackoffice(dept.namaDepartemen)) {
        throw new ForbiddenException('Shift Backoffice hanya dapat diatur oleh HRD dan Admin');
      }
    } else if (dto.idDepartemen) {
      // Check if target dept is backoffice and user is not admin/hrd
      const dept = await this.deptRepo.findOne({ where: { idDepartemen: dto.idDepartemen } });
      if (dept && this.isBackoffice(dept.namaDepartemen) && user?.role !== 'Admin' && user?.role !== 'HRD') {
        throw new ForbiddenException('Shift Backoffice hanya dapat diatur oleh HRD dan Admin');
      }
    }

    const shift = this.shiftRepo.create(dto);
    return this.shiftRepo.save(shift);
  }

  async findAll(userRole?: string, idDepartemen?: number): Promise<Shift[]> {
    if (userRole === 'SPV') {
      if (!idDepartemen) return [];
      // SPV only sees shifts for their own department or general shifts
      const allShifts = await this.shiftRepo.find({
        relations: { departemen: true },
        order: { idShift: 'ASC' },
      });
      return allShifts.filter((s) => {
        if (s.departemen && this.isBackoffice(s.departemen.namaDepartemen)) {
          return false;
        }
        return s.idDepartemen === idDepartemen || s.idDepartemen === null || s.idDepartemen === undefined;
      });
    }

    // Admin & HRD can see all shifts
    return this.shiftRepo.find({
      relations: { departemen: true },
      order: { idShift: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Shift> {
    const shift = await this.shiftRepo.findOne({
      where: { idShift: id },
      relations: { departemen: true },
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
    const shift = await this.findOne(id);

    if (user?.role === 'SPV') {
      if (!user.idDepartemen || shift.idDepartemen !== user.idDepartemen) {
        throw new ForbiddenException('Anda hanya dapat mengubah shift untuk departemen Anda sendiri');
      }
      if (shift.departemen && this.isBackoffice(shift.departemen.namaDepartemen)) {
        throw new ForbiddenException('Shift Backoffice hanya dapat diatur oleh HRD dan Admin');
      }
      dto.idDepartemen = user.idDepartemen;
    }

    Object.assign(shift, dto);
    return this.shiftRepo.save(shift);
  }

  async remove(
    id: number,
    user?: { role: string; idDepartemen?: number },
  ): Promise<void> {
    const shift = await this.findOne(id);

    if (user?.role === 'SPV') {
      if (!user.idDepartemen || shift.idDepartemen !== user.idDepartemen) {
        throw new ForbiddenException('Anda hanya dapat menghapus shift untuk departemen Anda sendiri');
      }
      if (shift.departemen && this.isBackoffice(shift.departemen.namaDepartemen)) {
        throw new ForbiddenException('Shift Backoffice hanya dapat diatur oleh HRD dan Admin');
      }
    }

    await this.shiftRepo.remove(shift);
  }
}
