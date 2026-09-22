import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaldoRo } from './entities/saldo-ro.entity.js';
import { PengajuanRo } from './entities/pengajuan-ro.entity.js';
import { Karyawan } from '../karyawan/entities/karyawan.entity.js';
import { JadwalKerja } from '../jadwal-kerja/entities/jadwal-kerja.entity.js';
import { HariLibur } from '../hari-libur/entities/hari-libur.entity.js';
import { User } from '../user/entities/user.entity.js';
import { RegularOffService } from './regular-off.service.js';
import { RegularOffController } from './regular-off.controller.js';
import { NotificationModule } from '../notification/notification.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SaldoRo,
      PengajuanRo,
      Karyawan,
      JadwalKerja,
      HariLibur,
      User,
    ]),
    NotificationModule,
  ],
  controllers: [RegularOffController],
  providers: [RegularOffService],
  exports: [RegularOffService],
})
export class RegularOffModule {}
