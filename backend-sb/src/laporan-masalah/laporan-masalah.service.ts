import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LaporanMasalah } from './entities/laporan-masalah.entity.js';
import { LaporanMasalahLampiran } from './entities/laporan-masalah-lampiran.entity.js';
import { CreateLaporanMasalahDto } from './dto/create-laporan-masalah.dto.js';
import { UpdateStatusLaporanDto } from './dto/update-status-laporan.dto.js';
import { NotificationService } from '../notification/notification.service.js';

@Injectable()
export class LaporanMasalahService {
  constructor(
    @InjectRepository(LaporanMasalah)
    private readonly laporanRepo: Repository<LaporanMasalah>,
    @InjectRepository(LaporanMasalahLampiran)
    private readonly lampiranRepo: Repository<LaporanMasalahLampiran>,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Pembangkitan nomor tiket unik format: RPT-YYYYMM-XXXX (e.g. RPT-202610-0001)
   */
  private async generateTiketId(): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `RPT-${yearMonth}-`;

    const last = await this.laporanRepo
      .createQueryBuilder('laporan')
      .where('laporan.tiket_id LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('laporan.id_laporan', 'DESC')
      .getOne();

    let seq = 1;
    if (last && last.tiketId) {
      const parts = last.tiketId.split('-');
      if (parts.length === 3) {
        seq = parseInt(parts[2], 10) + 1;
      }
    }

    return `${prefix}${String(seq).padStart(4, '0')}`;
  }

  private parseDeviceInfo(deviceInfo: any): Record<string, any> | null {
    if (!deviceInfo) return null;
    if (typeof deviceInfo === 'object') return deviceInfo;
    try {
      return JSON.parse(deviceInfo);
    } catch {
      return { raw: deviceInfo };
    }
  }

  /**
   * Submit Laporan dari Aplikasi Mobile Karyawan
   */
  async createFromMobile(
    idKaryawan: number,
    dto: CreateLaporanMasalahDto,
    file?: Express.Multer.File,
  ): Promise<LaporanMasalah> {
    const tiketId = await this.generateTiketId();

    const laporan = this.laporanRepo.create({
      tiketId,
      sumber: 'mobile',
      idKaryawan,
      kategori: dto.kategori,
      judul: dto.judul,
      deskripsi: dto.deskripsi,
      langkahReproduksi: dto.langkahReproduksi || null,
      prioritas: dto.prioritas || 'sedang',
      status: 'menunggu',
      deviceInfo: this.parseDeviceInfo(dto.deviceInfo),
    });

    const saved = await this.laporanRepo.save(laporan);

    if (file) {
      const lampiran = this.lampiranRepo.create({
        idLaporan: saved.idLaporan,
        filePath: file.path,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSizeBytes: file.size,
      });
      await this.lampiranRepo.save(lampiran);
    }

    return this.findOne(saved.idLaporan);
  }

  /**
   * Submit Laporan dari Web Admin Panel (Admin / HRD / SPV)
   */
  async createFromWeb(
    idUser: number,
    dto: CreateLaporanMasalahDto,
    file?: Express.Multer.File,
  ): Promise<LaporanMasalah> {
    const tiketId = await this.generateTiketId();

    const laporan = this.laporanRepo.create({
      tiketId,
      sumber: 'web',
      idUser,
      kategori: dto.kategori,
      judul: dto.judul,
      deskripsi: dto.deskripsi,
      langkahReproduksi: dto.langkahReproduksi || null,
      prioritas: dto.prioritas || 'sedang',
      status: 'menunggu',
      deviceInfo: this.parseDeviceInfo(dto.deviceInfo),
    });

    const saved = await this.laporanRepo.save(laporan);

    if (file) {
      const lampiran = this.lampiranRepo.create({
        idLaporan: saved.idLaporan,
        filePath: file.path,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSizeBytes: file.size,
      });
      await this.lampiranRepo.save(lampiran);
    }

    return this.findOne(saved.idLaporan);
  }

  /**
   * Ambil riwayat laporan milik karyawan (Mobile)
   */
  async getMyReportsMobile(idKaryawan: number): Promise<LaporanMasalah[]> {
    return this.laporanRepo.find({
      where: { idKaryawan, sumber: 'mobile' },
      relations: { lampiran: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Ambil riwayat laporan milik user web (Web Admin)
   */
  async getMyReportsWeb(idUser: number): Promise<LaporanMasalah[]> {
    return this.laporanRepo.find({
      where: { idUser, sumber: 'web' },
      relations: { lampiran: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Super Admin: Ambil seluruh tiket dengan filter
   */
  async findAllForSuperAdmin(query?: {
    status?: string;
    prioritas?: string;
    sumber?: string;
    search?: string;
  }): Promise<LaporanMasalah[]> {
    const qb = this.laporanRepo
      .createQueryBuilder('laporan')
      .leftJoinAndSelect('laporan.karyawan', 'karyawan')
      .leftJoinAndSelect('laporan.user', 'user')
      .leftJoinAndSelect('laporan.superAdmin', 'superAdmin')
      .leftJoinAndSelect('laporan.lampiran', 'lampiran')
      .orderBy('laporan.createdAt', 'DESC');

    if (query?.status && query.status !== 'all') {
      qb.andWhere('laporan.status = :status', { status: query.status });
    }

    if (query?.prioritas && query.prioritas !== 'all') {
      qb.andWhere('laporan.prioritas = :prioritas', { prioritas: query.prioritas });
    }

    if (query?.sumber && query.sumber !== 'all') {
      qb.andWhere('laporan.sumber = :sumber', { sumber: query.sumber });
    }

    if (query?.search) {
      const s = `%${query.search.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(laporan.judul) LIKE :s OR LOWER(laporan.deskripsi) LIKE :s OR LOWER(laporan.tiket_id) LIKE :s OR LOWER(karyawan.nama) LIKE :s OR LOWER(user.nama) LIKE :s)',
        { s },
      );
    }

    return qb.getMany();
  }

  /**
   * Ambil detail satu laporan
   */
  async findOne(idLaporan: number): Promise<LaporanMasalah> {
    const item = await this.laporanRepo.findOne({
      where: { idLaporan },
      relations: { karyawan: true, user: true, superAdmin: true, lampiran: true },
    });

    if (!item) {
      throw new NotFoundException(`Laporan masalah dengan ID ${idLaporan} tidak ditemukan`);
    }

    return item;
  }

  /**
   * Super Admin: Update status, prioritas & berikan tanggapan solusi
   */
  async updateStatusBySuperAdmin(
    idLaporan: number,
    idSuperAdmin: number | null,
    dto: UpdateStatusLaporanDto,
  ): Promise<LaporanMasalah> {
    const laporan = await this.findOne(idLaporan);

    laporan.status = dto.status;
    if (dto.prioritas) laporan.prioritas = dto.prioritas;
    if (dto.tanggapanSolusi) laporan.tanggapanSolusi = dto.tanggapanSolusi;
    if (idSuperAdmin) laporan.idSuperAdmin = idSuperAdmin;

    if (dto.status === 'selesai') {
      laporan.tanggalSelesai = new Date();
    }

    await this.laporanRepo.save(laporan);

    // Kirim notifikasi umpan balik ke pelapor
    try {
      const statusLabel =
        dto.status === 'selesai'
          ? 'telah Selesai Ditangani'
          : dto.status === 'sedang_diproses'
          ? 'sedang Diinvestigasi'
          : `berstatus "${dto.status}"`;

      const title = `Laporan Masalah ${laporan.tiketId}`;
      const message = `Tiket kendala Anda (${laporan.judul}) ${statusLabel}.${dto.tanggapanSolusi ? ` Solusi: "${dto.tanggapanSolusi}"` : ''}`;

      if (laporan.sumber === 'mobile' && laporan.idKaryawan) {
        await this.notificationService.createNotification({
          idKaryawan: laporan.idKaryawan,
          title,
          message,
          type: 'laporan_masalah',
        });
      } else if (laporan.sumber === 'web' && laporan.idUser) {
        await this.notificationService.createNotification({
          idUser: laporan.idUser,
          title,
          message,
          type: 'laporan_masalah',
        });
      }
    } catch (err) {
      console.error('Gagal mengirimkan notifikasi laporan masalah:', err);
    }

    return this.findOne(idLaporan);
  }
}
