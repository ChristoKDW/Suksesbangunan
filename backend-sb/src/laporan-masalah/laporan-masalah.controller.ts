import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { LaporanMasalahService } from './laporan-masalah.service.js';
import { CreateLaporanMasalahDto } from './dto/create-laporan-masalah.dto.js';
import { UpdateStatusLaporanDto } from './dto/update-status-laporan.dto.js';
import { JwtMobileGuard } from '../common/guards/jwt-mobile.guard.js';
import { JwtWebGuard } from '../common/guards/jwt-web.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

const uploadStorage = diskStorage({
  destination: (_req, _file, cb) => {
    const dir = './uploads/laporan-masalah';
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'lap-' + uniqueSuffix + extname(file.originalname));
  },
});

@ApiTags('Laporan Masalah Aplikasi')
@Controller()
export class LaporanMasalahController {
  constructor(private readonly service: LaporanMasalahService) {}

  // ─── 📱 MOBILE ENDPOINTS ──────────────────────────────────────────────────

  @Post('laporan-masalah/mobile')
  @UseGuards(JwtMobileGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kirim laporan masalah dari aplikasi mobile karyawan' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: uploadStorage,
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  async submitFromMobile(
    @CurrentUser('idKaryawan') idKaryawan: number,
    @Body() dto: CreateLaporanMasalahDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.service.createFromMobile(idKaryawan, dto, file);
  }

  @Get('laporan-masalah/my-mobile')
  @UseGuards(JwtMobileGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ambil riwayat laporan masalah milik karyawan' })
  async getMyReportsMobile(@CurrentUser('idKaryawan') idKaryawan: number) {
    return this.service.getMyReportsMobile(idKaryawan);
  }

  // ─── 💻 WEB ADMIN ENDPOINTS ───────────────────────────────────────────────

  @Post('laporan-masalah/web')
  @UseGuards(JwtWebGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kirim laporan masalah dari web admin panel' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: uploadStorage,
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  async submitFromWeb(
    @CurrentUser('idUser') idUser: number,
    @Body() dto: CreateLaporanMasalahDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.service.createFromWeb(idUser, dto, file);
  }

  @Get('laporan-masalah/my-web')
  @UseGuards(JwtWebGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ambil riwayat laporan masalah milik user web admin' })
  async getMyReportsWeb(@CurrentUser('idUser') idUser: number) {
    return this.service.getMyReportsWeb(idUser);
  }

  // ─── 👑 SUPER ADMIN ENDPOINTS ─────────────────────────────────────────────

  @Get('super-admin/laporan-masalah')
  @ApiOperation({ summary: 'Super Admin: Ambil seluruh tiket laporan masalah' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'prioritas', required: false })
  @ApiQuery({ name: 'sumber', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAllForSuperAdmin(
    @Query('status') status?: string,
    @Query('prioritas') prioritas?: string,
    @Query('sumber') sumber?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAllForSuperAdmin({ status, prioritas, sumber, search });
  }

  @Get('super-admin/laporan-masalah/:id')
  @ApiOperation({ summary: 'Super Admin: Ambil detail tiket laporan masalah' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch('super-admin/laporan-masalah/:id/status')
  @ApiOperation({ summary: 'Super Admin: Update status, prioritas dan beri tanggapan solusi' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusLaporanDto,
  ) {
    // idSuperAdmin null or from header if available
    return this.service.updateStatusBySuperAdmin(id, null, dto);
  }
}
