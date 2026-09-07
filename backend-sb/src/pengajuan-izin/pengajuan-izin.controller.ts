import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { PengajuanIzinService } from './pengajuan-izin.service.js';
import { CreatePengajuanIzinDto } from './dto/create-pengajuan-izin.dto.js';
import { ApprovalPengajuanIzinDto } from './dto/approval-pengajuan-izin.dto.js';
import { JwtMobileGuard } from '../common/guards/jwt-mobile.guard.js';
import { JwtWebGuard } from '../common/guards/jwt-web.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Pengajuan Izin')
@Controller('pengajuan-izin')
export class PengajuanIzinController {
  constructor(
    private readonly pengajuanIzinService: PengajuanIzinService,
  ) {}

  @Post()
  @UseGuards(JwtMobileGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Submit pengajuan izin dari mobile (dengan/tanpa lokasi untuk dual-path)',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('filePendukung', {
      storage: diskStorage({
        destination: './uploads/file-pendukung',
        filename: (_req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  async submitIzin(
    @Body() dto: CreatePengajuanIzinDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.pengajuanIzinService.submitIzin(
      dto,
      file?.path || undefined,
    );
  }

  @Patch(':id/approval')
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('SPV', 'HRD')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Approve/reject pengajuan izin (SPV/HRD only)',
  })
  processApproval(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApprovalPengajuanIzinDto,
    @CurrentUser('idUser') idUser: number,
  ) {
    return this.pengajuanIzinService.processApproval(id, dto, idUser);
  }

  @Get('me')
  @UseGuards(JwtMobileGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Daftar izin milik karyawan yang login (mobile)' })
  findMine(
    @CurrentUser('idKaryawan') idKaryawan: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.pengajuanIzinService.findByKaryawan(
      idKaryawan,
      startDate,
      endDate,
    );
  }

  @Get()
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('Admin', 'HRD', 'SPV')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ambil semua pengajuan izin' })
  @ApiQuery({ name: 'status', required: false })
  findAll(@Query('status') status?: string) {
    if (status) {
      return this.pengajuanIzinService.findByStatus(status);
    }
    return this.pengajuanIzinService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('Admin', 'HRD', 'SPV')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ambil pengajuan izin berdasarkan ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pengajuanIzinService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('Admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hapus pengajuan izin' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.pengajuanIzinService.remove(id);
  }
}
