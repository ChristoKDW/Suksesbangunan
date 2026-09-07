import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Karyawan } from './entities/karyawan.entity.js';
import { KaryawanService } from './karyawan.service.js';
import { KaryawanController } from './karyawan.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Karyawan])],
  controllers: [KaryawanController],
  providers: [KaryawanService],
  exports: [KaryawanService],
})
export class KaryawanModule {}
