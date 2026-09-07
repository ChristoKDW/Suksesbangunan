import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PengajuanIzin } from './entities/pengajuan-izin.entity.js';
import { CreatePengajuanIzinDto } from './dto/create-pengajuan-izin.dto.js';
import { ApprovalPengajuanIzinDto } from './dto/approval-pengajuan-izin.dto.js';
import { LocationHelper } from '../common/helpers/location.helper.js';
import { PengaturanKantorService } from '../pengaturan-kantor/pengaturan-kantor.service.js';
import { KaryawanService } from '../karyawan/karyawan.service.js';
import { AbsensiService } from '../absensi/absensi.service.js';

@Injectable()
export class PengajuanIzinService {
  constructor(
    @InjectRepository(PengajuanIzin)
    private readonly izinRepo: Repository<PengajuanIzin>,
    private readonly locationHelper: LocationHelper,
    private readonly pengaturanKantorService: PengaturanKantorService,
    private readonly karyawanService: KaryawanService,
    private readonly absensiService: AbsensiService,
  ) {}

  /**
   * Submit pengajuan izin dari mobile.
   * Dual-path logic:
   * - Dengan lokasi → validasi geofencing, auto-approve jika dalam radius
   * - Tanpa lokasi → status menunggu, perlu approval SPV/HRD
   */
  async submitIzin(
    dto: CreatePengajuanIzinDto,
    filePendukung?: string,
  ): Promise<PengajuanIzin> {
    const karyawan = await this.karyawanService.findOne(dto.idKaryawan);
    if (!karyawan) {
      throw new BadRequestException('Karyawan tidak ditemukan');
    }

    if (dto.jenisIzin === 'cuti' && !karyawan.hakCuti) {
      throw new BadRequestException(
        'Pengajuan cuti ditolak: Anda belum memiliki hak cuti tahunan dari HRD. Silakan hubungi HRD.',
      );
    }

    const menggunakanLokasi =
      dto.lokasiLat !== undefined &&
      dto.lokasiLat !== null &&
      dto.lokasiLng !== undefined &&
      dto.lokasiLng !== null;

    const izinData: Partial<PengajuanIzin> = {
      idKaryawan: dto.idKaryawan,
      jenisIzin: dto.jenisIzin,
      tanggalMulai: dto.tanggalMulai as any,
      tanggalSelesai: dto.tanggalSelesai as any,
      alasan: dto.alasan,
      filePendukung: filePendukung || undefined,
      tanggalPengajuan: new Date(),
      menggunakanLokasi,
    };

    if (menggunakanLokasi) {
      // === PATH 1: Izin mendadak dari kantor (dengan lokasi) ===
      izinData.lokasiLat = dto.lokasiLat!;
      izinData.lokasiLng = dto.lokasiLng!;

      const semuaKantor = await this.pengaturanKantorService.findAll();

      if (semuaKantor.length === 0) {
        throw new BadRequestException(
          'Pengaturan kantor belum dikonfigurasi',
        );
      }

      let dalamRadius = false;
      for (const kantor of semuaKantor) {
        const diDalam = this.locationHelper.dalamRadiusKantor(
          dto.lokasiLat!,
          dto.lokasiLng!,
          Number(kantor.latitude),
          Number(kantor.longitude),
          kantor.radiusMeter,
        );
        if (diDalam) {
          dalamRadius = true;
          break;
        }
      }

      izinData.dalamRadiusKantor = dalamRadius;

      if (!dalamRadius) {
        throw new BadRequestException(
          'Pengajuan izin ditolak: lokasi Anda di luar radius kantor. Jika Anda tidak di kantor, ajukan izin tanpa lokasi.',
        );
      }

      // Dalam radius → disetujui otomatis
      izinData.status = 'disetujui';
      izinData.tanggalDiproses = new Date();
    } else {
      // === PATH 2: Izin dari rumah / sakit (tanpa lokasi) ===
      if (dto.jenisIzin === 'sakit' && !filePendukung) {
        // Fleksibel: izinkan tapi bisa ditambahkan validasi strict jika perlu
      }

      izinData.status = 'menunggu';
    }

    const izin = this.izinRepo.create(izinData);
    const saved = await this.izinRepo.save(izin);

    // Jika disetujui otomatis, buat/update record absensi
    if (saved.status === 'disetujui') {
      await this.createAbsensiFromIzin(saved);
    }

    return saved;
  }

  /**
   * Approval oleh SPV/HRD (PATCH /pengajuan-izin/:id/approval)
   */
  async processApproval(
    idIzin: number,
    dto: ApprovalPengajuanIzinDto,
    idUser: number,
  ): Promise<PengajuanIzin> {
    const izin = await this.findOne(idIzin);

    if (izin.status !== 'menunggu') {
      throw new BadRequestException(
        `Izin sudah diproses sebelumnya (status: ${izin.status})`,
      );
    }

    izin.status = dto.status;
    izin.idUserApproval = idUser;
    izin.tanggalDiproses = new Date();
    izin.catatanApproval = dto.catatanApproval || '';

    const saved = await this.izinRepo.save(izin);

    if (saved.status === 'disetujui') {
      await this.createAbsensiFromIzin(saved);
    }

    return saved;
  }

  /**
   * Buat/update record absensi untuk setiap hari dalam rentang izin yang disetujui.
   */
  private async createAbsensiFromIzin(izin: PengajuanIzin): Promise<void> {
    const statusKehadiran = izin.jenisIzin;

    const start = new Date(izin.tanggalMulai);
    const end = new Date(izin.tanggalSelesai);

    const current = new Date(start);
    while (current <= end) {
      await this.absensiService.createAbsensiIzin(
        izin.idKaryawan,
        izin.idIzin,
        new Date(current),
        statusKehadiran,
      );
      current.setDate(current.getDate() + 1);
    }
  }

  async findAll(): Promise<PengajuanIzin[]> {
    return this.izinRepo.find({
      relations: { karyawan: true, userApproval: true },
    });
  }

  async findOne(id: number): Promise<PengajuanIzin> {
    const izin = await this.izinRepo.findOne({
      where: { idIzin: id },
      relations: { karyawan: true, userApproval: true },
    });
    if (!izin) {
      throw new NotFoundException(
        `Pengajuan izin dengan ID ${id} tidak ditemukan`,
      );
    }
    return izin;
  }

  async findByStatus(status: string): Promise<PengajuanIzin[]> {
    return this.izinRepo.find({
      where: { status },
      relations: { karyawan: true, userApproval: true },
    });
  }

  /**
   * Daftar izin milik satu karyawan, urut terbaru (mobile).
   * Opsional: filter berdasarkan startDate dan endDate.
   */
  async findByKaryawan(
    idKaryawan: number,
    startDate?: string,
    endDate?: string,
  ): Promise<PengajuanIzin[]> {
    const qb = this.izinRepo
      .createQueryBuilder('izin')
      .leftJoinAndSelect('izin.userApproval', 'userApproval')
      .where('izin.id_karyawan = :idKaryawan', { idKaryawan });

    if (startDate) {
      qb.andWhere('izin.tanggal_mulai >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('izin.tanggal_selesai <= :endDate', {
        endDate: new Date(
          new Date(endDate).getTime() + 24 * 60 * 60 * 1000,
        ),
      });
    }

    return qb.orderBy('izin.tanggal_pengajuan', 'DESC').getMany();
  }

  async remove(id: number): Promise<void> {
    const izin = await this.findOne(id);
    await this.izinRepo.remove(izin);
  }
}
