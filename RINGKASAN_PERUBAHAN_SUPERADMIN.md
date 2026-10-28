# Ringkasan Pembaruan Sistem & Super Admin Panel (LARAS)

**Tanggal:** 28 Oktober 2026  
**Status Sinkronisasi Git:** Bersih & Terverifikasi (`origin/main`, `vps/main`, Laptop)  
**Dokumentasi:** Obsidian Vault / CV. Sukses Bangunindo  

---

## 1. Status Commit GitHub & Repositori

- **Pemeriksaan Remote:** `git fetch origin` telah dijalankan.
- **Hasil:** Seluruh commit pada branch `main` GitHub telah selaras dengan commit lokal dan VPS. Tidak ada commit tertinggal atau bercabang di GitHub.
- **Daftar Commit Terkini:**
  1. `feat(super-admin): deduplikasi daftar user log dan paksa logout otomatis ke halaman login saat sesi diputuskan` (Commit ini)
  2. `bd9e812` `fix(backend): optimasi asinkron kirim email otp dan timeout nodemailer`
  3. `da9b11f` `fix(super-admin): hilangkan fallback email lama pada login dan perbaiki validasi user baru`
  4. `7e98741` `feat: tambahkan fitur user log, status akses aktif/tidak dan integrasi sidebar superadmin`
  5. `61ec12e` `feat: hapus seluruh data dummy dan beralih ke data dinamis murni dari database`
  6. `c8218d2` `feat: batasi akses super admin khusus tim software engineer dan update email user powtahh`
  7. `28d356a` `feat: aktifkan email authenticator login dan integrasi data riil dashboard superadmin`

---

## 2. Fitur Baru: Deduplikasi User Log & Otomatisasi Kick Session (Force Logout)

### A. Deduplikasi Daftar Pengguna (Tidak Ada Baris Ganda)
- **Masalah Sebelumnya:** Setiap kali seorang pengguna (misalnya `Administrator`) login ulang, sistem menambahkan baris baru ke tabel `user_log`. Akibatnya pada tabel User Log, nama `Administrator` muncul berulang kali (misal baris jam 11.39 Online dan baris jam 11.38 Offline).
- **Solusi yang Diterapkan:**
  - Query backend `findAll()` diperbarui dengan `DISTINCT ON (LOWER(l.username))` yang memprioritaskan sesi `is_online = true` dan `login_at` terbaru.
  - Setiap pengguna unik kini hanya muncul **tepat 1 baris** di daftar dengan status sesi terbarunya.
  - Saat pengguna login baru di platform yang sama, sistem secara otomatis menonaktifkan sesi-sesi lamanya (`isOnline: false, logoutAt: new Date()`) sehingga tidak ada sesi online yang menggantung.

### B. Otomatisasi Tombol "Putuskan Sesi" (Kick Session ke Halaman Login)
- **Masalah Sebelumnya:** Saat tombol "Putuskan Sesi" ditekan, status di tabel memang berubah menjadi offline, namun pengguna di browser lain masih tetap berada di dalam panel karena token JWT masih valid dan tidak ada mekanisme penolakan sesi di server.
- **Solusi yang Diterapkan:**
  1. **Revokasi di Sisi Server (Backend Guards & Strategy)**:
     - `JwtWebStrategy` (Web Admin) kini secara aktif memeriksa status online di tabel `user_log` via `isUserSessionOnline(idUser, 'web')`. Jika sesi telah di-kick, seluruh request API Web Admin langsung ditolak dengan **HTTP 401 Unauthorized**.
     - Untuk Mobile App Karyawan: saat sesi di-kick, token pada entitas `Karyawan` langsung dihapus (`null`), menyebabkan request aplikasi mobile seketika 401 dan otomatis logout.
     - Endpoint baru real-time session status:
       - `GET /super-admin/auth/session-status`
       - `GET /auth/web/session-status`
  2. **Session Watchdog Heartbeat (Frontend)**:
     - Di `superadmin-sb/lib/auth-context.tsx`, dipasang poller interval setiap 5 detik. Begitu sesi diputuskan, browser langsung mendeteksi status 401, membersihkan storage/cookie, dan otomatis me-redirect pengguna ke `/login?kicked=1`.
     - Di `frontend-sb/lib/auth-context.tsx` (Web Admin), dipasang poller interval setiap 8 detik. Begitu sesi diputuskan, browser otomatis memanggil `logout()` dan me-redirect ke `/login`.
     - Di `superadmin-sb/app/(dashboard)/user-logs/page.tsx`, jika pengguna menekan "Putuskan Sesi" pada akunnya sendiri, sistem seketika logout dan mengalihkan ke halaman login.
  3. **Notifikasi User-Friendly**:
     - Halaman login kini menampilkan alert banner merah khusus: *"Sesi Anda telah diakhiri atau diputuskan oleh Super Administrator. Silakan login kembali."*

---

## 3. Analisis Bug: Email Super Admin Lama "Nyangkut" Saat Login (Terselesaikan)
- Dihapuskannya silent catch fallback `o***r@suksesbangunindo.com` di frontend.
- Form login dibersihkan dari default username/password dummy.
- Validasi password diselaraskan dengan backend regex kombinasi simbol & angka.
- Pengiriman email OTP di backend diubah menjadi asinkron di latar belakang sehingga login berlangsung instan tanpa delay SMTP IPv6.

---

*Disinkronkan secara otomatis mengikuti Protokol AGENTS.md (3-Way Hash Sync).*
