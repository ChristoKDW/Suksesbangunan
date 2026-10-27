import * as ExcelJS from 'exceljs';
import {
  COMPANY_ADDRESS_LINES,
  COMPANY_NAME,
  LOGO_IMAGE,
  SIGNER_COMPANY,
  SIGNER_NAME,
  STAMP_IMAGE,
  drawKopSurat,
  drawSignatureBlock,
  tanggalSurat,
} from './pdf.util.js';

// ============================================================================
// REKAP ABSENSI PERORANGAN (template "ABSENSI <NAMA> <BULAN>")
// ============================================================================

/** Satu baris tanggal: jam masuk/keluar, atau label penuh (OFF, SAKIT, ...). */
export interface AbsensiRow {
  tgl: string; // "01 Sel"
  masuk?: string;
  keluar?: string;
  label?: string; // diisi = sel MASUK+KELUAR digabung
}

export interface AbsensiSheet {
  nama: string; // judul tabel (nama panggilan / nama)
  namaLengkap: string;
  rows: AbsensiRow[];
}

const COL_W = [48, 49, 48];
const ROW_H = 15.3;

function cell(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  text: string,
  align: 'left' | 'center',
) {
  doc.rect(x, y, w, ROW_H).lineWidth(0.5).stroke('#000000');
  doc.text(text, x + (align === 'left' ? 4 : 0), y + 4.4, {
    width: align === 'left' ? w - 6 : w,
    align,
    lineBreak: false,
  });
}

/** Satu halaman rekap absensi persis template HRD (kop + tabel + cap). */
export function drawAbsensiPage(doc: PDFKit.PDFDocument, sheet: AbsensiSheet) {
  drawKopSurat(doc);
  const x0 = doc.page.margins.left;
  const total = COL_W[0] + COL_W[1] + COL_W[2];
  let y = doc.y + 2;
  doc.font('Helvetica').fontSize(8).fillColor('#000000');

  cell(doc, x0, y, total, sheet.nama, 'center');
  y += ROW_H;
  cell(doc, x0, y, COL_W[0], 'TGL', 'left');
  cell(doc, x0 + COL_W[0], y, COL_W[1], 'MASUK', 'left');
  cell(doc, x0 + COL_W[0] + COL_W[1], y, COL_W[2], 'KELUAR', 'left');
  y += ROW_H;

  for (const r of sheet.rows) {
    cell(doc, x0, y, COL_W[0], r.tgl, 'center');
    if (r.label !== undefined) {
      cell(doc, x0 + COL_W[0], y, COL_W[1] + COL_W[2], r.label, 'center');
    } else {
      cell(doc, x0 + COL_W[0], y, COL_W[1], r.masuk ?? '', 'left');
      cell(doc, x0 + COL_W[0] + COL_W[1], y, COL_W[2], r.keluar ?? '', 'left');
    }
    y += ROW_H;
  }

  drawSignatureBlock(doc, x0, y + 20);
}

const BROWN = 'FF7B3F12';
const thin: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' }, bottom: { style: 'thin' },
  left: { style: 'thin' }, right: { style: 'thin' },
};

/** Kop surat di worksheet Excel (logo + nama/alamat + garis ganda cokelat). */
function addExcelKop(wb: ExcelJS.Workbook, ws: ExcelJS.Worksheet, lastCol: number) {
  if (LOGO_IMAGE) {
    const id = wb.addImage({ buffer: LOGO_IMAGE as any, extension: 'jpeg' });
    ws.addImage(id, { tl: { col: 1.4, row: 0.1 }, ext: { width: 56, height: 76 } });
  }
  const lines = [COMPANY_NAME, ...COMPANY_ADDRESS_LINES];
  lines.forEach((text, i) => {
    const r = i + 1;
    ws.mergeCells(r, 3, r, lastCol);
    const c = ws.getCell(r, 3);
    c.value = text;
    c.alignment = { horizontal: 'center', vertical: 'middle' };
    c.font = i === 0 ? { name: 'Times New Roman', bold: true, size: 11 } : { name: 'Arial', size: 8 };
  });
  for (let c = 1; c <= lastCol; c++) {
    ws.getCell(6, c).border = { bottom: { style: 'double', color: { argb: BROWN } } };
  }
  ws.getRow(5).height = 14;
  ws.getRow(6).height = 8;
}

