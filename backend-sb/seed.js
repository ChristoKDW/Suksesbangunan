const { Client } = require('pg'); 
const client = new Client({
  user: process.env.DATABASE_USERNAME,
  host: process.env.DATABASE_HOST || '127.0.0.1',
  database: process.env.DATABASE_NAME || 'absensi_sukses_bangunan',
  password: process.env.DATABASE_PASSWORD,
  port: Number(process.env.DATABASE_PORT || 5432),
});
client.connect().then(() => client.query("INSERT INTO karyawan (nik, nama, email) VALUES ('7371112109000002', 'Christo', 'istoganteng262@gmail.com') ON CONFLICT (nik) DO NOTHING")).then(() => { console.log('Seeded data'); client.end(); }).catch(e => { console.error(e); client.end(); });
