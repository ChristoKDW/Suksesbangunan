import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserLogService } from './user-log.service.js';

@ApiTags('Super Admin - User Access Logs')
@Controller('super-admin/user-logs')
export class UserLogController {
  constructor(private readonly userLogService: UserLogService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar riwayat login dan status akses user' })
  findAll(
    @Query('search') search?: string,
    @Query('platform') platform?: string,
    @Query('isOnline') isOnline?: string,
    @Query('limit') limit?: number,
  ) {
    return this.userLogService.findAll({ search, platform, isOnline, limit });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistik sesi aktif dan login hari ini' })
  getStats() {
    return this.userLogService.getStats();
  }

  @Post(':id/kick')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Putuskan sesi aktif user (Force Logout)' })
  kickSession(@Param('id', ParseIntPipe) id: number) {
    return this.userLogService.kickSession(id);
  }
}
