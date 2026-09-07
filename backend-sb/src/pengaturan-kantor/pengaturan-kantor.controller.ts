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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PengaturanKantorService } from './pengaturan-kantor.service.js';
import { CreatePengaturanKantorDto } from './dto/create-pengaturan-kantor.dto.js';
import { UpdatePengaturanKantorDto } from './dto/update-pengaturan-kantor.dto.js';
import { JwtWebGuard } from '../common/guards/jwt-web.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';

@ApiTags('Pengaturan Kantor')
@ApiBearerAuth()
@UseGuards(JwtWebGuard, RolesGuard)
@Controller('pengaturan-kantor')
export class PengaturanKantorController {
  constructor(
    private readonly pengaturanKantorService: PengaturanKantorService,
  ) {}

  @Post()
  @Roles('Admin')
  @ApiOperation({ summary: 'Buat pengaturan kantor baru' })
  create(@Body() dto: CreatePengaturanKantorDto) {
    return this.pengaturanKantorService.create(dto);
  }

  @Get()
  @Roles('Admin', 'HRD', 'SPV')
  @ApiOperation({ summary: 'Ambil semua pengaturan kantor' })
  findAll() {
    return this.pengaturanKantorService.findAll();
  }

  @Get(':id')
  @Roles('Admin', 'HRD', 'SPV')
  @ApiOperation({ summary: 'Ambil pengaturan kantor berdasarkan ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pengaturanKantorService.findOne(id);
  }

  @Patch(':id')
  @Roles('Admin')
  @ApiOperation({ summary: 'Update pengaturan kantor' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePengaturanKantorDto,
  ) {
    return this.pengaturanKantorService.update(id, dto);
  }

  @Delete(':id')
  @Roles('Admin')
  @ApiOperation({ summary: 'Hapus pengaturan kantor' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.pengaturanKantorService.remove(id);
  }
}
