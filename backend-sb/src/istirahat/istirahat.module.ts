import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Istirahat } from './entities/istirahat.entity.js';
import { Absensi } from '../absensi/entities/absensi.entity.js';
import { IstirahatService } from './istirahat.service.js';
import { IstirahatController } from './istirahat.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Istirahat, Absensi])],
  controllers: [IstirahatController],
  providers: [IstirahatService],
  exports: [IstirahatService],
})
export class IstirahatModule {}
