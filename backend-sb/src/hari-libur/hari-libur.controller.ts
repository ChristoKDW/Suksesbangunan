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
import { HariLiburService } from './hari-libur.service.js';
import { CreateHariLiburDto } from './dto/create-hari-libur.dto.js';
import { UpdateHariLiburDto } from './dto/update-hari-libur.dto.js';
import { JwtWebGuard } from '../common/guards/jwt-web.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';

@ApiTags('Hari Penting & Hari Libur')
@ApiBearerAuth()
@UseGuards(JwtWebGuard, RolesGuard)
@Controller('hari-libur')
export class HariLiburController {
  constructor(private readonly hariLiburService: HariLiburService) {}

  @Post()
  @Roles('Admin', 'HRD')
  @ApiOperation({
    summary:
      'Tambah hari penting / hari libur resmi (otomatis menimpa semua jadwal karyawan)',
  })
  create(@Body() dto: CreateHariLiburDto, @Req() req: any) {
    return this.hariLiburService.create(dto, req.user);
  }

  @Get()
  @Roles('Admin', 'HRD', 'SPV')
  @ApiOperation({ summary: 'Ambil semua daftar hari penting & hari libur' })
  findAll() {
    return this.hariLiburService.findAll();
  }

  @Get('kalender')
  @Roles('Admin', 'HRD', 'SPV')
  @ApiOperation({ summary: 'Ambil kalender hari libur nasional & cuti bersama resmi Indonesia' })
  getKalender(@Req() req: any) {
    const year = req.query?.year ? parseInt(req.query.year, 10) : new Date().getFullYear();
    return this.hariLiburService.getNationalCalendar(year);
  }

  @Get(':id')
  @Roles('Admin', 'HRD', 'SPV')
  @ApiOperation({ summary: 'Ambil rincian hari penting berdasarkan ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.hariLiburService.findOne(id);
  }

  @Patch(':id')
  @Roles('Admin', 'HRD')
  @ApiOperation({ summary: 'Update hari penting / libur' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHariLiburDto,
    @Req() req: any,
  ) {
    return this.hariLiburService.update(id, dto, req.user);
  }

  @Delete(':id')
  @Roles('Admin', 'HRD')
  @ApiOperation({ summary: 'Hapus hari penting / libur' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.hariLiburService.remove(id);
  }
}
