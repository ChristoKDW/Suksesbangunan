import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shift } from './entities/shift.entity.js';
import { Departemen } from '../departemen/entities/departemen.entity.js';
import { ShiftService } from './shift.service.js';
import { ShiftController } from './shift.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Shift, Departemen])],
  controllers: [ShiftController],
  providers: [ShiftService],
  exports: [ShiftService],
})
export class ShiftModule {}
