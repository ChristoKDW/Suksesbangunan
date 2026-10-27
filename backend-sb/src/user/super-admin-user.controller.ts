import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserService } from './user.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@ApiTags('Super Admin - Manajemen User')
@Controller('super-admin/users')
export class SuperAdminUserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar semua pengguna super admin & sistem' })
  findAll() {
    return this.userService.findSuperAdmins();
  }

  @Post()
  @ApiOperation({ summary: 'Tambah pengguna super admin baru' })
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail pengguna super admin' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Perbarui pengguna super admin' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto, 'Admin');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hapus pengguna super admin' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.removeSuperAdmin(id);
  }
}
