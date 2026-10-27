import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.userRepo.findOne({
      where: { username: dto.username },
    });
    if (existing) {
      throw new ConflictException('Username sudah digunakan');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const { idDepartemen: _deptId, ...data } = dto;
    const user = this.userRepo.create({
      ...data,
      password: hashedPassword,
    });
    const saved = await this.userRepo.save(user);
    const { password: _pwd, ...result } = saved;
    return result as User;
  }

  async findAll(): Promise<User[]> {
    return this.userRepo.find({
      select: {
        idUser: true,
        nama: true,
        role: true,
        username: true,
        email: true,
        isActive: true,
        fotoProfil: true,
        idDepartemen: true,
        createdAt: true,
        updatedAt: true,
      },
      relations: {
        departemen: true,
      },
      order: {
        idUser: 'ASC',
      },
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { idUser: id },
      relations: {
        departemen: true,
      },
    });
    if (!user) {
      throw new NotFoundException(`User dengan ID ${id} tidak ditemukan`);
    }
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { username } });
  }

  async update(id: number, dto: UpdateUserDto, requesterRole?: string): Promise<User> {
    const user = await this.findOne(id);

    // Jika pemohon adalah HRD, tidak diizinkan mengubah akun Admin
    if (requesterRole === 'HRD' && user.role === 'Admin') {
      throw new ForbiddenException('HRD tidak memiliki akses untuk mengubah akun Admin');
    }

    const { idUser: _, idDepartemen: __, ...updates } = dto;

    // Jika bukan Admin, tidak diizinkan mengubah role
    if (requesterRole && requesterRole !== 'Admin') {
      delete updates.role;
    }

    // Cek keunikan username jika diubah
    if (updates.username && updates.username !== user.username) {
      const existing = await this.userRepo.findOne({
        where: { username: updates.username },
      });
      if (existing && existing.idUser !== user.idUser) {
        throw new ConflictException(`Username '${updates.username}' sudah digunakan oleh pengguna lain`);
      }
    }

    // Hash password jika diisi dan tidak kosong
    if (updates.password && updates.password.trim() !== '') {
      updates.password = await bcrypt.hash(updates.password, 10);
    } else {
      delete updates.password;
    }

    Object.assign(user, updates);
    const saved = await this.userRepo.save(user);
    const { password: _p, ...result } = saved;
    return result as User;
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepo.remove(user);
  }

  async findSuperAdmins(): Promise<User[]> {
    return this.userRepo.find({
      where: {
        role: In([
          'SUPER_ADMIN',
          'Super Admin',
          'SOFTWARE_ENGINEER',
          'DEVOPS_ADMIN',
          'SECURITY_AUDITOR',
          'Admin',
        ]),
      },
      select: {
        idUser: true,
        nama: true,
        role: true,
        username: true,
        email: true,
        fotoProfil: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      order: {
        idUser: 'ASC',
      },
    });
  }

  async removeSuperAdmin(id: number): Promise<void> {
    const user = await this.findOne(id);
    if (user.idUser === 1 || user.username === 'superadmin') {
      throw new ForbiddenException('Akun utama Super Admin dilindungi dan tidak dapat dihapus');
    }
    await this.userRepo.remove(user);
  }
}
