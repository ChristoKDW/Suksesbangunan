import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  port: 5433,
  user: 'postgres',
  password: 'root',
  database: 'absensi_sukses_bangunan'
});

async function run() {
  await client.connect();
  const res = await client.query('SELECT * FROM "user"');
  console.log(res.rows);
  await client.end();
}
run();
