import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PenggajianService } from './penggajian.service.js';
import { UpdatePenggajianDto } from './dto/update-penggajian.dto.js';
import { JwtWebGuard } from '../common/guards/jwt-web.guard.js';
import { JwtMobileGuard } from '../common/guards/jwt-mobile.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { UpdatePengaturanPenggajianDto } from './dto/update-pengaturan-penggajian.dto.js';

@ApiTags('Penggajian')
@Controller('penggajian')
export class PenggajianController {
  constructor(private readonly penggajianService: PenggajianService) {}

  @Post('generate')
  @UseGuards(JwtWebGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('Admin', 'HRD')
  @ApiOperation({
    summary: 'Generate penggajian untuk semua karyawan aktif (Admin & HRD)',
  })
  @ApiQuery({
    name: 'periode_awal',
    description: 'Tanggal awal periode (YYYY-MM-DD)',
    example: '2026-09-01',
  })
  @ApiQuery({
    name: 'periode_akhir',
    description: 'Tanggal akhir periode (YYYY-MM-DD)',
    example: '2026-09-30',
  })
  @ApiQuery({
    name: 'potongan',
    required: false,
    description: 'Potongan global (opsional)',
    example: 0,
  })
  @ApiQuery({
    name: 'denda_per_telat',
    required: false,
    description:
      'Tarif denda keterlambatan per kejadian telat (opsional, default otomatis dari pengaturan cut-off)',
  })
  @ApiQuery({
    name: 'total_hari_kerja',
    required: false,
    description:
      'Total hari kerja periode (opsional, default otomatis dihitung dari kalender non-Minggu / shift)',
  })
  generate(
    @Query('periode_awal') periodeAwal: string,
    @Query('periode_akhir') periodeAkhir: string,
    @Query('potongan') potongan?: string,
    @Query('denda_per_telat') dendaPerTelat?: string,
    @Query('total_hari_kerja') totalHariKerja?: string,
  ) {
    return this.penggajianService.generate(
      periodeAwal,
      periodeAkhir,
      potongan !== undefined && potongan !== '' ? Number(potongan) : undefined,
      dendaPerTelat !== undefined && dendaPerTelat !== ''
        ? Number(dendaPerTelat)
        : undefined,
      totalHariKerja !== undefined && totalHariKerja !== ''
        ? Number(totalHariKerja)
        : undefined,
    );
  }

  @Get()
  @UseGuards(JwtWebGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('Admin', 'HRD')
  @ApiOperation({ summary: 'Ambil semua data penggajian' })
  findAll() {
    return this.penggajianService.findAll();
  }

  @Get('settings')
  @UseGuards(JwtWebGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('Admin', 'HRD', 'SPV')
  @ApiOperation({
    summary: 'Ambil pengaturan cut-off penggajian & denda telat',
  })
  getSettings() {
    return this.penggajianService.getSettings();
  }

  @Patch('settings')
  @UseGuards(JwtWebGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('Admin', 'HRD')
  @ApiOperation({
    summary: 'Update pengaturan cut-off penggajian & denda telat',
  })
  updateSettings(@Body() dto: UpdatePengaturanPenggajianDto) {
    return this.penggajianService.updateSettings(dto);
  }

  @Get('me/slip')
  @UseGuards(JwtMobileGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Ambil slip gaji real-time harian karyawan untuk mobile (bisa dilihat per hari)',
  })
  @ApiQuery({
    name: 'tanggal',
    required: false,
    description: 'Tanggal acuan (YYYY-MM-DD), default hari ini',
  })
  getMySlip(
    @CurrentUser('idKaryawan') idKaryawan: number,
    @Query('tanggal') tanggal?: string,
  ) {
    return this.penggajianService.getMySlip(idKaryawan, tanggal);
  }

  @Get(':id')
  @UseGuards(JwtWebGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('Admin', 'HRD')
  @ApiOperation({ summary: 'Ambil penggajian berdasarkan ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.penggajianService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtWebGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('Admin', 'HRD')
  @ApiOperation({ summary: 'Update/sesuaikan data slip gaji karyawan' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePenggajianDto,
  ) {
    return this.penggajianService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtWebGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('Admin', 'HRD')
  @ApiOperation({ summary: 'Hapus data penggajian' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.penggajianService.remove(id);
  }
}
