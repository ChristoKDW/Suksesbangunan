import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { Absensi } from '../absensi/entities/absensi.entity.js';
import { PengajuanIzin } from '../pengajuan-izin/entities/pengajuan-izin.entity.js';
import { Penggajian } from '../penggajian/entities/penggajian.entity.js';
import { Karyawan } from '../karyawan/entities/karyawan.entity.js';
import { JadwalKerja } from '../jadwal-kerja/entities/jadwal-kerja.entity.js';
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
import { LEGEND_PURPOSE_IFT } from './bni-legend.const.js';

type ReportUser = { role?: string; idDepartemen?: number };

const BULAN_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const HARI_SINGKAT = ['Mgg', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

/** Pemetaan nama bank → kode peserta BI-FAST (bank besar umum di Indonesia). */
const BIFAST_BANK_CODES: [RegExp, string][] = [
  [/bsi|syariah indonesia/, 'BSMDIDJA'],
  [/bca/, 'CENAIDJA'],
  [/mandiri/, 'BMRIIDJA'],
  [/bri\b|rakyat indonesia/, 'BRINIDJA'],
  [/btn|tabungan negara/, 'BTANIDJA'],
  [/cimb|niaga/, 'BNIAIDJA'],
  [/danamon/, 'BDINIDJA'],
  [/permata/, 'BBBAIDJA'],
  [/panin/, 'PINBIDJA'],
  [/maybank/, 'IBBKIDJA'],
  [/ocbc|nisp/, 'NISPIDJA'],
  [/mega/, 'MEGAIDJA'],
  [/btpn|smbc/, 'SUNIIDJA'],
  [/sinarmas/, 'SBJKIDJA'],
  [/muamalat/, 'MUABIDJA'],
  [/bjb|jabar/, 'PDJBIDJA'],
  [/dbs/, 'DBSBIDJA'],
  [/uob/, 'UOVBIDJA'],
];

function bifastCode(namaBank: string): string {
  const nb = (namaBank || '').toLowerCase();
  for (const [pattern, code] of BIFAST_BANK_CODES) {
    if (pattern.test(nb)) return code;
  }
  return ''; // kolom wajib — HRD melengkapi manual jika bank tidak dikenali
}

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

function fmtDateTime(value: Date | string | null | undefined): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', {
    timeZone: BUSINESS_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtRp(value: number): string {
  return `Rp ${Math.round(Number(value) || 0).toLocaleString('id-ID')}`;
}

function bulanLabel(yyyyMm: string): string {
  const [y, m] = yyyyMm.split('-').map(Number);
  return `${BULAN_ID[(m || 1) - 1]} ${y}`;
}

/** Hilangkan karakter yang dilarang BNIDirect (lihat sheet Restricted Characters). */
function sanitizeBni(value: string): string {
  return (value || '').replace(/[,`~!@#$%^&*_{}<>[\]=\\;]/g, ' ').trim();
}

/** Kop surat perusahaan + judul untuk worksheet Excel. */
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
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  return workbook.xlsx.write(res);
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
  ) {}

  // ===================== DATA HELPERS =====================

  private resolveBulan(periodeBulan?: string): string {
    if (periodeBulan && /^\d{4}-\d{2}$/.test(periodeBulan)) return periodeBulan;
    return businessDateOf(new Date()).slice(0, 7);
  }

  /** SPV hanya boleh melihat departemennya sendiri. */
  private scopeDepartemen(departemen: string | undefined, user?: ReportUser) {
    if (user?.role === 'SPV') return String(user.idDepartemen ?? -1);
    return departemen;
  }

  private async getKehadiranData(
    periodeBulan?: string,
    departemen?: string,
    user?: ReportUser,
  ) {
    const bulan = this.resolveBulan(periodeBulan);
    const [y, m] = bulan.split('-').map(Number);
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const { start, end } = businessDayRange(
      `${bulan}-01`,
      `${bulan}-${String(lastDay).padStart(2, '0')}`,
    );
    const deptFilter = this.scopeDepartemen(departemen, user);
    const records = await this.absensiRepo.find({
      where: { jamMasukAktual: Between(start, end) },
      relations: { karyawan: { departemen: true } },
      order: { jamMasukAktual: 'ASC' },
    });
    const filtered =
      deptFilter && deptFilter !== 'all' && deptFilter !== 'undefined'
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
    if (
      statusApproval &&
      statusApproval !== 'Semua Status' &&
      statusApproval !== 'undefined'
    ) {
      qb.andWhere('izin.status = :status', {
        status: statusApproval.toLowerCase(),
      });
    }
    if (rentangWaktu && /^\d{4}-\d{2}$/.test(rentangWaktu)) {
      const [y, m] = rentangWaktu.split('-').map(Number);
      const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
      qb.andWhere(
        'izin.tanggal_mulai <= :selesai AND izin.tanggal_selesai >= :mulai',
        {
          mulai: `${rentangWaktu}-01`,
          selesai: `${rentangWaktu}-${String(lastDay).padStart(2, '0')}`,
        },
      );
    }
    if (user?.role === 'SPV') {
      qb.andWhere('karyawan.id_departemen = :idDept', {
        idDept: user.idDepartemen ?? -1,
      });
    }
    return qb.getMany();
  }

  private async getPenggajianData(periode?: string) {
    const qb = this.penggajianRepo
      .createQueryBuilder('gaji')
      .leftJoinAndSelect('gaji.karyawan', 'karyawan')
      .leftJoinAndSelect('karyawan.departemen', 'departemen')
      .leftJoinAndSelect('karyawan.jabatan', 'jabatan')
      .orderBy('gaji.id_gaji', 'DESC');
    if (periode && /^\d{4}-\d{2}$/.test(periode)) {
      // Periode cut-off bisa mulai di tanggal berapa pun dalam bulan tsb
      const [y, m] = periode.split('-').map(Number);
      const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
      qb.andWhere('gaji.periode_awal BETWEEN :a AND :b', {
        a: `${periode}-01`,
        b: `${periode}-${String(lastDay).padStart(2, '0')}`,
      });
    }
    return qb.getMany();
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
      rentangWaktu && /^\d{4}-\d{2}$/.test(rentangWaktu)
        ? `Periode ${bulanLabel(rentangWaktu)}`
        : 'Semua Periode',
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
        rentangWaktu && /^\d{4}-\d{2}$/.test(rentangWaktu)
          ? `Periode ${bulanLabel(rentangWaktu)}`
          : 'Semua Periode',
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

  async exportPenggajian(res: Response, periode: string, _grup: string) {
    const records = await this.getPenggajianData(periode);
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Laporan Penggajian');
    const columns = [
      'No', 'NIK', 'Nama Karyawan', 'Departemen', 'Jabatan',
      'Periode Awal', 'Periode Akhir', 'Hari Kerja', 'Hari Hadir',
      'Gaji Pokok', 'Gaji Sesuai Hari', 'Tunj. Konsumsi', 'Tunj. Transport',
      'Tunj. Komunikasi', 'Tunj. Jabatan', 'Lembur', 'Total Penghasilan',
      'Pot. BPJS', 'Pot. Terlambat', 'Pot. Pinjaman', 'Pot. Lainnya',
      'Total Potongan', 'Take Home Pay',
    ];
    ws.columns = columns.map((_, i) => ({ width: i < 5 ? 20 : 16 }));
    const headerRowIdx = addExcelHeader(
      ws,
      columns.length,
      'LAPORAN PENGGAJIAN KARYAWAN',
      periode && /^\d{4}-\d{2}$/.test(periode)
        ? `Periode Cut-off Bulan ${bulanLabel(periode)}`
        : 'Semua Periode',
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
      ]);
      for (let c = 10; c <= 23; c++) {
        row.getCell(c).numFmt = '#,##0';
      }
    });
    return sendWorkbook(res, workbook, 'Laporan_Penggajian.xlsx');
  }

  async exportPenggajianPdf(res: Response, periode: string) {
    const records = await this.getPenggajianData(periode);
    streamPdf(res, 'Laporan_Penggajian.pdf', 'landscape', (doc) => {
      drawCompanyHeader(
        doc,
        'LAPORAN PENGGAJIAN KARYAWAN',
        periode && /^\d{4}-\d{2}$/.test(periode)
          ? `Periode Cut-off Bulan ${bulanLabel(periode)}`
          : 'Semua Periode',
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
    });
  }

  // ===================== BNIDIRECT (TRANSFER PAYROLL) =====================

  /**
   * Excel format BNIDirect sheet "Inhouse" (template v1.9.6) untuk upload
   * transfer gaji massal. Amount diambil dari THP slip gaji periode terpilih.
   */
  async exportBniDirect(
    res: Response,
    periodeAwal?: string,
    rekDebet?: string,
    tglTransaksi?: string,
    remark?: string,
    format?: string,
  ) {
    let periode = periodeAwal ? normalizeDateOnly(periodeAwal) : undefined;
    if (!periode) {
      const latest = await this.penggajianRepo
        .createQueryBuilder('gaji')
        .select('MAX(gaji.periode_awal)', 'max')
        .getRawOne<{ max: string }>();
      if (!latest?.max) {
        throw new BadRequestException(
          'Belum ada data penggajian untuk diekspor ke BNIDirect',
        );
      }
      periode = normalizeDateOnly(latest.max);
    }
    const records = await this.penggajianRepo.find({
      where: { periodeAwal: periode as any },
      relations: { karyawan: true },
      order: { idGaji: 'ASC' },
    });
    if (records.length === 0) {
      throw new BadRequestException(
        `Tidak ada slip gaji dengan periode awal ${periode}`,
      );
    }

    const withRekening = records.filter(
      (r) => (r.karyawan?.noRekening || '').trim() !== '',
    );
    const tanpaRekening = records.filter(
      (r) => (r.karyawan?.noRekening || '').trim() === '',
    );
    // Rekening BNI (atau nama bank kosong = dianggap BNI) → sheet Inhouse;
    // bank lain → sheet BIFAST dengan kode bank otomatis dari nama bank.
    const isBni = (r: Penggajian) => {
      const nb = (r.karyawan?.namaBank || '').toLowerCase();
      return nb === '' || (nb.includes('bni') && !nb.includes('bni syariah'));
    };
    const bniRecords = withRekening.filter(isBni);
    const bankLainRecords = withRekening.filter((r) => !isBni(r));
    const jumlah = (list: Penggajian[]) =>
      list.reduce((s, r) => s + Math.round(Number(r.totalGaji) || 0), 0);
    const totalAmount = jumlah(bniRecords);
    const remarkFinal = sanitizeBni(
      remark || `PAYROLL ${COMPANY_NAME.replace('CV. ', '')}`,
    ).slice(0, 33);
    const tglTrx =
      tglTransaksi && /^\d{8}$/.test(tglTransaksi)
        ? tglTransaksi
        : businessDateOf(new Date()).replace(/-/g, '');

    // format=csv: hasilkan file CSV persis output macro "Create CSV"
    // (Make_IH_CSV, template v1.9.6) — langsung siap upload ke BNIDirect.
    if (format === 'csv') {
      const now = new Date();
      const tanggal = businessDateOf(now);
      const jam = fmtTime(now).replace(':', ':');
      const stamp = `${tanggal.replace(/-/g, '/')}_${jam}:00`;
      const fileStamp = `${tanggal.replace(/-/g, '')}_${jam.replace(':', '')}00`;
      const pad = (fields: string[]) => {
        while (fields.length < 20) fields.push('');
        return fields.join(',');
      };
      const lines = [
        pad([stamp, String(bniRecords.length + 2), 'SUKSES BANGUNINDO']),
        pad([
          'P',
          tglTrx,
          sanitizeBni(rekDebet || '').replace(/\./g, ''),
          String(bniRecords.length),
          String(totalAmount),
        ]),
        ...bniRecords.map((r) => {
          const fields = [
            sanitizeBni(r.karyawan!.noRekening || ''),
            sanitizeBni((r.karyawan?.nama || '').toUpperCase()).slice(0, 40),
            String(Math.round(Number(r.totalGaji) || 0)),
            remarkFinal,
          ];
          while (fields.length < 16) fields.push('');
          // EMAIL FLAG, Email, Reff Num, FLAG — kosong = N sesuai macro
          fields.push('N', '', '', 'N');
          return fields.join(',');
        }),
      ];
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=SUKSES_BANGUNINDO_IH_${fileStamp}.csv`,
      );
      res.send(lines.join('\r\n') + '\r\n');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const now = new Date();
    const stampNow = `${businessDateOf(now).replace(/-/g, '/')}_${fmtTime(now)}:00`;

    /** Kerangka sheet transfer persis template v1.9.6 (baris 1-9). */
    const addBniSheet = (
      name: string,
      row7: (string | number)[],
      row8: (string | number)[],
      row9: string[],
      namaFile = '',
      dataRows: (string | number)[][] = [],
    ) => {
      const sheet = workbook.addWorksheet(name);
      sheet.columns = row9.map((_, i) => ({
        width: i === 0 ? 20 : i === 1 ? 32 : 16,
      }));
      sheet.getCell('B1').value = 'Langkah Penggunaan:';
      sheet.getCell('C1').value =
        '1. Lakukan pengisian tabel di bawah, kolom merah wajib diisi';
      sheet.getCell('C2').value =
        '2. Klik tombol Create CSV. Lokasi File CSV = Lokasi Template Excel';
      sheet.getCell('C3').value = '3. Total Record Max 5000';
      sheet.getCell('A5').value = 'File Creation(auto)';
      sheet.getCell('C5').value = 'Nama File';
      sheet.getCell('A6').value = stampNow;
      if (namaFile) sheet.getCell('C6').value = namaFile;
      const r7 = sheet.getRow(7);
      r7.values = row7;
      r7.eachCell((c) => (c.font = { bold: true }));
      sheet.getRow(8).values = row8;
      const r9 = sheet.getRow(9);
      r9.values = row9;
      styleHeaderRow(r9);
      for (const dr of dataRows) sheet.addRow(dr);
      return sheet;
    };

    const headerUtama = [
      'P(auto)', 'Tgl Transaksi', 'Rek. Debet(16)',
      'Total Record(auto)', 'Total Amount(auto)',
    ];
    const kolomBankLengkap = [
      'NAMA CABANG(100)', 'ALAMAT BANK1(50)', 'ALAMAT BANK2(50)',
      'ALAMAT BANK3(50)', 'NAMA KOTA(100)', 'NAMA NEGARA(100)',
      'WARGA NEGARA(40)', 'KODE WN(40)', 'EMAIL FLAG(1)', 'Email(100)',
      'Reff Num(16)', 'FLAG(1)',
    ];

    // Sheet 1: Inhouse — satu-satunya yang terisi data payroll (transfer antar
    // rekening BNI). Sheet lain adalah kerangka kosong sesuai template.
    const ws = addBniSheet(
      'Inhouse',
      headerUtama,
      ['P', tglTrx, sanitizeBni(rekDebet || ''), bniRecords.length, totalAmount],
      [
        'Rek. Tujuan(16)', 'Nama Penerima(40)', 'Amount', 'Remark1(33)',
        'Remark2(50)', 'Remark3(50)', 'KODEBANK(8)--(M)',
        'NAMA BANK TUJUAN(100)--(M)', ...kolomBankLengkap,
      ],
      'SUKSES BANGUNINDO',
    );
    for (const r of bniRecords) {
      ws.addRow([
        sanitizeBni(r.karyawan!.noRekening || ''),
        sanitizeBni((r.karyawan?.nama || '').toUpperCase()).slice(0, 40),
        Math.round(Number(r.totalGaji) || 0),
        remarkFinal,
      ]);
    }

    // Sheet 2-7: jenis transfer lain (kerangka kosong, sesuai template)
    addBniSheet('Kliring', headerUtama, ['P'], [
      'Rek. Tujuan(34)', 'Nama Penerima(40)', 'Amount', 'Remark1(33)',
      'Remark2(50)', 'Remark3(50)', 'Clearing Code(7)', 'Bank Tujuan(35)',
      ...kolomBankLengkap,
    ]);
    addBniSheet('RTGS', headerUtama, ['P'], [
      'Rek. Tujuan(16)', 'Nama Penerima(80)', 'Amount', 'Remark1(33)',
      'Remark2(50)', 'Remark3(50)', 'RTGS Member(8)', 'Bank Tujuan(35)',
      ...kolomBankLengkap,
    ]);
    addBniSheet('Online', headerUtama, ['P'], [
      'Rek. Tujuan(16)', 'Nama Penerima(80)', 'Amount', 'Remark1(33)',
      'Remark2(50)', 'Remark3(50)', 'Online Bank Code(3)', 'Bank Tujuan(35)',
      ...kolomBankLengkap,
    ]);
    addBniSheet(
      'IFT',
      [...headerUtama, 'Remitter Country Code(oto)', 'ID Code(auto)', '', 'N(oto)'],
      ['P', '', '', '', '', 'ID', 'ID', '', 'N'],
      [
        'Rek. Tujuan(35)', 'Nama Penerima(35)', 'Amount', 'Remark(50)',
        'Remark2(50)', 'Remark3(40)', 'Alamat Penerima (35)',
        'Kota Penerima(35)', 'Beneficiary Address3 (50)', 'BIC Swift Code(11)',
        'Bank Tujuan(35)', 'BeneficiaryBankBranchName (35)',
        'Kota Bank Tujuan(35)', 'Negara Bank Tujuan(35)',
        'BeneficiaryBankAddress3 (50)', 'BeneficiaryBankCityName (100)',
        'BeneBankCountry(35)', 'BeneficiaryCountryResidence (40)',
        'BeneficiaryCitizenshipCode (40)', 'BeneficiaryNotificationFlag (1)',
        'Email (100)', 'BeneficiaryNotificationFlag-SMS (1)',
        'BeneficiaryNotificationTargetValue-SMS (100)',
        'BeneficiaryNotificationFlag-Fax (1)',
        'BeneficiaryNotificationTargetValue-Fax (100)',
        'CorrespondentBankName (40)', 'Transaction Purpose Code (40)',
        'Affiliated Flag (1)', 'Identical Flag (1)',
        'Beneficiary Category Code (40)', 'LLD Desc(18)', 'Reff Num(16)',
        'FinalizePaymentFlag (1)',
      ],
    );
    addBniSheet(
      'Autodebet',
      ['P(auto)', 'Tgl Transaksi', 'Rek. Kredit(16)', 'Total Record(auto)', 'Total Amount(auto)'],
      ['P'],
      [
        'Rek. Terdebit(16)', 'Nama Terdebit(40)', 'Amount', 'Remark1(33)',
        'Remark2(50)', 'Remark3(50)', 'EMAIL FLAG(1)', 'Email(100)',
        'Reff Num(16)', 'FLAG(1)--(M)', 'Ben Ref Num (16)',
      ],
    );
    addBniSheet(
      'BIFAST',
      headerUtama,
      bankLainRecords.length > 0
        ? ['P', tglTrx, sanitizeBni(rekDebet || ''), bankLainRecords.length, jumlah(bankLainRecords)]
        : ['P'],
      [
        'Rek. Tujuan(17)', 'Nama Penerima(100)', 'Amount', 'Remark1(100)',
        'Remark2(100)', 'Remark3(100)', 'BIFast Code(40)', 'Bank Tujuan(100)',
        ...kolomBankLengkap.slice(0, 10), 'Reff Num(16)', 'FLAG RefNum',
        'Counter Party Reference No/ Beneficiary Reference No', 'Tipe Kode',
        'Flag Proxy', 'User Proxy', 'Transaction Purpose',
      ],
      bankLainRecords.length > 0 ? 'SUKSES BANGUNINDO' : '',
      // Karyawan dengan rekening bank selain BNI otomatis masuk sini,
      // kode BI-FAST terisi dari nama bank di data karyawan.
      bankLainRecords.map((r) => [
        sanitizeBni(r.karyawan!.noRekening || ''),
        sanitizeBni((r.karyawan?.nama || '').toUpperCase()).slice(0, 100),
        Math.round(Number(r.totalGaji) || 0),
        remarkFinal,
        '',
        '',
        bifastCode(r.karyawan?.namaBank || ''),
        sanitizeBni((r.karyawan?.namaBank || '').toUpperCase()),
      ]),
    );

    // Sheet 8: Restricted Characters (disalin dari template)
    const wsChar = workbook.addWorksheet('Restricted Characters');
    wsChar.columns = [{ width: 10 }, { width: 30 }];
    wsChar.getCell('A1').value = 'Restricted Characters List';
    wsChar.getCell('A1').font = { bold: true };
    const restricted: [string, string][] = [
      [',', 'Comma'], ['`', 'grave accent'], ['~', 'tilde'],
      ['!', 'exclamation mark'], ['@', 'at sign'], ['#', 'number sign'],
      ['$', 'dollar sign'], ['%', 'percent sign'], ['^', 'circumflex accent'],
      ['&', 'ampersand'], ['*', 'asterisk'], ['_', 'underscore'],
      ['{', 'left curly bracket'], ['}', 'right curly bracket'],
      ['<', 'less-than'], ['>', 'greater-than'], ['[', 'left bracket'],
      [']', 'right bracket'], ['=', 'equals'], ['\\', 'backslash'],
      [';', 'semicolon'],
    ];
    const hdrChar = wsChar.getRow(3);
    wsChar.getCell('B3').value = 'Glyph';
    wsChar.getCell('C3').value = 'Description';
    hdrChar.font = { bold: true };
    restricted.forEach(([g, d]) => wsChar.addRow(['', g, d]));
    wsChar.columns = [{ width: 4 }, { width: 10 }, { width: 30 }];

    // Sheet 9: Legend — kode Transaction Purpose IFT & BIFAST (dari template)
    const wsLegend = workbook.addWorksheet('Legend');
    wsLegend.columns = [{ width: 4 }, { width: 110 }, { width: 4 }, { width: 30 }];
    wsLegend.getCell('B2').value = 'Transaction_Purpose_IFT';
    wsLegend.getCell('D3').value = 'Transaction_Purpose_BIFAST';
    wsLegend.getCell('B2').font = { bold: true };
    wsLegend.getCell('D3').font = { bold: true };
    const purposeBifast = [
      '01 - Pemindahan Dana', '02 - Investasi', '03 - Pembelian', '99 - Lainnya',
    ];
    purposeBifast.forEach((v, i) => (wsLegend.getCell(`D${5 + i}`).value = v));
    LEGEND_PURPOSE_IFT.forEach((v, i) => (wsLegend.getCell(`B${4 + i}`).value = v));

    // Sheet tambahan sistem: karyawan tanpa nomor rekening agar HRD melengkapi
    if (tanpaRekening.length > 0) {
      const ws2 = workbook.addWorksheet('Tanpa Rekening');
      ws2.columns = [{ width: 8 }, { width: 18 }, { width: 32 }, { width: 18 }];
      const hdr = ws2.getRow(1);
      hdr.values = ['No', 'NIK', 'Nama Karyawan', 'THP'];
      styleHeaderRow(hdr);
      tanpaRekening.forEach((r, i) => {
        ws2.addRow([
          i + 1,
          r.karyawan?.nik || '-',
          r.karyawan?.nama || '-',
          Math.round(Number(r.totalGaji) || 0),
        ]);
      });
    }

    return sendWorkbook(res, workbook, `BNIDIRECT_Payroll_${periode}.xlsx`);
  }

  // ===================== ABSENSI PERORANGAN =====================

  /**
   * Data absensi bulanan perorangan dengan format identik template
   * "ABSENSI <NAMA> <BULAN>" (TGL | MASUK | KELUAR, OFF untuk hari libur).
   */
  private async getAbsensiKaryawanData(idKaryawan: number, bulan?: string) {
    const karyawan = await this.karyawanRepo.findOne({
      where: { idKaryawan },
      relations: { departemen: true, jabatan: true },
    });
    if (!karyawan) {
      throw new NotFoundException('Karyawan tidak ditemukan');
    }
    const bulanStr = this.resolveBulan(bulan);
    const [y, m] = bulanStr.split('-').map(Number);
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const startStr = `${bulanStr}-01`;
    const endStr = `${bulanStr}-${String(lastDay).padStart(2, '0')}`;
    const { start, end } = businessDayRange(startStr, endStr);

    const absensiList = await this.absensiRepo.find({
      where: { idKaryawan, jamMasukAktual: Between(start, end) },
      order: { jamMasukAktual: 'ASC' },
    });
    const byDate = new Map<string, { masuk: string; keluar: string }>();
    for (const a of absensiList) {
      if (!a.jamMasukAktual) continue;
      const key = businessDateOf(new Date(a.jamMasukAktual));
      const existing = byDate.get(key);
      if (!existing) {
        byDate.set(key, {
          masuk: fmtTime(a.jamMasukAktual),
          keluar: fmtTime(a.jamKeluarAktual),
        });
      } else if (a.jamKeluarAktual) {
        existing.keluar = fmtTime(a.jamKeluarAktual);
      }
    }

    const jadwalList = await this.jadwalRepo.find({
      where: { idKaryawan, tanggal: Between(startStr as any, endStr as any) },
    });
    const liburDates = new Set(
      jadwalList
        .filter((j) => j.isLibur)
        .map((j) => normalizeDateOnly(j.tanggal)),
    );

    const rows = dateRange(startStr, endStr).map((tanggal) => {
      const day = new Date(`${tanggal}T00:00:00.000Z`).getUTCDay();
      const label = `${tanggal.slice(8, 10)} ${HARI_SINGKAT[day]}`;
      const absen = byDate.get(tanggal);
      if (absen) return [label, absen.masuk, absen.keluar];
      if (liburDates.has(tanggal)) return [label, 'OFF', ''];
      return [label, '-', '-'];
    });

    return {
      karyawan,
      bulanStr,
      judulBulan: `${BULAN_ID[m - 1].toUpperCase()} ${y}`,
      rows,
    };
  }

  async exportAbsensiKaryawanExcel(
    res: Response,
    idKaryawan: number,
    bulan?: string,
  ) {
    const { karyawan, bulanStr, judulBulan, rows } =
      await this.getAbsensiKaryawanData(idKaryawan, bulan);
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Absensi');
    ws.columns = [{ width: 14 }, { width: 12 }, { width: 12 }];
    const headerRowIdx = addExcelHeader(
      ws,
      3,
      karyawan.nama.toUpperCase(),
      `ABSENSI ${judulBulan}`,
    );
    const header = ws.getRow(headerRowIdx);
    header.values = ['TGL', 'MASUK', 'KELUAR'];
    styleHeaderRow(header);
    for (const r of rows) {
      const row = ws.addRow(r);
      row.eachCell((cell) => {
        cell.alignment = { horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
      if (r[1] === 'OFF') {
        ws.mergeCells(row.number, 2, row.number, 3);
      }
    }
    ws.addRow([]);
    ws.addRow([]);
    const today = new Date();
    const tglCetak = `${today.getDate()} ${BULAN_ID[today.getMonth()]} ${today.getFullYear()}`;
    ws.addRow(['', '', tglCetak]);
    ws.addRow(['', '', 'Hormat saya']);
    ws.addRow(['', '', COMPANY_NAME]);
    ws.addRow([]);
    ws.addRow([]);
    ws.addRow(['', '', '(______________)']);
    return sendWorkbook(
      res,
      workbook,
      `Absensi_${karyawan.nama.replace(/\s+/g, '_')}_${bulanStr}.xlsx`,
    );
  }

  async exportAbsensiKaryawanPdf(
    res: Response,
    idKaryawan: number,
    bulan?: string,
  ) {
    const { karyawan, bulanStr, judulBulan, rows } =
      await this.getAbsensiKaryawanData(idKaryawan, bulan);
    streamPdf(
      res,
      `Absensi_${karyawan.nama.replace(/\s+/g, '_')}_${bulanStr}.pdf`,
      'portrait',
      (doc) => {
        drawCompanyHeader(
          doc,
          karyawan.nama.toUpperCase(),
          `ABSENSI ${judulBulan}`,
        );
        // Tabel dipusatkan seperti template absensi perorangan
        const tableWidth = 90 + 80 + 80;
        doc.x =
          doc.page.margins.left +
          (doc.page.width - doc.page.margins.left - doc.page.margins.right - tableWidth) / 2;
        const startX = doc.x;
        const colDefs = [
          { label: 'TGL', width: 90, align: 'center' as const },
          { label: 'MASUK', width: 80, align: 'center' as const },
          { label: 'KELUAR', width: 80, align: 'center' as const },
        ];
        const marginBackup = doc.page.margins.left;
        doc.page.margins.left = startX;
        drawTable(doc, colDefs, rows, { rowHeight: 15, fontSize: 8 });
        doc.page.margins.left = marginBackup;

        const today = new Date();
        const tglCetak = `${today.getDate()} ${BULAN_ID[today.getMonth()]} ${today.getFullYear()}`;
        doc.moveDown(1);
        const rightX = doc.page.width - doc.page.margins.right - 180;
        doc.font('Helvetica').fontSize(9);
        doc.text(tglCetak, rightX, doc.y, { width: 180, align: 'center' });
        doc.text('Hormat saya', rightX, doc.y, { width: 180, align: 'center' });
        doc.text(COMPANY_NAME, rightX, doc.y, { width: 180, align: 'center' });
        doc.moveDown(3);
        doc.text('(______________)', rightX, doc.y, {
          width: 180,
          align: 'center',
        });
      },
    );
  }
}
