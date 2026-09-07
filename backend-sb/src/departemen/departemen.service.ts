import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Departemen } from './entities/departemen.entity.js';
import { CreateDepartemenDto } from './dto/create-departemen.dto.js';
import { UpdateDepartemenDto } from './dto/update-departemen.dto.js';

@Injectable()
export class DepartemenService {
  constructor(
    @InjectRepository(Departemen)
    private readonly departemenRepo: Repository<Departemen>,
  ) {}

  async create(dto: CreateDepartemenDto): Promise<Departemen> {
    const departemen = this.departemenRepo.create(dto);
    return this.departemenRepo.save(departemen);
  }

  async findAll(): Promise<Departemen[]> {
    return this.departemenRepo.find();
  }

  async findOne(id: number): Promise<Departemen> {
    const departemen = await this.departemenRepo.findOne({
      where: { idDepartemen: id },
    });
    if (!departemen) {
      throw new NotFoundException(`Departemen dengan ID ${id} tidak ditemukan`);
    }
    return departemen;
  }

  async update(id: number, dto: UpdateDepartemenDto): Promise<Departemen> {
    const departemen = await this.findOne(id);
    Object.assign(departemen, dto);
    return this.departemenRepo.save(departemen);
  }

  async remove(id: number): Promise<void> {
    const departemen = await this.findOne(id);
    await this.departemenRepo.remove(departemen);
  }
}
