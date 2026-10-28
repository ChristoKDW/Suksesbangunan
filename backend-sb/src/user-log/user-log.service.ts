import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserLog } from './entities/user-log.entity.js';
import { Karyawan } from '../karyawan/entities/karyawan.entity.js';

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
    @InjectRepository(Karyawan)
    private readonly karyawanRepo: Repository<Karyawan>,
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
   * Catat sesi login baru & tutup sesi lama pengguna pada platform yang sama
   */
  async recordLogin(dto: CreateUserLogDto): Promise<UserLog> {
    const deviceInfo = this.parseDeviceInfo(dto.userAgent);

    // Nonaktifkan sesi sebelumnya untuk user & platform yang sama agar tidak terjadi sesi ganda
    if (dto.idUser) {
      await this.userLogRepo.update(
        { idUser: dto.idUser, platform: dto.platform, isOnline: true },
        { isOnline: false, logoutAt: new Date() },
      );
    } else if (dto.idKaryawan) {
      await this.userLogRepo.update(
        { idKaryawan: dto.idKaryawan, platform: dto.platform, isOnline: true },
        { isOnline: false, logoutAt: new Date() },
      );
    } else if (dto.username) {
      await this.userLogRepo.update(
        { username: dto.username, platform: dto.platform, isOnline: true },
        { isOnline: false, logoutAt: new Date() },
      );
    }

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
   * Putuskan sesi secara paksa dari panel Super Admin (Force Logout)
   */
  async kickSession(idLog: number): Promise<UserLog> {
    const log = await this.userLogRepo.findOne({ where: { idLog } });
    if (!log) {
      throw new NotFoundException(`Sesi log dengan ID #${idLog} tidak ditemukan`);
    }

    log.isOnline = false;
    log.logoutAt = new Date();
    await this.userLogRepo.save(log);

    // Nonaktifkan seluruh sesi online user ini pada platform yang sama
    if (log.idUser) {
      await this.userLogRepo.update(
        { idUser: log.idUser, platform: log.platform, isOnline: true },
        { isOnline: false, logoutAt: new Date() },
      );
    }

    // Jika karyawan mobile, cabut token di tabel karyawan agar seketika 401
    if (log.idKaryawan) {
      await this.userLogRepo.update(
        { idKaryawan: log.idKaryawan, platform: log.platform, isOnline: true },
        { isOnline: false, logoutAt: new Date() },
      );
      await this.karyawanRepo.update(
        { idKaryawan: log.idKaryawan },
        { token: null as any, tokenKadaluarsa: null as any },
      );
    }

    return log;
  }

  /**
   * Periksa apakah user memiliki sesi aktif pada platform tertentu
   */
  async isUserSessionOnline(idUser: number, platform: string): Promise<boolean> {
    const hasAnyRecord = await this.userLogRepo.count({
      where: { idUser, platform },
    });
    // Jika belum pernah tercatat sama sekali di tabel user_log, izinkan (kompatibilitas)
    if (hasAnyRecord === 0) return true;

    const activeCount = await this.userLogRepo.count({
      where: { idUser, platform, isOnline: true },
    });
    return activeCount > 0;
  }

  /**
   * Ambil daftar status akses pengguna TANPA DUPLIKAT (1 baris per pengguna unik)
   */
  async findAll(query?: {
    search?: string;
    platform?: string;
    isOnline?: string;
    limit?: number;
  }): Promise<UserLog[]> {
    // Ambil sesi unik per pengguna (LOWER(username))
    // Prioritaskan sesi yang sedang online, lalu login_at terbaru
    const baseSql = `
      SELECT DISTINCT ON (LOWER(l.username))
        l.id_log AS "idLog",
        l.id_user AS "idUser",
        l.id_karyawan AS "idKaryawan",
        l.nama AS "nama",
        l.username AS "username",
        l.role AS "role",
        l.platform AS "platform",
        l.ip_address AS "ipAddress",
        l.user_agent AS "userAgent",
        l.device_info AS "deviceInfo",
        l.is_online AS "isOnline",
        l.login_at AS "loginAt",
        l.last_active_at AS "lastActiveAt",
        l.logout_at AS "logoutAt",
        l.session_token AS "sessionToken"
      FROM user_log l
      ORDER BY LOWER(l.username), l.is_online DESC, l.login_at DESC, l.id_log DESC
    `;

    const params: any[] = [];
    let outerWhere = 'WHERE 1=1';

    if (query?.search && query.search.trim()) {
      params.push(`%${query.search.trim().toLowerCase()}%`);
      outerWhere += ` AND (
        LOWER(sub."nama") LIKE $${params.length} OR
        LOWER(sub."username") LIKE $${params.length} OR
        LOWER(sub."ipAddress") LIKE $${params.length} OR
        LOWER(sub."deviceInfo") LIKE $${params.length}
      )`;
    }

    if (query?.platform && query.platform !== 'all') {
      params.push(query.platform);
      outerWhere += ` AND sub."platform" = $${params.length}`;
    }

    if (query?.isOnline !== undefined && query.isOnline !== 'all') {
      params.push(query.isOnline === 'true');
      outerWhere += ` AND sub."isOnline" = $${params.length}`;
    }

    const limit = query?.limit ? Number(query.limit) : 100;
    params.push(limit);

    const finalSql = `
      SELECT * FROM (${baseSql}) sub
      ${outerWhere}
      ORDER BY sub."isOnline" DESC, sub."loginAt" DESC
      LIMIT $${params.length}
    `;

    return this.userLogRepo.query(finalSql, params);
  }

  /**
   * Statistik ringkas log aktivitas pengguna unik
   */
  async getStats() {
    const totalToday = await this.userLogRepo
      .createQueryBuilder('l')
      .where('l.login_at >= CURRENT_DATE')
      .getCount();

    // Jumlah pengguna unik yang sedang berstatus Online
    const activeRaw = await this.userLogRepo.query(`
      SELECT COUNT(DISTINCT LOWER(username)) AS count
      FROM user_log
      WHERE is_online = true
    `);
    const activeNow = Number(activeRaw[0]?.count || 0);

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
