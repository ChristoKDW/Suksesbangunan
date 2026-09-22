import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Absensi } from './entities/absensi.entity.js';
import { CreateAbsensiDto } from './dto/create-absensi.dto.js';
import { LocationHelper } from '../common/helpers/location.helper.js';
import { PengaturanKantorService } from '../pengaturan-kantor/pengaturan-kantor.service.js';
import { KaryawanService } from '../karyawan/karyawan.service.js';
import { JadwalKerjaService } from '../jadwal-kerja/jadwal-kerja.service.js';
import { FaceRecognitionService } from '../face/face-recognition.service.js';
import { Karyawan } from '../karyawan/entities/karyawan.entity.js';
import { PengaturanKantor } from '../pengaturan-kantor/entities/pengaturan-kantor.entity.js';
import { RegularOffService } from '../regular-off/regular-off.service.js';

/** Ambang cosine similarity; di atas nilai ini dianggap orang yang sama. */
const FACE_MATCH_THRESHOLD = 0.4;

@Injectable()
export class AbsensiService {
  constructor(
    @InjectRepository(Absensi)
    private readonly absensiRepo: Repository<Absensi>,
    private readonly locationHelper: LocationHelper,
    private readonly pengaturanKantorService: PengaturanKantorService,
    private readonly karyawanService: KaryawanService,
    private readonly jadwalKerjaService: JadwalKerjaService,
    private readonly faceService: FaceRecognitionService,
    private readonly regularOffService: RegularOffService,
  ) {}

  /** Cocokkan foto absen dengan wajah terdaftar memakai model AI. */
  private async verifikasiWajah(
    karyawan: Karyawan,
    imageBase64?: string,
  ): Promise<void> {
    if (!karyawan.faceEmbedding || karyawan.faceEmbedding.length === 0) {
      throw new BadRequestException(
        'Wajah Anda belum didaftarkan. Silakan daftarkan wajah terlebih dahulu.',
      );
    }
    if (!imageBase64) {
      throw new BadRequestException('Foto wajah wajib dikirim saat absen.');
    }
    if (!this.faceService.isReady()) {
      throw new ServiceUnavailableException(
        'Model AI wajah belum siap di server. Coba beberapa saat lagi.',
      );
    }

    const buffer = this.faceService.decodeBase64Image(imageBase64);
    const hasil = await this.faceService.extractEmbedding(buffer);

    if (!hasil) {
      throw new BadRequestException(
        'Wajah tidak terdeteksi pada foto. Pastikan pencahayaan cukup dan wajah menghadap kamera.',
      );
    }

    const similarity = this.faceService.cosineSimilarity(
      karyawan.faceEmbedding,
      hasil.embedding,
    );

    if (similarity < FACE_MATCH_THRESHOLD) {
      throw new BadRequestException(
        `Wajah tidak cocok dengan data terdaftar (kemiripan ${(similarity * 100).toFixed(1)}%). Silakan coba lagi.`,
      );
    }
  }

  /** Cari kantor pertama yang radiusnya mencakup koordinat GPS yang diberikan. */
  private async cariKantorDalamRadius(
    lat: number,
    lng: number,
  ): Promise<{ kantor: PengaturanKantor; jarakMeter: number } | null> {
    const semuaKantor = await this.pengaturanKantorService.findAll();

    for (const kantor of semuaKantor) {
      const jarakMeter = this.locationHelper.hitungJarakMeter(
        lat,
        lng,
        Number(kantor.latitude),
        Number(kantor.longitude),
      );
      if (jarakMeter <= kantor.radiusMeter) {
        return { kantor, jarakMeter };
      }
    }
    return null;
  }

  /**
   * Cek status geofence tanpa membuat absensi (dipakai mobile untuk indikator visual
   * "Di dalam/luar Radius Kantor" sebelum karyawan menekan tombol absen).
   */
  async checkGeofenceStatus(lat: number, lng: number) {
    const hasil = await this.cariKantorDalamRadius(lat, lng);
    if (!hasil) {
      return {
        dalamRadius: false,
        idKantor: null,
        namaKantor: null,
        jarakMeter: null,
      };
    }
    return {
      dalamRadius: true,
      idKantor: hasil.kantor.idKantor,
      namaKantor: hasil.kantor.namaKantor,
      jarakMeter: Math.round(hasil.jarakMeter),
    };
  }

