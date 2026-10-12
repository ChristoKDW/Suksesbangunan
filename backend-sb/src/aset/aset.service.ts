import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PeminjamanAset } from './entities/peminjaman-aset.entity.js';
import { CreatePeminjamanAsetDto } from './dto/create-peminjaman-aset.dto.js';
import { UpdatePeminjamanAsetDto } from './dto/update-peminjaman-aset.dto.js';

@Injectable()
export class AsetService {
  constructor(
    @InjectRepository(PeminjamanAset)
    private readonly asetRepo: Repository<PeminjamanAset>,
  ) {}

  create(dto: CreatePeminjamanAsetDto): Promise<PeminjamanAset> {
    const aset = this.asetRepo.create({
      ...dto,
      tanggalPinjam: dto.tanggalPinjam as any,
      status: 'dipinjam',
    });
    return this.asetRepo.save(aset);
  }

  findAll(idKaryawan?: number): Promise<PeminjamanAset[]> {
    return this.asetRepo.find({
      where: idKaryawan ? { idKaryawan } : {},
      order: { idPeminjamanAset: 'DESC' },
    });
  }

  async findOne(id: number): Promise<PeminjamanAset> {
    const aset = await this.asetRepo.findOne({
      where: { idPeminjamanAset: id },
    });
    if (!aset) {
      throw new NotFoundException(
        `Peminjaman aset dengan ID ${id} tidak ditemukan`,
      );
    }
    return aset;
  }

  async update(
    id: number,
    dto: UpdatePeminjamanAsetDto,
  ): Promise<PeminjamanAset> {
    const aset = await this.findOne(id);
    Object.assign(aset, dto);
    return this.asetRepo.save(aset);
  }

  /** Tandai aset sudah dikembalikan hari ini. */
  async kembalikan(id: number): Promise<PeminjamanAset> {
    const aset = await this.findOne(id);
    aset.status = 'dikembalikan';
    aset.tanggalDikembalikan = new Date();
    return this.asetRepo.save(aset);
  }

  async remove(id: number): Promise<void> {
    const aset = await this.findOne(id);
    await this.asetRepo.remove(aset);
  }
}
