import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PenggajianService } from './penggajian.service.js';
import { JwtWebGuard } from '../common/guards/jwt-web.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';

@ApiTags('Penggajian')
@ApiBearerAuth()
@UseGuards(JwtWebGuard, RolesGuard)
@Controller('penggajian')
export class PenggajianController {
  constructor(private readonly penggajianService: PenggajianService) {}

  @Post('generate')
  @Roles('HRD')
  @ApiOperation({
    summary:
      'Generate penggajian untuk semua karyawan aktif (HRD only)',
  })
  @ApiQuery({
    name: 'periode_awal',
    description: 'Tanggal awal periode (YYYY-MM-DD)',
    example: '2026-07-29',
  })
  @ApiQuery({
    name: 'periode_akhir',
    description: 'Tanggal akhir periode (YYYY-MM-DD)',
    example: '2026-08-28',
  })
  @ApiQuery({
    name: 'potongan',
    required: false,
    description: 'Potongan global (opsional)',
    example: 0,
  })
  generate(
    @Query('periode_awal') periodeAwal: string,
    @Query('periode_akhir') periodeAkhir: string,
    @Query('potongan') potongan?: string,
  ) {
    return this.penggajianService.generate(
      periodeAwal,
      periodeAkhir,
      potongan ? Number(potongan) : 0,
    );
  }

  @Get()
  @Roles('Admin', 'HRD')
  @ApiOperation({ summary: 'Ambil semua data penggajian' })
  findAll() {
    return this.penggajianService.findAll();
  }

  @Get(':id')
  @Roles('Admin', 'HRD')
  @ApiOperation({ summary: 'Ambil penggajian berdasarkan ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.penggajianService.findOne(id);
  }

  @Delete(':id')
  @Roles('Admin', 'HRD')
  @ApiOperation({ summary: 'Hapus data penggajian' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.penggajianService.remove(id);
  }
}
