import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JabatanService } from './jabatan.service.js';
import { CreateJabatanDto } from './dto/create-jabatan.dto.js';
import { UpdateJabatanDto } from './dto/update-jabatan.dto.js';
import { JwtWebGuard } from '../common/guards/jwt-web.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';

@ApiTags('Jabatan')
@ApiBearerAuth()
@UseGuards(JwtWebGuard, RolesGuard)
@Controller('jabatan')
export class JabatanController {
  constructor(private readonly jabatanService: JabatanService) {}

  @Post()
  @Roles('Admin')
  @ApiOperation({ summary: 'Buat jabatan baru' })
  create(@Body() dto: CreateJabatanDto) {
    return this.jabatanService.create(dto);
  }

  @Get()
  @Roles('Admin', 'HRD', 'SPV')
  @ApiOperation({ summary: 'Ambil semua jabatan' })
  findAll() {
    return this.jabatanService.findAll();
  }

  @Get(':id')
  @Roles('Admin', 'HRD', 'SPV')
  @ApiOperation({ summary: 'Ambil jabatan berdasarkan ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.jabatanService.findOne(id);
  }

  @Patch(':id')
  @Roles('Admin')
  @ApiOperation({ summary: 'Update jabatan' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateJabatanDto,
  ) {
    return this.jabatanService.update(id, dto);
  }

  @Delete(':id')
  @Roles('Admin')
  @ApiOperation({ summary: 'Hapus jabatan' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.jabatanService.remove(id);
  }
}
