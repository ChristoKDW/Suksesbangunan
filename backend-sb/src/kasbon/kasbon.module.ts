import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Kasbon, KasbonCicilan } from './entities/kasbon.entity.js';
import { Karyawan } from '../karyawan/entities/karyawan.entity.js';
import { KasbonService } from './kasbon.service.js';
import { KasbonController } from './kasbon.controller.js';
import { NotificationModule } from '../notification/notification.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Kasbon, KasbonCicilan, Karyawan]),
    NotificationModule,
  ],
  controllers: [KasbonController],
  providers: [KasbonService],
  exports: [KasbonService],
})
export class KasbonModule {}
