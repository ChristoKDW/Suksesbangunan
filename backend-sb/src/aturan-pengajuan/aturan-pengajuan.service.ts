import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BatasPengajuan } from './batas-pengajuan.entity.js';
import { Karyawan } from '../karyawan/entities/karyawan.entity.js';
import { User } from '../user/entities/user.entity.js';
import { matchUserName } from '../karyawan/name-matcher.util.js';
import { businessToday } from '../common/utils/business-date.util.js';

export type JenisPengajuan =
  | 'izin'
  | 'izin_sementara'
  | 'sakit'
  | 'dinas_luar'
  | 'cuti'
  | 'tukar_shift'
  | 'tukar_off'
  | 'tunda_off'
  | 'regular_off'
  | 'kasbon';

/**
 * Daftar jenis pengajuan, label, nilai default batas & query penghitung.
 * maks 0 = tanpa batas. Periode = bulan kalender tanggal yang diajukan,
 * kecuali kasbon (jumlah kasbon aktif / menunggu, tidak per bulan).
 */
const ATURAN: Record<
  JenisPengajuan,
  { label: string; maksDefault: number; keterangan: string; sql: string | null }
> = {
  izin: {
    label: 'Izin',
    maksDefault: 2,
    keterangan: 'Izin tidak masuk (maks. 1 hari per pengajuan)',
    sql: `SELECT count(*) FROM pengajuan_izin WHERE id_karyawan = $1 AND jenis_izin = 'izin'
          AND status NOT LIKE 'ditolak%' AND status <> 'dibatalkan' AND tanggal_mulai BETWEEN $2 AND $3`,
  },
  izin_sementara: {
    label: 'Izin Sementara',
    maksDefault: 3,
    keterangan: 'Keluar sementara saat jam kerja',
    sql: `SELECT count(*) FROM pengajuan_izin WHERE id_karyawan = $1 AND jenis_izin = 'izin sementara'
          AND status NOT LIKE 'ditolak%' AND status <> 'dibatalkan' AND tanggal_mulai BETWEEN $2 AND $3`,
  },
  sakit: {
    label: 'Sakit',
    maksDefault: 0,
    keterangan: 'Wajib surat dokter; default tanpa batas',
    sql: `SELECT count(*) FROM pengajuan_izin WHERE id_karyawan = $1 AND jenis_izin = 'sakit'
          AND status NOT LIKE 'ditolak%' AND status <> 'dibatalkan' AND tanggal_mulai BETWEEN $2 AND $3`,
  },
  dinas_luar: {
    label: 'Dinas Luar',
    maksDefault: 0,
    keterangan: 'Default tanpa batas',
    sql: `SELECT count(*) FROM pengajuan_izin WHERE id_karyawan = $1 AND jenis_izin = 'dinas luar'
          AND status NOT LIKE 'ditolak%' AND status <> 'dibatalkan' AND tanggal_mulai BETWEEN $2 AND $3`,
  },
  cuti: {
    label: 'Cuti Tahunan',
    maksDefault: 0,
    keterangan: 'Jumlah hari dibatasi jatah cuti; ini batas jumlah pengajuan per bulan',
    sql: `SELECT count(*) FROM pengajuan_izin WHERE id_karyawan = $1 AND jenis_izin = 'cuti'
          AND status NOT LIKE 'ditolak%' AND status <> 'dibatalkan' AND tanggal_mulai BETWEEN $2 AND $3`,
  },
  tukar_shift: {
    label: 'Tukar Shift',
    maksDefault: 0,
    keterangan: 'Default tanpa batas',
    sql: `SELECT count(*) FROM pengajuan_pertukaran WHERE id_karyawan_pemohon = $1 AND jenis_pertukaran = 'shift'
          AND status NOT LIKE 'ditolak%' AND status <> 'dibatalkan' AND tanggal_pemohon BETWEEN $2 AND $3`,
  },
  tukar_off: {
    label: 'Tukar Off',
    maksDefault: 1,
    keterangan: 'Berlaku untuk pemohon maupun rekan yang diajak tukar',
    sql: null, // dihitung oleh PertukaranJadwalService (pemohon & target)
  },
  tunda_off: {
    label: 'Tunda Off',
    maksDefault: 1,
    keterangan: 'Masuk di hari off, off dipindah ke tanggal lain',
    sql: `SELECT count(*) FROM pengajuan_tunda_off WHERE id_karyawan = $1
          AND status NOT LIKE 'ditolak%' AND status <> 'dibatalkan' AND tanggal_off_asal BETWEEN $2 AND $3`,
  },
  regular_off: {
    label: 'Regular Off (RO)',
    maksDefault: 0,
    keterangan: 'Jumlah hari dibatasi saldo RO; ini batas jumlah pengajuan per bulan',
    sql: `SELECT count(*) FROM pengajuan_ro WHERE id_karyawan = $1
          AND status NOT LIKE 'ditolak%' AND status <> 'dibatalkan'
          AND (created_at AT TIME ZONE 'Asia/Makassar')::date BETWEEN $2 AND $3`,
  },
  kasbon: {
    label: 'Kasbon',
    maksDefault: 1,
    keterangan: 'Jumlah kasbon berjalan (menunggu / aktif) sekaligus, bukan per bulan',
    sql: `SELECT count(*) FROM kasbon WHERE id_karyawan = $1 AND status IN ('menunggu', 'aktif')`,
  },
};

const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export const JENIS_IZIN_KE_ATURAN: Record<string, JenisPengajuan> = {
  izin: 'izin',
  'izin sementara': 'izin_sementara',
  sakit: 'sakit',
  'dinas luar': 'dinas_luar',
  cuti: 'cuti',
};

