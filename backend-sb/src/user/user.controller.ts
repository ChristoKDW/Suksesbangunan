import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { JwtWebGuard } from '../common/guards/jwt-web.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';

@ApiTags('User')
@ApiBearerAuth()
@UseGuards(JwtWebGuard, RolesGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles('Admin', 'HRD')
  @ApiOperation({ summary: 'Buat user baru (Admin/HRD)' })
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Get()
  @Roles('Admin', 'HRD')
  @ApiOperation({ summary: 'Ambil semua user' })
  findAll() {
    return this.userService.findAll();
  }

  @Get('profile')
  @ApiOperation({ summary: 'Ambil profil sendiri (Admin/HRD/SPV)' })
  getProfile(@Req() req) {
    const id = req.user.idUser || req.user.sub;
    return this.userService.findOne(id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update profil sendiri (Admin/HRD/SPV)' })
  updateProfile(@Body() dto: UpdateUserDto, @Req() req) {
    // req.user has the jwt payload which includes sub or idUser
    const id = req.user.idUser || req.user.sub;
    const { role: _r, idDepartemen: _d, ...profileData } = dto;
    return this.userService.update(id, profileData);
  }

  @Get(':id')
  @Roles('Admin', 'HRD')
  @ApiOperation({ summary: 'Ambil user berdasarkan ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @Roles('Admin', 'HRD')
  @ApiOperation({ summary: 'Update user' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @Req() req,
  ) {
    const requesterRole = req.user?.role;
    return this.userService.update(id, dto, requesterRole);
  }

  @Delete(':id')
  @Roles('Admin')
  @ApiOperation({ summary: 'Hapus user' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }
}
