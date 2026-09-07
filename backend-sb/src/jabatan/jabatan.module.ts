import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Jabatan } from './entities/jabatan.entity.js';
import { JabatanService } from './jabatan.service.js';
import { JabatanController } from './jabatan.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Jabatan])],
  controllers: [JabatanController],
  providers: [JabatanService],
  exports: [JabatanService],
})
export class JabatanModule {}
