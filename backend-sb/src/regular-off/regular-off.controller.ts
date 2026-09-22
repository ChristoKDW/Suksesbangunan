import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RegularOffService } from './regular-off.service.js';
import { CreatePengajuanRoDto } from './dto/create-pengajuan-ro.dto.js';
import { ApprovalRoDto } from './dto/approval-ro.dto.js';
import { JwtMobileGuard } from '../common/guards/jwt-mobile.guard.js';
import { JwtWebGuard } from '../common/guards/jwt-web.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Regular Off (RO)')
@Controller('regular-off')
export class RegularOffController {
  constructor(private readonly roService: RegularOffService) {}

  @Get('eligibility')
  @UseGuards(JwtMobileGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Cek apakah karyawan berhak mengakses Regular Off (khusus operasional)',
  })
  checkEligibility(@CurrentUser('idKaryawan') idKaryawan: number) {
    return this.roService.checkEligibility(idKaryawan);
  }

  @Get('saldo')
  @UseGuards(JwtMobileGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Ambil informasi saldo Regular Off (RO) karyawan login beserta sisa hari hangus',
  })
  getMySaldo(@CurrentUser('idKaryawan') idKaryawan: number) {
    return this.roService.getMySaldoRo(idKaryawan);
  }

  @Post('pengajuan')
  @UseGuards(JwtMobileGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ajukan libur Regular Off (RO) dari mobile' })
  createPengajuan(
    @CurrentUser('idKaryawan') idKaryawan: number,
    @Body() dto: CreatePengajuanRoDto,
  ) {
    return this.roService.createPengajuanRo(idKaryawan, dto);
  }

  @Get('pengajuan/my')
  @UseGuards(JwtMobileGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Daftar riwayat pengajuan RO milik karyawan login' })
  getMyPengajuan(@CurrentUser('idKaryawan') idKaryawan: number) {
    return this.roService.getMyPengajuan(idKaryawan);
  }

  @Patch('pengajuan/:id/cancel')
  @UseGuards(JwtMobileGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Batalkan pengajuan RO sebelum persetujuan final HRD',
  })
  cancelPengajuan(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('idKaryawan') idKaryawan: number,
  ) {
    return this.roService.cancelPengajuan(id, idKaryawan);
  }

  @Get('pengajuan/spv')
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('SPV', 'Admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Daftar pengajuan RO bawahan untuk Supervisor' })
  getPengajuanForSpv(@Req() req: any) {
    return this.roService.getPengajuanForSpv(req.user);
  }

  @Patch('pengajuan/:id/approval-spv')
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('SPV', 'Admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Persetujuan / penolakan pengajuan RO oleh SPV' })
  respondSpv(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() dto: ApprovalRoDto,
  ) {
    return this.roService.respondSpv(id, req.user, dto);
  }

  @Get('pengajuan/hrd')
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('HRD', 'Admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Daftar pengajuan RO untuk HRD / Admin' })
  getPengajuanForHrd() {
    return this.roService.getPengajuanForHrd();
  }

  @Patch('pengajuan/:id/approval-hrd')
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('HRD', 'Admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Persetujuan akhir pengajuan RO oleh HRD (otomatis update jadwal jadi libur RO)',
  })
  respondHrd(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() dto: ApprovalRoDto,
  ) {
    return this.roService.respondHrd(id, req.user, dto);
  }

  @Get('pengajuan/:id')
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('SPV', 'HRD', 'Admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detail pengajuan RO untuk web' })
  findOnePengajuan(@Param('id', ParseIntPipe) id: number) {
    return this.roService.findOnePengajuan(id);
  }
}
