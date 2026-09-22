import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PertukaranJadwalService } from './pertukaran-jadwal.service.js';
import { CreatePertukaranDto } from './dto/create-pertukaran.dto.js';
import { RespondPeerDto } from './dto/respond-peer.dto.js';
import { RespondApprovalDto } from './dto/respond-approval.dto.js';
import { JwtMobileGuard } from '../common/guards/jwt-mobile.guard.js';
import { JwtWebGuard } from '../common/guards/jwt-web.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Pertukaran Jadwal')
@Controller('pengajuan-pertukaran')
export class PertukaranJadwalController {
  constructor(private readonly pertukaranService: PertukaranJadwalService) {}

  @Post()
  @UseGuards(JwtMobileGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Submit pengajuan pertukaran shift / off dari mobile',
  })
  create(
    @Body() dto: CreatePertukaranDto,
    @CurrentUser('idKaryawan') idKaryawan: number,
  ) {
    return this.pertukaranService.create(dto, idKaryawan);
  }

  @Get('eligibility')
  @UseGuards(JwtMobileGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Cek apakah karyawan berhak mengajukan pertukaran (khusus operasional/SPV)',
  })
  checkEligibility(@CurrentUser('idKaryawan') idKaryawan: number) {
    return this.pertukaranService.checkEligibility(idKaryawan);
  }

  @Get('shifts')
  @UseGuards(JwtMobileGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Ambil daftar shift operasional untuk karyawan mobile',
  })
  getShifts(@CurrentUser('idKaryawan') idKaryawan: number) {
    return this.pertukaranService.getShiftsForMobile(idKaryawan);
  }

  @Get('available-peers')
  @UseGuards(JwtMobileGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Cari rekan sebidang yang memiliki shift/off yang cocok untuk ditukar',
  })
  @ApiQuery({ name: 'tanggalTarget', required: true })
  @ApiQuery({ name: 'jenisPertukaran', required: true, enum: ['shift', 'off'] })
  @ApiQuery({ name: 'idShiftTarget', required: false, type: Number })
  getAvailablePeers(
    @CurrentUser('idKaryawan') idKaryawan: number,
    @Query('tanggalTarget') tanggalTarget: string,
    @Query('jenisPertukaran') jenisPertukaran: 'shift' | 'off',
    @Query('idShiftTarget') idShiftTarget?: string,
  ) {
    return this.pertukaranService.getAvailablePeers(
      idKaryawan,
      tanggalTarget,
      jenisPertukaran,
      idShiftTarget ? Number(idShiftTarget) : undefined,
    );
  }

  @Get('my')
  @UseGuards(JwtMobileGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Daftar pengajuan pertukaran milik karyawan yang login',
  })
  findMyRequests(@CurrentUser('idKaryawan') idKaryawan: number) {
    return this.pertukaranService.findMyRequests(idKaryawan);
  }

  @Get('incoming')
  @UseGuards(JwtMobileGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Daftar permintaan pertukaran masuk dari rekan yang butuh konfirmasi',
  })
  findIncomingRequests(@CurrentUser('idKaryawan') idKaryawan: number) {
    return this.pertukaranService.findIncomingRequests(idKaryawan);
  }

  @Patch(':id/respond-peer')
  @UseGuards(JwtMobileGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Rekan kerja tujuan menerima / menolak permintaan tukar jadwal',
  })
  respondPeer(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('idKaryawan') idKaryawan: number,
    @Body() dto: RespondPeerDto,
  ) {
    return this.pertukaranService.respondPeer(id, idKaryawan, dto);
  }

  @Patch(':id/approval-spv')
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('SPV', 'Admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Persetujuan / penolakan oleh Supervisor' })
  respondSpv(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() dto: RespondApprovalDto,
  ) {
    return this.pertukaranService.respondSpv(id, req.user, dto);
  }

  @Patch(':id/approval-hrd')
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('HRD', 'Admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Persetujuan akhir oleh HRD (jadwal otomatis berubah)',
  })
  respondHrd(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() dto: RespondApprovalDto,
  ) {
    return this.pertukaranService.respondHrd(id, req.user, dto);
  }

  @Get(':id')
  @UseGuards(JwtMobileGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detail pengajuan pertukaran jadwal' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('idKaryawan') idKaryawan: number,
  ) {
    return this.pertukaranService.findOne(id, idKaryawan);
  }

  @Get()
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('SPV', 'HRD', 'Admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ambil semua pengajuan pertukaran untuk SPV/HRD' })
  findAll(@Req() req: any) {
    return this.pertukaranService.findAll(req.user);
  }
}
