import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatasPengajuan } from './batas-pengajuan.entity.js';
import { Karyawan } from '../karyawan/entities/karyawan.entity.js';
import { User } from '../user/entities/user.entity.js';
import { AturanPengajuanService } from './aturan-pengajuan.service.js';
import { AturanPengajuanController } from './aturan-pengajuan.controller.js';

// Global: dipakai pengajuan izin/cuti, tukar jadwal, tunda off, RO, dan kasbon.
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([BatasPengajuan, Karyawan, User])],
  controllers: [AturanPengajuanController],
  providers: [AturanPengajuanService],
  exports: [AturanPengajuanService],
})
export class AturanPengajuanModule {}
