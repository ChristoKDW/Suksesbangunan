import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { KebijakanLiburService } from './kebijakan-libur.service.js';
import { JwtWebGuard } from '../common/guards/jwt-web.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

const tahunDari = (t?: string) =>
  t && /^\d{4}$/.test(t) ? Number(t) : Number(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Makassar' }).slice(0, 4));

@ApiTags('Kebijakan Tanggal Merah')
@ApiBearerAuth()
@UseGuards(JwtWebGuard, RolesGuard)
@Controller('kebijakan-libur')
export class KebijakanLiburController {
  constructor(private readonly service: KebijakanLiburService) {}

  @Get()
  @Roles('Admin', 'HRD', 'SPV')
  @ApiQuery({ name: 'tahun', required: false, example: '2026' })
  @ApiOperation({ summary: 'Daftar libur nasional & cuti bersama setahun beserta perlakuannya' })
  daftar(@Query('tahun') tahun?: string) {
    return this.service.daftar(tahunDari(tahun));
  }

  @Patch('default')
  @Roles('Admin', 'HRD')
  @ApiOperation({ summary: 'Kebijakan default: liburNasional / cutiBersama = libur | kerja' })
  setDefault(@Body() dto: { liburNasional?: string; cutiBersama?: string }) {
    return this.service.setDefault(dto);
  }

  @Post('reset')
  @Roles('Admin', 'HRD')
  @ApiQuery({ name: 'tahun', required: false })
  @ApiOperation({ summary: 'Kembalikan semua tanggal pada tahun tsb ke kebijakan default' })
  reset(@Query('tahun') tahun?: string) {
    return this.service.resetTahun(tahunDari(tahun));
  }

  @Patch(':tanggal')
  @Roles('Admin', 'HRD')
  @ApiOperation({ summary: 'Atur perlakuan satu tanggal: libur | kerja' })
  setTanggal(
    @Param('tanggal') tanggal: string,
    @Body('perlakuan') perlakuan: string,
    @CurrentUser('idUser') idUser: number,
  ) {
    return this.service.setTanggal(tanggal, perlakuan, idUser);
  }
}
