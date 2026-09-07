import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Penggajian } from './entities/penggajian.entity.js';
import { KaryawanService } from '../karyawan/karyawan.service.js';
import { AbsensiService } from '../absensi/absensi.service.js';
import { JadwalKerjaService } from '../jadwal-kerja/jadwal-kerja.service.js';

@Injectable()
export class PenggajianService {
  constructor(
    @InjectRepository(Penggajian)
    private readonly penggajianRepo: Repository<Penggajian>,
    private readonly karyawanService: KaryawanService,
    private readonly absensiService: AbsensiService,
    private readonly jadwalKerjaService: JadwalKerjaService,
  ) {}

  async generate(
    periodeAwal: string,
    periodeAkhir: string,
    potonganGlobal: number = 0,
  ): Promise<Penggajian[]> {
    const startDate = new Date(periodeAwal);
    const endDate = new Date(periodeAkhir);

    const karyawanList = await this.karyawanService.findAllAktif();
    const results: Penggajian[] = [];

    for (const karyawan of karyawanList) {
      const absensiList =
        await this.absensiService.findByKaryawanDanPeriode(
          karyawan.idKaryawan,
          startDate,
          endDate,
        );

      const cutiList = await this.jadwalKerjaService.findCutiByKaryawanAndPeriode(
        karyawan.idKaryawan,
        startDate,
        endDate,
      );

      let totalJamKerja = 0;
      for (const absensi of absensiList) {
        if (absensi.jamMasukAktual && absensi.jamKeluarAktual) {
          const diffMs =
            new Date(absensi.jamKeluarAktual).getTime() -
            new Date(absensi.jamMasukAktual).getTime();
          totalJamKerja += diffMs / (1000 * 60 * 60);
        }
      }

      // Paid leave gets 8 hours per cuti day if they have hakCuti
      if (karyawan.hakCuti) {
        totalJamKerja += cutiList.length * 8;
      }

      totalJamKerja = Math.round(totalJamKerja);

      const gajiPokok = Number(karyawan.gajiPokok) || 0;
      const ratePerJam = gajiPokok > 0 ? gajiPokok / 173 : 0;
      const totalGaji = ratePerJam * totalJamKerja - potonganGlobal;

      const penggajian = this.penggajianRepo.create({
        idKaryawan: karyawan.idKaryawan,
        periodeAwal: startDate,
        periodeAkhir: endDate,
        totalJamKerja,
        gajiPokok,
        potongan: potonganGlobal,
        totalGaji: Math.max(totalGaji, 0),
      });

      const saved = await this.penggajianRepo.save(penggajian);
      results.push(saved);
    }

    return results;
  }

  async findAll(): Promise<Penggajian[]> {
    return this.penggajianRepo.find({
      relations: { karyawan: true },
    });
  }

  async findOne(id: number): Promise<Penggajian> {
    const gaji = await this.penggajianRepo.findOne({
      where: { idGaji: id },
      relations: { karyawan: true },
    });
    if (!gaji) {
      throw new NotFoundException(
        `Penggajian dengan ID ${id} tidak ditemukan`,
      );
    }
    return gaji;
  }

  async remove(id: number): Promise<void> {
    const gaji = await this.findOne(id);
    await this.penggajianRepo.remove(gaji);
  }
}
