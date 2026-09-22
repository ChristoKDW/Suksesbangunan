import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { PengajuanPertukaran } from './entities/pengajuan-pertukaran.entity.js';
import { Karyawan } from '../karyawan/entities/karyawan.entity.js';
import { JadwalKerja } from '../jadwal-kerja/entities/jadwal-kerja.entity.js';
import { Shift } from '../shift/entities/shift.entity.js';
import { User } from '../user/entities/user.entity.js';
import { NotificationService } from '../notification/notification.service.js';
import { CreatePertukaranDto } from './dto/create-pertukaran.dto.js';
import { RespondPeerDto } from './dto/respond-peer.dto.js';
import { RespondApprovalDto } from './dto/respond-approval.dto.js';
import {
  businessToday,
  normalizeDateOnly,
} from '../common/utils/business-date.util.js';

@Injectable()
export class PertukaranJadwalService {
  constructor(
    @InjectRepository(PengajuanPertukaran)
    private readonly pertukaranRepo: Repository<PengajuanPertukaran>,
    @InjectRepository(Karyawan)
    private readonly karyawanRepo: Repository<Karyawan>,
    @InjectRepository(JadwalKerja)
    private readonly jadwalRepo: Repository<JadwalKerja>,
    @InjectRepository(Shift)
    private readonly shiftRepo: Repository<Shift>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly notificationService: NotificationService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Validasi bahwa karyawan berasal dari divisi operasional yang dikelola oleh Supervisor (SPV).
   * Karyawan kantor (Backoffice / dikelola langsung oleh Admin atau HRD) memiliki jam kerja tetap
   * dan tidak menggunakan sistem pertukaran shift / off.
   */
  private validateKaryawanOperasional(karyawan: Karyawan) {
    if (!karyawan.departemen) {
      throw new BadRequestException('Departemen karyawan tidak ditemukan');
    }

    const deptName = (karyawan.departemen.namaDepartemen || '')
      .toLowerCase()
      .replace(/[\s\-_]/g, '');

    const managers = Array.isArray(karyawan.departemen.pengelola)
      ? karyawan.departemen.pengelola
      : (karyawan.departemen as any).pengelola
        ? [(karyawan.departemen as any).pengelola]
        : [];

    const hasSpv = managers.some((m: any) => m.role === 'SPV');
    const isManagedByAdminOrHrd = managers.some(
      (m: any) => m.role === 'Admin' || m.role === 'HRD',
    );

    if (
      !hasSpv ||
      isManagedByAdminOrHrd ||
      deptName === 'backoffice' ||
      deptName === 'kantor'
    ) {
      throw new BadRequestException(
        `Pengajuan pertukaran shift & hari libur hanya berlaku untuk karyawan operasional yang dikelola oleh Supervisor (SPV). Divisi ${karyawan.departemen.namaDepartemen || 'Kantor'} merupakan divisi kantor dengan jam kerja tetap yang dikelola oleh Admin & HRD.`,
      );
    }
  }

  /**
   * Cek kelayakan apakah karyawan dapat mengajukan tukar shift/off
   */
  async checkEligibility(idKaryawan: number) {
    const k = await this.karyawanRepo.findOne({
      where: { idKaryawan },
      relations: { departemen: { pengelola: true } },
    });
    if (!k || !k.departemen) {
      return {
        isOperasional: false,
        namaDepartemen: null,
        reason: 'Departemen karyawan tidak ditemukan',
      };
    }

    const deptName = (k.departemen.namaDepartemen || '')
      .toLowerCase()
      .replace(/[\s\-_]/g, '');

    const managers = Array.isArray(k.departemen.pengelola)
      ? k.departemen.pengelola
      : (k.departemen as any).pengelola
        ? [(k.departemen as any).pengelola]
        : [];

    const hasSpv = managers.some((m: any) => m.role === 'SPV');
    const isManagedByAdminOrHrd = managers.some(
      (m: any) => m.role === 'Admin' || m.role === 'HRD',
    );

    const isOperasional =
      hasSpv &&
      !isManagedByAdminOrHrd &&
      deptName !== 'backoffice' &&
      deptName !== 'kantor';

    return {
      isOperasional,
      namaDepartemen: k.departemen.namaDepartemen,
      reason: isOperasional
        ? null
        : 'Pengajuan pertukaran shift & off hanya berlaku untuk karyawan operasional (SPV). Karyawan kantor memiliki jadwal kerja tetap yang dikelola oleh Admin & HRD.',
    };
  }

  /**
   * Menghitung jumlah pertukaran off yang sudah disetujui atau sedang dalam antrean aktif
   * milik karyawan tertentu pada bulan tertentu (format YYYY-MM).
   * Aturan bisnis: Penukaran hari libur (off) dibatasi maksimal 1 kali dalam sebulan.
   * Penukaran shift dapat dilakukan berkali-kali tanpa batasan.
   */
  async countOffExchangesInMonth(
    idKaryawan: number,
    yearMonth: string,
  ): Promise<number> {
    const [yearStr, monthStr] = yearMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const startDate = `${yearMonth}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${yearMonth}-${String(lastDay).padStart(2, '0')}`;

    const qb = this.pertukaranRepo
      .createQueryBuilder('p')
      .where("p.jenis_pertukaran = 'off'")
      .andWhere(
        "p.status IN ('disetujui', 'menunggu_rekan', 'menunggu_spv', 'menunggu_hrd')",
      )
      .andWhere(
        '((p.id_karyawan_pemohon = :idKaryawan AND p.tanggal_pemohon >= :startDate AND p.tanggal_pemohon <= :endDate) OR (p.id_karyawan_target = :idKaryawan AND p.tanggal_target >= :startDate AND p.tanggal_target <= :endDate))',
        { idKaryawan, startDate, endDate },
      );

    return await qb.getCount();
  }

  /**
   * Submit pengajuan pertukaran shift / off dari mobile
   */
  async create(
    dto: CreatePertukaranDto,
    idKaryawanPemohon: number,
  ): Promise<PengajuanPertukaran> {
    if (idKaryawanPemohon === dto.idKaryawanTarget) {
      throw new BadRequestException(
        'Anda tidak dapat bertukar jadwal dengan diri sendiri',
      );
    }

    const pemohon = await this.karyawanRepo.findOne({
      where: { idKaryawan: idKaryawanPemohon },
      relations: { departemen: { pengelola: true } },
    });
    if (!pemohon) {
      throw new NotFoundException('Data karyawan pemohon tidak ditemukan');
    }
    this.validateKaryawanOperasional(pemohon);

    const target = await this.karyawanRepo.findOne({
      where: { idKaryawan: dto.idKaryawanTarget },
      relations: { departemen: { pengelola: true } },
    });
    if (!target) {
      throw new NotFoundException('Data rekan kerja tujuan tidak ditemukan');
    }
    this.validateKaryawanOperasional(target);

    // Aturan ketat: Pertukaran hanya bisa terjadi dalam 1 departemen / 1 SPV yang sama
    if (pemohon.idDepartemen !== target.idDepartemen) {
      throw new BadRequestException(
        `Pertukaran jadwal hanya dapat dilakukan antar rekan kerja dalam satu departemen/bidang yang sama (${pemohon.departemen?.namaDepartemen || 'Departemen Anda'})`,
      );
    }

    let tanggalPemohon: string;
    let tanggalTarget: string;
    try {
      tanggalPemohon = normalizeDateOnly(dto.tanggalPemohon);
      tanggalTarget = normalizeDateOnly(dto.tanggalTarget);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
    const today = businessToday();
    if (tanggalPemohon < today || tanggalTarget < today) {
      throw new BadRequestException(
        'Pertukaran jadwal tidak dapat menggunakan tanggal yang sudah lewat',
      );
    }
    if (dto.jenisPertukaran === 'off' && tanggalPemohon === tanggalTarget) {
      throw new BadRequestException(
        'Pertukaran hari off harus menggunakan dua tanggal yang berbeda',
      );
    }

    if (
      dto.jenisPertukaran === 'shift' &&
      (!dto.idShiftPemohon || !dto.idShiftTarget)
    ) {
      throw new BadRequestException(
        'Shift asal pemohon dan rekan wajib dipilih',
      );
    }

    const [jadwalPemohon, jadwalTarget] = await Promise.all([
      this.jadwalRepo.findOne({
        where: {
          idKaryawan: idKaryawanPemohon,
          tanggal: tanggalPemohon as any,
        },
      }),
      this.jadwalRepo.findOne({
        where: {
          idKaryawan: dto.idKaryawanTarget,
          tanggal: tanggalTarget as any,
        },
      }),
    ]);
    this.validateClaimedSchedule(
      jadwalPemohon,
      dto.jenisPertukaran === 'shift' ? 'work' : 'off',
      dto.idShiftPemohon,
      'pemohon',
    );
    this.validateClaimedSchedule(
      jadwalTarget,
      dto.jenisPertukaran === 'shift' ? 'work' : 'off',
      dto.idShiftTarget,
      'rekan',
    );

    let offShiftPemohon: number | null = null;
    let offShiftTarget: number | null = null;
    if (dto.jenisPertukaran === 'off') {
      const [targetOnPemohonDate, pemohonOnTargetDate] = await Promise.all([
        this.jadwalRepo.findOne({
          where: {
            idKaryawan: dto.idKaryawanTarget,
            tanggal: tanggalPemohon as any,
          },
        }),
        this.jadwalRepo.findOne({
          where: {
            idKaryawan: idKaryawanPemohon,
            tanggal: tanggalTarget as any,
          },
        }),
      ]);
      this.validateClaimedSchedule(
        targetOnPemohonDate,
        'work',
        undefined,
        'rekan',
      );
      this.validateClaimedSchedule(
        pemohonOnTargetDate,
        'work',
        undefined,
        'pemohon',
      );
      offShiftTarget = targetOnPemohonDate!.idShift;
      offShiftPemohon = pemohonOnTargetDate!.idShift;
    }

    const activeConflict = await this.pertukaranRepo
      .createQueryBuilder('p')
      .where("p.status IN ('menunggu_rekan', 'menunggu_spv', 'menunggu_hrd')")
      .andWhere(
        '(p.id_karyawan_pemohon IN (:...employees) OR p.id_karyawan_target IN (:...employees))',
        { employees: [idKaryawanPemohon, dto.idKaryawanTarget] },
      )
      .andWhere(
        '(p.tanggal_pemohon IN (:...dates) OR p.tanggal_target IN (:...dates))',
        { dates: [tanggalPemohon, tanggalTarget] },
      )
      .getOne();
    if (activeConflict) {
      throw new BadRequestException(
        'Salah satu karyawan sudah memiliki pengajuan pertukaran aktif pada tanggal tersebut',
      );
    }

    // Aturan khusus:
    // - Shift: Bisa ditukar beberapa kali dalam sebulan tanpa batasan (1 hari per penukaran).
    // - Off: Dibatasi maksimal 1 kali dalam sebulan.
    if (dto.jenisPertukaran === 'off') {
      const monthPemohon = dto.tanggalPemohon.slice(0, 7);
      const pemohonQuota = await this.countOffExchangesInMonth(
        idKaryawanPemohon,
        monthPemohon,
      );
      if (pemohonQuota >= 1) {
        throw new BadRequestException(
          `Anda sudah menggunakan kuota penukaran hari off untuk bulan ${monthPemohon} (maksimal 1 kali penukaran off dalam sebulan).`,
        );
      }

      const monthTarget = dto.tanggalTarget.slice(0, 7);
      const targetQuota = await this.countOffExchangesInMonth(
        dto.idKaryawanTarget,
        monthTarget,
      );
      if (targetQuota >= 1) {
        throw new BadRequestException(
          `Rekan kerja (${target.nama}) sudah menggunakan kuota penukaran hari off untuk bulan ${monthTarget} (maksimal 1 kali penukaran off dalam sebulan).`,
        );
      }
    }

    const entity = this.pertukaranRepo.create({
      idKaryawanPemohon,
      idKaryawanTarget: dto.idKaryawanTarget,
      jenisPertukaran: dto.jenisPertukaran,
      tanggalPemohon,
      idShiftPemohon: dto.idShiftPemohon || offShiftPemohon,
      tanggalTarget,
      idShiftTarget: dto.idShiftTarget || offShiftTarget,
      alasan: dto.alasan || null,
      status: 'menunggu_rekan',
    });

    const saved = await this.pertukaranRepo.save(entity);

    // Kirim notifikasi ke HP rekan tujuan
    try {
      const jenisStr =
        dto.jenisPertukaran === 'shift' ? 'Shift Kerja' : 'Hari Libur (Off)';
      await this.notificationService.createNotification({
        idKaryawan: dto.idKaryawanTarget,
        title: 'Permintaan Pertukaran Jadwal',
        message: `${pemohon.nama} mengajak Anda bertukar ${jenisStr} untuk tanggal ${dto.tanggalTarget}. Mohon periksa dan berikan konfirmasi Anda.`,
        type: 'pertukaran_jadwal',
      });
    } catch (err) {
      console.error('Failed to send notification to target employee:', err);
    }

    return this.findOne(saved.idPertukaran);
  }

  private validateClaimedSchedule(
    jadwal: JadwalKerja | null,
    expected: 'work' | 'off',
    claimedShiftId: number | undefined,
    owner: string,
  ) {
    if (!jadwal) {
      throw new BadRequestException(
        `Jadwal nyata ${owner} belum tersedia pada tanggal yang dipilih`,
      );
    }
    const protectedHoliday =
      jadwal.isLibur &&
      /libur nasional|cuti bersama/i.test(jadwal.keterangan || '');
    if (
      jadwal.isCuti ||
      jadwal.sumberUpload === 'regular_off' ||
      protectedHoliday
    ) {
      throw new BadRequestException(
        `Jadwal ${owner} bentrok dengan cuti atau Regular Off`,
      );
    }
    const isOff = jadwal.isLibur || !jadwal.idShift;
    if (expected === 'off' && !isOff) {
      throw new BadRequestException(
        `Jadwal ${owner} bukan hari off pada tanggal yang dipilih`,
      );
    }
    if (expected === 'work' && isOff) {
      throw new BadRequestException(
        `Jadwal ${owner} adalah hari libur pada tanggal yang dipilih`,
      );
    }
    if (claimedShiftId !== undefined && jadwal.idShift !== claimedShiftId) {
      throw new BadRequestException(
        `Shift ${owner} tidak sesuai dengan jadwal tersimpan`,
      );
    }
  }

  /**
   * Mengambil daftar shift yang relevan untuk karyawan mobile (hanya departemen pemohon atau shift umum)
   */
  async getShiftsForMobile(idKaryawan: number) {
    const pemohon = await this.karyawanRepo.findOne({
      where: { idKaryawan },
      relations: { departemen: { pengelola: true } },
    });
    if (!pemohon) {
      throw new NotFoundException('Data karyawan tidak ditemukan');
    }
    this.validateKaryawanOperasional(pemohon);

    const shifts = await this.shiftRepo.find({
      order: { jamMulai: 'ASC' },
    });

    return shifts.filter((s) => {
      const name = (s.namaShift || '').toLowerCase();
      // Shift jam kerja kantor/reguler/default tidak boleh muncul untuk pertukaran shift operasional
      if (
        name.includes('default') ||
        name.includes('reguler') ||
        name.includes('kantor') ||
        name.includes('office')
      ) {
        return false;
      }

      // Jika shift di-assign khusus untuk departemen tertentu, harus sama dengan departemen pemohon
      if (s.idDepartemen && s.idDepartemen !== pemohon.idDepartemen) {
        return false;
      }

      return true;
    });
  }

  /**
   * Mengambil daftar rekan sebidang yang memiliki shift / off yang dicari pada tanggal target
   */
  async getAvailablePeers(
    idKaryawanPemohon: number,
    tanggalTarget: string,
    jenisPertukaran: 'shift' | 'off',
    idShiftTarget?: number,
  ) {
    const pemohon = await this.karyawanRepo.findOne({
      where: { idKaryawan: idKaryawanPemohon },
      relations: { departemen: { pengelola: true } },
    });
    if (!pemohon || !pemohon.idDepartemen) {
      return [];
    }
    try {
      this.validateKaryawanOperasional(pemohon);
    } catch {
      return [];
    }

    // Ambil rekan sebidang yang aktif
    const peers = await this.karyawanRepo.find({
      where: {
        idDepartemen: pemohon.idDepartemen,
        statusAktif: 'aktif',
      },
      relations: { jabatan: true },
    });

    const otherPeers = peers.filter((p) => p.idKaryawan !== idKaryawanPemohon);
    if (otherPeers.length === 0) return [];

    // Jika pertukaran off, cek kuota pemohon terlebih dahulu
    if (jenisPertukaran === 'off') {
      const ym = tanggalTarget.slice(0, 7);
      const pemohonQuota = await this.countOffExchangesInMonth(
        idKaryawanPemohon,
        ym,
      );
      if (pemohonQuota >= 1) {
        throw new BadRequestException(
          `Anda sudah menggunakan kuota penukaran hari off untuk bulan ${ym} (maksimal 1 kali penukaran off dalam sebulan).`,
        );
      }
    }

    const dateObj = new Date(tanggalTarget);
    const dayNames = [
      'Minggu',
      'Senin',
      'Selasa',
      'Rabu',
      'Kamis',
      'Jumat',
      'Sabtu',
    ];
    const targetDayName = dayNames[dateObj.getDay()];

    const results: {
      idKaryawan: number;
      nama: string;
      nik: string;
      jabatan?: string;
      fotoProfil?: string;
      currentShift?: { idShift: number; namaShift: string; jam: string } | null;
      isOff: boolean;
      statusLabel: string;
    }[] = [];

    for (const peer of otherPeers) {
      const jadwal = await this.jadwalRepo.findOne({
        where: {
          idKaryawan: peer.idKaryawan,
          tanggal: tanggalTarget as any,
        },
        relations: { shift: true },
      });

      let isOff = false;
      let currentShift: {
        idShift: number;
        namaShift: string;
        jam: string;
      } | null = null;

      if (jadwal) {
        if (jadwal.isCuti) {
          // Karyawan sedang cuti pada hari itu, tidak bisa diajak tukar
          continue;
        } else if (jadwal.isLibur || !jadwal.idShift) {
          isOff = true;
        } else if (jadwal.shift) {
          currentShift = {
            idShift: jadwal.shift.idShift,
            namaShift: jadwal.shift.namaShift,
            jam: `${jadwal.shift.jamMulai?.slice(0, 5)} - ${jadwal.shift.jamSelesai?.slice(0, 5)}`,
          };
        }
      } else {
        // Jika belum ada jadwal tersimpan manual, cek default hari libur rutin
        const peerOffDay = peer.hariLibur?.trim() || 'Minggu';
        if (peerOffDay.toLowerCase() === targetDayName.toLowerCase()) {
          isOff = true;
        }
      }

      // Filter berdasarkan jenis pertukaran
      if (jenisPertukaran === 'off') {
        if (isOff) {
          const ym = tanggalTarget.slice(0, 7);
          const peerQuota = await this.countOffExchangesInMonth(
            peer.idKaryawan,
            ym,
          );
          if (peerQuota >= 1) {
            // Rekan kerja ini sudah mencapai kuota 1x penukaran off pada bulan ini
            continue;
          }

          results.push({
            idKaryawan: peer.idKaryawan,
            nama: peer.nama,
            nik: peer.nik,
            jabatan: peer.jabatan?.namaJabatan,
            fotoProfil: peer.fotoProfil,
            currentShift: null,
            isOff: true,
            statusLabel: 'Hari Libur (Off)',
          });
        }
      } else {
        // Pertukaran shift
        if (!isOff && currentShift) {
          if (!idShiftTarget || currentShift.idShift === idShiftTarget) {
            results.push({
              idKaryawan: peer.idKaryawan,
              nama: peer.nama,
              nik: peer.nik,
              jabatan: peer.jabatan?.namaJabatan,
              fotoProfil: peer.fotoProfil,
              currentShift,
              isOff: false,
              statusLabel: `${currentShift.namaShift} (${currentShift.jam})`,
            });
          }
        }
      }
    }

    return results;
  }

  /**
   * Rekan kerja tujuan menerima / menolak permintaan pertukaran
   */
  async respondPeer(
    idPertukaran: number,
    idKaryawanTarget: number,
    dto: RespondPeerDto,
  ): Promise<PengajuanPertukaran> {
    const pertukaran = await this.findOne(idPertukaran);

    if (pertukaran.idKaryawanTarget !== idKaryawanTarget) {
      throw new ForbiddenException(
        'Anda tidak berhak menanggapi pengajuan pertukaran ini',
      );
    }

    if (pertukaran.status !== 'menunggu_rekan') {
      throw new BadRequestException(
        `Pengajuan ini tidak dapat ditanggapi karena status saat ini adalah "${pertukaran.status}"`,
      );
    }

    pertukaran.catatanRekan = dto.catatan || null;

    const isApproved = dto.setuju === true || dto.status === 'disetujui';

    if (isApproved) {
      pertukaran.status = 'menunggu_spv';
      await this.pertukaranRepo.save(pertukaran);

      // Notifikasi ke pemohon
      try {
        await this.notificationService.createNotification({
          idKaryawan: pertukaran.idKaryawanPemohon,
          title: 'Permintaan Tukar Disetujui Rekan',
          message: `${pertukaran.karyawanTarget?.nama} telah menyetujui permintaan tukar jadwal Anda. Pengajuan diteruskan ke Supervisor untuk persetujuan.`,
          type: 'pertukaran_jadwal',
        });

        // Notifikasi ke SPV departemen
        const spvUsers = await this.userRepo.find({
          where: {
            role: 'SPV',
            idDepartemen: pertukaran.karyawanPemohon?.idDepartemen,
          },
        });
        for (const spv of spvUsers) {
          await this.notificationService.createNotification({
            idUser: spv.idUser,
            title: 'Pengajuan Tukar Jadwal Menunggu Persetujuan',
            message: `${pertukaran.karyawanPemohon?.nama} dan ${pertukaran.karyawanTarget?.nama} mengajukan pertukaran ${pertukaran.jenisPertukaran} dan memerlukan persetujuan Anda.`,
            type: 'pertukaran_jadwal',
          });
        }
      } catch (err) {
        console.error('Failed to send notification after peer approval:', err);
      }
    } else {
      pertukaran.status = 'ditolak_rekan';
      await this.pertukaranRepo.save(pertukaran);

      // Notifikasi ke pemohon
      try {
        await this.notificationService.createNotification({
          idKaryawan: pertukaran.idKaryawanPemohon,
          title: 'Permintaan Tukar Ditolak Rekan',
          message: `${pertukaran.karyawanTarget?.nama} menolak permintaan tukar jadwal Anda.${dto.catatan ? ` Alasan: "${dto.catatan}"` : ''}`,
          type: 'pertukaran_jadwal',
        });
      } catch (err) {
        console.error('Failed to send notification after peer rejection:', err);
      }
    }

    return this.findOne(idPertukaran);
  }

  /**
   * Persetujuan oleh Supervisor (SPV)
   */
  async respondSpv(
    idPertukaran: number,
    userSpv: { idUser: number; role: string; idDepartemen?: number },
    dto: RespondApprovalDto,
  ): Promise<PengajuanPertukaran> {
    const pertukaran = await this.findOne(idPertukaran);

    if (pertukaran.status !== 'menunggu_spv') {
      throw new BadRequestException(
        `Pengajuan tidak dapat diproses oleh SPV karena status saat ini adalah "${pertukaran.status}"`,
      );
    }

    if (
      userSpv.role === 'SPV' &&
      (!userSpv.idDepartemen ||
        pertukaran.karyawanPemohon?.idDepartemen !== userSpv.idDepartemen ||
        pertukaran.karyawanTarget?.idDepartemen !== userSpv.idDepartemen)
    ) {
      throw new ForbiddenException(
        'Anda hanya dapat memproses pertukaran karyawan di departemen Anda sendiri',
      );
    }

    pertukaran.idUserSpv = userSpv.idUser;
    pertukaran.catatanSpv = dto.catatan || null;

    const isApproved = dto.setuju === true || dto.status === 'disetujui';

    if (isApproved) {
      pertukaran.status = 'menunggu_hrd';
      await this.pertukaranRepo.save(pertukaran);

      // Notifikasi ke HRD
      try {
        const hrdUsers = await this.userRepo.find({
          where: [{ role: 'HRD' }, { role: 'Admin' }],
        });
        for (const hrd of hrdUsers) {
          await this.notificationService.createNotification({
            idUser: hrd.idUser,
            title: 'Persetujuan Akhir Pertukaran Jadwal (HRD)',
            message: `Pertukaran jadwal ${pertukaran.karyawanPemohon?.nama} & ${pertukaran.karyawanTarget?.nama} telah disetujui SPV dan menunggu verifikasi akhir HRD.`,
            type: 'pertukaran_jadwal',
          });
        }
      } catch (err) {
        console.error('Failed to notify HRD after SPV approval:', err);
      }
    } else {
      pertukaran.status = 'ditolak_spv';
      await this.pertukaranRepo.save(pertukaran);

      try {
        await this.notificationService.createNotification({
          idKaryawan: pertukaran.idKaryawanPemohon,
          title: 'Tukar Jadwal Ditolak SPV',
          message: `Pengajuan tukar jadwal Anda dengan ${pertukaran.karyawanTarget?.nama} ditolak oleh Supervisor.${dto.catatan ? ` Catatan: "${dto.catatan}"` : ''}`,
          type: 'pertukaran_jadwal',
        });
        await this.notificationService.createNotification({
          idKaryawan: pertukaran.idKaryawanTarget,
          title: 'Tukar Jadwal Ditolak SPV',
          message: `Pertukaran jadwal Anda dengan ${pertukaran.karyawanPemohon?.nama} ditolak oleh Supervisor.`,
          type: 'pertukaran_jadwal',
        });
      } catch (err) {
        console.error('Failed to send rejection notification:', err);
      }
    }

    return this.findOne(idPertukaran);
  }

  /**
   * Persetujuan Akhir oleh HRD: Jika disetujui, JADWAL DI DATABASE LANGSUNG DIUPDATE OTOMATIS!
   */
  async respondHrd(
    idPertukaran: number,
    userHrd: { idUser: number; role: string },
    dto: RespondApprovalDto,
  ): Promise<PengajuanPertukaran> {
    const isApproved = dto.setuju === true || dto.status === 'disetujui';
    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(PengajuanPertukaran);
      const item = await repo
        .createQueryBuilder('pertukaran')
        .setLock('pessimistic_write')
        .where('pertukaran.id_pertukaran = :idPertukaran', { idPertukaran })
        .getOne();
      if (!item) {
        throw new NotFoundException(
          `Pengajuan pertukaran ID ${idPertukaran} tidak ditemukan`,
        );
      }
      if (item.status !== 'menunggu_hrd') {
        throw new BadRequestException(
          `Pengajuan tidak dapat diproses oleh HRD karena status saat ini adalah "${item.status}"`,
        );
      }
      item.idUserHrd = userHrd.idUser;
      item.catatanHrd = dto.catatan || null;
      item.status = isApproved ? 'disetujui' : 'ditolak_hrd';
      if (isApproved) {
        await this.revalidateSchedulesForApproval(item, manager);
        await this.executeScheduleSwap(item, userHrd.idUser, manager);
      }
      await repo.save(item);
      return item;
    });
    const result = await this.findOne(idPertukaran);

    if (isApproved) {
      // Notifikasi ke kedua karyawan
      try {
        await this.notificationService.createNotification({
          idKaryawan: result.idKaryawanPemohon,
          title: '🎉 Pertukaran Jadwal Telah Disetujui HRD',
          message: `Pengajuan pertukaran ${result.jenisPertukaran} Anda dengan ${result.karyawanTarget?.nama} telah resmi disetujui HRD. Jadwal kerja Anda telah diperbarui.`,
          type: 'pertukaran_jadwal',
        });
        await this.notificationService.createNotification({
          idKaryawan: result.idKaryawanTarget,
          title: '🎉 Pertukaran Jadwal Telah Disetujui HRD',
          message: `Pertukaran ${result.jenisPertukaran} Anda dengan ${result.karyawanPemohon?.nama} telah resmi disetujui HRD. Jadwal kerja Anda telah diperbarui.`,
          type: 'pertukaran_jadwal',
        });
      } catch (err) {
        console.error('Failed to send final approval notification:', err);
      }
    } else {
      try {
        await this.notificationService.createNotification({
          idKaryawan: result.idKaryawanPemohon,
          title: 'Tukar Jadwal Ditolak HRD',
          message: `Pengajuan tukar jadwal Anda dengan ${result.karyawanTarget?.nama} ditolak oleh HRD.${dto.catatan ? ` Catatan: "${dto.catatan}"` : ''}`,
          type: 'pertukaran_jadwal',
        });
        await this.notificationService.createNotification({
          idKaryawan: result.idKaryawanTarget,
          title: 'Tukar Jadwal Ditolak HRD',
          message: `Pertukaran jadwal Anda dengan ${result.karyawanPemohon?.nama} ditolak oleh HRD.`,
          type: 'pertukaran_jadwal',
        });
      } catch (err) {
        console.error('Failed to send final rejection notification:', err);
      }
    }

    return result;
  }

