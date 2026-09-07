import { Controller, Get, Query, Res } from '@nestjs/common';
import { ReportsService } from './reports.service.js';
import type { Response } from 'express';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('kehadiran/excel')
  async getKehadiranExcel(
    @Res() res: Response,
    @Query('periodeBulan') periodeBulan: string,
    @Query('departemen') departemen: string,
  ) {
    return this.reportsService.exportKehadiran(res, periodeBulan, departemen);
  }

  @Get('cuti-izin/excel')
  async getCutiIzinExcel(
    @Res() res: Response,
    @Query('rentangWaktu') rentangWaktu: string,
    @Query('statusApproval') statusApproval: string,
  ) {
    return this.reportsService.exportCutiIzin(res, rentangWaktu, statusApproval);
  }

  @Get('penggajian/excel')
  async getPenggajianExcel(
    @Res() res: Response,
    @Query('periode') periode: string,
    @Query('grup') grup: string,
  ) {
    return this.reportsService.exportPenggajian(res, periode, grup);
  }
}
