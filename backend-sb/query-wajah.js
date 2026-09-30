const { DataSource } = require('typeorm');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'postgres',
});

ds.initialize().then(async () => {
  const res = await ds.query(`SELECT id_karyawan, nama_lengkap, case when face_embedding is null then true else false end as is_null FROM karyawan`);
  console.log(res);
  process.exit(0);
}).catch(console.error);
