import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IstirahatService } from './istirahat.service.js';
import { CreateIstirahatDto } from './dto/create-istirahat.dto.js';
import { JwtMobileGuard } from '../common/guards/jwt-mobile.guard.js';
import { JwtWebGuard } from '../common/guards/jwt-web.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Istirahat')
@Controller('istirahat')
export class IstirahatController {
  constructor(private readonly istirahatService: IstirahatService) {}

  @Post()
  @UseGuards(JwtMobileGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mulai/selesai istirahat dari mobile' })
  create(
    @Body() dto: CreateIstirahatDto,
    @CurrentUser('idKaryawan') idKaryawan: number,
  ) {
    return this.istirahatService.mulaiIstirahat(dto, idKaryawan);
  }

  @Get('me/today')
  @UseGuards(JwtMobileGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Status dan riwayat istirahat hari ini untuk karyawan yang login',
  })
  findMyTodayBreak(@CurrentUser('idKaryawan') idKaryawan: number) {
    return this.istirahatService.findTodayBreakByKaryawan(idKaryawan);
  }

  @Get()
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('Admin', 'HRD', 'SPV')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ambil semua data istirahat' })
  findAll() {
    return this.istirahatService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('Admin', 'HRD', 'SPV')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ambil istirahat berdasarkan ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.istirahatService.findOne(id);
  }

  @Get('absensi/:idAbsensi')
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('Admin', 'HRD', 'SPV')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ambil istirahat berdasarkan ID Absensi' })
  findByAbsensi(@Param('idAbsensi', ParseIntPipe) idAbsensi: number) {
    return this.istirahatService.findByAbsensi(idAbsensi);
  }

  @Delete(':id')
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('Admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hapus data istirahat' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.istirahatService.remove(id);
  }
}
