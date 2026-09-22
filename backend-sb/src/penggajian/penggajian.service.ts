import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import { Penggajian } from './entities/penggajian.entity.js';
import { PengajuanIzin } from '../pengajuan-izin/entities/pengajuan-izin.entity.js';
import { KaryawanService } from '../karyawan/karyawan.service.js';
import { AbsensiService } from '../absensi/absensi.service.js';
import { JadwalKerjaService } from '../jadwal-kerja/jadwal-kerja.service.js';
import { UpdatePenggajianDto } from './dto/update-penggajian.dto.js';

import { PengaturanPenggajian } from './entities/pengaturan-penggajian.entity.js';
import { UpdatePengaturanPenggajianDto } from './dto/update-pengaturan-penggajian.dto.js';
import {
  BUSINESS_TIME_ZONE,
  businessDateOf,
  businessDayRange,
  dateRange,
  isSunday,
  normalizeDateOnly,
} from '../common/utils/business-date.util.js';

function calendarDate(year: number, monthIndex: number, day: number): string {
  const normalized = new Date(Date.UTC(year, monthIndex, 1));
  const lastDay = new Date(
    Date.UTC(normalized.getUTCFullYear(), normalized.getUTCMonth() + 1, 0),
  ).getUTCDate();
  return `${normalized.getUTCFullYear()}-${String(normalized.getUTCMonth() + 1).padStart(2, '0')}-${String(Math.min(day, lastDay)).padStart(2, '0')}`;
}

function countNonSundayOverlap(
  start: string | Date,
  end: string | Date,
  periodStart: string,
  periodEnd: string,
): number {
  const overlapStart =
    normalizeDateOnly(start) < periodStart
      ? periodStart
      : normalizeDateOnly(start);
  const overlapEnd =
    normalizeDateOnly(end) > periodEnd ? periodEnd : normalizeDateOnly(end);
  if (overlapStart > overlapEnd) return 0;
  return dateRange(overlapStart, overlapEnd).filter((date) => !isSunday(date))
    .length;
}

@Injectable()
export class PenggajianService {
  constructor(
    @InjectRepository(Penggajian)
    private readonly penggajianRepo: Repository<Penggajian>,
    @InjectRepository(PengaturanPenggajian)
    private readonly pengaturanRepo: Repository<PengaturanPenggajian>,
    @InjectRepository(PengajuanIzin)
    private readonly pengajuanIzinRepo: Repository<PengajuanIzin>,
    private readonly karyawanService: KaryawanService,
    private readonly absensiService: AbsensiService,
    private readonly jadwalKerjaService: JadwalKerjaService,
  ) {}

  /**
   * Menghitung total hari kerja kalender dalam rentang tanggal (Senin s/d Sabtu, non-Minggu).
   */
  hitungHariKerjaKalender(
    startDate: string | Date,
    endDate: string | Date,
  ): number {
    const days = dateRange(
      normalizeDateOnly(startDate),
      normalizeDateOnly(endDate),
    ).filter((date) => !isSunday(date)).length;
    return days > 0 ? days : 26;
  }

