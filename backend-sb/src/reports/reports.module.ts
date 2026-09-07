import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Karyawan } from '../karyawan/entities/karyawan.entity.js';
import { Absensi } from '../absensi/entities/absensi.entity.js';
import { PengajuanIzin } from '../pengajuan-izin/entities/pengajuan-izin.entity.js';
import { Penggajian } from '../penggajian/entities/penggajian.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Karyawan, Absensi, PengajuanIzin, Penggajian]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
