import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, EntityManager, Repository } from 'typeorm';
import { PengajuanIzin } from './entities/pengajuan-izin.entity.js';
import { CreatePengajuanIzinDto } from './dto/create-pengajuan-izin.dto.js';
import { ApprovalPengajuanIzinDto } from './dto/approval-pengajuan-izin.dto.js';
import { LocationHelper } from '../common/helpers/location.helper.js';
import { PengaturanKantorService } from '../pengaturan-kantor/pengaturan-kantor.service.js';
import { KaryawanService } from '../karyawan/karyawan.service.js';
import { AbsensiService } from '../absensi/absensi.service.js';
import { NotificationService } from '../notification/notification.service.js';
import { JadwalKerja } from '../jadwal-kerja/entities/jadwal-kerja.entity.js';
import { KebijakanLiburService } from '../kebijakan-libur/kebijakan-libur.service.js';
import { AturanPengajuanService, JENIS_IZIN_KE_ATURAN } from '../aturan-pengajuan/aturan-pengajuan.service.js';
import {
  businessToday,
  dateRange,
  isSunday,
  normalizeDateOnly,
} from '../common/utils/business-date.util.js';

@Injectable()
export class PengajuanIzinService {
  constructor(
    @InjectRepository(PengajuanIzin)
    private readonly izinRepo: Repository<PengajuanIzin>,
    @InjectRepository(JadwalKerja)
    private readonly jadwalRepo: Repository<JadwalKerja>,
    private readonly locationHelper: LocationHelper,
    private readonly pengaturanKantorService: PengaturanKantorService,
    private readonly karyawanService: KaryawanService,
    private readonly absensiService: AbsensiService,
    private readonly notificationService: NotificationService,
    private readonly dataSource: DataSource,
    private readonly kebijakanLibur?: KebijakanLiburService,
    private readonly aturan?: AturanPengajuanService,
  ) {}

