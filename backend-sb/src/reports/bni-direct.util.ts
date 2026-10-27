import * as ExcelJS from 'exceljs';
import { LEGEND_PURPOSE_IFT } from './bni-legend.const.js';

/**
 * Replikasi template BNIDIRECT-EXCEL_TEMPLATE_v1.9.6 (9 sheet) beserta
 * output macro "Create CSV" per sheet (Make_IH/LLG/RTGS/Online/BIFAST_CSV).
 */

export type BniSheetKey = 'inhouse' | 'kliring' | 'rtgs' | 'online' | 'bifast';
export const BNI_SHEETS: BniSheetKey[] = ['inhouse', 'kliring', 'rtgs', 'online', 'bifast'];

export interface BniTrx {
  rek: string;
  nama: string;
  amount: number;
  remark1: string;
  remark2: string;
  code: string; // KODEBANK / Clearing Code / RTGS Member / Online Code / BIFast Code
  bank: string;
}

interface SheetSpec {
  name: string;
  csvSuffix: string;
  nameMax: number;
  headers: string[];
  required: string[]; // kolom berhuruf merah (wajib) pada baris 9
  widths: number[];
}

const KOLOM_BANK = [
  'NAMA CABANG(100)', 'ALAMAT BANK1(50)', 'ALAMAT BANK2(50)', 'ALAMAT BANK3(50)',
  'NAMA KOTA(100)', 'NAMA NEGARA(100)', 'WARGA NEGARA(40)', 'KODE WN(40)',
  'EMAIL FLAG(1)', 'Email(100)', 'Reff Num(16)', 'FLAG(1)',
];

const SPECS: Record<BniSheetKey, SheetSpec> = {
  inhouse: {
    name: 'Inhouse',
    csvSuffix: 'IH',
    nameMax: 40,
    headers: [
      'Rek. Tujuan(16)', 'Nama Penerima(40)', 'Amount', 'Remark1(33)', 'Remark2(50)',
      'Remark3(50)', 'KODEBANK(8)--(M)', 'NAMA BANK TUJUAN(100)--(M)', ...KOLOM_BANK,
    ],
    required: ['A', 'B', 'C'],
    widths: [19, 35, 23, 22, 19, 12, 17, 28, 19, 18, 18, 18, 16, 19, 20, 14, 14, 18, 13, 8],
  },
  kliring: {
    name: 'Kliring',
    csvSuffix: 'LLG',
    nameMax: 40,
    headers: [
      'Rek. Tujuan(34)', 'Nama Penerima(40)', 'Amount', 'Remark1(33)', 'Remark2(50)',
      'Remark3(50)', 'Clearing Code(7)', 'Bank Tujuan(35)', ...KOLOM_BANK,
    ],
    required: ['A', 'B', 'C', 'G', 'H'],
    widths: [18, 35, 15, 18, 18, 11, 17, 16, 19, 18, 18, 18, 16, 19, 20, 13, 14, 12, 13, 8],
  },
  rtgs: {
    name: 'RTGS',
    csvSuffix: 'RTGS',
    nameMax: 80,
    headers: [
      'Rek. Tujuan(16)', 'Nama Penerima(80)', 'Amount', 'Remark1(33)', 'Remark2(50)',
      'Remark3(50)', 'RTGS Member(8)', 'Bank Tujuan(35)', ...KOLOM_BANK,
    ],
    required: ['A', 'B', 'C', 'G', 'H'],
    widths: [18, 35, 15, 19, 19, 12, 18, 16, 19, 18, 18, 18, 16, 19, 20, 13, 14, 12, 12, 8],
  },
  online: {
    name: 'Online',
    csvSuffix: 'Online',
    nameMax: 80,
    headers: [
      'Rek. Tujuan(16)', 'Nama Penerima(80)', 'Amount', 'Remark1(33)', 'Remark2(50)',
      'Remark3(50)', 'Online Bank Code(3)', 'Bank Tujuan(35)', ...KOLOM_BANK,
    ],
    required: ['A', 'B', 'C', 'G', 'H'],
    widths: [18, 35, 15, 19, 19, 12, 18, 16, 19, 18, 18, 18, 16, 19, 20, 13, 14, 12, 12, 8],
  },
  bifast: {
    name: 'BIFAST',
    csvSuffix: 'BIFAST',
    nameMax: 100,
    headers: [
      'Rek. Tujuan(17)', 'Nama Penerima(100)', 'Amount', 'Remark1(100)', 'Remark2(100)',
      'Remark3(100)', 'BIFast Code(40)', 'Bank Tujuan(100)', ...KOLOM_BANK.slice(0, 11),
      'FLAG RefNum', 'Counter Party Reference No/ Beneficiary Reference No', 'Tipe Kode',
      'Flag Proxy', 'User Proxy', 'Transaction Purpose',
    ],
    required: ['A', 'B', 'C', 'G', 'H'],
    widths: [18, 35, 18, 17, 18, 13, 15, 16, 20, 20, 20, 20, 17, 20, 20, 14, 16, 10, 17, 12, 45, 9, 9, 21, 22],
  },
};