  async generate(
    periodeAwal: string,
    periodeAkhir: string,
    potonganGlobal?: number,
    dendaPerTelatCustom?: number,
    totalHariKerjaCustom?: number,
  ): Promise<Penggajian[]> {
    const periodeAwalStr = normalizeDateOnly(periodeAwal);
    const periodeAkhirStr = normalizeDateOnly(periodeAkhir);
    const { start: startDate, end: endDate } = businessDayRange(
      periodeAwalStr,
      periodeAkhirStr,
    );
    const paidPayroll = await this.penggajianRepo.findOne({
      where: {
        periodeAwal: periodeAwalStr as any,
        periodeAkhir: periodeAkhirStr as any,
        tanggalBayar: Not(IsNull()),
      },
      relations: { karyawan: true },
    });
    if (paidPayroll) {
      throw new BadRequestException(
        `Payroll periode ${periodeAwal} s/d ${periodeAkhir} sudah difinalisasi/dibayar${paidPayroll.karyawan?.nama ? ` untuk ${paidPayroll.karyawan.nama}` : ''} dan tidak dapat dihitung ulang.`,
      );
    }

    const settings = await this.getSettings();
    const tarifDenda =
      dendaPerTelatCustom !== undefined && !isNaN(Number(dendaPerTelatCustom))
        ? Number(dendaPerTelatCustom)
        : Number(settings?.dendaPerTelatDefault ?? 20000);

    // Hitung hari kerja dinamis kalender periode cut-off (Senin s/d Sabtu)
    const dynamicWorkingDays = this.hitungHariKerjaKalender(
      periodeAwalStr,
      periodeAkhirStr,
    );
    const normalizedTotalHariKerjaCustom = Number(totalHariKerjaCustom);
    const hasValidTotalHariKerjaCustom =
      totalHariKerjaCustom !== undefined &&
      Number.isFinite(normalizedTotalHariKerjaCustom) &&
      Number.isInteger(normalizedTotalHariKerjaCustom) &&
      normalizedTotalHariKerjaCustom > 0;

    // Prioritas hari kerja dasar:
    // 1. totalHariKerjaCustom (jika diisi / diubah oleh HRD di dialog)
    // 2. dynamicWorkingDays (metode hitung otomatis rentang tanggal, e.g. 25 Ags - 24 Sep = 27 hari, 25 Ags - 25 Sep = 28 hari)
    const baseTotalHariKerja = hasValidTotalHariKerjaCustom
      ? normalizedTotalHariKerjaCustom
      : dynamicWorkingDays;

    const karyawanList = await this.karyawanService.findAllAktif();
    const results: Penggajian[] = [];

    for (const karyawan of karyawanList) {
      // 1. Tentukan total hari kerja spesifik untuk karyawan:
      let totalHariKerja = baseTotalHariKerja;
      if (!hasValidTotalHariKerjaCustom) {
        try {
          const jadwalList =
            await this.jadwalKerjaService.findByKaryawanAndPeriode(
              karyawan.idKaryawan,
              periodeAwalStr,
              periodeAkhirStr,
            );
          if (jadwalList && jadwalList.length > 0) {
            const shiftHariKerja = jadwalList.filter((j) => !j.isLibur).length;
            if (shiftHariKerja > 0) {
              totalHariKerja = shiftHariKerja;
            } else {
              const explicitHariLibur = new Set(
                jadwalList
                  .filter((j) => j.isLibur && !isSunday(j.tanggal))
                  .map((j) => normalizeDateOnly(j.tanggal)),
              ).size;
              totalHariKerja = Math.max(
                baseTotalHariKerja - explicitHariLibur,
                1,
              );
            }
          }
        } catch (e) {
          // Fallback baseTotalHariKerja
        }
      }

      // 1b. Data absensi riil dari database
      const absensiList = await this.absensiService.findByKaryawanDanPeriode(
        karyawan.idKaryawan,
        startDate,
        endDate,
      );

      const attendedDates = new Set<string>();
      let totalJamKerja = 0;
      let lateCount = 0;
      let lateBreakCount = 0;

      for (const absensi of absensiList) {
        const status = (absensi.statusKehadiran || '').toLowerCase();
        // Hanya hitung kehadiran riil (tepat waktu atau telat), bukan izin/cuti/sakit/tidak hadir
        if (status === 'tepat waktu' || status === 'telat') {
          if (absensi.jamMasukAktual) {
            const dStr = businessDateOf(new Date(absensi.jamMasukAktual));
            attendedDates.add(dStr);
            const completedBreaks = (absensi.istirahat || []).filter(
              (istirahat) => !!istirahat.jamMasukIstirahat,
            );
            lateBreakCount += completedBreaks.filter(
              (istirahat) => (Number(istirahat.durasiMenit) || 0) > 60,
            ).length;

            if (absensi.jamKeluarAktual) {
              const diffMs =
                new Date(absensi.jamKeluarAktual).getTime() -
                new Date(absensi.jamMasukAktual).getTime();
              const completedBreakMinutes = completedBreaks.reduce(
                (sum, istirahat) => sum + (Number(istirahat.durasiMenit) || 0),
                0,
              );
              totalJamKerja += Math.max(
                0,
                diffMs / (1000 * 60 * 60) - completedBreakMinutes / 60,
              );
            }
          }
          if (status === 'telat') {
            lateCount++;
          }
        }
      }
      lateCount += lateBreakCount;

      // 2. Data izin sakit resmi (disetujui)
      // Catatan: Jika izin sakit dengan surat resmi, hanya tunjangan konsumsi yang dipotong.
      // Gaji pokok tetap dibayarkan.
      const izinSakitList = await this.pengajuanIzinRepo.find({
        where: {
          idKaryawan: karyawan.idKaryawan,
          jenisIzin: 'sakit',
          status: 'disetujui',
          tanggalMulai: LessThanOrEqual(periodeAkhirStr as any),
          tanggalSelesai: MoreThanOrEqual(periodeAwalStr as any),
        },
      });

      const hariSakitResmi = izinSakitList.reduce(
        (total, izin) =>
          total +
          countNonSundayOverlap(
            izin.tanggalMulai,
            izin.tanggalSelesai,
            periodeAwalStr,
            periodeAkhirStr,
          ),
        0,
      );

      // 2b. Data izin biasa (disetujui) -> Unpaid (potong gaji harian & uang makan)
      const izinList = await this.pengajuanIzinRepo.find({
        where: {
          idKaryawan: karyawan.idKaryawan,
          jenisIzin: 'izin',
          status: 'disetujui',
          tanggalMulai: LessThanOrEqual(periodeAkhirStr as any),
          tanggalSelesai: MoreThanOrEqual(periodeAwalStr as any),
        },
      });

      const hariIzin = izinList.reduce(
        (total, izin) =>
          total +
          countNonSundayOverlap(
            izin.tanggalMulai,
            izin.tanggalSelesai,
            periodeAwalStr,
            periodeAkhirStr,
          ),
        0,
      );

      // 3. Cuti berbayar (jika hakCuti aktif)
      const cutiList =
        await this.jadwalKerjaService.findCutiByKaryawanAndPeriode(
          karyawan.idKaryawan,
          periodeAwalStr,
          periodeAkhirStr,
        );
      const hariCuti = new Set(
        cutiList
          .map((cuti) => normalizeDateOnly(cuti.tanggal))
          .filter((date) => !isSunday(date)),
      ).size;
      if (karyawan.hakCuti) {
        totalJamKerja += hariCuti * 8;
      }

      const totalHariHadir = attendedDates.size;
      const hariDibayarGajiPokok = Math.min(
        totalHariKerja,
        totalHariHadir + hariSakitResmi + (karyawan.hakCuti ? hariCuti : 0),
      );
      const hariAlpa = Math.max(
        0,
        totalHariKerja -
          (totalHariHadir +
            hariSakitResmi +
            (karyawan.hakCuti ? hariCuti : 0) +
            hariIzin),
      );

      const gajiPokok = Number(karyawan.gajiPokok) || 0;
      // Gaji pokok dibayarkan penuh jika kehadiran + sakit resmi memenuhi total hari kerja
      const gajiPokokSesuaiHari =
        totalHariKerja > 0
          ? Math.round((hariDibayarGajiPokok / totalHariKerja) * gajiPokok)
          : gajiPokok;

      const tarifKonsumsiPerHari =
        Number(karyawan.tunjanganKonsumsiHari) || 20000;
      // Tunjangan konsumsi dihitung harian: tarif * kehadiran riil aktual
      const tunjanganKonsumsi = tarifKonsumsiPerHari * totalHariHadir;
      const tunjanganTransportasi = Number(karyawan.tunjanganTransportasi) || 0;
      const tunjanganKomunikasi = Number(karyawan.tunjanganKomunikasi) || 0;
      const tunjanganJabatan = Number(karyawan.tunjanganJabatan) || 0;
      const lembur = 0;

      let penggajian = await this.penggajianRepo.findOne({
        where: {
          idKaryawan: karyawan.idKaryawan,
          periodeAwal: periodeAwalStr as any,
          periodeAkhir: periodeAkhirStr as any,
        },
      });

      const totalPenghasilan =
        gajiPokokSesuaiHari +
        tunjanganKonsumsi +
        tunjanganTransportasi +
        tunjanganKomunikasi +
        tunjanganJabatan +
        lembur;

      const potonganBpjs = Number(karyawan.potonganBpjs) || 0;
      // Denda potongan terlambat otomatis dari riwayat absensi: menggunakan tarif dari pengaturan cut-off
      const potonganTerlambat = lateCount * tarifDenda;
      const potonganPinjaman = 0;
      const sisaPinjaman = 0;
      const potonganLainnya =
        potonganGlobal !== undefined && Number.isFinite(Number(potonganGlobal))
          ? Number(potonganGlobal)
          : Number(penggajian?.potonganLainnya || 0);

      const totalPotongan =
        potonganBpjs + potonganTerlambat + potonganPinjaman + potonganLainnya;
      const totalGaji = Math.max(totalPenghasilan - totalPotongan, 0);

      if (!penggajian) {
        penggajian = this.penggajianRepo.create({
          idKaryawan: karyawan.idKaryawan,
          periodeAwal: periodeAwalStr as any,
          periodeAkhir: periodeAkhirStr as any,
        });
      }

      penggajian.totalJamKerja = Math.round(totalJamKerja);
      penggajian.totalHariKerja = totalHariKerja;
      penggajian.totalHariHadir = totalHariHadir;
      penggajian.gajiPokok = gajiPokok;
      penggajian.gajiPokokSesuaiHari = gajiPokokSesuaiHari;
      penggajian.tarifKonsumsiPerHari = tarifKonsumsiPerHari;
      penggajian.tunjanganKonsumsi = tunjanganKonsumsi;
      penggajian.tunjanganTransportasi = tunjanganTransportasi;
      penggajian.tunjanganKomunikasi = tunjanganKomunikasi;
      penggajian.tunjanganJabatan = tunjanganJabatan;
      penggajian.lembur = lembur;
      penggajian.totalPenghasilan = totalPenghasilan;
      penggajian.potonganBpjs = potonganBpjs;
      penggajian.potonganTerlambat = potonganTerlambat;
      penggajian.potonganPinjaman = potonganPinjaman;
      penggajian.potonganLainnya = potonganLainnya;
      penggajian.sisaPinjaman = sisaPinjaman;
      penggajian.potongan = totalPotongan;
      penggajian.totalGaji = totalGaji;
      const detailKehadiran: string[] = [`${totalHariHadir} Hari Hadir Riil`];
      if (hariSakitResmi > 0) {
        detailKehadiran.push(
          `${hariSakitResmi} Hari Sakit (Gaji Pokok Tetap, Potong Uang Makan)`,
        );
      }
      if (hariIzin > 0) {
        detailKehadiran.push(
          `${hariIzin} Hari Izin (Potong Gaji & Uang Makan)`,
        );
      }
      if (hariAlpa > 0) {
        detailKehadiran.push(
          `${hariAlpa} Hari Tidak Masuk/Alpa (Potong Gaji & Uang Makan)`,
        );
      }
      if (karyawan.hakCuti && hariCuti > 0) {
        detailKehadiran.push(`${hariCuti} Hari Cuti Tahunan`);
      }
      if (lateCount > 0) {
        detailKehadiran.push(
          `${lateCount}x Terlambat (Denda Rp ${potonganTerlambat.toLocaleString('id-ID')})`,
        );
      }
      if (lateBreakCount > 0) {
        detailKehadiran.push(`${lateBreakCount}x Kembali Istirahat >60 Menit`);
      }

      penggajian.catatan = `Metode Penggajian CV Sukses Bangunindo (${totalHariKerja} Hari Kerja Periode): ${detailKehadiran.join(', ')}. Slip gaji bersifat rahasia.`;

      const saved = await this.penggajianRepo.save(penggajian);
      results.push(saved);
    }

    return results;
  }

