import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Jabatan } from './entities/jabatan.entity.js';
import { CreateJabatanDto } from './dto/create-jabatan.dto.js';
import { UpdateJabatanDto } from './dto/update-jabatan.dto.js';

@Injectable()
export class JabatanService {
  constructor(
    @InjectRepository(Jabatan)
    private readonly jabatanRepo: Repository<Jabatan>,
  ) {}

  async create(dto: CreateJabatanDto): Promise<Jabatan> {
    const jabatan = this.jabatanRepo.create(dto);
    return this.jabatanRepo.save(jabatan);
  }

  async findAll(): Promise<Jabatan[]> {
    return this.jabatanRepo.find();
  }

  async findOne(id: number): Promise<Jabatan> {
    const jabatan = await this.jabatanRepo.findOne({
      where: { idJabatan: id },
    });
    if (!jabatan) {
      throw new NotFoundException(`Jabatan dengan ID ${id} tidak ditemukan`);
    }
    return jabatan;
  }

  async update(id: number, dto: UpdateJabatanDto): Promise<Jabatan> {
    const jabatan = await this.findOne(id);
    Object.assign(jabatan, dto);
    return this.jabatanRepo.save(jabatan);
  }

  async remove(id: number): Promise<void> {
    const jabatan = await this.findOne(id);
    await this.jabatanRepo.remove(jabatan);
  }
}
