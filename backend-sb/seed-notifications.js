import pkg from 'pg';
const { Client } = pkg;
import * as dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT || 5432,
  user: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'absensi_sukses_bangunan',
});

async function run() {
  await client.connect();
  console.log('Connected to DB');

  try {
    // Check if Administrator user exists
    const res = await client.query(`SELECT id_user FROM "user" WHERE role = 'Admin' LIMIT 1`);
    if (res.rows.length === 0) {
      console.log('No Admin user found.');
      process.exit(1);
    }
    const adminId = res.rows[0].id_user;

    // Insert notification
    await client.query(`
      INSERT INTO "notification" (id_user, title, message, type, is_read, created_at)
      VALUES ($1, $2, $3, $4, false, NOW())
    `, [
      adminId, 
      'Sistem Absensi Online Aktif', 
      'Selamat datang di dashboard baru. Sistem notifikasi waktu nyata (real-time) sekarang telah aktif dan terhubung ke database.', 
      'SYSTEM'
    ]);
    
    await client.query(`
      INSERT INTO "notification" (id_user, title, message, type, is_read, created_at)
      VALUES ($1, $2, $3, $4, false, NOW() - interval '1 hour')
    `, [
      adminId, 
      'Pengajuan Izin Baru', 
      'Budi Santoso mengajukan Izin Sakit untuk tanggal 3 September.', 
      'LEAVE_REQUEST'
    ]);

    console.log('Notifications seeded successfully!');
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

run();
