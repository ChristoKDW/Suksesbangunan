import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeminjamanAset } from './entities/peminjaman-aset.entity.js';
import { AsetService } from './aset.service.js';
import { AsetController } from './aset.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([PeminjamanAset])],
  controllers: [AsetController],
  providers: [AsetService],
})
export class AsetModule {}
