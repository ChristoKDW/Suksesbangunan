import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity.js';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async createNotification(
    data: {
      idUser?: number;
      idKaryawan?: number;
      title: string;
      message: string;
      type?: string;
    }
  ) {
    const notification = this.notificationRepository.create(data);
    return await this.notificationRepository.save(notification);
  }

  async getMyNotifications(userId: number, role: string) {
    // If role is Admin/HRD/SPV, find by idUser
    // If role is Karyawan (mobile app), find by idKaryawan
    const isMobileUser = !['Admin', 'HRD', 'SPV'].includes(role);
    
    return await this.notificationRepository.find({
      where: isMobileUser ? { idKaryawan: userId } : { idUser: userId },
      order: { createdAt: 'DESC' },
      take: 50, // limit to last 50 for performance
    });
  }

  async getUnreadCount(userId: number, role: string) {
    const isMobileUser = !['Admin', 'HRD', 'SPV'].includes(role);
    return await this.notificationRepository.count({
      where: isMobileUser
        ? { idKaryawan: userId, isRead: false }
        : { idUser: userId, isRead: false },
    });
  }

  async markAsRead(idNotification: number, userId: number, role: string) {
    const isMobileUser = !['Admin', 'HRD', 'SPV'].includes(role);
    const notification = await this.notificationRepository.findOne({
      where: isMobileUser 
        ? { idNotification, idKaryawan: userId }
        : { idNotification, idUser: userId }
    });

    if (!notification) {
      throw new NotFoundException('Notifikasi tidak ditemukan atau Anda tidak memiliki akses');
    }

    notification.isRead = true;
    return await this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: number, role: string) {
    const isMobileUser = !['Admin', 'HRD', 'SPV'].includes(role);
    
    await this.notificationRepository.update(
      isMobileUser ? { idKaryawan: userId, isRead: false } : { idUser: userId, isRead: false },
      { isRead: true }
    );
    return { message: 'Semua notifikasi telah dibaca' };
  }
}