  /**
   * Submit pengajuan izin dari mobile:
   * 1. Izin: Maksimal 1 hari, unggah dokumen opsional, tidak dapat gaji harian & tunjangan makan.
   * 2. Sakit: Sesuai surat keterangan dokter, unggah dokumen WAJIB, dapat gaji harian tapi tidak dapat tunjangan makan.
   * 3. Multi-tier workflow: Diajukan -> SPV -> HRD -> Selesai.
   */
  async submitIzin(
    dto: CreatePengajuanIzinDto,
    filePendukung?: string,
  ): Promise<PengajuanIzin> {
    const karyawan = await this.karyawanService.findOne(dto.idKaryawan);
    if (!karyawan) {
      throw new BadRequestException('Karyawan tidak ditemukan');
    }

    let tglMulaiStr: string;
    let tglSelesaiStr: string;
    try {
      tglMulaiStr = normalizeDateOnly(dto.tanggalMulai);
      tglSelesaiStr = normalizeDateOnly(dto.tanggalSelesai);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
    if (tglMulaiStr > tglSelesaiStr) {
      throw new BadRequestException(
        'Tanggal mulai tidak boleh setelah tanggal selesai',
      );
    }
    if (tglMulaiStr < businessToday()) {
      throw new BadRequestException(
        'Pengajuan izin tidak dapat menggunakan tanggal yang sudah lewat',
      );
    }

    const overlap = await this.izinRepo
      .createQueryBuilder('izin')
      .where('izin.id_karyawan = :idKaryawan', { idKaryawan: dto.idKaryawan })
      .andWhere(
        "izin.status IN ('menunggu', 'menunggu_spv', 'menunggu_hrd', 'disetujui')",
      )
      .andWhere(
        'izin.tanggal_mulai <= :selesai AND izin.tanggal_selesai >= :mulai',
        {
          mulai: tglMulaiStr,
          selesai: tglSelesaiStr,
        },
      )
      .getOne();
    if (overlap) {
      throw new BadRequestException(
        'Rentang tanggal bertumpang tindih dengan pengajuan izin aktif',
      );
    }

    // --- 1. Validasi Aturan Izin ---
    if (dto.jenisIzin === 'izin') {
      // Maksimal izin adalah 1 hari
      if (tglMulaiStr !== tglSelesaiStr) {
        throw new BadRequestException(
          'Pengajuan izin maksimal hanya untuk 1 hari. Jika membutuhkan lebih dari 1 hari, silakan ajukan cuti tahunan atau hubungi HRD.',
        );
      }
      // Dokumen pendukung bersifat opsional
    }

    // --- 2. Validasi Aturan Sakit ---
    if (dto.jenisIzin === 'sakit') {
      // Unggah dokumen pendukung (surat keterangan dokter) bersifat WAJIB
      if (!filePendukung || filePendukung.trim() === '') {
        throw new BadRequestException(
          'Pengajuan izin sakit wajib melampirkan dokumen pendukung (surat keterangan dokter).',
        );
      }
      // Durasi sakit bebas sesuai ketentuan surat dokter
    }

    // --- 3. Validasi Aturan Cuti: wajib hak cuti & tidak melebihi sisa jatah tahunan ---
    if (dto.jenisIzin === 'cuti') {
      if (!karyawan.hakCuti) {
        throw new BadRequestException(
          'Pengajuan cuti ditolak: Anda belum memiliki hak cuti tahunan dari HRD. Silakan hubungi HRD.',
        );
      }
      const hariDiminta = await this.hariCutiPerTahun(dto.idKaryawan, tglMulaiStr, tglSelesaiStr);
      if ([...hariDiminta.values()].reduce((a, b) => a + b, 0) === 0) {
        throw new BadRequestException(
          'Rentang tanggal cuti hanya berisi hari libur Anda. Pilih minimal 1 hari kerja.',
        );
      }
      for (const [tahun, hari] of hariDiminta) {
        const saldo = await this.getSaldoCuti(dto.idKaryawan, tahun);
        if (hari > saldo.sisa) {
          throw new BadRequestException(
            `Sisa cuti tahun ${tahun} hanya ${saldo.sisa} hari (jatah ${saldo.jatah}, terpakai ${saldo.terpakai}, menunggu persetujuan ${saldo.menunggu}). Anda mengajukan ${hari} hari.`,
          );
        }
      }
    }

    // --- 3b. Validasi Aturan Izin Sementara (keluar sementara saat jam kerja) ---
    if (dto.jenisIzin === 'izin sementara') {
      if (tglMulaiStr !== tglSelesaiStr) {
        throw new BadRequestException(
          'Izin sementara hanya berlaku untuk 1 hari (keluar sementara saat jam kerja).',
        );
      }
      if (!dto.jamMulai || !dto.jamSelesai) {
        throw new BadRequestException(
          'Izin sementara wajib mencantumkan jam mulai dan jam selesai.',
        );
      }
      if (dto.jamMulai >= dto.jamSelesai) {
        throw new BadRequestException(
          'Jam mulai izin sementara harus sebelum jam selesai.',
        );
      }
    }

    const menggunakanLokasi =
      dto.lokasiLat !== undefined &&
      dto.lokasiLat !== null &&
      dto.lokasiLng !== undefined &&
      dto.lokasiLng !== null;

    // Tentukan alur approval awal:
    // Jika departemen dikelola SPV → menunggu_spv
    // Jika departemen dikelola Admin/HRD langsung (kantor/backoffice) → langsung menunggu_hrd
    const managers = Array.isArray(karyawan.departemen?.pengelola)
      ? karyawan.departemen.pengelola
      : (karyawan.departemen as any)?.pengelola
        ? [(karyawan.departemen as any).pengelola]
        : [];

    // Batas jumlah pengajuan per bulan (diatur HRD) → 409 "Anda sudah melakukan pengajuan ..."
    const jenisAturan = JENIS_IZIN_KE_ATURAN[dto.jenisIzin];
    if (this.aturan && jenisAturan) {
      await this.aturan.cekBatas(dto.idKaryawan, jenisAturan, tglMulaiStr);
    }

    // Pemohon SPV → langsung HRD; staf departemen ber-SPV → SPV dulu; kantor → HRD
    const initialStatus = this.aturan
      ? await this.aturan.statusAwal(karyawan)
      : managers.some((m: any) => m.role === 'SPV')
        ? 'menunggu_spv'
        : 'menunggu_hrd';

    const izinData: Partial<PengajuanIzin> = {
      idKaryawan: dto.idKaryawan,
      jenisIzin: dto.jenisIzin,
      tanggalMulai: tglMulaiStr as any,
      tanggalSelesai: tglSelesaiStr as any,
      alasan: dto.alasan,
      jamMulai: dto.jenisIzin === 'izin sementara' ? dto.jamMulai : null,
      jamSelesai: dto.jenisIzin === 'izin sementara' ? dto.jamSelesai : null,
      filePendukung: filePendukung || undefined,
      tanggalPengajuan: new Date(),
      menggunakanLokasi,
      status: initialStatus,
    };

    if (menggunakanLokasi) {
      izinData.lokasiLat = dto.lokasiLat!;
      izinData.lokasiLng = dto.lokasiLng!;

      const semuaKantor = await this.pengaturanKantorService.findAll();
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
    }

    const izin = this.izinRepo.create(izinData);
    const saved = await this.izinRepo.save(izin);

    // Kirim notifikasi ke SPV atau HRD
    try {
      await this.notificationService.createNotification({
        title: `Pengajuan ${dto.jenisIzin.toUpperCase()} Baru`,
        message: `${karyawan.nama} mengajukan ${dto.jenisIzin} untuk tanggal ${tglMulaiStr}${tglMulaiStr !== tglSelesaiStr ? ` s/d ${tglSelesaiStr}` : ''}. Mohon periksa dan berikan persetujuan.`,
        type: 'pengajuan_izin',
      });
    } catch (err) {
      console.error('Failed to send notification on izin submit:', err);
    }

    return this.findOne(saved.idIzin);
  }

  /**
   * Persetujuan Tahap 1 oleh Supervisor (SPV):
   * Jika disetujui, status naik menjadi 'menunggu_hrd'.
   * Jika ditolak, status menjadi 'ditolak_spv'.
   */
  async processApprovalSpv(
    idIzin: number,
    dto: ApprovalPengajuanIzinDto,
    user: { idUser: number; role?: string; idDepartemen?: number },
  ): Promise<PengajuanIzin> {
    const izin = await this.findOne(idIzin);

    if (izin.status !== 'menunggu_spv' && izin.status !== 'menunggu') {
      throw new BadRequestException(
        `Pengajuan tidak dapat diproses oleh SPV karena status saat ini adalah "${izin.status}"`,
      );
    }
    if (
      user.role === 'SPV' &&
      (!user.idDepartemen || izin.karyawan?.idDepartemen !== user.idDepartemen)
    ) {
      throw new BadRequestException(
        'Supervisor hanya dapat memproses pengajuan karyawan di departemennya sendiri',
      );
    }

    const isApproved = dto.setuju === true || dto.status === 'disetujui';
    izin.idUserSpv = user.idUser;
    izin.idUserApproval = user.idUser;
    izin.catatanSpv = dto.catatan || dto.catatanApproval || null;
    izin.catatanApproval = izin.catatanSpv;

    if (isApproved) {
      izin.status = 'menunggu_hrd';
      await this.izinRepo.save(izin);

      try {
        await this.notificationService.createNotification({
          idKaryawan: izin.idKaryawan,
          title: 'Pengajuan Izin Disetujui SPV',
          message: `Pengajuan ${izin.jenisIzin} Anda telah disetujui oleh Supervisor dan diteruskan ke HRD untuk persetujuan akhir.`,
          type: 'pengajuan_izin',
        });
      } catch (err) {
        console.error('Failed to send SPV approval notification:', err);
      }
    } else {
      izin.status = 'ditolak_spv';
      izin.tanggalDiproses = new Date();
      await this.izinRepo.save(izin);

      try {
        await this.notificationService.createNotification({
          idKaryawan: izin.idKaryawan,
          title: 'Pengajuan Izin Ditolak SPV',
          message: `Pengajuan ${izin.jenisIzin} Anda ditolak oleh Supervisor.${izin.catatanSpv ? ` Catatan: "${izin.catatanSpv}"` : ''}`,
          type: 'pengajuan_izin',
        });
      } catch (err) {
        console.error('Failed to send SPV rejection notification:', err);
      }
    }

    return this.findOne(idIzin);
  }

  /**
   * Persetujuan Tahap Akhir oleh HRD:
   * Jika disetujui, status menjadi 'disetujui' dan record absensi dibuat otomatis.
   * Jika ditolak, status menjadi 'ditolak_hrd'.
   */
  async processApprovalHrd(
    idIzin: number,
    dto: ApprovalPengajuanIzinDto,
    idUser: number,
  ): Promise<PengajuanIzin> {
    const isApproved = dto.setuju === true || dto.status === 'disetujui';
    const saved = await this.dataSource.transaction(async (manager) => {
      const izinRepo = manager.getRepository(PengajuanIzin);
      const izin = await izinRepo.findOne({
        where: { idIzin },
        lock: { mode: 'pessimistic_write' },
      });
      if (!izin) {
        throw new NotFoundException(
          `Pengajuan izin dengan ID ${idIzin} tidak ditemukan`,
        );
      }
      if (izin.status !== 'menunggu_hrd') {
        throw new BadRequestException(
          `Pengajuan tidak dapat diproses oleh HRD karena status saat ini adalah "${izin.status}"`,
        );
      }
      izin.idUserHrd = idUser;
      izin.idUserApproval = idUser;
      izin.catatanHrd = dto.catatan || dto.catatanApproval || null;
      izin.catatanApproval = izin.catatanHrd;
      izin.tanggalDiproses = new Date();
      izin.status = isApproved ? 'disetujui' : 'ditolak_hrd';
      await izinRepo.save(izin);
      if (isApproved && izin.jenisIzin === 'cuti') {
        await this.upsertCutiSchedules(izin, idUser, manager);
      }
      return izin;
    });

    if (isApproved) {
      // Izin sementara: karyawan tetap hadir & absen normal, tidak perlu record absensi izin.
      // Durasi izin otomatis dikompensasi pada perhitungan jam kerja payroll.
      if (saved.jenisIzin !== 'izin sementara') {
        // Buat / update record absensi secara otomatis
        await this.createAbsensiFromIzin(saved);
      }

      try {
        await this.notificationService.createNotification({
          idKaryawan: saved.idKaryawan,
          title: '🎉 Pengajuan Izin Resmi Disetujui HRD',
          message: `Pengajuan ${saved.jenisIzin} Anda telah resmi disetujui oleh HRD. Status kehadiran Anda telah diperbarui.`,
          type: 'pengajuan_izin',
        });
      } catch (err) {
        console.error('Failed to send HRD approval notification:', err);
      }
    } else {
      try {
        await this.notificationService.createNotification({
          idKaryawan: saved.idKaryawan,
          title: 'Pengajuan Izin Ditolak HRD',
          message: `Pengajuan ${saved.jenisIzin} Anda ditolak oleh HRD.${saved.catatanHrd ? ` Catatan: "${saved.catatanHrd}"` : ''}`,
          type: 'pengajuan_izin',
        });
      } catch (err) {
        console.error('Failed to send HRD rejection notification:', err);
      }
    }
    return this.findOne(idIzin);
  }

  /**
   * General approval dispatcher (mendukung role SPV, HRD, dan Admin)
   */
  async processApproval(
    idIzin: number,
    dto: ApprovalPengajuanIzinDto,
    user: { idUser: number; role?: string },
  ): Promise<PengajuanIzin> {
    const role = (user.role || '').toUpperCase();
    if (role === 'SPV') {
      return this.processApprovalSpv(idIzin, dto, user);
    } else {
      return this.processApprovalHrd(idIzin, dto, user.idUser);
    }
  }

  /**
   * Buat/update record absensi untuk setiap hari dalam rentang izin yang disetujui.
   */
  private async createAbsensiFromIzin(izin: PengajuanIzin): Promise<void> {
    const statusKehadiran = izin.jenisIzin;
    if (izin.jenisIzin === 'cuti') {
      // Cuti hanya tercatat di hari kerja; hari libur karyawan tetap libur
      for (const tanggal of await this.hariKerjaCuti(
        izin.idKaryawan,
        normalizeDateOnly(izin.tanggalMulai),
        normalizeDateOnly(izin.tanggalSelesai),
      )) {
        await this.absensiService.createAbsensiIzin(
          izin.idKaryawan,
          izin.idIzin,
          new Date(`${tanggal}T00:00:00`),
          statusKehadiran,
        );
      }
      return;
    }

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

  private static readonly NAMA_HARI = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];

  /**
   * Tanggal yang benar-benar menjadi cuti (dan memotong jatah) = hari KERJA karyawan.
   * Hari libur karyawan tetap libur, tidak ditimpa cuti:
   * - tanggal yang punya jadwal → hari kerja bila ada shift (mis. operasional
   *   masuk hari Minggu), libur bila off (mis. off fleksibel hari Rabu)
   * - tanggal tanpa jadwal → libur tetap karyawan (kolom hari libur, default Minggu);
   *   karyawan kantor (departemen tanpa SPV) juga libur di tanggal merah.
   */
  private async hariKerjaCuti(
    idKaryawan: number,
    mulai: string,
    selesai: string,
    manager?: EntityManager,
  ): Promise<string[]> {
    const karyawan = await this.karyawanService.findOne(idKaryawan);
    const jadwalRepo = manager?.getRepository(JadwalKerja) ?? this.jadwalRepo;
    const jadwal = await jadwalRepo.find({
      where: { idKaryawan, tanggal: Between(mulai as any, selesai as any) },
    });
    const kerjaPerTanggal = new Map<string, boolean>();
    for (const j of jadwal) {
      const tgl = normalizeDateOnly(j.tanggal);
      kerjaPerTanggal.set(tgl, (kerjaPerTanggal.get(tgl) ?? false) || j.isCuti || !j.isLibur);
    }
    const pengelola: any[] = Array.isArray(karyawan?.departemen?.pengelola)
      ? karyawan.departemen.pengelola
      : [];
    const isKantor = !pengelola.some((m) => m.role === 'SPV');
    const tanggalMerah = isKantor && this.kebijakanLibur
      ? await this.kebijakanLibur.tanggalMerahDalamRentang(mulai, selesai)
      : new Map();
    const hariLiburTetap = (karyawan?.hariLibur || 'Minggu')
      .split(',')
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean);

    return dateRange(mulai, selesai).filter((tgl) => {
      if (kerjaPerTanggal.has(tgl)) return kerjaPerTanggal.get(tgl)!;
      const hari = PengajuanIzinService.NAMA_HARI[new Date(`${tgl}T00:00:00Z`).getUTCDay()];
      return !hariLiburTetap.includes(hari) && !tanggalMerah.has(tgl);
    });
  }

