import {
  Controller,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notification.service.js';
import { JwtWebGuard } from '../common/guards/jwt-web.guard.js';
// Note: You can use a common Jwt guard if you have one that supports both Mobile and Web.
// For now, assuming web dashboard users. If mobile users call this, ensure the guard supports them.

@ApiTags('Notification')
@ApiBearerAuth()
@UseGuards(JwtWebGuard)
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Ambil daftar notifikasi untuk user yang sedang login' })
  getMyNotifications(@Request() req) {
    // req.user from JWT payload usually has id (or sub) and role
    const userId = req.user.idUser || req.user.id || req.user.sub;
    const role = req.user.role;
    return this.notificationService.getMyNotifications(userId, role);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Ambil jumlah notifikasi belum dibaca' })
  getUnreadCount(@Request() req) {
    const userId = req.user.idUser || req.user.id || req.user.sub;
    const role = req.user.role;
    return this.notificationService.getUnreadCount(userId, role);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Tandai 1 notifikasi sebagai telah dibaca' })
  markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @Request() req
  ) {
    const userId = req.user.idUser || req.user.id || req.user.sub;
    const role = req.user.role;
    return this.notificationService.markAsRead(id, userId, role);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Tandai SEMUA notifikasi sebagai telah dibaca' })
  markAllAsRead(@Request() req) {
    const userId = req.user.idUser || req.user.id || req.user.sub;
    const role = req.user.role;
    return this.notificationService.markAllAsRead(userId, role);
  }
}
