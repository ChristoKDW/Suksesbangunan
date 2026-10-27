import PDFDocument from 'pdfkit';
import { Response } from 'express';

export const COMPANY_NAME = 'CV. SUKSES BANGUNINDO';
export const COMPANY_ADDRESS_LINES = [
  'Jl. Perintis Kemerdekaan Km.17 Ruko Merah, Depan Hotel Dalton, Pai',
  'Biringkanaya Makassar Telepon: (0411) 8954888 - 082299333755',
  'Email: suksesbangunindo@gmail.com, Kode Pos 90243',
];

export interface PdfColumn {
  label: string;
  width: number;
  align?: 'left' | 'center' | 'right';
}

/** Header kop surat perusahaan standar untuk seluruh laporan PDF. */
export function drawCompanyHeader(doc: PDFKit.PDFDocument, title: string, subtitle?: string) {
  doc.font('Helvetica-Bold').fontSize(14).text(COMPANY_NAME, { align: 'center' });
  doc.font('Helvetica').fontSize(8);
  for (const line of COMPANY_ADDRESS_LINES) {
    doc.text(line, { align: 'center' });
  }
  doc.moveDown(0.5);
  doc
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .lineWidth(1.5)
    .stroke();
  doc.moveDown(0.8);
  doc.font('Helvetica-Bold').fontSize(12).text(title, { align: 'center' });
  if (subtitle) {
    doc.font('Helvetica').fontSize(9).text(subtitle, { align: 'center' });
  }
  doc.moveDown(0.8);
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
): void {
  const doc = new PDFDocument({ size: 'A4', layout, margin: 36 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  doc.pipe(res);
  build(doc);
  drawPrintedFooter(doc);
  doc.end();
}