  /** Jumlah hari cuti terhitung (hari kerja karyawan) per tahun kalender. */
  private async hariCutiPerTahun(
    idKaryawan: number,
    mulai: string,
    selesai: string,
  ): Promise<Map<number, number>> {
    const perTahun = new Map<number, number>();
    for (const tanggal of await this.hariKerjaCuti(idKaryawan, mulai, selesai)) {
      const tahun = Number(tanggal.slice(0, 4));
      perTahun.set(tahun, (perTahun.get(tahun) ?? 0) + 1);
    }
    return perTahun;
  }

  /**
   * Saldo cuti tahunan: jatah dari HRD dikurangi cuti disetujui (terpakai)
   * dan cuti yang masih menunggu persetujuan (dipesan).
   */
  async getSaldoCuti(idKaryawan: number, tahun = Number(businessToday().slice(0, 4))) {
    const karyawan = await this.karyawanService.findOne(idKaryawan);
    const awal = `${tahun}-01-01`;
    const akhir = `${tahun}-12-31`;
    const list = await this.izinRepo
      .createQueryBuilder('izin')
      .where('izin.id_karyawan = :idKaryawan', { idKaryawan })
      .andWhere("izin.jenis_izin = 'cuti'")
      .andWhere("izin.status IN ('menunggu', 'menunggu_spv', 'menunggu_hrd', 'disetujui')")
      .andWhere('izin.tanggal_mulai <= :akhir AND izin.tanggal_selesai >= :awal', { awal, akhir })
      .getMany();
    let terpakai = 0;
    let menunggu = 0;
    for (const izin of list) {
      const hari =
        (
          await this.hariCutiPerTahun(
            idKaryawan,
            normalizeDateOnly(izin.tanggalMulai),
            normalizeDateOnly(izin.tanggalSelesai),
          )
        ).get(tahun) ?? 0;
      if (izin.status === 'disetujui') terpakai += hari;
      else menunggu += hari;
    }
    // Cuti yang dicairkan (diuangkan) ikut memotong jatah tahun tersebut
    let dicairkan = 0;
    const pencairan: { status: string; hari: string }[] = await this.dataSource.query(
      `SELECT status, COALESCE(SUM(jumlah_hari), 0) AS hari FROM pengajuan_pencairan
       WHERE id_karyawan = $1 AND jenis = 'cuti' AND tahun = $2
         AND status IN ('menunggu_spv', 'menunggu_hrd', 'disetujui') GROUP BY status`,
      [idKaryawan, tahun],
    );
    for (const row of pencairan) {
      if (row.status === 'disetujui') {
        dicairkan += Number(row.hari);
        terpakai += Number(row.hari);
      } else menunggu += Number(row.hari);
    }
    const jatah = karyawan?.hakCuti ? Number(karyawan.jatahCuti ?? 12) : 0;
    return {
      tahun,
      hakCuti: !!karyawan?.hakCuti,
      jatah,
      terpakai,
      menunggu,
      dicairkan,
      sisa: Math.max(0, jatah - terpakai - menunggu),
    };
  }