  async submitAbsensi(dto: CreateAbsensiDto): Promise<Absensi> {
    const { idKaryawan, lokasiLat, lokasiLng, metodeAbsen } = dto;

    const karyawan = await this.karyawanService.findOne(idKaryawan);

    if (!karyawan) {
      throw new BadRequestException('Karyawan tidak ditemukan');
    }

    if (karyawan.statusAktif !== 'aktif') {
      throw new BadRequestException(
        `Karyawan berstatus ${karyawan.statusAktif} tidak dapat melakukan absensi`,
      );
    }

    const now = new Date();
    const todayDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    // 1. VALIDASI JADWAL KERJA HARI INI
    const jadwal = await this.jadwalKerjaService.findByKaryawanAndTanggal(
      dto.idKaryawan,
      todayDate,
    );

    if (!jadwal) {
      throw new BadRequestException(
        'Anda belum punya jadwal kerja, hubungi supervisor',
      );
    }

    if (jadwal.isCuti) {
      throw new BadRequestException(
        'Hari ini Anda sedang cuti, tidak perlu melakukan absensi',
      );
    }

    if (jadwal.isLibur) {
      throw new BadRequestException(
        `Hari ini adalah hari libur/hari penting resmi: "${jadwal.keterangan || 'Hari Penting'}", tidak perlu melakukan absensi`,
      );
    }

    if (!jadwal.shift) {
      throw new BadRequestException(
        'Hari ini adalah hari libur Anda, tidak ada jadwal kerja',
      );
    }

    // 2. VALIDASI KESESUAIAN JAM KERJA DENGAN SHIFT
    const shift = jadwal.shift;
    const [mulaiJam, mulaiMenit] = shift.jamMulai.split(':').map(Number);
    const [selesaiJam, selesaiMenit] = shift.jamSelesai.split(':').map(Number);

    const shiftMulai = new Date(todayDate);
    shiftMulai.setHours(mulaiJam, mulaiMenit, 0, 0);

    const shiftSelesai = new Date(todayDate);
    shiftSelesai.setHours(selesaiJam, selesaiMenit, 0, 0);
    // Jika shift lintas hari (misal 22:00 s/d 06:00)
    if (shiftSelesai <= shiftMulai) {
      shiftSelesai.setDate(shiftSelesai.getDate() + 1);
    }

    const jamMulaiFmt = shift.jamMulai.substring(0, 5);
    const jamSelesaiFmt = shift.jamSelesai.substring(0, 5);
    const tipe = dto.tipe || 'masuk';

    let absensiHariIni: Absensi | null = null;
    if (tipe === 'keluar') {
      absensiHariIni = await this.absensiRepo.findOne({
        where: {
          idKaryawan: dto.idKaryawan,
          jamMasukAktual: Between(
            todayDate,
            new Date(todayDate.getTime() + 24 * 60 * 60 * 1000),
          ),
        },
        relations: { istirahat: true },
      });

      if (!absensiHariIni) {
        throw new BadRequestException('Tidak ditemukan absensi masuk hari ini');
      }

      if (absensiHariIni.jamKeluarAktual) {
        throw new BadRequestException(
          'Anda sudah melakukan absensi keluar hari ini',
        );
      }

      const activeBreak = absensiHariIni.istirahat?.find(
        (i) => i.jamKeluarIstirahat && !i.jamMasukIstirahat,
      );
      if (activeBreak) {
        throw new BadRequestException(
          'Anda masih dalam status istirahat aktif. Harap selesaikan istirahat terlebih dahulu sebelum absen pulang.',
        );
      }
    } else {
      // tipe masuk
      const existingMasuk = await this.absensiRepo.findOne({
        where: {
          idKaryawan: dto.idKaryawan,
          jamMasukAktual: Between(
            todayDate,
            new Date(todayDate.getTime() + 24 * 60 * 60 * 1000),
          ),
        },
      });

      if (existingMasuk) {
        throw new BadRequestException(
          'Anda sudah melakukan absensi masuk hari ini',
        );
      }

      // Karyawan tidak boleh absen di luar rentang jam shift-nya:
      // Buka akses absen masuk 120 menit (2 jam) sebelum jam mulai shift
      const batasBukaMasuk = new Date(shiftMulai.getTime() - 120 * 60 * 1000);
      if (now < batasBukaMasuk) {
        const jamBukaFmt = `${String(batasBukaMasuk.getHours()).padStart(2, '0')}:${String(batasBukaMasuk.getMinutes()).padStart(2, '0')}`;
        throw new BadRequestException(
          `Belum waktunya absen masuk untuk ${shift.namaShift} (${jamMulaiFmt} - ${jamSelesaiFmt}). Absensi dibuka mulai pukul ${jamBukaFmt}`,
        );
      }

      if (now > shiftSelesai) {
        throw new BadRequestException(
          `Waktu shift ${shift.namaShift} (${jamMulaiFmt} - ${jamSelesaiFmt}) telah berakhir. Anda tidak dapat melakukan absensi masuk.`,
        );
      }
    }

    // 3. VERIFIKASI WAJAH DENGAN MODEL AI (SCRFD + MobileFaceNet) + pgvector
    if (metodeAbsen === 'wajah') {
      await this.verifikasiWajah(karyawan, dto.faceImageBase64);
    }

    // 4. VALIDASI RADIUS KANTOR (MULTI-TITIK)
    const semuaKantor = await this.pengaturanKantorService.findAll();

    if (semuaKantor.length === 0) {
      throw new BadRequestException('Pengaturan kantor belum dikonfigurasi');
    }

    const hasilKantor = await this.cariKantorDalamRadius(
      dto.lokasiLat,
      dto.lokasiLng,
    );

    if (!hasilKantor) {
      throw new BadRequestException(
        'Absensi ditolak: Anda berada di luar radius kantor',
      );
    }

    const kantorCocok = hasilKantor.kantor;

    if (tipe === 'keluar' && absensiHariIni) {
      absensiHariIni.jamKeluarAktual = now;
      return this.absensiRepo.save(absensiHariIni);
    }

    let statusKehadiran = 'tepat waktu';
    if (now > shiftMulai) {
      statusKehadiran = 'telat';
    }

    const absensi = this.absensiRepo.create({
      idKaryawan: dto.idKaryawan,
      idJadwal: jadwal.idJadwal,
      idKantor: kantorCocok.idKantor,
      jamMasukAktual: now,
      lokasiLat: dto.lokasiLat,
      lokasiLng: dto.lokasiLng,
      dalamRadiusKantor: true,
      statusKehadiran,
      metodeAbsen: dto.metodeAbsen,
    });

    const savedAbsensi = await this.absensiRepo.save(absensi);

    // Jika karyawan operasional masuk di hari libur nasional (bukan hari Minggu), berikan 1 saldo RO
    try {
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      await this.regularOffService.createSaldoRoIfEligible(
        dto.idKaryawan,
        todayStr,
      );
    } catch (err) {
      console.error('Error generating RO on attendance submit:', err);
    }

    return savedAbsensi;
  }