  async update(id: number, dto: UpdatePenggajianDto): Promise<Penggajian> {
    const gaji = await this.findOne(id);
    if (gaji.tanggalBayar) {
      throw new BadRequestException(
        'Slip gaji yang sudah difinalisasi/dibayar tidak dapat dihitung ulang atau diubah.',
      );
    }

    if (dto.totalHariKerja !== undefined)
      gaji.totalHariKerja = Number(dto.totalHariKerja);
    if (dto.totalHariHadir !== undefined)
      gaji.totalHariHadir = Number(dto.totalHariHadir);
    if (dto.gajiPokok !== undefined) gaji.gajiPokok = Number(dto.gajiPokok);
    if (dto.gajiPokokSesuaiHari !== undefined)
      gaji.gajiPokokSesuaiHari = Number(dto.gajiPokokSesuaiHari);
    if (dto.tarifKonsumsiPerHari !== undefined)
      gaji.tarifKonsumsiPerHari = Number(dto.tarifKonsumsiPerHari);
    if (dto.tunjanganKonsumsi !== undefined)
      gaji.tunjanganKonsumsi = Number(dto.tunjanganKonsumsi);
    if (dto.tunjanganTransportasi !== undefined)
      gaji.tunjanganTransportasi = Number(dto.tunjanganTransportasi);
    if (dto.tunjanganKomunikasi !== undefined)
      gaji.tunjanganKomunikasi = Number(dto.tunjanganKomunikasi);
    if (dto.tunjanganJabatan !== undefined)
      gaji.tunjanganJabatan = Number(dto.tunjanganJabatan);
    if (dto.lembur !== undefined) gaji.lembur = Number(dto.lembur);
    if (dto.potonganBpjs !== undefined)
      gaji.potonganBpjs = Number(dto.potonganBpjs);
    if (dto.potonganTerlambat !== undefined)
      gaji.potonganTerlambat = Number(dto.potonganTerlambat);
    if (dto.potonganPinjaman !== undefined)
      gaji.potonganPinjaman = Number(dto.potonganPinjaman);
    if (dto.potonganLainnya !== undefined)
      gaji.potonganLainnya = Number(dto.potonganLainnya);
    if (dto.sisaPinjaman !== undefined)
      gaji.sisaPinjaman = Number(dto.sisaPinjaman);
    if (dto.tanggalBayar !== undefined)
      gaji.tanggalBayar = dto.tanggalBayar
        ? new Date(dto.tanggalBayar)
        : (null as any);
    if (dto.catatan !== undefined) gaji.catatan = dto.catatan;

    // Rekalkulasi total penghasilan
    gaji.totalPenghasilan =
      Number(gaji.gajiPokokSesuaiHari || 0) +
      Number(gaji.tunjanganKonsumsi || 0) +
      Number(gaji.tunjanganTransportasi || 0) +
      Number(gaji.tunjanganKomunikasi || 0) +
      Number(gaji.tunjanganJabatan || 0) +
      Number(gaji.lembur || 0);

    // Rekalkulasi total potongan
    const totalPotongan =
      Number(gaji.potonganBpjs || 0) +
      Number(gaji.potonganTerlambat || 0) +
      Number(gaji.potonganPinjaman || 0) +
      Number(gaji.potonganLainnya || 0);
    gaji.potongan = totalPotongan;

    // Rekalkulasi Take Home Pay
    gaji.totalGaji = Math.max(gaji.totalPenghasilan - totalPotongan, 0);

    return this.penggajianRepo.save(gaji);
  }