  private async upsertCutiSchedules(
    izin: PengajuanIzin,
    idUser: number,
    manager?: EntityManager,
  ): Promise<void> {
    const jadwalRepo = manager?.getRepository(JadwalKerja) ?? this.jadwalRepo;
    const start = normalizeDateOnly(izin.tanggalMulai);
    const end = normalizeDateOnly(izin.tanggalSelesai);
    // Hanya hari kerja karyawan yang menjadi cuti; hari libur (off) tetap libur
    for (const tanggal of await this.hariKerjaCuti(izin.idKaryawan, start, end, manager)) {
      let jadwal = manager
        ? await jadwalRepo
            .createQueryBuilder('jadwal')
            .setLock('pessimistic_write')
            .where('jadwal.id_karyawan = :idKaryawan', {
              idKaryawan: izin.idKaryawan,
            })
            .andWhere('jadwal.tanggal = :tanggal', { tanggal })
            .getOne()
        : await jadwalRepo.findOne({
            where: { idKaryawan: izin.idKaryawan, tanggal: tanggal as any },
          });
      jadwal ??= jadwalRepo.create({
        idKaryawan: izin.idKaryawan,
        tanggal: tanggal as any,
      });
      Object.assign(jadwal, {
        idShift: null,
        shift: null,
        isCuti: true,
        isLibur: false,
        keterangan: `Cuti tahunan disetujui (Pengajuan #${izin.idIzin})`,
        sumberUpload: 'pengajuan_cuti',
        idUser,
      });
      await jadwalRepo.save(jadwal);
    }
  }