/** Satu worksheet rekap absensi per karyawan dengan kop & cap. */
export function addAbsensiWorksheet(wb: ExcelJS.Workbook, sheet: AbsensiSheet, sheetName: string) {
  const ws = wb.addWorksheet(sheetName, {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 1 },
  });
  ws.columns = [{ width: 10 }, { width: 10 }, { width: 10 }, ...Array(6).fill({ width: 11 })];
  addExcelKop(wb, ws, 9);

  const font = { name: 'Arial', size: 9 };
  let r = 8;
  ws.mergeCells(r, 1, r, 3);
  ws.getCell(r, 1).value = sheet.nama;
  ws.getCell(r, 1).alignment = { horizontal: 'center' };
  ['TGL', 'MASUK', 'KELUAR'].forEach((t, i) => (ws.getCell(r + 1, i + 1).value = t));
  for (const rr of [r, r + 1]) {
    for (let c = 1; c <= 3; c++) {
      ws.getCell(rr, c).border = thin;
      ws.getCell(rr, c).font = font;
    }
  }
  r += 2;
  for (const row of sheet.rows) {
    ws.getCell(r, 1).value = row.tgl;
    ws.getCell(r, 1).alignment = { horizontal: 'center' };
    if (row.label !== undefined) {
      ws.mergeCells(r, 2, r, 3);
      ws.getCell(r, 2).value = row.label;
      ws.getCell(r, 2).alignment = { horizontal: 'center' };
    } else {
      ws.getCell(r, 2).value = row.masuk ?? '';
      ws.getCell(r, 3).value = row.keluar ?? '';
    }
    for (let c = 1; c <= 3; c++) {
      ws.getCell(r, c).border = thin;
      ws.getCell(r, c).font = font;
    }
    r++;
  }

  r += 1;
  const sig = { name: 'Calibri', size: 11 };
  [tanggalSurat(), 'Hormat saya', '', SIGNER_COMPANY].forEach((t, i) => {
    ws.getCell(r + i, 1).value = t;
    ws.getCell(r + i, 1).font = sig;
  });
  r += 4;
  if (STAMP_IMAGE) {
    const id = wb.addImage({ buffer: STAMP_IMAGE as any, extension: 'jpeg' });
    ws.addImage(id, { tl: { col: 0, row: r - 1 }, ext: { width: 150, height: 87 } });
  }
  r += 5;
  ws.getCell(r, 1).value = SIGNER_NAME;
  ws.getCell(r, 1).font = sig;
  return ws;
}

// ============================================================================
// SLIP GAJI KARYAWAN (template "CV SUKSES BANGUNINDO / SLIP GAJI KARYAWAN")
// ============================================================================

export interface SlipData {
  nama: string;
  jabatan: string;
  divisi: string;
  periodeLabel: string; // "Agustus 2026"
  totalHariKerja: number;
  gajiPokok: number;
  gajiPokokSesuaiHari: number;
  tarifKonsumsi: number;
  tunjanganKonsumsi: number;
  tunjanganTransportasi: number;
  tunjanganKomunikasi: number;
  tunjanganJabatan: number;
  lembur: number;
  totalPenghasilan: number;
  potonganBpjs: number;
  potonganTerlambat: number;
  potonganPinjaman: number;
  potonganLainnya: number;
  sisaPinjaman: number;
  totalGaji: number;
  isPreview?: boolean;
}

/** "Rp4.500.000" — format rupiah persis template slip. */
export function rp(value: number): string {
  return `Rp${Math.round(Number(value) || 0).toLocaleString('id-ID')}`;
}

type SlipLine = {
  a?: string;
  b?: string | number;
  c?: string | number;
  bold?: boolean;
  full?: string; // teks satu baris penuh (A:C digabung)
  center?: boolean;
  money?: boolean; // kolom C berupa nominal
};

const CATATAN = [
  '1. Slip gaji bersifat rahasia. Dilarang membagikan informasi gaji kepada sesama karyawan.',
  'Jika melanggar, gaji dapat ditunda 1 bulan dan perubahan gaji (jika ada) dibatalkan.',
  '2. Jika izin sakit dengan surat resmi, hanya tunjangan konsumsi yang dipotong.',
  'Gaji pokok tetap dibayarkan.',
];

function slipLines(s: SlipData): SlipLine[] {
  const lines: SlipLine[] = [
    { full: 'CV SUKSES BANGUNINDO', bold: true, center: true },
    { full: 'SLIP GAJI KARYAWAN', bold: true, center: true },
    { full: `Periode: ${s.periodeLabel}`, bold: true },
  ];
  if (s.isPreview) {
    lines.push({ full: 'PRATINJAU (belum slip resmi, nilai dapat berubah)', center: true });
  }
  lines.push(
    {},
    { a: 'Nama', c: s.nama.toUpperCase(), bold: true },
    { a: 'Jabatan', c: s.jabatan, bold: true },
    { a: 'Divisi', c: s.divisi, bold: true },
    {},
    { a: 'RINCIAN PENGHASILAN', bold: true },
    { a: 'TOTAL TAKE HOME PAY', c: s.totalGaji, bold: true, money: true },
    { a: 'TOTAL HARI KERJA', b: s.totalHariKerja, c: 'HARI', bold: true },
    { a: `Gaji Pokok (${s.totalHariKerja} Hari Kerja)`, c: s.gajiPokok, money: true },
    { a: 'Gaji Pokok sesuai hari kerja', c: s.gajiPokokSesuaiHari, money: true },
    { a: 'Tunjangan Konsumsi', b: rp(s.tarifKonsumsi), c: s.tunjanganKonsumsi, money: true },
    { a: 'Tunjangan Transportasi', c: s.tunjanganTransportasi, money: true },
    { a: 'Tunjangan Komunikasi', c: s.tunjanganKomunikasi, money: true },
    { a: 'Tunjangan Jabatan', c: s.tunjanganJabatan, money: true },
    { a: 'Lembur', c: s.lembur, money: true },
    { a: 'Total Penghasilan', c: s.totalPenghasilan, bold: true, money: true },
    {},
    { a: 'POTONGAN' },
    { a: 'Potongan BPJS KETENAGAKERJAAN', c: s.potonganBpjs, money: true },
    { a: 'Potongan Terlambat', c: s.potonganTerlambat, money: true },
    { a: 'Potongan pinjaman', c: s.potonganPinjaman, money: true },
  );
  if (s.potonganLainnya > 0) {
    lines.push({ a: 'Potongan Lainnya', c: s.potonganLainnya, money: true });
  }
  lines.push(
    { a: 'Sisa Pinjaman', c: s.sisaPinjaman, money: true },
    { a: 'Total Diterima', c: s.totalGaji, bold: true, money: true },
    {},
    { full: 'CATATAN:', bold: true },
    ...CATATAN.map((t) => ({ full: t })),
  );
  return lines;
}