  private async revalidateSchedulesForApproval(
    item: PengajuanPertukaran,
    manager: EntityManager,
  ) {
    const repo = manager.getRepository(JadwalKerja);
    const load = (idKaryawan: number, tanggal: string) =>
      repo
        .createQueryBuilder('jadwal')
        .setLock('pessimistic_write')
        .where('jadwal.id_karyawan = :idKaryawan', { idKaryawan })
        .andWhere('jadwal.tanggal = :tanggal', { tanggal })
        .getOne();
    const tanggalPemohon = normalizeDateOnly(item.tanggalPemohon);
    const tanggalTarget = normalizeDateOnly(item.tanggalTarget);
    const pemohonOwn = await load(item.idKaryawanPemohon, tanggalPemohon);
    const targetOwn = await load(item.idKaryawanTarget, tanggalTarget);
    if (item.jenisPertukaran === 'shift') {
      this.validateClaimedSchedule(
        pemohonOwn,
        'work',
        item.idShiftPemohon ?? undefined,
        'pemohon',
      );
      this.validateClaimedSchedule(
        targetOwn,
        'work',
        item.idShiftTarget ?? undefined,
        'rekan',
      );
      return;
    }
    const targetCross = await load(item.idKaryawanTarget, tanggalPemohon);
    const pemohonCross = await load(item.idKaryawanPemohon, tanggalTarget);
    this.validateClaimedSchedule(pemohonOwn, 'off', undefined, 'pemohon');
    this.validateClaimedSchedule(targetOwn, 'off', undefined, 'rekan');
    this.validateClaimedSchedule(
      targetCross,
      'work',
      item.idShiftTarget ?? undefined,
      'rekan',
    );
    this.validateClaimedSchedule(
      pemohonCross,
      'work',
      item.idShiftPemohon ?? undefined,
      'pemohon',
    );
  }

