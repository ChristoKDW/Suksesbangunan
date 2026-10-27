import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ReportsService } from './reports.service.js';
import { JwtWebGuard } from '../common/guards/jwt-web.guard.js';
import { JwtMobileGuard } from '../common/guards/jwt-mobile.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

const optionalInt = (value?: string) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : undefined;
};

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtWebGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // Alias "/excel" dipertahankan agar tautan/versi frontend lama tidak 404.
  @Get(['kehadiran', 'kehadiran/excel'])
  @Roles('Admin', 'HRD', 'SPV')
  @ApiOperation({ summary: 'Laporan kehadiran (SPV otomatis dibatasi ke timnya)' })
  @ApiQuery({ name: 'periodeBulan', required: false, example: '2026-09' })
  @ApiQuery({ name: 'departemen', required: false })
  @ApiQuery({ name: 'format', required: false, enum: ['excel', 'pdf'] })
  exportKehadiran(
    @Res() res: Response,
    @Req() req: any,
    @Query('periodeBulan') periodeBulan: string,
    @Query('departemen') departemen: string,
    @Query('format') format?: string,
  ) {
    return format === 'pdf'
      ? this.reportsService.exportKehadiranPdf(res, periodeBulan, departemen, req.user)
      : this.reportsService.exportKehadiran(res, periodeBulan, departemen, req.user);
  }

  @Get(['cuti-izin', 'cuti-izin/excel'])
  @Roles('Admin', 'HRD', 'SPV')
  @ApiOperation({ summary: 'Laporan cuti & izin (SPV otomatis dibatasi ke timnya)' })
  @ApiQuery({ name: 'rentangWaktu', required: false, example: '2026-09' })
  @ApiQuery({ name: 'statusApproval', required: false })
  @ApiQuery({ name: 'format', required: false, enum: ['excel', 'pdf'] })
  exportCutiIzin(
    @Res() res: Response,
    @Req() req: any,
    @Query('rentangWaktu') rentangWaktu: string,
    @Query('statusApproval') statusApproval: string,
    @Query('format') format?: string,
  ) {
    return format === 'pdf'
      ? this.reportsService.exportCutiIzinPdf(res, rentangWaktu, statusApproval, req.user)
      : this.reportsService.exportCutiIzin(res, rentangWaktu, statusApproval, req.user);
  }

  @Get(['penggajian', 'penggajian/excel'])
  @Roles('Admin', 'HRD')
  @ApiOperation({ summary: 'Laporan penggajian lengkap (khusus Admin/HRD)' })
  @ApiQuery({ name: 'periode', required: false, example: '2026-09', description: 'Bulan periode gaji (bulan tanggal akhir cut-off)' })
  @ApiQuery({ name: 'departemen', required: false })
  @ApiQuery({ name: 'format', required: false, enum: ['excel', 'pdf'] })
  exportPenggajian(
    @Res() res: Response,
    @Query('periode') periode: string,
    @Query('departemen') departemen?: string,
    @Query('format') format?: string,
  ) {
    return format === 'pdf'
      ? this.reportsService.exportPenggajianPdf(res, periode, departemen)
      : this.reportsService.exportPenggajian(res, periode, departemen);
  }

  @Get('bni-direct')
  @Roles('Admin', 'HRD')
  @ApiOperation({
    summary:
      'BNIDirect payroll: Excel 9 sheet template v1.9.6 atau CSV per sheet (persis macro Create CSV)',
  })
  @ApiQuery({ name: 'periode', required: false, example: '2026-09' })
  @ApiQuery({ name: 'periodeAwal', required: false, example: '2026-08-25' })
  @ApiQuery({ name: 'rekDebet', required: false })
  @ApiQuery({ name: 'tglTransaksi', required: false, example: '20260925' })
  @ApiQuery({ name: 'remark', required: false })
  @ApiQuery({ name: 'metodeBankLain', required: false, enum: ['bifast', 'online', 'kliring', 'rtgs'] })
  @ApiQuery({ name: 'format', required: false, enum: ['excel', 'csv'] })
  @ApiQuery({ name: 'sheet', required: false, enum: ['inhouse', 'bifast', 'online', 'kliring', 'rtgs'] })
  exportBniDirect(
    @Res() res: Response,
    @Query('periode') periode?: string,
    @Query('periodeAwal') periodeAwal?: string,
    @Query('rekDebet') rekDebet?: string,
    @Query('tglTransaksi') tglTransaksi?: string,
    @Query('remark') remark?: string,
    @Query('metodeBankLain') metodeBankLain?: string,
    @Query('format') format?: string,
    @Query('sheet') sheet?: string,
  ) {
    return this.reportsService.exportBniDirect(res, {
      periode, periodeAwal, rekDebet, tglTransaksi, remark, metodeBankLain, format, sheet,
    });
  }

  @Get('karyawan-options')
  @Roles('Admin', 'HRD', 'SPV')
  @ApiOperation({ summary: 'Daftar karyawan untuk filter laporan (SPV: timnya saja)' })
  @ApiQuery({ name: 'statusKaryawan', required: false, enum: ['Internal', 'External'] })
  getKaryawanOptions(@Req() req: any, @Query('statusKaryawan') statusKaryawan?: string) {
    return this.reportsService.getKaryawanOptions(req.user, statusKaryawan);
  }

  @Get('absensi-karyawan')
  @Roles('Admin', 'HRD', 'SPV')
  @ApiOperation({
    summary:
      'Rekap absensi format kop resmi (per orang atau massal, mis. semua karyawan External untuk brand)',
  })
  @ApiQuery({ name: 'bulan', required: false, example: '2026-09' })
  @ApiQuery({ name: 'idKaryawan', required: false })
  @ApiQuery({ name: 'statusKaryawan', required: false, enum: ['Internal', 'External', 'all'] })
  @ApiQuery({ name: 'departemen', required: false })
  @ApiQuery({ name: 'format', required: false, enum: ['pdf', 'excel'] })
  exportRekapAbsensi(
    @Res() res: Response,
    @Req() req: any,
    @Query('bulan') bulan?: string,
    @Query('idKaryawan') idKaryawan?: string,
    @Query('statusKaryawan') statusKaryawan?: string,
    @Query('departemen') departemen?: string,
    @Query('format') format?: string,
  ) {
    return this.reportsService.exportRekapAbsensi(
      res,
      { idKaryawan: optionalInt(idKaryawan), statusKaryawan, departemen },
      bulan,
      format,
      req.user,
    );
  }

  @Get('absensi-karyawan/:idKaryawan')
  @Roles('Admin', 'HRD', 'SPV')
  @ApiOperation({ summary: 'Rekap absensi bulanan perorangan (format kop resmi)' })
  @ApiQuery({ name: 'bulan', required: false, example: '2026-09' })
  @ApiQuery({ name: 'format', required: false, enum: ['excel', 'pdf'] })
  exportAbsensiKaryawan(
    @Res() res: Response,
    @Req() req: any,
    @Param('idKaryawan', ParseIntPipe) idKaryawan: number,
    @Query('bulan') bulan?: string,
    @Query('format') format?: string,
  ) {
    return this.reportsService.exportRekapAbsensi(res, { idKaryawan }, bulan, format, req.user);
  }

  @Get('slip-gaji')
  @Roles('Admin', 'HRD')
  @ApiOperation({ summary: 'Slip gaji template resmi per orang atau semua karyawan dalam periode' })
  @ApiQuery({ name: 'periode', required: false, example: '2026-08' })
  @ApiQuery({ name: 'idKaryawan', required: false })
  @ApiQuery({ name: 'departemen', required: false })
  @ApiQuery({ name: 'format', required: false, enum: ['pdf', 'excel'] })
  exportSlipGaji(
    @Res() res: Response,
    @Query('periode') periode?: string,
    @Query('idKaryawan') idKaryawan?: string,
    @Query('departemen') departemen?: string,
    @Query('format') format?: string,
  ) {
    return this.reportsService.exportSlipGaji(
      res,
      periode,
      optionalInt(idKaryawan),
      departemen,
      format,
    );
  }
}

