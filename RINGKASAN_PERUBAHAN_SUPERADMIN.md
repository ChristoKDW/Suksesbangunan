# Ringkasan Pembaruan Sistem & Super Admin Panel (LARAS)

**Tanggal:** 28 Oktober 2026  
**Status Sinkronisasi Git:** Bersih & Terverifikasi (`origin/main`, `vps/main`, Laptop)  
**Dokumentasi:** Obsidian Vault / CV. Sukses Bangunindo  

---

## 1. Integrasi WebSocket Gateway & Redis Heartbeat (Real-time & Dynamic)

### A. Infrastruktur Redis Server di VPS (Native Linux, Non-Docker)
- Paket `redis-server` (v7.0.15) diinstal langsung di Ubuntu VPS host `root@103.247.11.91` tanpa container/Docker.
- Dikonfigurasi terikat ke localhost (`bind 127.0.0.1 -::1`), `port 6379`, `protected-mode yes`, dan berjalan otomatis via systemd (`redis-server.service`).
- Menggunakan pedoman arsitektur dari paket skill resmi `redis/agent-skills` (`redis-core`, `redis-connections`, `redis-security`).

### B. Modul Redis & WebSocket di Backend (`backend-sb`)
- **`RedisService` (`ioredis`)**:
  - Pola penamaan key stabil: `laras:heartbeat:{platform}:{username}`.
  - Heartbeat dengan TTL 25 detik (`SET ... EX 25`). Klien mengirimkan denyut setiap 10 detik. Jika klien terputus secara mendadak atau sesi di-kick, key otomatis kedaluwarsa atau dihapus seketika.
- **`RealtimeGateway` (`@nestjs/websockets` + `socket.io`)**:
  - Namespace: `/realtime` dengan dukungan WebSocket & polling fallback.
  - Room pengguna dinamis: `room:user:{username}` dan `room:superadmin`.
  - Event `session_kicked`: Mengirimkan sinyal paksa logout instan ke socket pengguna spesifik.
  - Event `user_status_changed`: Mem-broadcast perubahan status pengguna (online/offline) ke seluruh panel Super Admin secara real-time.

### C. Integrasi Frontend (`superadmin-sb`)
- Inisialisasi klien Socket.IO di `lib/socket.ts` dengan token JWT resmi.
- Background heartbeat berkala dari browser ke Redis via WebSocket.
- Pada halaman User Log (`/user-logs`), penambahan listener `user_status_changed` memperbarui daftar pengguna dan angka 4 kartu statistik secara otomatis tanpa perlu menekan tombol refresh.
- Penanganan penutupan sesi instan: jika akun pengguna di-kick dari panel, browser pengguna yang ditargetkan langsung terlempar ke halaman `/login?kicked=1`.

---

## 2. Rincian Data Karyawan & Payroll per Departemen (Financial Insights)

### A. Fitur Interaktif Modal Detail
- Setiap baris/kartu departemen pada halaman **Financial Insights & Payroll Intelligence** (`/financial-insights`) kini dapat diklik langsung untuk menampilkan modal rincian daftar karyawan dan alokasi beban payroll.
- Terdapat 4 ringkasan metrik khusus untuk departemen yang dipilih: Total Karyawan Aktif, Total THP Bersih, Total Beban Lembur, dan Piutang Kasbon Terpotong.
- Fitur pencarian instan berdasarkan Nama, NIK, Jabatan, dan Status Kerja karyawan.

### B. Tabel Detail Komprehensif per Karyawan
- Menampilkan seluruh karyawan di departemen tersebut dengan rincian:
  - Identitas: Foto profil, Nama Lengkap, dan NIK.
  - Jabatan & Status Kerja (Karyawan Tetap/Kontrak).
  - Kehadiran: Rasio Hari Hadir terhadap Hari Kerja (misal: 25 / 26 Hari).
  - Gaji Pokok (prorata hari dibayar).
  - Tunjangan Konsumsi (uang makan riil) dan Lembur.
  - Potongan: Kasbon terpotong, Denda telat/istirahat > 60 menit, dan BPJS.
  - THP Bersih (Take Home Pay) yang diterima karyawan.

### C. Backend Endpoint Dinamis
- `GET /super-admin/financial-insights/departments/:id/employees`
- Mengambil data riil dari relasi `karyawan`, `jabatan`, dan `penggajian` di PostgreSQL tanpa manipulasi data tiruan (zero dummy data).

---

## 3. Riwayat Pembaruan Sebelumnya

1. **Deduplikasi User Log**: Menggunakan query `DISTINCT ON (LOWER(username))` sehingga tiap akun unik hanya tampil 1 baris dengan status dan sesi login terbarunya.
2. **Pembersihan Fallback Mock**: Menghapus silent error handling dan kredensial default pada form login superadmin.
3. **Pengiriman Email OTP Asinkron**: Transporter nodemailer dikonfigurasi dengan socket timeout dan pengiriman OTP di background untuk mencegah 504 Gateway Timeout.

---

*Disinkronkan secara otomatis mengikuti Protokol AGENTS.md (3-Way Hash Sync).*