  /**
   * Logika Eksekusi Pertukaran Jadwal di Tabel jadwal_kerja
   */
  private async executeScheduleSwap(
    item: PengajuanPertukaran,
    idUserApprover: number,
    manager: EntityManager,
  ) {
    const pemohon = item.karyawanPemohon;
    const target = item.karyawanTarget;

    const tglPemohon =
      typeof item.tanggalPemohon === 'string'
        ? item.tanggalPemohon
        : (item.tanggalPemohon as any).toISOString().slice(0, 10);
    const tglTarget =
      typeof item.tanggalTarget === 'string'
        ? item.tanggalTarget
        : (item.tanggalTarget as any).toISOString().slice(0, 10);

    if (item.jenisPertukaran === 'shift') {
      // Pertukaran Shift: Keduanya tetap bekerja dan berganti shift (tidak ada yang libur)
      // 1. Pemohon mendapatkan shift baru yang diinginkan di tanggal jadwalnya (misal dari Siang ke Pagi)
      await this.setOrCreateJadwal(
        item.idKaryawanPemohon,
        tglPemohon,
        item.idShiftTarget || null,
        false,
        `Tukar shift dg ${target?.nama || 'rekan'}`,
        idUserApprover,
        manager,
      );

      // 2. Rekan target mendapatkan shift yang ditukarkan pemohon di tanggal jadwal target
      await this.setOrCreateJadwal(
        item.idKaryawanTarget,
        tglTarget,
        item.idShiftPemohon || null,
        false,
        `Tukar shift dg ${pemohon?.nama || 'rekan'}`,
        idUserApprover,
        manager,
      );
    } else if (item.jenisPertukaran === 'off') {
      const shiftPemohon = item.idShiftPemohon || item.idShiftTarget;
      const shiftTarget = item.idShiftTarget || item.idShiftPemohon;
      if (!shiftPemohon || !shiftTarget) {
        throw new BadRequestException(
          'Shift kerja untuk pertukaran off tidak ditemukan. Periksa jadwal kedua karyawan sebelum menyetujui.',
        );
      }

      // Pertukaran Hari Libur (Off):
      // Tanggal Pemohon:
      // - Pemohon sekarang Masuk (mengambil shift target/pemohon)
      await this.setOrCreateJadwal(
        item.idKaryawanPemohon,
        tglPemohon,
        shiftTarget,
        false,
        `Masuk (Tukar Off dg ${target?.nama || 'rekan'})`,
        idUserApprover,
        manager,
      );
      // - Target sekarang Libur di tanggal pemohon
      await this.setOrCreateJadwal(
        item.idKaryawanTarget,
        tglPemohon,
        null,
        true,
        `Libur Off (Tukar Off dg ${pemohon?.nama || 'rekan'})`,
        idUserApprover,
        manager,
      );

      // Jika tanggal berbeda, pada tanggalTarget:
      if (tglPemohon !== tglTarget) {
        // - Pemohon sekarang Libur di tanggal target
        await this.setOrCreateJadwal(
          item.idKaryawanPemohon,
          tglTarget,
          null,
          true,
          `Libur Off (Tukar Off dg ${target?.nama || 'rekan'})`,
          idUserApprover,
          manager,
        );
        // - Target sekarang Masuk di tanggal target
        await this.setOrCreateJadwal(
          item.idKaryawanTarget,
          tglTarget,
          shiftPemohon,
          false,
          `Masuk (Tukar Off dg ${pemohon?.nama || 'rekan'})`,
          idUserApprover,
          manager,
        );
      }
    }
  }

