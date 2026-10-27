// Kirim email pengingat perubahan project memakai SMTP aplikasi (backend-sb/.env).
// Pemakaian: node scripts/kirim-pengingat.mjs "<judul>" "<isi>"
// Penerima dibaca dari /root/.laras-pantau/email (satu alamat per baris).
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(root, 'backend-sb', 'package.json'));
require('dotenv').config({ path: join(root, 'backend-sb', '.env'), quiet: true });
const nodemailer = require('nodemailer');

const [judul, isi] = process.argv.slice(2);
const penerima = readFileSync('/root/.laras-pantau/email', 'utf8')
  .split(/\s+/)
  .filter(Boolean);
if (!penerima.length) process.exit(0);

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

await transport.sendMail({
  from: `"LARAS Monitor VPS" <${process.env.SMTP_USER}>`,
  to: penerima.join(', '),
  subject: judul,
  text: `${isi}\n\n— Dikirim otomatis oleh pemantau perubahan VPS (${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' })} WITA)`,
});
console.log(`Pengingat terkirim ke ${penerima.length} penerima`);
