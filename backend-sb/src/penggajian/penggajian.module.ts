import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Penggajian } from './entities/penggajian.entity.js';
import { PengaturanPenggajian } from './entities/pengaturan-penggajian.entity.js';
import { PenggajianService } from './penggajian.service.js';
import { PenggajianController } from './penggajian.controller.js';
import { KaryawanModule } from '../karyawan/karyawan.module.js';
import { AbsensiModule } from '../absensi/absensi.module.js';

import { JadwalKerjaModule } from '../jadwal-kerja/jadwal-kerja.module.js';

import { PengajuanIzin } from '../pengajuan-izin/entities/pengajuan-izin.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Penggajian, PengajuanIzin, PengaturanPenggajian]),
    KaryawanModule,
    AbsensiModule,
    JadwalKerjaModule,
  ],
  controllers: [PenggajianController],
  providers: [PenggajianService],
  exports: [PenggajianService],
})
export class PenggajianModule {}
