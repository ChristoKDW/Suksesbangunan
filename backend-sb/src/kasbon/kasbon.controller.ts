import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { KasbonService } from './kasbon.service.js';
import { ApprovalKasbonDto, CreateKasbonDto, PengajuanKasbonDto } from './dto/kasbon.dto.js';
import { JwtMobileGuard } from '../common/guards/jwt-mobile.guard.js';
import { JwtWebGuard } from '../common/guards/jwt-web.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Kasbon')
@ApiBearerAuth()
@Controller('kasbon')
export class KasbonController {
  constructor(private readonly kasbonService: KasbonService) {}

  // ---------------- Mobile (karyawan) ----------------

  @Get('me')
  @UseGuards(JwtMobileGuard)
  @ApiOperation({ summary: 'Kasbon saya beserta sisa & riwayat cicilan' })
  findMine(@CurrentUser('idKaryawan') idKaryawan: number) {
    return this.kasbonService.findMine(idKaryawan);
  }

  @Post('me')
  @UseGuards(JwtMobileGuard)
  @ApiOperation({ summary: 'Ajukan kasbon (menunggu persetujuan HRD)' })
  ajukan(
    @CurrentUser('idKaryawan') idKaryawan: number,
    @Body() dto: PengajuanKasbonDto,
  ) {
    return this.kasbonService.ajukan(idKaryawan, dto);
  }

  @Patch('me/:id/batal')
  @UseGuards(JwtMobileGuard)
  @ApiOperation({ summary: 'Batalkan pengajuan kasbon yang masih menunggu' })
  batalkanPengajuan(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('idKaryawan') idKaryawan: number,
  ) {
    return this.kasbonService.batalkanPengajuan(id, idKaryawan);
  }

  // ---------------- Web (HRD/Admin) ----------------

  @Get()
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('Admin', 'HRD')
  @ApiQuery({ name: 'status', required: false, enum: ['semua', 'menunggu', 'aktif', 'lunas', 'ditolak', 'dibatalkan'] })
  @ApiOperation({ summary: 'Daftar kasbon seluruh karyawan' })
  findAll(@Query('status') status?: string) {
    return this.kasbonService.findAll(status);
  }

  @Post()
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('Admin', 'HRD')
  @ApiOperation({ summary: 'Catat kasbon karyawan (langsung aktif, dipotong otomatis di payroll)' })
  create(@Body() dto: CreateKasbonDto, @CurrentUser('idUser') idUser: number) {
    return this.kasbonService.create(dto, idUser);
  }

  @Patch(':id/approval')
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('Admin', 'HRD')
  @ApiOperation({ summary: 'Setujui / tolak pengajuan kasbon dari mobile' })
  approval(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApprovalKasbonDto,
    @CurrentUser('idUser') idUser: number,
  ) {
    return this.kasbonService.approval(id, dto, idUser);
  }

  @Patch(':id/batal')
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('Admin', 'HRD')
  @ApiOperation({ summary: 'Hentikan kasbon (mis. dilunasi tunai)' })
  batalkan(
    @Param('id', ParseIntPipe) id: number,
    @Body('catatan') catatan: string | undefined,
    @CurrentUser('idUser') idUser: number,
  ) {
    return this.kasbonService.batalkan(id, catatan, idUser);
  }
}
