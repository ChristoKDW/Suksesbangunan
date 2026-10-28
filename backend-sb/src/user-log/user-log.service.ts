import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserLog } from './entities/user-log.entity.js';

export interface CreateUserLogDto {
  idUser?: number | null;
  idKaryawan?: number | null;
  nama: string;
  username: string;
  role: string;
  platform: 'web' | 'mobile' | 'superadmin';
  ipAddress?: string | null;
  userAgent?: string | null;
  sessionToken?: string | null;
}

@Injectable()
export class UserLogService {
  constructor(
    @InjectRepository(UserLog)
    private readonly userLogRepo: Repository<UserLog>,
  ) {}

  /**
   * Parse user agent sederhana untuk menghasilkan deskripsi perangkat yang rapi
   */
  private parseDeviceInfo(userAgent?: string | null): string {
    if (!userAgent) return 'Perangkat Tidak Dikenal';

    const ua = userAgent.toLowerCase();
    let os = 'Unknown OS';
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'macOS';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) os = 'iOS';
    else if (ua.includes('linux')) os = 'Linux';

    let browser = 'Unknown Browser';
    if (ua.includes('edg')) browser = 'Edge';
    else if (ua.includes('chrome')) browser = 'Chrome';
    else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('dart') || ua.includes('flutter') || ua.includes('okhttp')) browser = 'LARAS Mobile App';

    return `${browser} on ${os}`;
  }

  /**
   * Catat sesi login baru
   */
  async recordLogin(dto: CreateUserLogDto): Promise<UserLog> {
    const deviceInfo = this.parseDeviceInfo(dto.userAgent);

    const log = this.userLogRepo.create({
      idUser: dto.idUser || null,
      idKaryawan: dto.idKaryawan || null,
      nama: dto.nama,
      username: dto.username,
      role: dto.role,
      platform: dto.platform,
      ipAddress: dto.ipAddress || '103.247.11.91',
      userAgent: dto.userAgent || null,
      deviceInfo,
      isOnline: true,
      sessionToken: dto.sessionToken || null,
      loginAt: new Date(),
      lastActiveAt: new Date(),
    });

    return this.userLogRepo.save(log);
  }

  /**
   * Catat logout pengguna
   */
  async recordLogout(sessionTokenOrId: string | number): Promise<void> {
    const where = typeof sessionTokenOrId === 'number'
      ? { idLog: sessionTokenOrId }
      : { sessionToken: sessionTokenOrId };

    await this.userLogRepo.update(where, {
      isOnline: false,
      logoutAt: new Date(),
    });
  }

  /**
   * Putuskan sesi secara paksa dari panel Super Admin
   */
  async kickSession(idLog: number): Promise<UserLog> {
    const log = await this.userLogRepo.findOne({ where: { idLog } });
    if (!log) {
      throw new NotFoundException(`Sesi log dengan ID #${idLog} tidak ditemukan`);
    }

    log.isOnline = false;
    log.logoutAt = new Date();
    return this.userLogRepo.save(log);
  }

  /**
   * Ambil riwayat log & status akses pengguna
   */
  async findAll(query?: {
    search?: string;
    platform?: string;
    isOnline?: string;
    limit?: number;
  }): Promise<UserLog[]> {
    const qb = this.userLogRepo.createQueryBuilder('l');

    if (query?.search && query.search.trim()) {
      const s = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(l.nama) LIKE :s OR LOWER(l.username) LIKE :s OR LOWER(l.ip_address) LIKE :s OR LOWER(l.device_info) LIKE :s)',
        { s },
      );
    }

    if (query?.platform && query.platform !== 'all') {
      qb.andWhere('l.platform = :platform', { platform: query.platform });
    }

    if (query?.isOnline !== undefined && query.isOnline !== 'all') {
      const isOnlineBool = query.isOnline === 'true';
      qb.andWhere('l.is_online = :isOnline', { isOnline: isOnlineBool });
    }

    qb.orderBy('l.login_at', 'DESC');
    qb.take(query?.limit ? Number(query.limit) : 100);

    return qb.getMany();
  }

  /**
   * Statistik ringkas log aktivitas pengguna
   */
  async getStats() {
    const totalToday = await this.userLogRepo
      .createQueryBuilder('l')
      .where('l.login_at >= CURRENT_DATE')
      .getCount();

    const activeNow = await this.userLogRepo.count({
      where: { isOnline: true },
    });

    const totalMobile = await this.userLogRepo.count({
      where: { platform: 'mobile' },
    });

    const totalWeb = await this.userLogRepo.count({
      where: { platform: 'web' },
    });

    const totalSuperAdmin = await this.userLogRepo.count({
      where: { platform: 'superadmin' },
    });

    return {
      totalToday,
      activeNow,
      totalMobile,
      totalWeb: totalWeb + totalSuperAdmin,
    };
  }
}
