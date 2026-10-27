import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LaporanMasalah } from './entities/laporan-masalah.entity.js';
import { LaporanMasalahLampiran } from './entities/laporan-masalah-lampiran.entity.js';
import { Karyawan } from '../karyawan/entities/karyawan.entity.js';
import { User } from '../user/entities/user.entity.js';
import { LaporanMasalahService } from './laporan-masalah.service.js';
import { LaporanMasalahController } from './laporan-masalah.controller.js';
import { NotificationModule } from '../notification/notification.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LaporanMasalah,
      LaporanMasalahLampiran,
      Karyawan,
      User,
    ]),
    NotificationModule,
  ],
  controllers: [LaporanMasalahController],
  providers: [LaporanMasalahService],
  exports: [LaporanMasalahService],
})
export class LaporanMasalahModule {}
