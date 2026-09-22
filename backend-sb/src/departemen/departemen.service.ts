import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Departemen } from './entities/departemen.entity.js';
import { User } from '../user/entities/user.entity.js';
import { CreateDepartemenDto } from './dto/create-departemen.dto.js';
import { UpdateDepartemenDto } from './dto/update-departemen.dto.js';

@Injectable()
export class DepartemenService {
  constructor(
    @InjectRepository(Departemen)
    private readonly departemenRepo: Repository<Departemen>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  private parsePengelolaIds(raw: any): number[] {
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw.map(Number).filter((id) => !isNaN(id) && id > 0);
    }
    const parsed = Number(raw);
    return !isNaN(parsed) && parsed > 0 ? [parsed] : [];
  }

  private validatePengelolaRoles(users: User[]) {
    const roles = users.map((u) => u.role);
    const hasSPV = roles.includes('SPV');
    const hasAdmin = roles.includes('Admin');
    const hasHRD = roles.includes('HRD');

    if (hasSPV && hasAdmin) {
      throw new BadRequestException(
        'Pengelola departemen dengan role SPV dan Admin tidak dapat digabungkan dalam satu departemen',
      );
    }
    if (hasSPV && hasHRD) {
      throw new BadRequestException(
        'Pengelola departemen dengan role SPV dan HRD tidak dapat digabungkan dalam satu departemen',
      );
    }
  }

  async create(dto: CreateDepartemenDto): Promise<Departemen> {
    const pengelolaIds = this.parsePengelolaIds(dto.idPengelola);
    let pengelolaUsers: User[] = [];
    if (pengelolaIds.length > 0) {
      pengelolaUsers = await this.userRepo.findBy({
        idUser: In(pengelolaIds),
      });
      this.validatePengelolaRoles(pengelolaUsers);
    }

    const departemen = this.departemenRepo.create({
      namaDepartemen: dto.namaDepartemen,
      idPengelola: pengelolaIds.length > 0 ? pengelolaIds[0] : null,
      pengelola: pengelolaUsers,
    });
    const saved = await this.departemenRepo.save(departemen);

    // Sinkronkan idDepartemen ke seluruh akun user pengelola terpilih
    for (const u of pengelolaUsers) {
      u.idDepartemen = saved.idDepartemen;
      await this.userRepo.save(u);
    }

    return this.findOne(saved.idDepartemen);
  }

  async findAll(): Promise<Departemen[]> {
    return this.departemenRepo.find({
      relations: { pengelola: true },
      order: { idDepartemen: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Departemen> {
    const departemen = await this.departemenRepo.findOne({
      where: { idDepartemen: id },
      relations: { pengelola: true },
    });
    if (!departemen) {
      throw new NotFoundException(`Departemen dengan ID ${id} tidak ditemukan`);
    }
    return departemen;
  }

  async update(id: number, dto: UpdateDepartemenDto): Promise<Departemen> {
    const departemen = await this.findOne(id);

    if (dto.namaDepartemen) {
      departemen.namaDepartemen = dto.namaDepartemen;
    }

    if (dto.idPengelola !== undefined) {
      const pengelolaIds = this.parsePengelolaIds(dto.idPengelola);
      const newPengelolaUsers =
        pengelolaIds.length > 0
          ? await this.userRepo.findBy({ idUser: In(pengelolaIds) })
          : [];
      this.validatePengelolaRoles(newPengelolaUsers);

      const currentPengelolaIds = (departemen.pengelola || []).map(
        (u) => u.idUser,
      );

      // Pengelola yang dihapus dari departemen ini
      const removedIds = currentPengelolaIds.filter(
        (oldId) => !pengelolaIds.includes(oldId),
      );
      if (removedIds.length > 0) {
        const removedUsers = await this.userRepo.findBy({
          idUser: In(removedIds),
        });
        for (const u of removedUsers) {
          if (u.idDepartemen === departemen.idDepartemen) {
            u.idDepartemen = null as any;
            await this.userRepo.save(u);
          }
        }
      }

      // Set idDepartemen untuk pengelola baru
      for (const u of newPengelolaUsers) {
        u.idDepartemen = departemen.idDepartemen;
        await this.userRepo.save(u);
      }

      departemen.pengelola = newPengelolaUsers;
      departemen.idPengelola = pengelolaIds.length > 0 ? pengelolaIds[0] : null;
    }

    await this.departemenRepo.save(departemen);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const departemen = await this.findOne(id);

    // Lepaskan referensi departemen dari user
    const associatedUsers = await this.userRepo.find({
      where: { idDepartemen: id },
    });
    for (const u of associatedUsers) {
      u.idDepartemen = null as any;
      await this.userRepo.save(u);
    }

    await this.departemenRepo.remove(departemen);
  }
}
