import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AsetService } from './aset.service.js';
import { CreatePeminjamanAsetDto } from './dto/create-peminjaman-aset.dto.js';
import { UpdatePeminjamanAsetDto } from './dto/update-peminjaman-aset.dto.js';
import { JwtWebGuard } from '../common/guards/jwt-web.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';

@ApiTags('Peminjaman Aset')
@ApiBearerAuth()
@UseGuards(JwtWebGuard, RolesGuard)
@Controller('aset')
export class AsetController {
  constructor(private readonly asetService: AsetService) {}

  @Post()
  @Roles('Admin', 'HRD')
  @ApiOperation({ summary: 'Catat peminjaman aset perusahaan oleh karyawan' })
  create(@Body() dto: CreatePeminjamanAsetDto) {
    return this.asetService.create(dto);
  }

  @Get()
  @Roles('Admin', 'HRD', 'SPV')
  @ApiOperation({
    summary: 'Daftar peminjaman aset (filter per karyawan opsional)',
  })
  @ApiQuery({ name: 'idKaryawan', required: false })
  findAll(@Query('idKaryawan') idKaryawan?: string) {
    return this.asetService.findAll(
      idKaryawan ? Number(idKaryawan) : undefined,
    );
  }

  @Get(':id')
  @Roles('Admin', 'HRD', 'SPV')
  @ApiOperation({ summary: 'Detail peminjaman aset' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.asetService.findOne(id);
  }

  @Patch(':id/kembalikan')
  @Roles('Admin', 'HRD')
  @ApiOperation({ summary: 'Tandai aset sudah dikembalikan' })
  kembalikan(@Param('id', ParseIntPipe) id: number) {
    return this.asetService.kembalikan(id);
  }

  @Patch(':id')
  @Roles('Admin', 'HRD')
  @ApiOperation({ summary: 'Update data peminjaman aset' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePeminjamanAsetDto,
  ) {
    return this.asetService.update(id, dto);
  }

  @Delete(':id')
  @Roles('Admin', 'HRD')
  @ApiOperation({ summary: 'Hapus catatan peminjaman aset' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.asetService.remove(id);
  }
}
