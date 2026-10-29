import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PencairanService } from './pencairan.service.js';
import { ApprovalPencairanDto, CreatePencairanDto } from './dto/pencairan.dto.js';
import { JwtMobileGuard } from '../common/guards/jwt-mobile.guard.js';
import { JwtWebGuard } from '../common/guards/jwt-web.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Pencairan RO & Cuti')
@ApiBearerAuth()
@Controller('pencairan')
export class PencairanController {
  constructor(private readonly service: PencairanService) {}

  // ---------------- Mobile (karyawan) ----------------

  @Get('me/saldo')
  @UseGuards(JwtMobileGuard)
  @ApiOperation({ summary: 'Saldo RO & cuti yang bisa dicairkan' })
  saldo(@CurrentUser('idKaryawan') idKaryawan: number) {
    return this.service.getSaldo(idKaryawan);
  }

  @Get('me')
  @UseGuards(JwtMobileGuard)
  @ApiOperation({ summary: 'Riwayat pengajuan pencairan saya' })
  findMine(@CurrentUser('idKaryawan') idKaryawan: number) {
    return this.service.findMine(idKaryawan);
  }

  @Post('me')
  @UseGuards(JwtMobileGuard)
  @ApiOperation({ summary: 'Ajukan pencairan RO / cuti (1 hari = 1 hari kerja gaji pokok)' })
  ajukan(@CurrentUser('idKaryawan') idKaryawan: number, @Body() dto: CreatePencairanDto) {
    return this.service.ajukan(idKaryawan, dto);
  }

  @Patch('me/:id/batal')
  @UseGuards(JwtMobileGuard)
  @ApiOperation({ summary: 'Batalkan pengajuan pencairan sebelum disetujui HRD' })
  batal(@Param('id', ParseIntPipe) id: number, @CurrentUser('idKaryawan') idKaryawan: number) {
    return this.service.batal(id, idKaryawan);
  }

  // ---------------- Web (SPV/HRD/Admin) ----------------

  @Get()
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('SPV', 'HRD', 'Admin')
  @ApiOperation({ summary: 'Daftar pengajuan pencairan (SPV: departemennya)' })
  findAll(@Req() req: any) {
    return this.service.findAll(req.user);
  }

  @Patch(':id/approval')
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('SPV', 'HRD', 'Admin')
  @ApiOperation({ summary: 'Setujui / tolak pencairan (SPV tahap 1, HRD final)' })
  approval(@Param('id', ParseIntPipe) id: number, @Req() req: any, @Body() dto: ApprovalPencairanDto) {
    return this.service.approval(id, req.user, dto);
  }
}
