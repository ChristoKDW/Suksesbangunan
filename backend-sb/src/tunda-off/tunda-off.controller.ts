import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TundaOffService } from './tunda-off.service.js';
import {
  ApprovalTundaOffDto,
  CreateTundaOffDto,
} from './dto/tunda-off.dto.js';
import { JwtMobileGuard } from '../common/guards/jwt-mobile.guard.js';
import { JwtWebGuard } from '../common/guards/jwt-web.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Tunda Off')
@Controller('tunda-off')
export class TundaOffController {
  constructor(private readonly tundaOffService: TundaOffService) {}

  @Post('pengajuan')
  @UseGuards(JwtMobileGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Ajukan tunda off dari mobile (masuk kerja di hari off, off dipindah ke tanggal lain)',
  })
  create(
    @CurrentUser('idKaryawan') idKaryawan: number,
    @Body() dto: CreateTundaOffDto,
  ) {
    return this.tundaOffService.create(idKaryawan, dto);
  }

  @Get('pengajuan/my')
  @UseGuards(JwtMobileGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Riwayat pengajuan tunda off karyawan login' })
  getMyPengajuan(@CurrentUser('idKaryawan') idKaryawan: number) {
    return this.tundaOffService.getMyPengajuan(idKaryawan);
  }

  @Patch('pengajuan/:id/cancel')
  @UseGuards(JwtMobileGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Batalkan pengajuan tunda off sebelum final' })
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('idKaryawan') idKaryawan: number,
  ) {
    return this.tundaOffService.cancel(id, idKaryawan);
  }

  @Get('pengajuan/spv')
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('SPV', 'Admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Daftar pengajuan tunda off untuk Supervisor' })
  getForSpv(@Req() req: any) {
    return this.tundaOffService.getForSpv(req.user);
  }

  @Patch('pengajuan/:id/approval-spv')
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('SPV', 'Admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Persetujuan/penolakan tunda off oleh SPV' })
  respondSpv(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() dto: ApprovalTundaOffDto,
  ) {
    return this.tundaOffService.respondSpv(id, req.user, dto);
  }

  @Get('pengajuan/hrd')
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('HRD', 'Admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Daftar pengajuan tunda off untuk HRD/Admin' })
  getForHrd() {
    return this.tundaOffService.getForHrd();
  }

  @Patch('pengajuan/:id/approval-hrd')
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('HRD', 'Admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Persetujuan akhir tunda off oleh HRD (otomatis menukar jadwal off)',
  })
  respondHrd(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() dto: ApprovalTundaOffDto,
  ) {
    return this.tundaOffService.respondHrd(id, req.user, dto);
  }

  @Get('pengajuan/:id')
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('SPV', 'HRD', 'Admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detail pengajuan tunda off untuk web' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tundaOffService.findOne(id);
  }
}
