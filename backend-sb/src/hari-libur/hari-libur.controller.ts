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
  Query,
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
@Controller('hari-libur')
export class HariLiburController {
  constructor(private readonly hariLiburService: HariLiburService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('Admin', 'HRD')
  @ApiOperation({
    summary:
      'Tambah hari penting / hari libur resmi (otomatis menimpa semua jadwal karyawan)',
  })
  create(@Body() dto: CreateHariLiburDto, @Req() req: any) {
    return this.hariLiburService.create(dto, req.user);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('Admin', 'HRD', 'SPV')
  @ApiOperation({ summary: 'Ambil semua daftar hari penting & hari libur' })
  findAll() {
    return this.hariLiburService.findAll();
  }

  /**
   * Endpoint Publik & Sinkron untuk Kalender (Web Admin, HRD, SPV & Mobile Karyawan semua role).
   * Terintegrasi dengan Opica API (Libur Nasional, Cuti Bersama, Hari Peringatan Nasional) & Database Perusahaan.
   */
  @Get('kalender')
  @ApiOperation({
    summary:
      'Ambil kalender hari libur nasional, cuti bersama, dan hari peringatan nasional resmi (Opica + DB)',
  })
  getKalender(
    @Query('year') yearQuery?: string,
    @Query('month') monthQuery?: string,
  ) {
    const currentYear = new Date().getFullYear();
    const year = yearQuery ? parseInt(yearQuery, 10) : currentYear;
    const month = monthQuery ? parseInt(monthQuery, 10) : undefined;
    return this.hariLiburService.getNationalCalendar(year, month);
  }

  @Get('opica')
  @ApiOperation({ summary: 'Alias untuk kalender libur & hari nasional Opica' })
  getOpica(
    @Query('year') yearQuery?: string,
    @Query('month') monthQuery?: string,
  ) {
    return this.getKalender(yearQuery, monthQuery);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('Admin', 'HRD', 'SPV')
  @ApiOperation({ summary: 'Ambil rincian hari penting berdasarkan ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.hariLiburService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtWebGuard, RolesGuard)
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
  @ApiBearerAuth()
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('Admin', 'HRD')
  @ApiOperation({ summary: 'Hapus hari penting / libur' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.hariLiburService.remove(id);
  }
}
