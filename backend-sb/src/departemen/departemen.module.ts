import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Departemen } from './entities/departemen.entity.js';
import { User } from '../user/entities/user.entity.js';
import { DepartemenService } from './departemen.service.js';
import { DepartemenController } from './departemen.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Departemen, User])],
  controllers: [DepartemenController],
  providers: [DepartemenService],
  exports: [DepartemenService],
})
export class DepartemenModule {}