  async findAll(user?: {
    role?: string;
    idDepartemen?: number;
  }): Promise<PengajuanIzin[]> {
    const qb = this.izinRepo
      .createQueryBuilder('izin')
      .leftJoinAndSelect('izin.karyawan', 'karyawan')
      .leftJoinAndSelect('karyawan.departemen', 'departemen')
      .leftJoinAndSelect('karyawan.jabatan', 'jabatan')
      .leftJoinAndSelect('izin.userApproval', 'userApproval')
      .leftJoinAndSelect('izin.userSpv', 'userSpv')
      .leftJoinAndSelect('izin.userHrd', 'userHrd')
      .orderBy('izin.tanggal_pengajuan', 'DESC');

    if (user?.role === 'SPV' && !user.idDepartemen) {
      return [];
    }
    if (user?.role === 'SPV') {
      qb.andWhere('karyawan.id_departemen = :idDept', {
        idDept: user.idDepartemen,
      });
    }

    return qb.getMany();
  }

  async findOne(id: number): Promise<PengajuanIzin> {
    const izin = await this.izinRepo.findOne({
      where: { idIzin: id },
      relations: {
        karyawan: { departemen: true, jabatan: true },
        userApproval: true,
        userSpv: true,
        userHrd: true,
      },
    });
    if (!izin) {
      throw new NotFoundException(
        `Pengajuan izin dengan ID ${id} tidak ditemukan`,
      );
    }
    return izin;
  }