@Injectable()
export class AturanPengajuanService implements OnModuleInit {
  private readonly logger = new Logger(AturanPengajuanService.name);

  constructor(
    @InjectRepository(BatasPengajuan)
    private readonly batasRepo: Repository<BatasPengajuan>,
    @InjectRepository(Karyawan)
    private readonly karyawanRepo: Repository<Karyawan>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  /** Isi batas default sekali (tidak menimpa nilai yang sudah diatur HRD). */
  async onModuleInit() {
    try {
      const ada = new Set((await this.batasRepo.find()).map((b) => b.jenis));
      const baru = (Object.keys(ATURAN) as JenisPengajuan[])
        .filter((j) => !ada.has(j))
        .map((j) => this.batasRepo.create({ jenis: j, maksPerBulan: ATURAN[j].maksDefault }));
      if (baru.length) await this.batasRepo.save(baru);
    } catch (err) {
      this.logger.error(`Gagal menyiapkan batas pengajuan: ${(err as Error).message}`);
    }
  }

  // ======================= Batas pengajuan =======================

  async getMaks(jenis: JenisPengajuan): Promise<number> {
    const row = await this.batasRepo.findOne({ where: { jenis } });
    return row ? row.maksPerBulan : ATURAN[jenis].maksDefault;
  }

  async daftarBatas() {
    const rows = new Map((await this.batasRepo.find()).map((b) => [b.jenis, b.maksPerBulan]));
    return (Object.keys(ATURAN) as JenisPengajuan[]).map((jenis) => ({
      jenis,
      label: ATURAN[jenis].label,
      keterangan: ATURAN[jenis].keterangan,
      maksPerBulan: rows.get(jenis) ?? ATURAN[jenis].maksDefault,
      perBulan: jenis !== 'kasbon',
    }));
  }

  async setBatas(jenis: string, maks: number) {
    if (!(jenis in ATURAN)) throw new BadRequestException('Jenis pengajuan tidak dikenal');
    const n = Math.round(Number(maks));
    if (!Number.isFinite(n) || n < 0 || n > 31) {
      throw new BadRequestException('Batas harus angka 0 – 31 (0 = tanpa batas)');
    }
    await this.batasRepo.save({ jenis, maksPerBulan: n });
    return this.daftarBatas();
  }

  private rentangBulan(tanggal: string) {
    const [y, m] = tanggal.slice(0, 7).split('-').map(Number);
    const akhir = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const ym = tanggal.slice(0, 7);
    return { awal: `${ym}-01`, akhir: `${ym}-${String(akhir).padStart(2, '0')}`, label: `${BULAN[m - 1]} ${y}` };
  }

  /** Status kuota satu jenis pengajuan untuk karyawan pada bulan tanggal referensi. */
  async statusKuota(idKaryawan: number, jenis: JenisPengajuan, tanggal = businessToday()) {
    const aturan = ATURAN[jenis];
    const maks = await this.getMaks(jenis);
    const { awal, akhir, label } = this.rentangBulan(tanggal);
    let terpakai = 0;
    if (aturan.sql) {
      const [row] = await this.dataSource.query(
        aturan.sql,
        jenis === 'kasbon' ? [idKaryawan] : [idKaryawan, awal, akhir],
      );
      terpakai = Number(row?.count ?? 0);
    }
    const boleh = maks === 0 || terpakai < maks;
    return {
      jenis,
      label: aturan.label,
      bulan: jenis === 'kasbon' ? null : label,
      terpakai,
      maks,
      boleh,
      pesan: boleh ? null : this.pesanBatas(aturan.label, terpakai, maks, jenis === 'kasbon' ? null : label),
    };
  }

  pesanBatas(label: string, terpakai: number, maks: number, bulan: string | null) {
    return bulan
      ? `Anda sudah melakukan pengajuan ${label} sebanyak ${terpakai}x pada bulan ${bulan} (batas ${maks}x per bulan).`
      : `Anda sudah melakukan pengajuan ${label} (maksimal ${maks} pengajuan berjalan sekaligus). Tunggu hingga selesai/lunas.`;
  }

  /** Tolak (409) bila kuota pengajuan jenis ini sudah habis. */
  async cekBatas(idKaryawan: number, jenis: JenisPengajuan, tanggal?: string) {
    const s = await this.statusKuota(idKaryawan, jenis, tanggal);
    if (!s.boleh) throw new ConflictException(s.pesan);
  }

  // ======================= Rute persetujuan =======================

  /** Karyawan berstatus Supervisor (akun role SPV atau jabatan supervisor/spv/leader). */
  async isSpv(karyawan: number | Karyawan): Promise<boolean> {
    const k =
      typeof karyawan === 'number'
        ? await this.karyawanRepo.findOne({ where: { idKaryawan: karyawan }, relations: { jabatan: true } })
        : karyawan;
    if (!k) return false;
    const jabatan = k.jabatan?.namaJabatan?.toLowerCase() || '';
    if (/supervisor|\bspv\b|leader/.test(jabatan)) return true;
    const users = await this.userRepo.find({ where: { role: 'SPV' as any } });
    return users.some((u) => matchUserName(k.nama, u.nama));
  }

  /**
   * Status awal pengajuan: pemohon SPV → langsung HRD; staf di departemen ber-SPV → SPV;
   * selain itu (kantor) → HRD.
   */
  async statusAwal(karyawan: Karyawan): Promise<'menunggu_spv' | 'menunggu_hrd'> {
    if (await this.isSpv(karyawan)) return 'menunggu_hrd';
    const pengelola: any[] = Array.isArray(karyawan.departemen?.pengelola) ? karyawan.departemen.pengelola : [];
    return pengelola.some((m) => m.role === 'SPV') ? 'menunggu_spv' : 'menunggu_hrd';
  }
}
