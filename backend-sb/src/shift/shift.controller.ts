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
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ShiftService } from './shift.service.js';
import { CreateShiftDto } from './dto/create-shift.dto.js';
import { UpdateShiftDto } from './dto/update-shift.dto.js';
import { JwtWebGuard } from '../common/guards/jwt-web.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';

@ApiTags('Shift')
@ApiBearerAuth()
@UseGuards(JwtWebGuard, RolesGuard)
@Controller('shift')
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  @Post()
  @Roles('Admin', 'HRD')
  @ApiOperation({ summary: 'Buat shift baru' })
  create(@Body() dto: CreateShiftDto, @Req() req: any) {
    return this.shiftService.create(dto, req.user);
  }

  @Get()
  @Roles('Admin', 'HRD', 'SPV')
  @ApiOperation({ summary: 'Ambil semua shift' })
  findAll(@Req() req: any) {
    return this.shiftService.findAll(req.user?.role, req.user?.idDepartemen);
  }

  @Get(':id')
  @Roles('Admin', 'HRD', 'SPV')
  @ApiOperation({ summary: 'Ambil shift berdasarkan ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.shiftService.findOne(id);
  }

  @Patch(':id')
  @Roles('Admin', 'HRD')
  @ApiOperation({ summary: 'Update shift' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateShiftDto,
    @Req() req: any,
  ) {
    return this.shiftService.update(id, dto, req.user);
  }

  @Delete(':id')
  @Roles('Admin', 'HRD')
  @ApiOperation({ summary: 'Hapus shift' })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.shiftService.remove(id, req.user);
  }
}
