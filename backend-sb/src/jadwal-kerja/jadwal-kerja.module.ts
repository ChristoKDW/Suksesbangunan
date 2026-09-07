import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JadwalKerja } from './entities/jadwal-kerja.entity.js';
import { Karyawan } from '../karyawan/entities/karyawan.entity.js';
import { Departemen } from '../departemen/entities/departemen.entity.js';
import { JadwalKerjaService } from './jadwal-kerja.service.js';
import { JadwalKerjaController } from './jadwal-kerja.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([JadwalKerja, Karyawan, Departemen])],
  controllers: [JadwalKerjaController],
  providers: [JadwalKerjaService],
  exports: [JadwalKerjaService],
})
export class JadwalKerjaModule {}
