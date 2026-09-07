import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PengaturanKantor } from './entities/pengaturan-kantor.entity.js';
import { PengaturanKantorService } from './pengaturan-kantor.service.js';
import { PengaturanKantorController } from './pengaturan-kantor.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([PengaturanKantor])],
  controllers: [PengaturanKantorController],
  providers: [PengaturanKantorService],
  exports: [PengaturanKantorService],
})
export class PengaturanKantorModule {}