/** Satu halaman slip gaji (grid 3 kolom seperti template spreadsheet HRD). */
export function drawSlipPage(doc: PDFKit.PDFDocument, s: SlipData) {
  const widths = [200, 140, 140];
  const total = widths[0] + widths[1] + widths[2];
  const x0 = (doc.page.width - total) / 2;
  const h = 16;
  let y = 56;

  for (const line of slipLines(s)) {
    doc.font(line.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).fillColor('#000000');
    if (line.full !== undefined || (!line.a && line.b === undefined && line.c === undefined)) {
      doc.rect(x0, y, total, h).lineWidth(0.4).stroke('#808080');
      if (line.full) {
        const isPreview = line.full.startsWith('PRATINJAU');
        doc
          .fillColor(isPreview ? '#c0392b' : '#000000')
          .fontSize(line.bold || line.center ? 9 : 8.5)
          .text(line.full, x0 + 4, y + 4.5, {
            width: total - 8,
            align: line.center ? 'center' : 'left',
            lineBreak: false,
          })
          .fillColor('#000000');
      }
    } else {
      const vals = [
        line.a ?? '',
        line.b === undefined ? '' : String(line.b),
        line.c === undefined ? '' : line.money ? rp(Number(line.c)) : String(line.c),
      ];
      let x = x0;
      vals.forEach((v, i) => {
        doc.rect(x, y, widths[i], h).lineWidth(0.4).stroke('#808080');
        const align = (i === 2 && line.money) || v.startsWith('Rp') ? 'right' : 'left';
        doc.text(v, x + 4, y + 4.5, { width: widths[i] - 8, align, lineBreak: false });
        x += widths[i];
      });
    }
    y += h;
  }
}

/** Satu worksheet slip gaji (layout identik template, nominal tetap angka). */
export function addSlipWorksheet(wb: ExcelJS.Workbook, s: SlipData, sheetName: string) {
  const ws = wb.addWorksheet(sheetName, {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 1 },
  });
  ws.columns = [{ width: 36 }, { width: 20 }, { width: 22 }];
  const border: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FF808080' } },
    bottom: { style: 'thin', color: { argb: 'FF808080' } },
    left: { style: 'thin', color: { argb: 'FF808080' } },
    right: { style: 'thin', color: { argb: 'FF808080' } },
  };
  let r = 1;
  for (const line of slipLines(s)) {
    const font = { name: 'Arial', size: 10, bold: !!line.bold };
    if (line.full !== undefined || (!line.a && line.b === undefined && line.c === undefined)) {
      ws.mergeCells(r, 1, r, 3);
      const c = ws.getCell(r, 1);
      c.value = line.full ?? '';
      c.font = line.full?.startsWith('PRATINJAU') ? { ...font, color: { argb: 'FFC0392B' } } : font;
      c.alignment = { horizontal: line.center ? 'center' : 'left' };
      c.border = border;
    } else {
      ws.getCell(r, 1).value = line.a ?? '';
      if (line.b !== undefined) ws.getCell(r, 2).value = line.b;
      if (line.c !== undefined) ws.getCell(r, 3).value = line.c;
      if (line.money) ws.getCell(r, 3).numFmt = '"Rp"#,##0';
      for (let c = 1; c <= 3; c++) {
        ws.getCell(r, c).font = font;
        ws.getCell(r, c).border = border;
      }
      if (String(line.b ?? '').startsWith('Rp')) ws.getCell(r, 2).alignment = { horizontal: 'right' };
      if (line.money) ws.getCell(r, 3).alignment = { horizontal: 'right' };
    }
    r++;
  }
  return ws;
}

/** Nama worksheet Excel valid & unik (maks 31 karakter, tanpa karakter terlarang). */
export function uniqueSheetName(base: string, used: Set<string>): string {
  const clean = base.replace(/[\\/?*[\]:]/g, ' ').trim().slice(0, 28) || 'Sheet';
  let name = clean;
  for (let i = 2; used.has(name.toLowerCase()); i++) name = `${clean.slice(0, 26)} ${i}`;
  used.add(name.toLowerCase());
  return name;
}