  /**
   * Helper untuk menyimpan atau mengupdate jadwal kerja secara pasti menggunakan QueryBuilder
   * (menghindari issue TypeORM eager relation caching pada .save())
   */
  private async setOrCreateJadwal(
    idKaryawan: number,
    tanggal: string,
    idShift: number | null,
    isLibur: boolean,
    keterangan: string,
    idUserApprover: number,
    manager: EntityManager,
  ) {
    const jadwalRepo = manager.getRepository(JadwalKerja);
    const existing = await jadwalRepo
      .createQueryBuilder('jadwal')
      .setLock('pessimistic_write')
      .where('jadwal.id_karyawan = :idKaryawan', { idKaryawan })
      .andWhere('jadwal.tanggal = :tanggal', { tanggal })
      .getOne();

    if (!existing) {
      const created = jadwalRepo.create({
        idKaryawan,
        tanggal: tanggal as any,
        idShift: idShift || (null as any),
        isLibur,
        isCuti: false,
        keterangan,
        idUser: idUserApprover,
        sumberUpload: 'pertukaran_jadwal',
      });
      await jadwalRepo.save(created);
    } else {
      await jadwalRepo
        .createQueryBuilder()
        .update(JadwalKerja)
        .set({
          idShift: idShift || null,
          isLibur,
          isCuti: false,
          keterangan,
          idUser: idUserApprover,
          sumberUpload: 'pertukaran_jadwal',
        })
        .where('id_jadwal = :idJadwal', { idJadwal: existing.idJadwal })
        .execute();
    }
  }