  async findAll(): Promise<Penggajian[]> {
    return this.penggajianRepo.find({
      relations: {
        karyawan: {
          departemen: true,
          jabatan: true,
        },
      },
      order: {
        idGaji: 'DESC',
      },
    });
  }

  async findOne(id: number): Promise<Penggajian> {
    const gaji = await this.penggajianRepo.findOne({
      where: { idGaji: id },
      relations: {
        karyawan: {
          departemen: true,
          jabatan: true,
        },
      },
    });
    if (!gaji) {
      throw new NotFoundException(`Penggajian dengan ID ${id} tidak ditemukan`);
    }
    return gaji;
  }

  async remove(id: number): Promise<void> {
    const gaji = await this.findOne(id);
    await this.penggajianRepo.remove(gaji);
  }

  /**
   * Mengambil pengaturan cut-off penggajian, denda telat, dan standar hari kerja.
   */
  async getSettings(): Promise<PengaturanPenggajian> {
    let settings = await this.pengaturanRepo.findOne({ where: {} });
    if (!settings) {
      settings = this.pengaturanRepo.create({
        tanggalCutOffMulai: 25,
        tanggalCutOffSelesai: 24,
        dendaPerTelatDefault: 20000,
        standarHariKerja: 26,
      });
      settings = await this.pengaturanRepo.save(settings);
    }
    return settings;
  }

