import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AbsensiService } from './absensi.service.js';
import { CreateAbsensiDto } from './dto/create-absensi.dto.js';
import { JwtMobileGuard } from '../common/guards/jwt-mobile.guard.js';
import { JwtWebGuard } from '../common/guards/jwt-web.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Absensi')
@Controller('absensi')
export class AbsensiController {
  constructor(private readonly absensiService: AbsensiService) {}

  @Post()
  @UseGuards(JwtMobileGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Submit absensi dari mobile (geofencing aktif)',
  })
  submitAbsensi(@Body() dto: CreateAbsensiDto) {
    return this.absensiService.submitAbsensi(dto);
  }

  @Get('me/today')
  @UseGuards(JwtMobileGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Absensi hari ini untuk karyawan yang login' })
  findMyToday(@CurrentUser('idKaryawan') idKaryawan: number) {
    return this.absensiService.findTodayByKaryawan(idKaryawan);
  }

  @Get('me/history')
  @UseGuards(JwtMobileGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Riwayat absensi (default 30 hari, bisa filter tanggal)' })
  findMyHistory(
    @CurrentUser('idKaryawan') idKaryawan: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.absensiService.findHistoryByKaryawan(
      idKaryawan,
      startDate,
      endDate,
    );
  }

  @Get('geofence-status')
  @UseGuards(JwtMobileGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Cek apakah koordinat GPS berada dalam radius salah satu kantor terdaftar',
  })
  checkGeofenceStatus(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
  ) {
    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
      throw new BadRequestException('Parameter lat/lng tidak valid');
    }
    return this.absensiService.checkGeofenceStatus(latNum, lngNum);
  }

  @Get()
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('Admin', 'HRD', 'SPV')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ambil semua data absensi' })
  findAll() {
    return this.absensiService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('Admin', 'HRD', 'SPV')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ambil absensi berdasarkan ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.absensiService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('Admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hapus data absensi' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.absensiService.remove(id);
  }
}