  async findAll(): Promise<Absensi[]> {
    return this.absensiRepo.find({
      relations: { karyawan: true, jadwalKerja: true, pengajuanIzin: true },
    });
  }

  async findOne(id: number): Promise<Absensi> {
    const absensi = await this.absensiRepo.findOne({
      where: { idAbsensi: id },
      relations: { karyawan: true, jadwalKerja: true, pengajuanIzin: true },
    });
    if (!absensi) {
      throw new NotFoundException(`Absensi dengan ID ${id} tidak ditemukan`);
    }
    return absensi;
  }

  async findByKaryawanDanPeriode(
    idKaryawan: number,
    periodeAwal: Date,
    periodeAkhir: Date,
  ): Promise<Absensi[]> {
    return this.absensiRepo.find({
      where: {
        idKaryawan,
        jamMasukAktual: Between(periodeAwal, periodeAkhir),
      },
      relations: { jadwalKerja: true, istirahat: true },
    });
  }

  /**
   * Absensi hari ini untuk karyawan tertentu (dipakai endpoint mobile).
   */
  async findTodayByKaryawan(idKaryawan: number): Promise<Absensi | null> {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    return this.absensiRepo.findOne({
      where: {
        idKaryawan,
        jamMasukAktual: Between(todayStart, todayEnd),
      },
      relations: { jadwalKerja: { shift: true }, istirahat: true },
    });
  }

  /**
   * Riwayat absensi karyawan. Default 30 hari terakhir, bisa di-filter.
   */
  async findHistoryByKaryawan(
    idKaryawan: number,
    startDate?: string,
    endDate?: string,
  ): Promise<Absensi[]> {
    const now = new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate
      ? new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000)
      : now;

    return this.absensiRepo.find({
      where: {
        idKaryawan,
        jamMasukAktual: Between(start, end),
      },
      relations: { jadwalKerja: { shift: true } },
      order: { jamMasukAktual: 'DESC' },
    });
  }

  async createAbsensiIzin(
    idKaryawan: number,
    idIzin: number,
    tanggal: Date,
    statusKehadiran: string,
  ): Promise<Absensi> {
    const existing = await this.absensiRepo.findOne({
      where: {
        idKaryawan,
        jamMasukAktual: Between(
          new Date(
            tanggal.getFullYear(),
            tanggal.getMonth(),
            tanggal.getDate(),
          ),
          new Date(
            tanggal.getFullYear(),
            tanggal.getMonth(),
            tanggal.getDate() + 1,
          ),
        ),
      },
    });

    if (existing) {
      existing.idIzin = idIzin;
      existing.statusKehadiran = statusKehadiran;
      return this.absensiRepo.save(existing);
    }

    const absensi = this.absensiRepo.create({
      idKaryawan,
      idIzin,
      jamMasukAktual: tanggal,
      statusKehadiran,
      metodeAbsen: 'manual',
    });

    return this.absensiRepo.save(absensi);
  }

  async remove(id: number): Promise<void> {
    const absensi = await this.findOne(id);
    await this.absensiRepo.query(
      `DELETE FROM istirahat WHERE id_absensi = $1`,
      [id],
    );
    await this.absensiRepo.remove(absensi);
  }

  getRepository(): Repository<Absensi> {
    return this.absensiRepo;
  }
}
