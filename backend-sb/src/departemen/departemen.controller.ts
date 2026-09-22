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
import { DepartemenService } from './departemen.service.js';
import { CreateDepartemenDto } from './dto/create-departemen.dto.js';
import { UpdateDepartemenDto } from './dto/update-departemen.dto.js';
import { JwtWebGuard } from '../common/guards/jwt-web.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';

@ApiTags('Departemen')
@ApiBearerAuth()
@UseGuards(JwtWebGuard, RolesGuard)
@Controller('departemen')
export class DepartemenController {
  constructor(private readonly departemenService: DepartemenService) {}

  @Post()
  @Roles('Admin', 'HRD')
  @ApiOperation({ summary: 'Buat departemen baru' })
  create(@Body() dto: CreateDepartemenDto) {
    return this.departemenService.create(dto);
  }

  @Get()
  @Roles('Admin', 'HRD', 'SPV')
  @ApiOperation({ summary: 'Ambil semua departemen' })
  findAll() {
    return this.departemenService.findAll();
  }

  @Get(':id')
  @Roles('Admin', 'HRD', 'SPV')
  @ApiOperation({ summary: 'Ambil departemen berdasarkan ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.departemenService.findOne(id);
  }

  @Patch(':id')
  @Roles('Admin', 'HRD')
  @ApiOperation({ summary: 'Update departemen' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDepartemenDto,
  ) {
    return this.departemenService.update(id, dto);
  }

  @Delete(':id')
  @Roles('Admin', 'HRD')
  @ApiOperation({ summary: 'Hapus departemen' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.departemenService.remove(id);
  }
}
