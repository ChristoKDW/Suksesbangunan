import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AturanPengajuanService } from './aturan-pengajuan.service.js';
import type { JenisPengajuan } from './aturan-pengajuan.service.js';
import { JwtMobileGuard } from '../common/guards/jwt-mobile.guard.js';
import { JwtWebGuard } from '../common/guards/jwt-web.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Aturan Pengajuan')
@ApiBearerAuth()
@Controller('aturan-pengajuan')
export class AturanPengajuanController {
  constructor(private readonly service: AturanPengajuanService) {}

  @Get('me')
  @UseGuards(JwtMobileGuard)
  @ApiQuery({ name: 'jenis', required: true, example: 'izin' })
  @ApiQuery({ name: 'tanggal', required: false, example: '2026-11-03' })
  @ApiOperation({ summary: 'Cek kuota pengajuan saya sebelum mengisi form (mobile)' })
  cekSaya(
    @CurrentUser('idKaryawan') idKaryawan: number,
    @Query('jenis') jenis: JenisPengajuan,
    @Query('tanggal') tanggal?: string,
  ) {
    return this.service.statusKuota(
      idKaryawan,
      jenis,
      tanggal && /^\d{4}-\d{2}-\d{2}$/.test(tanggal) ? tanggal : undefined,
    );
  }

  @Get('batas')
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('Admin', 'HRD', 'SPV')
  @ApiOperation({ summary: 'Daftar batas pengajuan per jenis' })
  daftar() {
    return this.service.daftarBatas();
  }

  @Patch('batas/:jenis')
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('Admin', 'HRD')
  @ApiOperation({ summary: 'Ubah batas pengajuan per bulan (0 = tanpa batas)' })
  setBatas(@Param('jenis') jenis: string, @Body('maksPerBulan') maks: number) {
    return this.service.setBatas(jenis, maks);
  }
}
