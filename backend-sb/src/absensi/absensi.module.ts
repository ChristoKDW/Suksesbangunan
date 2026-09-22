import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Absensi } from './entities/absensi.entity.js';
import { AbsensiService } from './absensi.service.js';
import { AbsensiController } from './absensi.controller.js';
import { PengaturanKantorModule } from '../pengaturan-kantor/pengaturan-kantor.module.js';
import { KaryawanModule } from '../karyawan/karyawan.module.js';
import { JadwalKerjaModule } from '../jadwal-kerja/jadwal-kerja.module.js';
import { RegularOffModule } from '../regular-off/regular-off.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Absensi]),
    PengaturanKantorModule,
    KaryawanModule,
    JadwalKerjaModule,
    RegularOffModule,
  ],
  controllers: [AbsensiController],
  providers: [AbsensiService],
  exports: [AbsensiService],
})
export class AbsensiModule {}