  async findByStatus(
    status: string,
    user?: { role?: string; idDepartemen?: number },
  ): Promise<PengajuanIzin[]> {
    if (user?.role === 'SPV' && !user.idDepartemen) {
      return [];
    }
    const qb = this.izinRepo
      .createQueryBuilder('izin')
      .leftJoinAndSelect('izin.karyawan', 'karyawan')
      .leftJoinAndSelect('karyawan.departemen', 'departemen')
      .leftJoinAndSelect('karyawan.jabatan', 'jabatan')
      .leftJoinAndSelect('izin.userApproval', 'userApproval')
      .leftJoinAndSelect('izin.userSpv', 'userSpv')
      .leftJoinAndSelect('izin.userHrd', 'userHrd')
      .where('izin.status = :status', { status })
      .orderBy('izin.tanggal_pengajuan', 'DESC');
    if (user?.role === 'SPV') {
      qb.andWhere('karyawan.id_departemen = :idDept', {
        idDept: user.idDepartemen,
      });
    }
    return qb.getMany();
  }

  /**
   * Daftar izin milik satu karyawan, urut terbaru (mobile).
   */
  async findByKaryawan(
    idKaryawan: number,
    startDate?: string,
    endDate?: string,
  ): Promise<PengajuanIzin[]> {
    const qb = this.izinRepo
      .createQueryBuilder('izin')
      .leftJoinAndSelect('izin.userApproval', 'userApproval')
      .leftJoinAndSelect('izin.userSpv', 'userSpv')
      .leftJoinAndSelect('izin.userHrd', 'userHrd')
      .where('izin.id_karyawan = :idKaryawan', { idKaryawan });

    if (startDate) {
      qb.andWhere('izin.tanggal_mulai >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('izin.tanggal_selesai <= :endDate', {
        endDate: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000),
      });
    }

    return qb.orderBy('izin.tanggal_pengajuan', 'DESC').getMany();
  }

  async remove(id: number): Promise<void> {
    const izin = await this.findOne(id);
    await this.izinRepo.remove(izin);
  }
}
