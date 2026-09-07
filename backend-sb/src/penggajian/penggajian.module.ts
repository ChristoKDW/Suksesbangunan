import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Penggajian } from './entities/penggajian.entity.js';
import { PenggajianService } from './penggajian.service.js';
import { PenggajianController } from './penggajian.controller.js';
import { KaryawanModule } from '../karyawan/karyawan.module.js';
import { AbsensiModule } from '../absensi/absensi.module.js';

import { JadwalKerjaModule } from '../jadwal-kerja/jadwal-kerja.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Penggajian]),
    KaryawanModule,
    AbsensiModule,
    JadwalKerjaModule,
  ],
  controllers: [PenggajianController],
  providers: [PenggajianService],
  exports: [PenggajianService],
})
export class PenggajianModule {}
