const { Client } = require('pg'); 
const client = new Client({ user: 'postgres', host: '127.0.0.1', database: 'absensi_sukses_bangunan', password: 'root', port: 5432 }); 
client.connect().then(() => client.query("INSERT INTO karyawan (nik, nama, email) VALUES ('7371112109000002', 'Christo', 'istoganteng262@gmail.com') ON CONFLICT (nik) DO NOTHING")).then(() => { console.log('Seeded data'); client.end(); }).catch(e => { console.error(e); client.end(); });
