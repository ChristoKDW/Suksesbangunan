import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  host: process.env.DATABASE_HOST || '127.0.0.1',
  port: Number(process.env.DATABASE_PORT || 5432),
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME || 'absensi_sukses_bangunan',
});

async function run() {
  await client.connect();
  const res = await client.query('SELECT * FROM "user"');
  console.log(res.rows);
  await client.end();
}
run();