const IFT_HEADERS = [
  'Rek. Tujuan(35)', 'Nama Penerima(35)', 'Amount', 'Remark(50)', 'Remark2(50)',
  'Remark3(40)', 'Alamat Penerima (35)', 'Kota Penerima(35)', 'Beneficiary Address3 (50)',
  'BIC Swift Code(11)', 'Bank Tujuan(35)', 'BeneficiaryBankBranchName (35)',
  'Kota Bank Tujuan(35)', 'Negara Bank Tujuan(35)', 'BeneficiaryBankAddress3 (50)',
  'BeneficiaryBankCityName (100)', 'BeneBankCountry(35)', 'BeneficiaryCountryResidence (40)',
  'BeneficiaryCitizenshipCode (40)', 'BeneficiaryNotificationFlag (1)', 'Email (100)',
  'BeneficiaryNotificationFlag-SMS (1)', 'BeneficiaryNotificationTargetValue-SMS (100)',
  'BeneficiaryNotificationFlag-Fax (1)', 'BeneficiaryNotificationTargetValue-Fax (100)',
  'CorrespondentBankName (40)', 'Transaction Purpose Code (40)', 'Affiliated Flag (1)',
  'Identical Flag (1)', 'Beneficiary Category Code (40)', 'LLD Desc(18)', 'Reff Num(16)',
  'FinalizePaymentFlag (1)',
];
const AUTODEBET_HEADERS = [
  'Rek. Terdebit(16)', 'Nama Terdebit(40)', 'Amount', 'Remark1(33)', 'Remark2(50)',
  'Remark3(50)', 'EMAIL FLAG(1)', 'Email(100)', 'Reff Num(16)', 'FLAG(1)--(M)',
  'Ben Ref Num (16)',
];
const RESTRICTED: [string, string][] = [
  [',', 'Comma'], ['`', 'grave accent'], ['~', 'tilde'], ['!', 'exclamation mark'],
  ['@', 'at sign'], ['#', 'number sign'], ['$', 'dollar sign'], ['%', 'percent sign'],
  ['^', 'Circumflex accent'], ['&', 'ampersand'], ['*', 'asterisk'],
  ['_', 'horizontal bar (underscore)'], ['{', 'left curly brace'], ['}', 'right curly brace'],
  ['<', 'less-than sign'], ['>', 'greater-than sign'], ['[', 'left square bracket'],
  [']', 'right square bracket'], ['=', 'equals sign'], ['\\', 'backslash'], [';', 'semicolon'],
];
export const BIFAST_PURPOSE_DEFAULT = '01 - Pemindahan Dana';
const PURPOSE_BIFAST = [BIFAST_PURPOSE_DEFAULT, '02 - Investasi', '03 - Pembelian', '99 - Lainnya'];

