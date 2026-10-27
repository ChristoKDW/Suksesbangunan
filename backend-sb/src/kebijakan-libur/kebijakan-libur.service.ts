import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { JenisLibur, KebijakanLibur, PerlakuanLibur } from './kebijakan-libur.entity.js';
import { PengaturanPenggajian } from '../penggajian/entities/pengaturan-penggajian.entity.js';
import {
  checkIndonesianHoliday,
  getIndonesianHolidays,
} from '../hari-libur/indonesia-holidays.util.js';
import { dateRange } from '../common/utils/business-date.util.js';

export interface TanggalMerah {
  tanggal: string;
  nama: string;
  jenis: JenisLibur;
}

const PERLAKUAN: PerlakuanLibur[] = ['libur', 'kerja'];

/**
 * Satu-satunya sumber keputusan "apakah tanggal libur resmi diliburkan perusahaan".
 * - libur : tanggal merah → karyawan kantor otomatis off, karyawan operasional yang
 *           tetap masuk mendapat saldo RO, tidak dihitung hari kerja di payroll.
 * - kerja : hari kerja biasa → tidak off, tidak dapat RO (default untuk cuti bersama).
 */
@Injectable()
export class KebijakanLiburService {
  constructor(
    @InjectRepository(KebijakanLibur)
    private readonly repo: Repository<KebijakanLibur>,
    @InjectRepository(PengaturanPenggajian)
    private readonly pengaturanRepo: Repository<PengaturanPenggajian>,
  ) {}

  private jenisDari(h: { isCollectiveLeave: boolean }): JenisLibur {
    return h.isCollectiveLeave ? 'cuti_bersama' : 'libur_nasional';
  }

  async getDefault(): Promise<Record<JenisLibur, PerlakuanLibur>> {
    const s = await this.pengaturanRepo.findOne({ where: {}, order: { id: 'ASC' } });
    return {
      libur_nasional: (s?.kebijakanLiburNasional as PerlakuanLibur) || 'libur',
      cuti_bersama: (s?.kebijakanCutiBersama as PerlakuanLibur) || 'kerja',
    };
  }

  /** Tanggal merah (diliburkan perusahaan) atau null jika hari kerja biasa. */
  async tanggalMerah(tanggal: string): Promise<TanggalMerah | null> {
    const h = checkIndonesianHoliday(tanggal);
    if (!h) return null;
    const jenis = this.jenisDari(h);
    const override = await this.repo.findOne({ where: { tanggal } });
    const perlakuan = override?.perlakuan ?? (await this.getDefault())[jenis];
    return perlakuan === 'libur' ? { tanggal, nama: h.localName, jenis } : null;
  }

  /** Map tanggal merah (diliburkan) dalam rentang, untuk perhitungan massal (payroll, jadwal). */
  async tanggalMerahDalamRentang(start: string, end: string): Promise<Map<string, TanggalMerah>> {
    const [def, overrides] = await Promise.all([
      this.getDefault(),
      this.repo.find({ where: { tanggal: Between(start as any, end as any) } }),
    ]);
    const ovMap = new Map(overrides.map((o) => [String(o.tanggal).slice(0, 10), o.perlakuan]));
    const result = new Map<string, TanggalMerah>();
    const tahun = new Set(dateRange(start, end).map((d) => Number(d.slice(0, 4))));
    for (const y of tahun) {
      for (const h of getIndonesianHolidays(y)) {
        if (h.date < start || h.date > end) continue;
        const jenis = this.jenisDari(h);
        if ((ovMap.get(h.date) ?? def[jenis]) === 'libur') {
          result.set(h.date, { tanggal: h.date, nama: h.localName, jenis });
        }
      }
    }
    return result;
  }

  /** Daftar seluruh libur resmi setahun beserta perlakuan efektif (untuk halaman pengaturan). */
  async daftar(tahun: number) {
    const [def, overrides] = await Promise.all([
      this.getDefault(),
      this.repo.find({ where: { tanggal: Between(`${tahun}-01-01` as any, `${tahun}-12-31` as any) } }),
    ]);
    const ovMap = new Map(overrides.map((o) => [String(o.tanggal).slice(0, 10), o.perlakuan]));
    return {
      tahun,
      default: def,
      daftar: getIndonesianHolidays(tahun).map((h) => {
        const jenis = this.jenisDari(h);
        const override = ovMap.get(h.date);
        return {
          tanggal: h.date,
          nama: h.localName,
          jenis,
          perlakuan: override ?? def[jenis],
          sumber: override ? 'khusus' : 'default',
        };
      }),
    };
  }

  /** Ubah kebijakan default per jenis (1 klik berlaku untuk semua tanggal jenis tsb). */
  async setDefault(dto: { liburNasional?: string; cutiBersama?: string }) {
    let s = await this.pengaturanRepo.findOne({ where: {}, order: { id: 'ASC' } });
    s ??= this.pengaturanRepo.create({});
    if (dto.liburNasional !== undefined) {
      if (!PERLAKUAN.includes(dto.liburNasional as PerlakuanLibur)) throw new BadRequestException('Nilai tidak valid');
      s.kebijakanLiburNasional = dto.liburNasional;
    }
    if (dto.cutiBersama !== undefined) {
      if (!PERLAKUAN.includes(dto.cutiBersama as PerlakuanLibur)) throw new BadRequestException('Nilai tidak valid');
      s.kebijakanCutiBersama = dto.cutiBersama;
    }
    await this.pengaturanRepo.save(s);
    return this.getDefault();
  }

  /** Ubah perlakuan satu tanggal (1 klik). Sama dengan default → pengecualian dihapus. */
  async setTanggal(tanggal: string, perlakuan: string, idUser?: number) {
    if (!PERLAKUAN.includes(perlakuan as PerlakuanLibur)) throw new BadRequestException('Nilai tidak valid');
    const h = checkIndonesianHoliday(tanggal);
    if (!h) throw new BadRequestException(`${tanggal} bukan hari libur nasional / cuti bersama resmi`);
    const def = (await this.getDefault())[this.jenisDari(h)];
    if (perlakuan === def) {
      await this.repo.delete({ tanggal });
    } else {
      await this.repo.save({ tanggal, perlakuan: perlakuan as PerlakuanLibur, idUser: idUser ?? null });
    }
    return { tanggal, nama: h.localName, perlakuan, sumber: perlakuan === def ? 'default' : 'khusus' };
  }

  /** Hapus semua pengecualian satu tahun → seluruh tanggal kembali ke kebijakan default. */
  async resetTahun(tahun: number) {
    const res = await this.repo.delete({
      tanggal: Between(`${tahun}-01-01` as any, `${tahun}-12-31` as any) as any,
    });
    return { dihapus: res.affected ?? 0 };
  }
}
