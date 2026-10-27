import PDFDocument from 'pdfkit';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { Response } from 'express';

export const COMPANY_NAME = 'CV. SUKSES BANGUNINDO';
/** Teks kop surat persis template "ABSENSI <NAMA> <BULAN>" dari HRD. */
export const COMPANY_ADDRESS_LINES = [
  'Jl. Perintis Kemerdekaan Km. 17 Ruko Merah, Depan Hotel Dalton, Pai',
  'Biringkaya  Makassar Telepon: (0411) 8954 888 - 0822 9933 3755,',
  'Email:suksesbangunindo@gmail.com, Kodes Pos 90243',
];
/** Penanda tangan rekap absensi (HRD) beserta cap perusahaan. */
export const SIGNER_COMPANY = 'Cv. Sukses Bangunindo';
export const SIGNER_NAME = 'Musrini Muin';

const BULAN_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const KOP_BROWN = '#7b3f12';

/** Aset gambar laporan (logo & cap+tanda tangan) di <root>/assets/report. */
function loadAsset(name: string): Buffer | null {
  const file = join(process.cwd(), 'assets', 'report', name);
  return existsSync(file) ? readFileSync(file) : null;
}
export const LOGO_IMAGE = loadAsset('logo.jpg');
export const STAMP_IMAGE = loadAsset('ttd-stempel.jpg');

/** "02 Oktober 2026" — format tanggal surat (zona WITA). */
export function tanggalSurat(date = new Date()): string {
  const [y, m, d] = date
    .toLocaleDateString('en-CA', { timeZone: 'Asia/Makassar' })
    .split('-');
  return `${d} ${BULAN_ID[Number(m) - 1]} ${y}`;
}

export interface PdfColumn {
  label: string;
  width: number;
  align?: 'left' | 'center' | 'right';
}

/**
 * Kop surat resmi: logo SB di kiri, nama & alamat perusahaan di tengah,
 * lalu garis ganda cokelat selebar halaman (identik template absensi HRD).
 */
export function drawKopSurat(doc: PDFKit.PDFDocument) {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const top = 14;
  const textCenter = left + (right - left) * 0.6;
  const textWidth = 300;

  if (LOGO_IMAGE) {
    doc.image(LOGO_IMAGE, textCenter - 225, top, { fit: [54, 72] });
  }
  doc
    .fillColor('#000000')
    .font('Times-Bold')
    .fontSize(10)
    .text(COMPANY_NAME, textCenter - textWidth / 2, top + 12, {
      width: textWidth,
      align: 'center',
    });
  doc.font('Helvetica').fontSize(8).moveDown(0.3);
  for (const line of COMPANY_ADDRESS_LINES) {
    doc.text(line, textCenter - textWidth / 2, doc.y, {
      width: textWidth,
      align: 'center',
    });
  }

  const lineY = top + 90;
  doc.rect(left, lineY, right - left, 2.6).fill(KOP_BROWN);
  doc
    .moveTo(left, lineY + 4.2)
    .lineTo(right, lineY + 4.2)
    .lineWidth(0.8)
    .stroke(KOP_BROWN);
  doc.fillColor('#000000').strokeColor('#000000');
  doc.x = left;
  doc.y = lineY + 16;
}

/** Kop surat + judul laporan untuk seluruh laporan PDF. */
export function drawCompanyHeader(doc: PDFKit.PDFDocument, title: string, subtitle?: string) {
  drawKopSurat(doc);
  doc.font('Helvetica-Bold').fontSize(12).text(title, { align: 'center' });
  if (subtitle) {
    doc.font('Helvetica').fontSize(9).text(subtitle, { align: 'center' });
  }
  doc.moveDown(0.8);
}

/** Blok "tanggal / Hormat saya / Cv. Sukses Bangunindo / cap / nama" di kiri. */
export function drawSignatureBlock(doc: PDFKit.PDFDocument, x: number, y: number) {
  doc.font('Helvetica').fontSize(9.5).fillColor('#000000');
  doc.text(tanggalSurat(), x, y);
  doc.text('Hormat saya', x, doc.y + 2);
  doc.text(SIGNER_COMPANY, x, doc.y + 8);
  const stampY = doc.y + 4;
  if (STAMP_IMAGE) {
    doc.image(STAMP_IMAGE, x, stampY, { fit: [112, 65] });
  }
  doc.text(SIGNER_NAME, x, stampY + 70);
}

/** Tabel PDF sederhana dengan header berwarna, zebra rows, dan page-break otomatis. */
export function drawTable(
  doc: PDFKit.PDFDocument,
  columns: PdfColumn[],
  rows: string[][],
  options: { rowHeight?: number; fontSize?: number } = {},
) {
  const rowHeight = options.rowHeight ?? 18;
  const fontSize = options.fontSize ?? 8;
  const startX = doc.page.margins.left;
  const totalWidth = columns.reduce((s, c) => s + c.width, 0);

  const drawHeaderRow = () => {
    const y = doc.y;
    doc.rect(startX, y, totalWidth, rowHeight).fill('#1f2a44');
    let x = startX;
    doc.font('Helvetica-Bold').fontSize(fontSize).fillColor('#ffffff');
    for (const col of columns) {
      doc.text(col.label, x + 3, y + 5, {
        width: col.width - 6,
        align: col.align ?? 'left',
        lineBreak: false,
      });
      x += col.width;
    }
    doc.fillColor('#000000');
    doc.y = y + rowHeight;
  };

  drawHeaderRow();
  doc.font('Helvetica').fontSize(fontSize);
  rows.forEach((row, idx) => {
    if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom - 30) {
      doc.addPage();
      drawHeaderRow();
      doc.font('Helvetica').fontSize(fontSize);
    }
    const y = doc.y;
    if (idx % 2 === 1) {
      doc.rect(startX, y, totalWidth, rowHeight).fill('#f1f4f9');
      doc.fillColor('#000000');
    }
    doc.rect(startX, y, totalWidth, rowHeight).lineWidth(0.3).stroke('#c5cbd6');
    let x = startX;
    for (let c = 0; c < columns.length; c++) {
      doc.fillColor('#000000').text(row[c] ?? '-', x + 3, y + 5, {
        width: columns[c].width - 6,
        align: columns[c].align ?? 'left',
        lineBreak: false,
      });
      x += columns[c].width;
    }
    doc.y = y + rowHeight;
  });
  doc.moveDown();
  doc.x = startX;
}

/** Footer waktu cetak. */
export function drawPrintedFooter(doc: PDFKit.PDFDocument) {
  doc
    .font('Helvetica-Oblique')
    .fontSize(7)
    .fillColor('#555555')
    .text(
      `Dicetak otomatis oleh Sistem HR ${COMPANY_NAME} pada ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' })} WITA`,
      doc.page.margins.left,
      doc.page.height - doc.page.margins.bottom - 15,
    )
    .fillColor('#000000');
}

/** Buat dokumen PDF dan alirkan ke response Express. */
export function streamPdf(
  res: Response,
  filename: string,
  layout: 'portrait' | 'landscape',
  build: (doc: PDFKit.PDFDocument) => void,
  options: { footer?: boolean } = {},
): void {
  const doc = new PDFDocument({ size: 'A4', layout, margin: 36 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);
  build(doc);
  if (options.footer !== false) drawPrintedFooter(doc);
  doc.end();
}
