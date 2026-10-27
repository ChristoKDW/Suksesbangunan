import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KebijakanLibur } from './kebijakan-libur.entity.js';
import { PengaturanPenggajian } from '../penggajian/entities/pengaturan-penggajian.entity.js';
import { KebijakanLiburService } from './kebijakan-libur.service.js';
import { KebijakanLiburController } from './kebijakan-libur.controller.js';

// Global: dipakai jadwal kerja, regular off, payroll & kalender tanpa impor berantai.
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([KebijakanLibur, PengaturanPenggajian])],
  controllers: [KebijakanLiburController],
  providers: [KebijakanLiburService],
  exports: [KebijakanLiburService],
})
export class KebijakanLiburModule {}
