import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PengajuanTundaOff } from './entities/pengajuan-tunda-off.entity.js';
import { Karyawan } from '../karyawan/entities/karyawan.entity.js';
import { JadwalKerja } from '../jadwal-kerja/entities/jadwal-kerja.entity.js';
import { User } from '../user/entities/user.entity.js';
import { TundaOffService } from './tunda-off.service.js';
import { TundaOffController } from './tunda-off.controller.js';
import { NotificationModule } from '../notification/notification.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([PengajuanTundaOff, Karyawan, JadwalKerja, User]),
    NotificationModule,
  ],
  controllers: [TundaOffController],
  providers: [TundaOffService],
  exports: [TundaOffService],
})
export class TundaOffModule {}
