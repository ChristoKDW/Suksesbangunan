import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity.js';
import { UserService } from './user.service.js';
import { UserController } from './user.controller.js';
import { SuperAdminUserController } from './super-admin-user.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController, SuperAdminUserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