  /**
   * Memperbarui pengaturan cut-off penggajian.
   */
  async updateSettings(
    dto: UpdatePengaturanPenggajianDto,
  ): Promise<PengaturanPenggajian> {
    const settings = await this.getSettings();
    if (dto.tanggalCutOffMulai !== undefined) {
      settings.tanggalCutOffMulai = dto.tanggalCutOffMulai;
    }
    if (dto.tanggalCutOffSelesai !== undefined) {
      settings.tanggalCutOffSelesai = dto.tanggalCutOffSelesai;
    }
    if (dto.dendaPerTelatDefault !== undefined) {
      settings.dendaPerTelatDefault = dto.dendaPerTelatDefault;
    }
    if (dto.standarHariKerja !== undefined) {
      settings.standarHariKerja = dto.standarHariKerja;
    }
    return this.pengaturanRepo.save(settings);
  }

  /**
   * Mengambil slip gaji real-time harian karyawan untuk mobile.
   * Karyawan dapat melihat kalkulasi gaji berjalan sampai hari ini,
   * termasuk deteksi keterlambatan & denda harian sebagai evaluasi.
   */
  async getMySlip(idKaryawan: number, tanggalQuery?: string) {
    const karyawan = await this.karyawanService.findOne(idKaryawan);
    if (!karyawan) {
      throw new NotFoundException('Data karyawan tidak ditemukan');
    }

    const settings = await this.getSettings();
    const startDay = settings.tanggalCutOffMulai || 25;
    const endDay = settings.tanggalCutOffSelesai || 24;
    const tarifDenda = Number(settings.dendaPerTelatDefault || 20000);

    const now = new Date();
    const refDateStr = tanggalQuery
      ? normalizeDateOnly(tanggalQuery)
      : businessDateOf(now);
    const [refYear, refMonth, refDay] = refDateStr.split('-').map(Number);

    let startY = refYear;
    let startM = refMonth - 1;
    let endY = refYear;
    let endM = refMonth - 1;

    if (refDay >= startDay) {
      endM = startM + 1;
      if (endM > 11) {
        endM = 0;
        endY++;
      }
    } else {
      startM = startM - 1;
      if (startM < 0) {
        startM = 11;
        startY--;
      }
    }

    const periodeAwalStr = calendarDate(startY, startM, startDay);
    const periodeAkhirStr = calendarDate(endY, endM, endDay);
    const { start: periodeAwalDate, end: periodeAkhirDate } = businessDayRange(
      periodeAwalStr,
      periodeAkhirStr,
    );

    // Hitung hari kerja dinamis berbasis kalender rentang cut-off (Senin s/d Sabtu)
    const dynamicWorkingDays = this.hitungHariKerjaKalender(
      periodeAwalStr,
      periodeAkhirStr,
    );
    let standarHariKerja = dynamicWorkingDays;

    try {
      const jadwalList = await this.jadwalKerjaService.findByKaryawanAndPeriode(
        idKaryawan,
        periodeAwalStr,
        periodeAkhirStr,
      );
      if (jadwalList && jadwalList.length > 0) {
        const shiftHariKerja = jadwalList.filter((j) => !j.isLibur).length;
        if (shiftHariKerja > 0) {
          standarHariKerja = shiftHariKerja;
        } else {
          const explicitHariLibur = new Set(
            jadwalList
              .filter((j) => j.isLibur && !isSunday(j.tanggal))
              .map((j) => normalizeDateOnly(j.tanggal)),
          ).size;
          standarHariKerja = Math.max(
            dynamicWorkingDays - explicitHariLibur,
            1,
          );
        }
      }
    } catch (e) {
      // Gunakan dynamicWorkingDays
    }

    const absensiList = await this.absensiService.findByKaryawanDanPeriode(
      idKaryawan,
      periodeAwalDate,
      periodeAkhirDate,
    );

    const attendedDates = new Set<string>();
    const daftarKeterlambatan: Array<{
      tanggal: string;
      jamMasuk: string;
      status: string;
      denda: number;
      keterangan: string;
    }> = [];

    let totalJamKerja = 0;

    for (const a of absensiList) {
      if (!a.jamMasukAktual) continue;
      const d = new Date(a.jamMasukAktual);
      const dateKey = businessDateOf(d);
      const status = (a.statusKehadiran || '').toLowerCase();

      if (status === 'tepat waktu' || status === 'telat') {
        attendedDates.add(dateKey);

        const completedBreaks = (a.istirahat || []).filter(
          (istirahat) => !!istirahat.jamMasukIstirahat,
        );
        if (a.jamKeluarAktual) {
          const diffMs =
            new Date(a.jamKeluarAktual).getTime() -
            new Date(a.jamMasukAktual).getTime();
          if (diffMs > 0) {
            const completedBreakMinutes = completedBreaks.reduce(
              (sum, istirahat) => sum + (Number(istirahat.durasiMenit) || 0),
              0,
            );
            totalJamKerja += Math.max(
              0,
              diffMs / (1000 * 60 * 60) - completedBreakMinutes / 60,
            );
          }
        }

        if (status === 'telat') {
          const jamMasukStr = d.toLocaleTimeString('en-GB', {
            timeZone: BUSINESS_TIME_ZONE,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });
          daftarKeterlambatan.push({
            tanggal: dateKey,
            jamMasuk: jamMasukStr,
            status: a.statusKehadiran || 'telat',
            denda: tarifDenda,
            keterangan: `Terlambat hadir pukul ${jamMasukStr} (Potongan denda Rp ${tarifDenda.toLocaleString('id-ID')})`,
          });
        }

        for (const istirahat of completedBreaks) {
          if ((Number(istirahat.durasiMenit) || 0) <= 60) continue;
          const kembali = new Date(istirahat.jamMasukIstirahat);
          const jamKembali = kembali.toLocaleTimeString('en-GB', {
            timeZone: BUSINESS_TIME_ZONE,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });
          daftarKeterlambatan.push({
            tanggal: dateKey,
            jamMasuk: jamKembali,
            status: 'terlambat kembali istirahat',
            denda: tarifDenda,
            keterangan: `Kembali istirahat setelah ${Number(istirahat.durasiMenit) || 0} menit (Potongan denda Rp ${tarifDenda.toLocaleString('id-ID')})`,
          });
        }
      }
    }

    // Ambil data sakit resmi (disetujui)
    const izinSakitList = await this.pengajuanIzinRepo.find({
      where: {
        idKaryawan,
        jenisIzin: 'sakit',
        status: 'disetujui',
        tanggalMulai: LessThanOrEqual(periodeAkhirStr as any),
        tanggalSelesai: MoreThanOrEqual(periodeAwalStr as any),
      },
    });

    const hariSakitResmi = izinSakitList.reduce(
      (total, izin) =>
        total +
        countNonSundayOverlap(
          izin.tanggalMulai,
          izin.tanggalSelesai,
          periodeAwalStr,
          periodeAkhirStr,
        ),
      0,
    );

    // Ambil data izin biasa (disetujui)
    const izinList = await this.pengajuanIzinRepo.find({
      where: {
        idKaryawan,
        jenisIzin: 'izin',
        status: 'disetujui',
        tanggalMulai: LessThanOrEqual(periodeAkhirStr as any),
        tanggalSelesai: MoreThanOrEqual(periodeAwalStr as any),
      },
    });

    const hariIzin = izinList.reduce(
      (total, izin) =>
        total +
        countNonSundayOverlap(
          izin.tanggalMulai,
          izin.tanggalSelesai,
          periodeAwalStr,
          periodeAkhirStr,
        ),
      0,
    );

    // Cuti berbayar
    const cutiList = await this.jadwalKerjaService.findCutiByKaryawanAndPeriode(
      idKaryawan,
      periodeAwalStr,
      periodeAkhirStr,
    );
    const hariCuti = new Set(
      cutiList
        .map((cuti) => normalizeDateOnly(cuti.tanggal))
        .filter((date) => !isSunday(date)),
    ).size;

    const totalHariHadir = attendedDates.size;
    const hariDibayarGajiPokok = Math.min(
      standarHariKerja,
      totalHariHadir + hariSakitResmi + (karyawan.hakCuti ? hariCuti : 0),
    );
    const hariAlpa = Math.max(
      0,
      standarHariKerja -
        (totalHariHadir +
          hariSakitResmi +
          (karyawan.hakCuti ? hariCuti : 0) +
          hariIzin),
    );

    // Cek record slip gaji yang sudah di-generate di database
    // 1. Coba exact match periode cut-off
    let slipResmi = await this.penggajianRepo.findOne({
      where: {
        idKaryawan,
        periodeAwal: periodeAwalStr as any,
        periodeAkhir: periodeAkhirStr as any,
      },
    });

    const isOfficial = !!slipResmi;
    const effPeriodeAwal = slipResmi
      ? normalizeDateOnly(slipResmi.periodeAwal)
      : periodeAwalStr;
    const effPeriodeAkhir = slipResmi
      ? normalizeDateOnly(slipResmi.periodeAkhir)
      : periodeAkhirStr;
    const effTotalHariKerja = slipResmi
      ? Number(slipResmi.totalHariKerja)
      : standarHariKerja;
    const effTotalHariHadir = slipResmi
      ? Number(slipResmi.totalHariHadir)
      : totalHariHadir;

    const gajiPokok = slipResmi
      ? Number(slipResmi.gajiPokok)
      : Number(karyawan.gajiPokok) || 0;
    const gajiPokokSesuaiHari = slipResmi
      ? Number(slipResmi.gajiPokokSesuaiHari)
      : effTotalHariKerja > 0
        ? Math.round((hariDibayarGajiPokok / effTotalHariKerja) * gajiPokok)
        : gajiPokok;

    const tarifKonsumsiPerHari = slipResmi
      ? Number(slipResmi.tarifKonsumsiPerHari)
      : Number(karyawan.tunjanganKonsumsiHari) || 20000;
    const tunjanganKonsumsi = slipResmi
      ? Number(slipResmi.tunjanganKonsumsi)
      : tarifKonsumsiPerHari * effTotalHariHadir;

    const tunjanganTransportasi = slipResmi
      ? Number(slipResmi.tunjanganTransportasi)
      : Number(karyawan.tunjanganTransportasi) || 0;
    const tunjanganKomunikasi = slipResmi
      ? Number(slipResmi.tunjanganKomunikasi)
      : Number(karyawan.tunjanganKomunikasi) || 0;
    const tunjanganJabatan = slipResmi
      ? Number(slipResmi.tunjanganJabatan)
      : Number(karyawan.tunjanganJabatan) || 0;
    const lembur = slipResmi ? Number(slipResmi.lembur) : 0;

    const totalPenghasilan = slipResmi
      ? Number(slipResmi.totalPenghasilan)
      : gajiPokokSesuaiHari +
        tunjanganKonsumsi +
        tunjanganTransportasi +
        tunjanganKomunikasi +
        tunjanganJabatan +
        lembur;

    const potonganBpjs = slipResmi
      ? Number(slipResmi.potonganBpjs)
      : Number(karyawan.potonganBpjs) || 0;
    const potonganTerlambat = slipResmi
      ? Number(slipResmi.potonganTerlambat)
      : daftarKeterlambatan.length * tarifDenda;
    const potonganPinjaman = slipResmi ? Number(slipResmi.potonganPinjaman) : 0;
    const potonganLainnya = slipResmi ? Number(slipResmi.potonganLainnya) : 0;
    const sisaPinjaman = slipResmi ? Number(slipResmi.sisaPinjaman) : 0;

    const totalPotongan = slipResmi
      ? Number(slipResmi.potongan)
      : potonganBpjs + potonganTerlambat + potonganPinjaman + potonganLainnya;

    const totalGaji = slipResmi
      ? Number(slipResmi.totalGaji)
      : Math.max(totalPenghasilan - totalPotongan, 0);

    const snapshotLateMatch = slipResmi?.catatan?.match(/(\d+)x Terlambat/);
    const jumlahTerlambat = slipResmi
      ? Number(
          snapshotLateMatch?.[1] ??
            (tarifDenda > 0
              ? Math.round(Number(slipResmi.potonganTerlambat) / tarifDenda)
              : 0),
        )
      : daftarKeterlambatan.length;
    const officialDaftarKeterlambatan = slipResmi ? [] : daftarKeterlambatan;
    const todayStr = businessDateOf(now);
    const telatHariIni = officialDaftarKeterlambatan.find(
      (k) => k.tanggal === todayStr,
    );

    return {
      karyawan: {
        idKaryawan: karyawan.idKaryawan,
        nama: karyawan.nama,
        nik: karyawan.nik,
        jabatan: karyawan.jabatan?.namaJabatan || '-',
        departemen: karyawan.departemen?.namaDepartemen || '-',
      },
      periodeAwal: effPeriodeAwal,
      periodeAkhir: effPeriodeAkhir,
      tanggalAcuan: refDateStr,
      isOfficial,
      slipStatus: isOfficial ? 'official' : 'live_preview',
      totalHariKerja: effTotalHariKerja,
      totalHariHadir: effTotalHariHadir,
      hariSakitResmi,
      hariIzin,
      hariAlpa,
      hariCuti,
      gajiPokok,
      gajiPokokSesuaiHari,
      tarifKonsumsiPerHari,
      tunjanganKonsumsi,
      tunjanganTransportasi,
      tunjanganKomunikasi,
      tunjanganJabatan,
      lembur,
      totalPenghasilan,
      potonganBpjs,
      potonganTerlambat,
      jumlahTerlambat,
      tarifDendaPerTelat: tarifDenda,
      potonganPinjaman,
      potonganLainnya,
      sisaPinjaman,
      totalPotongan,
      totalGaji,
      daftarKeterlambatan: officialDaftarKeterlambatan,
      hariIniTelat: !isOfficial && !!telatHariIni,
      pesanHariIni:
        !isOfficial && telatHariIni
          ? `Hari ini Anda terlambat (${telatHariIni.jamMasuk}). Denda Rp ${tarifDenda.toLocaleString('id-ID')} otomatis memotong slip gaji Anda.`
          : null,
      metodePerhitungan: {
        namaMetode: 'Metode Baku & Transparan CV Sukses Bangunindo',
        totalHariKerjaRumus: `${effTotalHariKerja} Hari Kerja (Dihitung dari kalender cut-off non-Minggu / Shift)`,
        gajiPokokRumus: isOfficial
          ? `Nilai snapshot payroll resmi: Rp ${gajiPokokSesuaiHari.toLocaleString('id-ID')}`
          : `Prorata (${hariDibayarGajiPokok}/${effTotalHariKerja} Hari) × Rp ${gajiPokok.toLocaleString('id-ID')} = Rp ${gajiPokokSesuaiHari.toLocaleString('id-ID')}`,
        uangMakanRumus: `${effTotalHariHadir} Hari Hadir Riil × Rp ${tarifKonsumsiPerHari.toLocaleString('id-ID')} = Rp ${tunjanganKonsumsi.toLocaleString('id-ID')}`,
        dendaTelatRumus: isOfficial
          ? `${jumlahTerlambat}x Terlambat pada snapshot = Rp ${potonganTerlambat.toLocaleString('id-ID')}`
          : `${jumlahTerlambat}x Terlambat × Rp ${tarifDenda.toLocaleString('id-ID')} = Rp ${potonganTerlambat.toLocaleString('id-ID')}`,
        takeHomePayRumus: `Penghasilan (Rp ${totalPenghasilan.toLocaleString('id-ID')}) - Potongan (Rp ${totalPotongan.toLocaleString('id-ID')}) = Rp ${totalGaji.toLocaleString('id-ID')}`,
      },
      catatan:
        slipResmi?.catatan ||
        `Slip gaji bersifat rahasia. Dilarang membagikan informasi gaji kepada sesama karyawan.`,
    };
  }
}
