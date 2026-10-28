import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SuperAdminInsightsService } from './super-admin-insights.service.js';

@ApiTags('Super Admin Insights')
@Controller('super-admin')
export class SuperAdminInsightsController {
  constructor(private readonly insightsService: SuperAdminInsightsService) {}

  @Get('financial-insights')
  @ApiOperation({ summary: 'Data wawasan finansial & penggajian riil Toko LARAS' })
  getFinancialInsights() {
    return this.insightsService.getFinancialInsights();
  }

  @Get('financial-insights/departments/:id/employees')
  @ApiOperation({ summary: 'Daftar detail karyawan & beban penggajian per departemen' })
  getDepartmentEmployees(@Param('id') id: string) {
    return this.insightsService.getDepartmentEmployees(id);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Data rekam jejak forensic audit trail operasional' })
  getAuditLogs() {
    return this.insightsService.getAuditLogs();
  }

  @Get('dashboard-stats')
  @ApiOperation({ summary: 'Ringkasan metrik dashboard overview eksekutif' })
  getDashboardStats() {
    return this.insightsService.getDashboardOverview();
  }
}
