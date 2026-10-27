import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { Absensi } from '../absensi/entities/absensi.entity.js';
import { PengajuanIzin } from '../pengajuan-izin/entities/pengajuan-izin.entity.js';
import { Penggajian } from '../penggajian/entities/penggajian.entity.js';
import { Karyawan } from '../karyawan/entities/karyawan.entity.js';
import { JadwalKerja } from '../jadwal-kerja/entities/jadwal-kerja.entity.js';
import { PenggajianService } from '../penggajian/penggajian.service.js';
import {
  BUSINESS_TIME_ZONE,
  businessDateOf,
  businessDayRange,
  dateRange,
  normalizeDateOnly,
} from '../common/utils/business-date.util.js';
import {
  COMPANY_ADDRESS_LINES,
  COMPANY_NAME,
  drawCompanyHeader,
  drawTable,
  streamPdf,
} from './pdf.util.js';
import {
  AbsensiRow,
  AbsensiSheet,
  SlipData,
  addAbsensiWorksheet,
  addSlipWorksheet,
  drawAbsensiPage,
  drawSlipPage,
  uniqueSheetName,
} from './dokumen.util.js';
import {
  BNI_SHEETS,
  BniSheetKey,
  BniTrx,
  bankCode,
  bniSheetName,
  buildBniCsv,
  buildBniWorkbook,
  cleanRekening,
  isBniBank,
  sanitizeBni,
} from './bni-direct.util.js';

export type ReportUser = { role?: string; idDepartemen?: number };