/** Daftar bank tujuan: kode BIC (BI-FAST & RTGS) dan kode bank 3 digit (Online). */
const BANKS: { pattern: RegExp; bic: string; online: string }[] = [
  { pattern: /bsi|syariah indonesia|bni syariah|bri syariah|mandiri syariah/, bic: 'BSMDIDJA', online: '451' },
  { pattern: /bca|central asia/, bic: 'CENAIDJA', online: '014' },
  { pattern: /mandiri/, bic: 'BMRIIDJA', online: '008' },
  { pattern: /\bbri\b|rakyat indonesia/, bic: 'BRINIDJA', online: '002' },
  { pattern: /btn|tabungan negara/, bic: 'BTANIDJA', online: '200' },
  { pattern: /cimb|niaga/, bic: 'BNIAIDJA', online: '022' },
  { pattern: /danamon/, bic: 'BDINIDJA', online: '011' },
  { pattern: /permata/, bic: 'BBBAIDJA', online: '013' },
  { pattern: /panin/, bic: 'PINBIDJA', online: '019' },
  { pattern: /maybank/, bic: 'IBBKIDJA', online: '016' },
  { pattern: /ocbc|nisp/, bic: 'NISPIDJA', online: '028' },
  { pattern: /mega/, bic: 'MEGAIDJA', online: '426' },
  { pattern: /btpn|smbc|jenius/, bic: 'SUNIIDJA', online: '213' },
  { pattern: /sinarmas/, bic: 'SBJKIDJA', online: '153' },
  { pattern: /muamalat/, bic: 'MUABIDJA', online: '147' },
  { pattern: /bjb|jabar/, bic: 'PDJBIDJA', online: '110' },
  { pattern: /dbs/, bic: 'DBSBIDJA', online: '046' },
  { pattern: /uob/, bic: 'BBIJIDJA', online: '023' },
];

/** Karyawan tanpa nama bank atau bank BNI (non-syariah) = transfer Inhouse. */
export function isBniBank(namaBank: string | null | undefined): boolean {
  const nb = (namaBank || '').toLowerCase().trim();
  return nb === '' || (/\bbni\b|negara indonesia/.test(nb) && !nb.includes('syariah'));
}

/** Kode bank sesuai kolom sheet: BIC 8 huruf (BIFAST/RTGS) atau 3 digit (Online). */
export function bankCode(namaBank: string | null | undefined, sheet: BniSheetKey): string {
  if (sheet === 'inhouse' || sheet === 'kliring') return ''; // kliring: sandi per cabang
  const nb = (namaBank || '').toLowerCase();
  const bank = BANKS.find((b) => b.pattern.test(nb));
  if (!bank) return '';
  return sheet === 'online' ? bank.online : bank.bic;
}

