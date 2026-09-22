import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PengajuanPertukaran } from './entities/pengajuan-pertukaran.entity.js';
import { PertukaranJadwalService } from './pertukaran-jadwal.service.js';
import { PertukaranJadwalController } from './pertukaran-jadwal.controller.js';
import { Karyawan } from '../karyawan/entities/karyawan.entity.js';
import { JadwalKerja } from '../jadwal-kerja/entities/jadwal-kerja.entity.js';
import { Shift } from '../shift/entities/shift.entity.js';
import { User } from '../user/entities/user.entity.js';
import { NotificationModule } from '../notification/notification.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PengajuanPertukaran,
      Karyawan,
      JadwalKerja,
      Shift,
      User,
    ]),
    NotificationModule,
  ],
  controllers: [PertukaranJadwalController],
  providers: [PertukaranJadwalService],
  exports: [PertukaranJadwalService],
})
export class PertukaranJadwalModule {}