const BULAN_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const HARI_SINGKAT = ['Mgg', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function fmtTime(value: Date | string | null | undefined): string {
  if (!value) return '-';
  return new Date(value).toLocaleTimeString('en-GB', {
    timeZone: BUSINESS_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function fmtRp(value: number): string {
  return `Rp ${Math.round(Number(value) || 0).toLocaleString('id-ID')}`;
}

function bulanLabel(yyyyMm: string): string {
  const [y, m] = yyyyMm.split('-').map(Number);
  return `${BULAN_ID[(m || 1) - 1]} ${y}`;
}

function isBulan(value?: string): value is string {
  return !!value && /^\d{4}-\d{2}$/.test(value);
}

function monthBounds(bulan: string) {
  const [y, m] = bulan.split('-').map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { start: `${bulan}-01`, end: `${bulan}-${String(lastDay).padStart(2, '0')}` };
}

function fileSafe(text: string): string {
  return text.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

/** Kop surat + judul untuk worksheet Excel laporan rekap. */
function addExcelHeader(
  ws: ExcelJS.Worksheet,
  colCount: number,
  title: string,
  subtitle?: string,
): number {
  const lines = [COMPANY_NAME, ...COMPANY_ADDRESS_LINES, '', title];
  if (subtitle) lines.push(subtitle);
  lines.forEach((text, idx) => {
    const row = ws.getRow(idx + 1);
    ws.mergeCells(idx + 1, 1, idx + 1, colCount);
    row.getCell(1).value = text;
    row.getCell(1).alignment = { horizontal: 'center' };
    row.getCell(1).font =
      idx === 0
        ? { bold: true, size: 14 }
        : text === title
          ? { bold: true, size: 12 }
          : { size: 9 };
  });
  return lines.length + 2; // baris pertama tabel
}

function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F2A44' },
    };
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });
}

function sendWorkbook(
  res: Response,
  workbook: ExcelJS.Workbook,
  filename: string,
) {
  res.setHeader('Content-Type', XLSX_MIME);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return workbook.xlsx.write(res);
}

export interface BniDirectOptions {
  periode?: string; // YYYY-MM (bulan periode akhir cut-off)
  periodeAwal?: string; // YYYY-MM-DD (kompatibilitas lama)
  rekDebet?: string;
  tglTransaksi?: string;
  remark?: string;
  format?: string; // excel | csv
  sheet?: string; // sheet CSV: inhouse | kliring | rtgs | online | bifast
  metodeBankLain?: string; // sheet untuk rekening non-BNI (default bifast)
}

export interface KaryawanFilter {
  idKaryawan?: number;
  statusKaryawan?: string; // Internal | External | all
  departemen?: string;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Absensi)
    private readonly absensiRepo: Repository<Absensi>,
    @InjectRepository(PengajuanIzin)
    private readonly pengajuanIzinRepo: Repository<PengajuanIzin>,
    @InjectRepository(Penggajian)
    private readonly penggajianRepo: Repository<Penggajian>,
    @InjectRepository(Karyawan)
    private readonly karyawanRepo: Repository<Karyawan>,
    @InjectRepository(JadwalKerja)
    private readonly jadwalRepo: Repository<JadwalKerja>,
    private readonly penggajianService: PenggajianService,
  ) {}

  // ===================== DATA HELPERS =====================

  private resolveBulan(periodeBulan?: string): string {
    if (isBulan(periodeBulan)) return periodeBulan;
    return businessDateOf(new Date()).slice(0, 7);
  }

  /** SPV hanya boleh melihat departemennya sendiri. */
  private scopeDepartemen(departemen: string | undefined, user?: ReportUser) {
    if (user?.role === 'SPV') return String(user.idDepartemen ?? -1);
    return departemen;
  }

  private hasDeptFilter(dept?: string): dept is string {
    return !!dept && dept !== 'all' && dept !== 'undefined' && dept !== 'null';
  }

  private async getKehadiranData(
    periodeBulan?: string,
    departemen?: string,
    user?: ReportUser,
  ) {
    const bulan = this.resolveBulan(periodeBulan);
    const { start: s, end: e } = monthBounds(bulan);
    const { start, end } = businessDayRange(s, e);
    const deptFilter = this.scopeDepartemen(departemen, user);
    const records = await this.absensiRepo.find({
      where: { jamMasukAktual: Between(start, end) },
      relations: { karyawan: { departemen: true } },
      order: { jamMasukAktual: 'ASC' },
    });
    const filtered = this.hasDeptFilter(deptFilter)
      ? records.filter((a) => a.karyawan?.idDepartemen === Number(deptFilter))
      : records;
    return { bulan, records: filtered };
  }

  private async getCutiIzinData(
    rentangWaktu?: string,
    statusApproval?: string,
    user?: ReportUser,
  ) {
    const qb = this.pengajuanIzinRepo
      .createQueryBuilder('izin')
      .leftJoinAndSelect('izin.karyawan', 'karyawan')
      .leftJoinAndSelect('karyawan.departemen', 'departemen')
      .orderBy('izin.tanggal_mulai', 'DESC');
    const status = (statusApproval || '').toLowerCase();
    if (status && !status.startsWith('semua') && status !== 'undefined') {
      // "menunggu" mencakup menunggu_spv/menunggu_hrd, "ditolak" mencakup ditolak_spv/hrd
      qb.andWhere('izin.status LIKE :status', { status: `${status}%` });
    }
    if (isBulan(rentangWaktu)) {
      const { start, end } = monthBounds(rentangWaktu);
      qb.andWhere(
        'izin.tanggal_mulai <= :selesai AND izin.tanggal_selesai >= :mulai',
        { mulai: start, selesai: end },
      );
    }
    if (user?.role === 'SPV') {
      qb.andWhere('karyawan.id_departemen = :idDept', {
        idDept: user.idDepartemen ?? -1,
      });
    }
    return qb.getMany();
  }

  /**
   * Slip gaji per periode. Bulan periode = bulan tanggal akhir cut-off
   * (mis. Agustus = 25 Juli s/d 24 Agustus), sama seperti halaman Penggajian.
   */
  private async getPenggajianData(
    periode?: string,
    filter: { idKaryawan?: number; departemen?: string } = {},
  ) {
    const qb = this.penggajianRepo
      .createQueryBuilder('gaji')
      .leftJoinAndSelect('gaji.karyawan', 'karyawan')
      .leftJoinAndSelect('karyawan.departemen', 'departemen')
      .leftJoinAndSelect('karyawan.jabatan', 'jabatan')
      .orderBy('karyawan.nama', 'ASC');
    if (isBulan(periode)) {
      const { start, end } = monthBounds(periode);
      qb.andWhere('gaji.periode_akhir BETWEEN :a AND :b', { a: start, b: end });
    }
    if (filter.idKaryawan) {
      qb.andWhere('gaji.id_karyawan = :id', { id: filter.idKaryawan });
    }
    if (this.hasDeptFilter(filter.departemen)) {
      qb.andWhere('karyawan.id_departemen = :dept', { dept: Number(filter.departemen) });
    }
    return qb.getMany();
  }

  // ===================== DAFTAR KARYAWAN (FILTER LAPORAN) =====================

  /** Daftar karyawan untuk dropdown filter laporan (SPV: timnya saja). */
  async getKaryawanOptions(user?: ReportUser, statusKaryawan?: string) {
    const qb = this.karyawanRepo
      .createQueryBuilder('k')
      .leftJoinAndSelect('k.departemen', 'departemen')
      .leftJoinAndSelect('k.jabatan', 'jabatan')
      .orderBy('k.nama', 'ASC');
    if (statusKaryawan === 'Internal' || statusKaryawan === 'External') {
      qb.andWhere("COALESCE(k.status_karyawan, 'Internal') = :st", { st: statusKaryawan });
    }
    if (user?.role === 'SPV') {
      qb.andWhere('k.id_departemen = :dept', { dept: user.idDepartemen ?? -1 });
    }
    const list = await qb.getMany();
    return list.map((k) => ({
      idKaryawan: k.idKaryawan,
      nik: k.nik,
      nama: k.nama,
      namaPanggilan: k.namaPanggilan,
      statusKaryawan: k.statusKaryawan || 'Internal',
      statusAktif: k.statusAktif,
      idDepartemen: k.idDepartemen,
      departemen: k.departemen?.namaDepartemen || '-',
      jabatan: k.jabatan?.namaJabatan || '-',
    }));
  }

  private async resolveKaryawanList(filter: KaryawanFilter, user?: ReportUser) {
    if (filter.idKaryawan) {
      const k = await this.karyawanRepo.findOne({
        where: { idKaryawan: filter.idKaryawan },
        relations: { departemen: true, jabatan: true },
      });
      if (!k) throw new NotFoundException('Karyawan tidak ditemukan');
      if (user?.role === 'SPV' && k.idDepartemen !== user.idDepartemen) {
        throw new ForbiddenException('Karyawan ini bukan anggota tim Anda');
      }
      return [k];
    }
    const qb = this.karyawanRepo
      .createQueryBuilder('k')
      .leftJoinAndSelect('k.departemen', 'departemen')
      .leftJoinAndSelect('k.jabatan', 'jabatan')
      .where("COALESCE(k.status_aktif, 'aktif') = 'aktif'")
      .orderBy('k.nama', 'ASC');
    if (filter.statusKaryawan === 'Internal' || filter.statusKaryawan === 'External') {
      qb.andWhere("COALESCE(k.status_karyawan, 'Internal') = :st", { st: filter.statusKaryawan });
    }
    const dept = this.scopeDepartemen(filter.departemen, user);
    if (this.hasDeptFilter(dept)) {
      qb.andWhere('k.id_departemen = :dept', { dept: Number(dept) });
    }
    const list = await qb.getMany();
    if (list.length === 0) {
      throw new NotFoundException('Tidak ada karyawan yang sesuai filter');
    }
    return list;
  }

  // ===================== LAPORAN KEHADIRAN =====================

  async exportKehadiran(
    res: Response,
    periodeBulan: string,
    departemen: string,
    user?: ReportUser,
  ) {
    const { bulan, records } = await this.getKehadiranData(
      periodeBulan,
      departemen,
      user,
    );
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Laporan Kehadiran');
    ws.columns = [
      { width: 6 }, { width: 28 }, { width: 20 }, { width: 14 },
      { width: 10 }, { width: 10 }, { width: 16 }, { width: 12 },
    ];
    const headerRowIdx = addExcelHeader(
      ws,
      8,
      user?.role === 'SPV'
        ? 'LAPORAN KEHADIRAN TIM (SUPERVISOR)'
        : 'LAPORAN KEHADIRAN KARYAWAN',
      `Periode ${bulanLabel(bulan)}`,
    );
    const header = ws.getRow(headerRowIdx);
    header.values = [
      'No', 'Nama Karyawan', 'Departemen', 'Tanggal',
      'Jam Masuk', 'Jam Keluar', 'Status Kehadiran', 'Metode',
    ];
    styleHeaderRow(header);
    records.forEach((a, i) => {
      ws.addRow([
        i + 1,
        a.karyawan?.nama || '-',
        a.karyawan?.departemen?.namaDepartemen || '-',
        a.jamMasukAktual ? businessDateOf(new Date(a.jamMasukAktual)) : '-',
        fmtTime(a.jamMasukAktual),
        fmtTime(a.jamKeluarAktual),
        a.statusKehadiran || '-',
        a.metodeAbsen || '-',
      ]);
    });
    return sendWorkbook(res, workbook, `Laporan_Kehadiran_${bulan}.xlsx`);
  }

  async exportKehadiranPdf(
    res: Response,
    periodeBulan: string,
    departemen: string,
    user?: ReportUser,
  ) {
    const { bulan, records } = await this.getKehadiranData(
      periodeBulan,
      departemen,
      user,
    );
    streamPdf(res, `Laporan_Kehadiran_${bulan}.pdf`, 'landscape', (doc) => {
      drawCompanyHeader(
        doc,
        user?.role === 'SPV'
          ? 'LAPORAN KEHADIRAN TIM (SUPERVISOR)'
          : 'LAPORAN KEHADIRAN KARYAWAN',
        `Periode ${bulanLabel(bulan)}`,
      );
      drawTable(
        doc,
        [
          { label: 'No', width: 30, align: 'center' },
          { label: 'Nama Karyawan', width: 160 },
          { label: 'Departemen', width: 110 },
          { label: 'Tanggal', width: 80, align: 'center' },
          { label: 'Masuk', width: 60, align: 'center' },
          { label: 'Keluar', width: 60, align: 'center' },
          { label: 'Status', width: 120 },
          { label: 'Metode', width: 80 },
        ],
        records.map((a, i) => [
          String(i + 1),
          a.karyawan?.nama || '-',
          a.karyawan?.departemen?.namaDepartemen || '-',
          a.jamMasukAktual ? businessDateOf(new Date(a.jamMasukAktual)) : '-',
          fmtTime(a.jamMasukAktual),
          fmtTime(a.jamKeluarAktual),
          a.statusKehadiran || '-',
          a.metodeAbsen || '-',
        ]),
      );
    });
  }

  // ===================== LAPORAN CUTI & IZIN =====================

  async exportCutiIzin(
    res: Response,
    rentangWaktu: string,
    statusApproval: string,
    user?: ReportUser,
  ) {
    const records = await this.getCutiIzinData(
      rentangWaktu,
      statusApproval,
      user,
    );
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Laporan Cuti & Izin');
    ws.columns = [
      { width: 6 }, { width: 28 }, { width: 20 }, { width: 16 },
      { width: 14 }, { width: 14 }, { width: 14 }, { width: 40 }, { width: 16 },
    ];
    const headerRowIdx = addExcelHeader(
      ws,
      9,
      user?.role === 'SPV'
        ? 'LAPORAN CUTI & IZIN TIM (SUPERVISOR)'
        : 'LAPORAN CUTI & IZIN KARYAWAN',
      isBulan(rentangWaktu) ? `Periode ${bulanLabel(rentangWaktu)}` : 'Semua Periode',
    );
    const header = ws.getRow(headerRowIdx);
    header.values = [
      'No', 'Nama Karyawan', 'Departemen', 'Jenis', 'Tgl Mulai',
      'Tgl Selesai', 'Jam (Izin Sementara)', 'Alasan', 'Status',
    ];
    styleHeaderRow(header);
    records.forEach((r, i) => {
      ws.addRow([
        i + 1,
        r.karyawan?.nama || '-',
        r.karyawan?.departemen?.namaDepartemen || '-',
        r.jenisIzin,
        normalizeDateOnly(r.tanggalMulai),
        normalizeDateOnly(r.tanggalSelesai),
        r.jamMulai && r.jamSelesai ? `${r.jamMulai} - ${r.jamSelesai}` : '-',
        r.alasan,
        r.status,
      ]);
    });
    return sendWorkbook(res, workbook, 'Laporan_Cuti_Izin.xlsx');
  }

  async exportCutiIzinPdf(
    res: Response,
    rentangWaktu: string,
    statusApproval: string,
    user?: ReportUser,
  ) {
    const records = await this.getCutiIzinData(
      rentangWaktu,
      statusApproval,
      user,
    );
    streamPdf(res, 'Laporan_Cuti_Izin.pdf', 'landscape', (doc) => {
      drawCompanyHeader(
        doc,
        user?.role === 'SPV'
          ? 'LAPORAN CUTI & IZIN TIM (SUPERVISOR)'
          : 'LAPORAN CUTI & IZIN KARYAWAN',
        isBulan(rentangWaktu) ? `Periode ${bulanLabel(rentangWaktu)}` : 'Semua Periode',
      );
      drawTable(
        doc,
        [
          { label: 'No', width: 28, align: 'center' },
          { label: 'Nama', width: 130 },
          { label: 'Departemen', width: 95 },
          { label: 'Jenis', width: 75 },
          { label: 'Mulai', width: 65, align: 'center' },
          { label: 'Selesai', width: 65, align: 'center' },
          { label: 'Jam', width: 70, align: 'center' },
          { label: 'Alasan', width: 170 },
          { label: 'Status', width: 70 },
        ],
        records.map((r, i) => [
          String(i + 1),
          r.karyawan?.nama || '-',
          r.karyawan?.departemen?.namaDepartemen || '-',
          r.jenisIzin,
          normalizeDateOnly(r.tanggalMulai),
          normalizeDateOnly(r.tanggalSelesai),
          r.jamMulai && r.jamSelesai ? `${r.jamMulai}-${r.jamSelesai}` : '-',
          (r.alasan || '-').slice(0, 45),
          r.status,
        ]),
      );
    });
  }

  // ===================== LAPORAN PENGGAJIAN =====================

  async exportPenggajian(res: Response, periode: string, departemen?: string) {
    const records = await this.getPenggajianData(periode, { departemen });
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Laporan Penggajian');
    const columns = [
      'No', 'NIK', 'Nama Karyawan', 'Departemen', 'Jabatan',
      'Periode Awal', 'Periode Akhir', 'Hari Kerja', 'Hari Hadir',
      'Gaji Pokok', 'Gaji Sesuai Hari', 'Tunj. Konsumsi', 'Tunj. Transport',
      'Tunj. Komunikasi', 'Tunj. Jabatan', 'Lembur', 'Total Penghasilan',
      'Pot. BPJS', 'Pot. Terlambat', 'Pot. Pinjaman', 'Pot. Lainnya',
      'Total Potongan', 'Take Home Pay', 'No. Rekening', 'Bank',
    ];
    ws.columns = columns.map((_, i) => ({ width: i < 5 ? 20 : 16 }));
    const headerRowIdx = addExcelHeader(
      ws,
      columns.length,
      'LAPORAN PENGGAJIAN KARYAWAN',
      isBulan(periode) ? `Periode Gaji ${bulanLabel(periode)}` : 'Semua Periode',
    );
    const header = ws.getRow(headerRowIdx);
    header.values = columns;
    styleHeaderRow(header);
    records.forEach((r, i) => {
      const row = ws.addRow([
        i + 1,
        r.karyawan?.nik || '-',
        r.karyawan?.nama || '-',
        r.karyawan?.departemen?.namaDepartemen || '-',
        r.karyawan?.jabatan?.namaJabatan || '-',
        normalizeDateOnly(r.periodeAwal),
        normalizeDateOnly(r.periodeAkhir),
        Number(r.totalHariKerja || 0),
        Number(r.totalHariHadir || 0),
        Number(r.gajiPokok || 0),
        Number(r.gajiPokokSesuaiHari || 0),
        Number(r.tunjanganKonsumsi || 0),
        Number(r.tunjanganTransportasi || 0),
        Number(r.tunjanganKomunikasi || 0),
        Number(r.tunjanganJabatan || 0),
        Number(r.lembur || 0),
        Number(r.totalPenghasilan || 0),
        Number(r.potonganBpjs || 0),
        Number(r.potonganTerlambat || 0),
        Number(r.potonganPinjaman || 0),
        Number(r.potonganLainnya || 0),
        Number(r.potongan || 0),
        Number(r.totalGaji || 0),
        r.karyawan?.noRekening || '-',
        r.karyawan?.namaBank || '-',
      ]);
      for (let c = 10; c <= 23; c++) {
        row.getCell(c).numFmt = '#,##0';
      }
    });
    if (records.length > 0) {
      const sum = (pick: (r: Penggajian) => number) =>
        records.reduce((s, r) => s + (Number(pick(r)) || 0), 0);
      const totalRow = ws.addRow([
        '', '', 'TOTAL', '', '', '', '', '', '',
        sum((r) => r.gajiPokok), sum((r) => r.gajiPokokSesuaiHari),
        sum((r) => r.tunjanganKonsumsi), sum((r) => r.tunjanganTransportasi),
        sum((r) => r.tunjanganKomunikasi), sum((r) => r.tunjanganJabatan),
        sum((r) => r.lembur), sum((r) => r.totalPenghasilan),
        sum((r) => r.potonganBpjs), sum((r) => r.potonganTerlambat),
        sum((r) => r.potonganPinjaman), sum((r) => r.potonganLainnya),
        sum((r) => r.potongan), sum((r) => r.totalGaji),
      ]);
      totalRow.font = { bold: true };
      for (let c = 10; c <= 23; c++) totalRow.getCell(c).numFmt = '#,##0';
    }
    return sendWorkbook(
      res,
      workbook,
      `Laporan_Penggajian_${isBulan(periode) ? periode : 'Semua'}.xlsx`,
    );
  }

  async exportPenggajianPdf(res: Response, periode: string, departemen?: string) {
    const records = await this.getPenggajianData(periode, { departemen });
    streamPdf(
      res,
      `Laporan_Penggajian_${isBulan(periode) ? periode : 'Semua'}.pdf`,
      'landscape',
      (doc) => {
        drawCompanyHeader(
          doc,
          'LAPORAN PENGGAJIAN KARYAWAN',
          isBulan(periode) ? `Periode Gaji ${bulanLabel(periode)}` : 'Semua Periode',
        );
        drawTable(
          doc,
          [
            { label: 'No', width: 25, align: 'center' },
            { label: 'Nama', width: 125 },
            { label: 'Departemen', width: 85 },
            { label: 'HK', width: 28, align: 'center' },
            { label: 'HH', width: 28, align: 'center' },
            { label: 'Gaji Pokok', width: 75, align: 'right' },
            { label: 'Penghasilan', width: 80, align: 'right' },
            { label: 'Potongan', width: 75, align: 'right' },
            { label: 'THP', width: 85, align: 'right' },
            { label: 'Status', width: 70, align: 'center' },
          ],
          records.map((r, i) => [
            String(i + 1),
            r.karyawan?.nama || '-',
            r.karyawan?.departemen?.namaDepartemen || '-',
            String(r.totalHariKerja || 0),
            String(r.totalHariHadir || 0),
            fmtRp(Number(r.gajiPokok)),
            fmtRp(Number(r.totalPenghasilan)),
            fmtRp(Number(r.potongan)),
            fmtRp(Number(r.totalGaji)),
            r.tanggalBayar ? 'Dibayar' : 'Draft',
          ]),
        );
        const total = records.reduce((s, r) => s + Number(r.totalGaji || 0), 0);
        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .text(`Total Take Home Pay: ${fmtRp(total)} (${records.length} karyawan)`);
      },
    );
  }

  // ===================== BNIDIRECT (TRANSFER PAYROLL) =====================

  /** Ambil slip gaji untuk BNIDirect berdasarkan bulan periode / tanggal periode awal. */
  private async getBniRecords(opts: BniDirectOptions) {
    if (isBulan(opts.periode)) {
      const records = await this.getPenggajianData(opts.periode);
      return { label: opts.periode, records };
    }
    let periodeAwal = opts.periodeAwal ? normalizeDateOnly(opts.periodeAwal) : undefined;
    if (!periodeAwal) {
      const latest = await this.penggajianRepo
        .createQueryBuilder('gaji')
        .select('MAX(gaji.periode_awal)', 'max')
        .getRawOne<{ max: string }>();
      if (!latest?.max) {
        throw new BadRequestException('Belum ada data penggajian untuk diekspor ke BNIDirect');
      }
      periodeAwal = normalizeDateOnly(latest.max);
    }
    const records = await this.penggajianRepo.find({
      where: { periodeAwal: periodeAwal as any },
      relations: { karyawan: true },
      order: { idGaji: 'ASC' },
    });
    return { label: periodeAwal, records };
  }

  /**
   * Template BNIDIRECT v1.9.6 lengkap 9 sheet. Rekening BNI → Inhouse,
   * rekening bank lain → sheet metode pilihan (BIFAST/Online/Kliring/RTGS).
   * format=csv&sheet=… menghasilkan file persis tombol "Create CSV" sheet tsb.
   */
  async exportBniDirect(res: Response, opts: BniDirectOptions) {
    const { label, records: all } = await this.getBniRecords(opts);
    const records = all.filter((r) => Math.round(Number(r.totalGaji) || 0) > 0);
    if (records.length === 0) {
      throw new BadRequestException(`Tidak ada slip gaji untuk periode ${label}`);
    }
    // Rekening debet & metode bank lain diambil dari Pengaturan Penggajian;
    // nilai yang dikirim HRD otomatis disimpan agar tidak perlu diketik ulang.
    const settings = await this.penggajianService.getSettings();
    const metodeValid = ['bifast', 'online', 'kliring', 'rtgs'];
    const rekDebetInput = cleanRekening(opts.rekDebet);
    const metodeInput = metodeValid.includes(opts.metodeBankLain || '') ? opts.metodeBankLain : undefined;
    if (
      (rekDebetInput && rekDebetInput !== settings.rekeningDebetBni) ||
      (metodeInput && metodeInput !== settings.metodeBankLain)
    ) {
      await this.penggajianService.updateSettings({
        ...(rekDebetInput ? { rekeningDebetBni: rekDebetInput } : {}),
        ...(metodeInput ? { metodeBankLain: metodeInput } : {}),
      });
    }
    const metode = (metodeInput ||
      (metodeValid.includes(settings.metodeBankLain) ? settings.metodeBankLain : 'bifast')) as BniSheetKey;

    const periodeLabel = isBulan(label) ? bulanLabel(label) : label;
    const remark1 = sanitizeBni(opts.remark || 'PAYROLL SUKSES BANGUNINDO').slice(0, 33);
    const remark2 = sanitizeBni(`GAJI ${periodeLabel}`.toUpperCase()).slice(0, 50);
    const tglTransaksi = /^\d{8}$/.test(opts.tglTransaksi || '')
      ? opts.tglTransaksi!
      : businessDateOf(new Date()).replace(/-/g, '');
    const header = {
      tglTransaksi,
      rekDebet: rekDebetInput || cleanRekening(settings.rekeningDebetBni),
      namaFile: 'SUKSES BANGUNINDO',
    };

    const data: Record<BniSheetKey, BniTrx[]> = {
      inhouse: [], kliring: [], rtgs: [], online: [], bifast: [],
    };
    const masalah: { nik: string; nama: string; bank: string; rek: string; thp: number; catatan: string }[] =
      all
        .filter((r) => Math.round(Number(r.totalGaji) || 0) <= 0)
        .map((r) => ({
          nik: r.karyawan?.nik || '-',
          nama: r.karyawan?.nama || '-',
          bank: r.karyawan?.namaBank || '-',
          rek: r.karyawan?.noRekening || '-',
          thp: 0,
          catatan:
            Number(r.gajiPokok || 0) <= 0
              ? 'Take home pay Rp0 — gaji pokok karyawan belum diisi di data Karyawan'
              : 'Take home pay Rp0 — periksa potongan/kehadiran di slip gaji',
        }));
    for (const r of records) {
      const k = r.karyawan;
      const amount = Math.round(Number(r.totalGaji) || 0);
      const rek = cleanRekening(k?.noRekening);
      const base = {
        nik: k?.nik || '-', nama: k?.nama || '-', bank: k?.namaBank || '-',
        rek: k?.noRekening || '-', thp: amount,
      };
      if (!rek) {
        masalah.push({ ...base, catatan: 'Nomor rekening belum diisi (tidak masuk file transfer)' });
        continue;
      }
      const sheet: BniSheetKey = isBniBank(k?.namaBank) ? 'inhouse' : metode;
      const code = bankCode(k?.namaBank, sheet);
      if (sheet !== 'inhouse' && !code) {
        masalah.push({
          ...base,
          catatan: sheet === 'kliring'
            ? 'Clearing Code 7 digit (sandi kliring cabang) wajib diisi manual'
            : `Kode bank ${bniSheetName(sheet)} tidak dikenali dari nama bank — isi manual`,
        });
      }
      if (sheet === 'inhouse' && rek.length > 16) {
        masalah.push({ ...base, catatan: 'Rekening BNI lebih dari 16 digit' });
      }
      data[sheet].push({
        rek,
        nama: sanitizeBni((k?.nama || '').toUpperCase()),
        amount,
        remark1,
        remark2,
        code,
        bank: sheet === 'inhouse' ? '' : sanitizeBni((k?.namaBank || '').toUpperCase()).slice(0, 35),
      });
    }

    if (opts.format === 'csv') {
      const key = (BNI_SHEETS.includes(opts.sheet as BniSheetKey) ? opts.sheet : 'inhouse') as BniSheetKey;
      if (!header.rekDebet) {
        throw new BadRequestException('Rek. Debet (rekening perusahaan) wajib diisi untuk membuat CSV');
      }
      if (data[key].length === 0) {
        throw new BadRequestException(`Tidak ada transaksi untuk sheet ${bniSheetName(key)} pada periode ini`);
      }
      const { filename, content } = buildBniCsv(key, data[key], header);
      res.setHeader('Content-Type', 'text/csv; charset=windows-1252');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(content);
      return;
    }

    const wb = buildBniWorkbook(data, header);
    if (masalah.length > 0) {
      const ws = wb.addWorksheet('Perlu Dilengkapi');
      ws.columns = [{ width: 6 }, { width: 18 }, { width: 32 }, { width: 18 }, { width: 22 }, { width: 16 }, { width: 60 }];
      const hdr = ws.getRow(1);
      hdr.values = ['No', 'NIK', 'Nama Karyawan', 'Bank', 'No. Rekening', 'THP', 'Catatan'];
      styleHeaderRow(hdr);
      masalah.forEach((m, i) => {
        const row = ws.addRow([i + 1, m.nik, m.nama, m.bank, m.rek, m.thp, m.catatan]);
        row.getCell(6).numFmt = '#,##0';
      });
    }
    return sendWorkbook(res, wb, `BNIDIRECT_Payroll_${fileSafe(label)}.xlsx`);
  }

  // ===================== REKAP ABSENSI PERORANGAN =====================

  /**
   * Bangun baris rekap absensi (format template "ABSENSI <NAMA> <BULAN>")
   * untuk banyak karyawan sekaligus dengan 3 query total.
   */
  private async buildAbsensiSheets(karyawanList: Karyawan[], bulan?: string) {
    const bulanStr = this.resolveBulan(bulan);
    const [y, m] = bulanStr.split('-').map(Number);
    const { start: startStr, end: endStr } = monthBounds(bulanStr);
    const { start, end } = businessDayRange(startStr, endStr);
    const ids = karyawanList.map((k) => k.idKaryawan);
    const today = businessDateOf(new Date());

    const [absensiList, jadwalList, izinList] = await Promise.all([
      this.absensiRepo.find({
        where: { idKaryawan: In(ids), jamMasukAktual: Between(start, end) },
        order: { jamMasukAktual: 'ASC' },
      }),
      this.jadwalRepo.find({
        where: { idKaryawan: In(ids), tanggal: Between(startStr as any, endStr as any) },
      }),
      this.pengajuanIzinRepo
        .createQueryBuilder('izin')
        .where('izin.id_karyawan IN (:...ids)', { ids })
        .andWhere("izin.status = 'disetujui'")
        .andWhere('izin.tanggal_mulai <= :selesai AND izin.tanggal_selesai >= :mulai', {
          mulai: startStr,
          selesai: endStr,
        })
        .getMany(),
    ]);

    const absenMap = new Map<string, { masuk: string; keluar: string }>();
    for (const a of absensiList) {
      if (!a.jamMasukAktual) continue;
      const key = `${a.idKaryawan}|${businessDateOf(new Date(a.jamMasukAktual))}`;
      const existing = absenMap.get(key);
      if (!existing) {
        absenMap.set(key, {
          masuk: fmtTime(a.jamMasukAktual),
          keluar: a.jamKeluarAktual ? fmtTime(a.jamKeluarAktual) : '-',
        });
      } else if (a.jamKeluarAktual) {
        existing.keluar = fmtTime(a.jamKeluarAktual);
      }
    }
    const liburSet = new Set(
      jadwalList
        .filter((j) => j.isLibur)
        .map((j) => `${j.idKaryawan}|${normalizeDateOnly(j.tanggal)}`),
    );
    const izinMap = new Map<string, string>();
    for (const iz of izinList) {
      const jenis = (iz.jenisIzin || 'izin').toLowerCase();
      if (jenis.includes('sementara')) continue; // izin beberapa jam tetap tercatat jam absennya
      for (const d of dateRange(
        normalizeDateOnly(iz.tanggalMulai),
        normalizeDateOnly(iz.tanggalSelesai),
      )) {
        izinMap.set(`${iz.idKaryawan}|${d}`, jenis.toUpperCase());
      }
    }

    const tanggalList = dateRange(startStr, endStr);
    const sheets: AbsensiSheet[] = karyawanList.map((k) => ({
      nama: (k.namaPanggilan || k.nama).toUpperCase(),
      namaLengkap: k.nama,
      rows: tanggalList.map((tanggal): AbsensiRow => {
        const day = new Date(`${tanggal}T00:00:00.000Z`).getUTCDay();
        const tgl = `${tanggal.slice(8, 10)} ${HARI_SINGKAT[day]}`;
        const key = `${k.idKaryawan}|${tanggal}`;
        const absen = absenMap.get(key);
        if (absen) return { tgl, masuk: absen.masuk, keluar: absen.keluar };
        if (izinMap.has(key)) return { tgl, label: izinMap.get(key) };
        if (liburSet.has(key)) return { tgl, label: 'OFF' };
        if (tanggal > today) return { tgl, masuk: '', keluar: '' };
        return { tgl, label: '-' };
      }),
    }));

    return { judulBulan: `${BULAN_ID[m - 1].toUpperCase()} ${y}`, sheets };
  }

  /** Rekap absensi (perorangan / semua karyawan External / filter) — PDF atau Excel. */
  async exportRekapAbsensi(
    res: Response,
    filter: KaryawanFilter,
    bulan: string | undefined,
    format: string | undefined,
    user?: ReportUser,
  ) {
    const karyawanList = await this.resolveKaryawanList(filter, user);
    const { judulBulan, sheets } = await this.buildAbsensiSheets(karyawanList, bulan);
    const subjek =
      sheets.length === 1
        ? fileSafe(sheets[0].nama)
        : filter.statusKaryawan === 'External'
          ? 'KARYAWAN_EXTERNAL'
          : 'KARYAWAN';
    const base = `ABSENSI_${subjek}_${fileSafe(judulBulan)}`;

    if (format === 'excel') {
      const wb = new ExcelJS.Workbook();
      const used = new Set<string>();
      for (const s of sheets) addAbsensiWorksheet(wb, s, uniqueSheetName(s.nama, used));
      return sendWorkbook(res, wb, `${base}.xlsx`);
    }
    streamPdf(
      res,
      `${base}.pdf`,
      'portrait',
      (doc) => {
        sheets.forEach((s, i) => {
          if (i > 0) doc.addPage();
          drawAbsensiPage(doc, s);
        });
      },
      { footer: false },
    );
  }

  // ===================== SLIP GAJI =====================

  private slipFromPenggajian(r: Penggajian): SlipData {
    const akhir = normalizeDateOnly(r.periodeAkhir);
    return {
      nama: r.karyawan?.nama || '-',
      jabatan: r.karyawan?.jabatan?.namaJabatan || '-',
      divisi: r.karyawan?.departemen?.namaDepartemen || '-',
      periodeLabel: bulanLabel(akhir.slice(0, 7)),
      totalHariKerja: Number(r.totalHariKerja) || 0,
      gajiPokok: Number(r.gajiPokok) || 0,
      gajiPokokSesuaiHari: Number(r.gajiPokokSesuaiHari) || 0,
      tarifKonsumsi: Number(r.tarifKonsumsiPerHari) || 0,
      tunjanganKonsumsi: Number(r.tunjanganKonsumsi) || 0,
      tunjanganTransportasi: Number(r.tunjanganTransportasi) || 0,
      tunjanganKomunikasi: Number(r.tunjanganKomunikasi) || 0,
      tunjanganJabatan: Number(r.tunjanganJabatan) || 0,
      lembur: Number(r.lembur) || 0,
      totalPenghasilan: Number(r.totalPenghasilan) || 0,
      potonganBpjs: Number(r.potonganBpjs) || 0,
      potonganTerlambat: Number(r.potonganTerlambat) || 0,
      potonganPinjaman: Number(r.potonganPinjaman) || 0,
      potonganLainnya: Number(r.potonganLainnya) || 0,
      sisaPinjaman: Number(r.sisaPinjaman) || 0,
      totalGaji: Number(r.totalGaji) || 0,
    };
  }

  private sendSlips(res: Response, slips: SlipData[], baseName: string, format?: string) {
    if (format === 'excel') {
      const wb = new ExcelJS.Workbook();
      const used = new Set<string>();
      for (const s of slips) addSlipWorksheet(wb, s, uniqueSheetName(s.nama, used));
      return sendWorkbook(res, wb, `${baseName}.xlsx`);
    }
    streamPdf(
      res,
      `${baseName}.pdf`,
      'portrait',
      (doc) => {
        slips.forEach((s, i) => {
          if (i > 0) doc.addPage();
          drawSlipPage(doc, s);
        });
      },
      { footer: false },
    );
  }

  /** Slip gaji HRD: per orang (idKaryawan) atau semua karyawan dalam periode. */
  async exportSlipGaji(
    res: Response,
    periode: string | undefined,
    idKaryawan: number | undefined,
    departemen: string | undefined,
    format?: string,
  ) {
    const bulan = this.resolveBulan(periode);
    const records = await this.getPenggajianData(bulan, { idKaryawan, departemen });
    if (records.length === 0) {
      throw new NotFoundException(
        `Slip gaji periode ${bulanLabel(bulan)} belum dibuat. Jalankan Generate Payroll terlebih dahulu.`,
      );
    }
    const slips = records.map((r) => this.slipFromPenggajian(r));
    const subjek = records.length === 1 ? fileSafe(slips[0].nama) : 'SEMUA_KARYAWAN';
    return this.sendSlips(res, slips, `SLIP_GAJI_${subjek}_${fileSafe(bulanLabel(bulan))}`, format);
  }

  // ===================== EKSPOR MOBILE (KARYAWAN SENDIRI) =====================

  /** Slip gaji karyawan yang login (resmi atau pratinjau berjalan). */
  async exportMySlip(res: Response, idKaryawan: number, tanggal?: string, format?: string) {
    const s: any = await this.penggajianService.getMySlip(idKaryawan, tanggal);
    const slip: SlipData = {
      nama: s.karyawan?.nama || '-',
      jabatan: s.karyawan?.jabatan || '-',
      divisi: s.karyawan?.departemen || '-',
      periodeLabel: bulanLabel(normalizeDateOnly(s.periodeAkhir).slice(0, 7)),
      totalHariKerja: Number(s.totalHariKerja) || 0,
      gajiPokok: Number(s.gajiPokok) || 0,
      gajiPokokSesuaiHari: Number(s.gajiPokokSesuaiHari) || 0,
      tarifKonsumsi: Number(s.tarifKonsumsiPerHari) || 0,
      tunjanganKonsumsi: Number(s.tunjanganKonsumsi) || 0,
      tunjanganTransportasi: Number(s.tunjanganTransportasi) || 0,
      tunjanganKomunikasi: Number(s.tunjanganKomunikasi) || 0,
      tunjanganJabatan: Number(s.tunjanganJabatan) || 0,
      lembur: Number(s.lembur) || 0,
      totalPenghasilan: Number(s.totalPenghasilan) || 0,
      potonganBpjs: Number(s.potonganBpjs) || 0,
      potonganTerlambat: Number(s.potonganTerlambat) || 0,
      potonganPinjaman: Number(s.potonganPinjaman) || 0,
      potonganLainnya: Number(s.potonganLainnya) || 0,
      sisaPinjaman: Number(s.sisaPinjaman) || 0,
      totalGaji: Number(s.totalGaji) || 0,
      isPreview: !s.isOfficial,
    };
    return this.sendSlips(
      res,
      [slip],
      `SLIP_GAJI_${fileSafe(slip.nama)}_${fileSafe(slip.periodeLabel)}`,
      format,
    );
  }

  /** Rekap/riwayat absensi bulanan karyawan yang login (format kop resmi). */
  async exportMyAbsensi(res: Response, idKaryawan: number, bulan?: string, format?: string) {
    return this.exportRekapAbsensi(res, { idKaryawan }, bulan, format);
  }
}