/** Hapus karakter terlarang BNIDirect (sheet Restricted Characters + macro). */
export function sanitizeBni(value: string | null | undefined): string {
  return (value || '')
    .replace(/[\u00a0]/g, ' ')
    .replace(/[\u200b\u00ad]/g, '')
    .replace(/[,`~!@#$%^&*_{}<>[\]=\\;'|]/g, ' ')
    .replace(/[^\x20-\x7e\xa0-\xff]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Nomor rekening hanya angka (macro menolak non-numerik). */
export function cleanRekening(value: string | null | undefined): string {
  return (value || '').replace(/\D/g, '');
}

function nowStamp() {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Makassar',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    })
      .formatToParts(new Date())
      .map((x) => [x.type, x.value]),
  );
  return {
    slash: `${p.year}/${p.month}/${p.day}_${p.hour}:${p.minute}:${p.second}`,
    compact: `${p.year}${p.month}${p.day}${p.hour}${p.minute}${p.second}`,
    file: `${p.year}${p.month}${p.day}_${p.hour}${p.minute}${p.second}`,
  };
}

export interface BniHeader {
  tglTransaksi: string; // YYYYMMDD
  rekDebet: string;
  namaFile: string;
}

const GREEN: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00FF00' } };
const thin: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' }, bottom: { style: 'thin' },
  left: { style: 'thin' }, right: { style: 'thin' },
};

function styleHeader(row: ExcelJS.Row, count: number, red: string[]) {
  for (let c = 1; c <= count; c++) {
    const cell = row.getCell(c);
    cell.fill = GREEN;
    cell.border = thin;
    cell.alignment = { vertical: 'middle', wrapText: true };
    const letter = cell.address.replace(/\d+/g, '');
    cell.font = { bold: true, color: { argb: red.includes(letter) ? 'FFFF0000' : 'FF000000' } };
  }
}

function addTemplateSheet(
  wb: ExcelJS.Workbook,
  name: string,
  topHeaders: string[],
  topValues: (string | number)[],
  headers: string[],
  required: string[],
  widths: number[],
  stamp: string,
  namaFile: string,
) {
  const ws = wb.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 9 }] });
  ws.columns = headers.map((_, i) => ({ width: widths[i] ?? 16 }));
  ws.getCell('B1').value = 'Langkah Penggunaan:';
  ws.getCell('B1').font = { bold: true };
  ws.getCell('C1').value = '1. Lakukan pengisian tabel di bawah, kolom merah wajib diisi';
  ws.getCell('C2').value = '2. Klik tombol Create CSV. Lokasi File CSV = Lokasi Template';
  ws.getCell('C3').value = '3. Total Record Max 5000';
  ws.getCell('A5').value = 'File Creation(auto)';
  ws.getCell('C5').value = 'Nama File';
  ws.getCell('A6').value = stamp;
  ws.getCell('C6').value = namaFile;
  const r7 = ws.getRow(7);
  r7.values = topHeaders;
  styleHeader(r7, topHeaders.length, ['C']);
  const r8 = ws.getRow(8);
  r8.values = topValues;
  for (let c = 1; c <= topHeaders.length; c++) r8.getCell(c).border = thin;
  const r9 = ws.getRow(9);
  r9.values = headers;
  r9.height = 30;
  styleHeader(r9, headers.length, required);
  return ws;
}

/** Workbook 9 sheet identik template; data payroll mengisi sheet sesuai bank tujuan. */
export function buildBniWorkbook(
  data: Record<BniSheetKey, BniTrx[]>,
  header: BniHeader,
): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  const stamp = nowStamp();
  const topHeaders = ['P(auto)', 'Tgl Transaksi', 'Rek. Debet(16)', 'Total Record(auto)', 'Total Amount(auto)'];

  for (const key of ['inhouse', 'kliring', 'rtgs', 'online'] as BniSheetKey[]) {
    addDataSheet(key);
    if (key === 'online') addIftSheet();
  }
  addAutodebetSheet();
  addDataSheet('bifast');
  addRestrictedSheet();
  addLegendSheet();
  return wb;

  function addDataSheet(key: BniSheetKey) {
    const spec = SPECS[key];
    const rows = data[key];
    const total = rows.reduce((s, r) => s + r.amount, 0);
    const ws = addTemplateSheet(
      wb, spec.name, topHeaders,
      rows.length ? ['P', header.tglTransaksi, header.rekDebet, rows.length, total] : ['P'],
      spec.headers, spec.required, spec.widths,
      key === 'bifast' ? stamp.compact : stamp.slash,
      rows.length ? header.namaFile : '',
    );
    for (const t of rows) {
      const values: (string | number)[] = [
        t.rek, t.nama.slice(0, spec.nameMax), t.amount, t.remark1, t.remark2, '', t.code, t.bank,
      ];
      if (key === 'bifast') {
        while (values.length < 24) values.push('');
        values.push(BIFAST_PURPOSE_DEFAULT);
      }
      const row = ws.addRow(values);
      row.getCell(1).numFmt = '@';
      row.getCell(3).numFmt = '#,##0';
      // Kolom wajib yang kosong ditandai merah agar HRD melengkapi sebelum upload
      for (const col of spec.required) {
        const cell = row.getCell(col);
        if (cell.value === '' || cell.value === null) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
        }
      }
    }
  }

  function addIftSheet() {
    addTemplateSheet(
      wb, 'IFT',
      [...topHeaders, 'Remitter Country Code(oto)', 'ID Code(auto)', '', 'N(oto)'],
      ['P', '', '', '', '', 'ID', 'ID', '', 'N'],
      IFT_HEADERS, ['A', 'B', 'C', 'J', 'K', 'M'],
      [17, 19, 15, 18, 18, 24, 20, 17, 23, 19, 26, 8, 23, 21, 26, 27, 19, 29, 27, 26, 11, 33, 43, 33, 42, 28, 30, 16, 16, 30, 16, 16, 20],
      stamp.slash, '',
    );
  }

  function addAutodebetSheet() {
    addTemplateSheet(
      wb, 'Autodebet',
      ['P(auto)', 'Tgl Transaksi', 'Rek. Kredit(16)', 'Total Record(auto)', 'Total Amount(auto)'],
      ['P'], AUTODEBET_HEADERS, ['A', 'B', 'C'],
      [18, 19, 15, 18, 19, 11, 14, 14, 13, 11, 15], stamp.slash, '',
    );
  }

  function addRestrictedSheet() {
    const ws = wb.addWorksheet('Restricted Characters');
    ws.columns = [{ width: 4 }, { width: 10 }, { width: 34 }];
    ws.getCell('A1').value = 'Restricted Characters List';
    ws.getCell('A1').font = { bold: true, size: 12 };
    ws.getCell('B3').value = 'Glyph';
    ws.getCell('C3').value = 'Description ';
    ws.getRow(3).font = { bold: true };
    RESTRICTED.forEach(([g, d], i) => {
      const r = ws.getRow(4 + i);
      r.getCell(2).value = g;
      r.getCell(3).value = d;
      r.getCell(2).border = thin;
      r.getCell(3).border = thin;
    });
  }

  function addLegendSheet() {
    const ws = wb.addWorksheet('Legend');
    ws.columns = [{ width: 4 }, { width: 100 }, { width: 4 }, { width: 4 }, { width: 4 }, { width: 4 }, { width: 30 }];
    ws.getCell('B2').value = 'Transaction_Purpose_IFT';
    ws.getCell('G3').value = 'Transaction_Purpose_BIFAST';
    ws.getCell('B2').font = { bold: true };
    ws.getCell('G3').font = { bold: true };
    LEGEND_PURPOSE_IFT.forEach((v, i) => (ws.getCell(`B${4 + i}`).value = v));
    PURPOSE_BIFAST.forEach((v, i) => (ws.getCell(`G${5 + i}`).value = v));
  }
}

/**
 * CSV persis output tombol "Create CSV" sheet terkait (template v1.9.6).
 * Return { filename, content }.
 */
export function buildBniCsv(key: BniSheetKey, rows: BniTrx[], header: BniHeader) {
  const spec = SPECS[key];
  const stamp = nowStamp();
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const pad = (fields: (string | number)[], n: number) => {
    const out = fields.map(String);
    while (out.length < n) out.push('');
    return out.join(',');
  };
  const rekDebet = header.rekDebet.replace(/\./g, '');
  const lines: string[] = [];

  if (key === 'bifast') {
    // Make_BIFAST_CSV: baris 6 & 8 hanya kolom terisi (+ koma penutup),
    // Transaction Purpose dipotong jadi 2 karakter oleh macro.
    lines.push(`${stamp.compact},${rows.length + 2},`);
    lines.push(`P,${header.tglTransaksi},${rekDebet},${rows.length},${total},`);
    for (const t of rows) {
      const f = [t.rek, t.nama.slice(0, spec.nameMax), t.amount, t.remark1, t.remark2, '', t.code, t.bank];
      while (f.length < 16) f.push('');
      f.push('N', '', '', 'N', '', '', 'N', '');
      lines.push(`${f.join(',')},${BIFAST_PURPOSE_DEFAULT.slice(0, 2)}`);
    }
  } else {
    lines.push(pad([stamp.slash, rows.length + 2, header.namaFile], 20));
    lines.push(pad(['P', header.tglTransaksi, rekDebet, rows.length, total], 20));
    for (const t of rows) {
      const f: (string | number)[] = [t.rek, t.nama.slice(0, spec.nameMax), t.amount, t.remark1, t.remark2, '', t.code, t.bank];
      while (f.length < 16) f.push('');
      // EMAIL FLAG & FLAG = N karena Email/Reff Num kosong (logika macro)
      f.push('N', '', '', 'N');
      lines.push(f.join(','));
    }
  }

  const prefix = header.namaFile ? header.namaFile.replace(/\s+/g, '_') : 'Uploadfile';
  return {
    filename: `${prefix}_${spec.csvSuffix}_${stamp.file}.csv`,
    content: lines.join('\r\n') + '\r\n',
  };
}

export function bniSheetName(key: BniSheetKey) {
  return SPECS[key].name;
}