  /**
   * Mengambil semua pengajuan pertukaran milik karyawan yang login (baik sebagai pemohon maupun rekan target)
   */
  async findMyRequests(idKaryawan: number): Promise<PengajuanPertukaran[]> {
    return this.pertukaranRepo.find({
      where: [
        { idKaryawanPemohon: idKaryawan },
        { idKaryawanTarget: idKaryawan },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Mengambil pengajuan pertukaran yang ditujukan ke karyawan yang login dan butuh konfirmasi
   */
  async findIncomingRequests(
    idKaryawan: number,
  ): Promise<PengajuanPertukaran[]> {
    return this.pertukaranRepo.find({
      where: {
        idKaryawanTarget: idKaryawan,
        status: 'menunggu_rekan',
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Cari berdasarkan ID
   */
  async findOne(id: number, idKaryawan?: number): Promise<PengajuanPertukaran> {
    const item = await this.pertukaranRepo.findOne({
      where: { idPertukaran: id },
      relations: {
        karyawanPemohon: { departemen: true, jabatan: true },
        karyawanTarget: { departemen: true, jabatan: true },
        shiftPemohon: true,
        shiftTarget: true,
        userSpv: true,
        userHrd: true,
      },
    });
    if (!item) {
      throw new NotFoundException(
        `Pengajuan pertukaran ID ${id} tidak ditemukan`,
      );
    }
    if (
      idKaryawan !== undefined &&
      item.idKaryawanPemohon !== idKaryawan &&
      item.idKaryawanTarget !== idKaryawan
    ) {
      throw new ForbiddenException(
        'Anda tidak memiliki akses ke pengajuan pertukaran ini',
      );
    }
    return item;
  }

  /**
   * Ambil semua untuk SPV / HRD / Admin
   */
  async findAll(user: {
    role: string;
    idDepartemen?: number;
  }): Promise<PengajuanPertukaran[]> {
    const qb = this.pertukaranRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.karyawanPemohon', 'pemohon')
      .leftJoinAndSelect('pemohon.departemen', 'deptPemohon')
      .leftJoinAndSelect('pemohon.jabatan', 'jabPemohon')
      .leftJoinAndSelect('p.karyawanTarget', 'target')
      .leftJoinAndSelect('target.departemen', 'deptTarget')
      .leftJoinAndSelect('target.jabatan', 'jabTarget')
      .leftJoinAndSelect('p.shiftPemohon', 'shiftPemohon')
      .leftJoinAndSelect('p.shiftTarget', 'shiftTarget')
      .leftJoinAndSelect('p.userSpv', 'userSpv')
      .leftJoinAndSelect('p.userHrd', 'userHrd')
      .orderBy('p.createdAt', 'DESC');

    if (user.role === 'SPV') {
      if (!user.idDepartemen) return [];
      qb.andWhere('pemohon.idDepartemen = :idDept', {
        idDept: user.idDepartemen,
      });
    }

    return qb.getMany();
  }
}
