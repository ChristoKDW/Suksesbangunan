import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserLog } from './entities/user-log.entity.js';
import { UserLogService } from './user-log.service.js';
import { UserLogController } from './user-log.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([UserLog])],
  controllers: [UserLogController],
  providers: [UserLogService],
  exports: [UserLogService, TypeOrmModule],
})
export class UserLogModule {}