/** Ekspor dokumen milik karyawan yang login di aplikasi mobile. */
@ApiTags('Reports (Mobile)')
@ApiBearerAuth()
@UseGuards(JwtMobileGuard)
@Controller('reports/me')
export class ReportsMobileController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('absensi')
  @ApiOperation({ summary: 'Rekap/riwayat absensi bulanan saya (PDF kop resmi / Excel)' })
  @ApiQuery({ name: 'bulan', required: false, example: '2026-09' })
  @ApiQuery({ name: 'format', required: false, enum: ['pdf', 'excel'] })
  exportMyAbsensi(
    @Res() res: Response,
    @CurrentUser('idKaryawan') idKaryawan: number,
    @Query('bulan') bulan?: string,
    @Query('format') format?: string,
  ) {
    return this.reportsService.exportMyAbsensi(res, idKaryawan, bulan, format);
  }

  @Get('slip-gaji')
  @ApiOperation({ summary: 'Slip gaji saya (template resmi) untuk periode tanggal acuan' })
  @ApiQuery({ name: 'tanggal', required: false, example: '2026-08-24' })
  @ApiQuery({ name: 'format', required: false, enum: ['pdf', 'excel'] })
  exportMySlip(
    @Res() res: Response,
    @CurrentUser('idKaryawan') idKaryawan: number,
    @Query('tanggal') tanggal?: string,
    @Query('format') format?: string,
  ) {
    return this.reportsService.exportMySlip(res, idKaryawan, tanggal, format);
  }
}
