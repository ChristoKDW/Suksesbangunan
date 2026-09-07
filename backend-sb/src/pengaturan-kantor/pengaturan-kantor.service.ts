import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PengaturanKantor } from './entities/pengaturan-kantor.entity.js';
import { CreatePengaturanKantorDto } from './dto/create-pengaturan-kantor.dto.js';
import { UpdatePengaturanKantorDto } from './dto/update-pengaturan-kantor.dto.js';

@Injectable()
export class PengaturanKantorService {
  constructor(
    @InjectRepository(PengaturanKantor)
    private readonly kantorRepo: Repository<PengaturanKantor>,
  ) {}

  async create(dto: CreatePengaturanKantorDto): Promise<PengaturanKantor> {
    const kantor = this.kantorRepo.create(dto);
    return this.kantorRepo.save(kantor);
  }

  async findAll(): Promise<PengaturanKantor[]> {
    return this.kantorRepo.find({ relations: { departemen: true } });
  }

  async findOne(id: number): Promise<PengaturanKantor> {
    const kantor = await this.kantorRepo.findOne({
      where: { idKantor: id },
      relations: { departemen: true },
    });
    if (!kantor) {
      throw new NotFoundException(
        `Pengaturan kantor dengan ID ${id} tidak ditemukan`,
      );
    }
    return kantor;
  }

  async findByDepartemen(
    idDepartemen: number,
  ): Promise<PengaturanKantor | null> {
    return this.kantorRepo.findOne({
      where: { idDepartemen },
    });
  }

  async findDefault(): Promise<PengaturanKantor | null> {
    return this.kantorRepo.findOne({ where: {} });
  }

  async update(
    id: number,
    dto: UpdatePengaturanKantorDto,
  ): Promise<PengaturanKantor> {
    const kantor = await this.findOne(id);
    Object.assign(kantor, dto);
    return this.kantorRepo.save(kantor);
  }

  async remove(id: number): Promise<void> {
    const kantor = await this.findOne(id);
    await this.kantorRepo.remove(kantor);
  }
}
