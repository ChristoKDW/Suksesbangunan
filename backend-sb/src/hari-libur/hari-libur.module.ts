import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HariLibur } from './entities/hari-libur.entity.js';
import { Karyawan } from '../karyawan/entities/karyawan.entity.js';
import { JadwalKerja } from '../jadwal-kerja/entities/jadwal-kerja.entity.js';
import { Departemen } from '../departemen/entities/departemen.entity.js';
import { Shift } from '../shift/entities/shift.entity.js';
import { HariLiburService } from './hari-libur.service.js';
import { HariLiburController } from './hari-libur.controller.js';
import { OpicaHolidayService } from './opica-holiday.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([HariLibur, Karyawan, JadwalKerja, Departemen, Shift]),
  ],
  controllers: [HariLiburController],
  providers: [HariLiburService, OpicaHolidayService],
  exports: [HariLiburService, OpicaHolidayService],
})
export class HariLiburModule {}
