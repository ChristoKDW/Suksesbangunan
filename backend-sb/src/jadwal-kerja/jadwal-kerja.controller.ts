import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JadwalKerjaService } from './jadwal-kerja.service.js';
import { CreateJadwalKerjaDto } from './dto/create-jadwal-kerja.dto.js';
import { UpdateJadwalKerjaDto } from './dto/update-jadwal-kerja.dto.js';
import { BulkJadwalKerjaItemDto } from './dto/bulk-jadwal-kerja.dto.js';
import { JwtWebGuard } from '../common/guards/jwt-web.guard.js';
import { JwtMobileGuard } from '../common/guards/jwt-mobile.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Jadwal Kerja')
@Controller('jadwal-kerja')
export class JadwalKerjaController {
  constructor(private readonly jadwalKerjaService: JadwalKerjaService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('Admin', 'HRD', 'SPV')
  @ApiOperation({ summary: 'Buat satu jadwal kerja' })
  create(
    @Body() dto: CreateJadwalKerjaDto,
    @Req() req: any,
  ) {
    return this.jadwalKerjaService.create(dto, req.user);
  }

  @Post('bulk')
  @ApiBearerAuth()
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('Admin', 'HRD', 'SPV')
  @ApiOperation({
    summary: 'Buat banyak jadwal kerja sekaligus (bulk)',
  })
  @ApiBody({ type: [BulkJadwalKerjaItemDto] })
  createBulk(
    @Body() items: BulkJadwalKerjaItemDto[],
    @Req() req: any,
  ) {
    return this.jadwalKerjaService.createBulk(items, req.user);
  }

  @Post('import-excel')
  @ApiBearerAuth()
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('Admin', 'HRD', 'SPV')
  @ApiOperation({
    summary: 'Import jadwal kerja dari file Excel',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new Error('File Excel wajib diupload');
    }
    const results = await this.jadwalKerjaService.importExcel(
      file.buffer,
      req.user,
    );
    return {
      message: `${results.length} jadwal berhasil diimport`,
      data: results,
    };
  }

  @Get('me/today')
  @UseGuards(JwtMobileGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Jadwal kerja hari ini (mobile)' })
  findMyToday(@CurrentUser('idKaryawan') idKaryawan: number) {
    return this.jadwalKerjaService.findTodayByKaryawan(idKaryawan);
  }

  @Get('me/weekly')
  @UseGuards(JwtMobileGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Jadwal kerja seminggu ke depan (mobile)' })
  findMyWeekly(@CurrentUser('idKaryawan') idKaryawan: number) {
    return this.jadwalKerjaService.findWeeklyByKaryawan(idKaryawan);
  }

  @Get('me/monthly')
  @UseGuards(JwtMobileGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Jadwal kerja satu bulan penuh (mobile calendar)' })
  findMyMonthly(
    @CurrentUser('idKaryawan') idKaryawan: number,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ) {
    return this.jadwalKerjaService.findMonthlyByKaryawan(
      idKaryawan,
      year,
      month,
    );
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('Admin', 'HRD', 'SPV')
  @ApiOperation({ summary: 'Ambil semua jadwal kerja' })
  findAll(@Req() req: any) {
    return this.jadwalKerjaService.findAll(req.user);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('Admin', 'HRD', 'SPV')
  @ApiOperation({ summary: 'Ambil jadwal kerja berdasarkan ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.jadwalKerjaService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('Admin', 'HRD', 'SPV')
  @ApiOperation({ summary: 'Update jadwal kerja' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateJadwalKerjaDto,
    @Req() req: any,
  ) {
    return this.jadwalKerjaService.update(id, dto, req.user);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtWebGuard, RolesGuard)
  @Roles('Admin', 'HRD', 'SPV')
  @ApiOperation({ summary: 'Hapus jadwal kerja' })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.jadwalKerjaService.remove(id, req.user);
  }
}
