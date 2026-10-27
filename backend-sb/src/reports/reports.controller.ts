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
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtWebGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('kehadiran')
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

  @Get('cuti-izin')
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

  @Get('penggajian')
  @Roles('Admin', 'HRD')
  @ApiOperation({ summary: 'Laporan penggajian lengkap (khusus Admin/HRD)' })
  @ApiQuery({ name: 'periode', required: false, example: '2026-09' })
  @ApiQuery({ name: 'grupLaporan', required: false })
  @ApiQuery({ name: 'format', required: false, enum: ['excel', 'pdf'] })
  exportPenggajian(
    @Res() res: Response,
    @Query('periode') periode: string,
    @Query('grupLaporan') grupLaporan: string,
    @Query('format') format?: string,
  ) {
    return format === 'pdf'
      ? this.reportsService.exportPenggajianPdf(res, periode)
      : this.reportsService.exportPenggajian(res, periode, grupLaporan);
  }

  @Get('bni-direct')
  @Roles('Admin', 'HRD')
  @ApiOperation({
    summary: 'Excel format BNIDirect (Inhouse) untuk upload transfer gaji massal',
  })
  @ApiQuery({ name: 'periodeAwal', required: false, example: '2026-08-25' })
  @ApiQuery({ name: 'rekDebet', required: false })
  @ApiQuery({ name: 'tglTransaksi', required: false, example: '20260925' })
  @ApiQuery({ name: 'remark', required: false })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ['excel', 'csv'],
    description: 'csv = file siap upload BNIDirect (persis output macro Create CSV)',
  })
  exportBniDirect(
    @Res() res: Response,
    @Query('periodeAwal') periodeAwal?: string,
    @Query('rekDebet') rekDebet?: string,
    @Query('tglTransaksi') tglTransaksi?: string,
    @Query('remark') remark?: string,
    @Query('format') format?: string,
  ) {
    return this.reportsService.exportBniDirect(
      res,
      periodeAwal,
      rekDebet,
      tglTransaksi,
      remark,
      format,
    );
  }

  @Get('absensi-karyawan/:idKaryawan')
  @Roles('Admin', 'HRD')
  @ApiOperation({
    summary: 'Absensi bulanan perorangan (format template absensi tanda tangan)',
  })
  @ApiQuery({ name: 'bulan', required: false, example: '2026-09' })
  @ApiQuery({ name: 'format', required: false, enum: ['excel', 'pdf'] })
  exportAbsensiKaryawan(
    @Res() res: Response,
    @Param('idKaryawan', ParseIntPipe) idKaryawan: number,
    @Query('bulan') bulan?: string,
    @Query('format') format?: string,
  ) {
    return format === 'pdf'
      ? this.reportsService.exportAbsensiKaryawanPdf(res, idKaryawan, bulan)
      : this.reportsService.exportAbsensiKaryawanExcel(res, idKaryawan, bulan);
  }
}
