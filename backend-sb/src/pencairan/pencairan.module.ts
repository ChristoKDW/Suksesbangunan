import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PengajuanPencairan } from './entities/pengajuan-pencairan.entity.js';
import { Karyawan } from '../karyawan/entities/karyawan.entity.js';
import { User } from '../user/entities/user.entity.js';
import { PencairanService } from './pencairan.service.js';
import { PencairanController } from './pencairan.controller.js';
import { NotificationModule } from '../notification/notification.module.js';
import { PengajuanIzinModule } from '../pengajuan-izin/pengajuan-izin.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([PengajuanPencairan, Karyawan, User]),
    NotificationModule,
    PengajuanIzinModule,
  ],
  controllers: [PencairanController],
  providers: [PencairanService],
  exports: [PencairanService],
})
export class PencairanModule {}
