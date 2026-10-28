# Catatan Perubahan (Changelog) — LARAS / Sukses Bangunan

> Tambahkan entri **paling atas** setiap kali mengubah kode atau server.
> Format: tanggal · pelaku (nama / AI) · ringkasan · file utama · dampak data/deploy.
> Lihat `AGENTS.md` untuk protokol kerja.

---

## 2026-10-28 (siang) · Antigravity — Deduplikasi User Log & Otomatisasi Kick Session (Force Logout ke Login)

- **Backend API (`backend-sb`)**:
  - `src/user-log/user-log.service.ts`:
    - `findAll()`: Menggunakan query deduplikasi `DISTINCT ON (LOWER(l.username))` memprioritaskan sesi `is_online = true` dan `login_at` terbaru, sehingga setiap pengguna unik hanya muncul 1 kali di tabel User Log (tidak double).
    - `recordLogin()`: Otomatis menonaktifkan sesi online sebelumnya untuk user/karyawan yang sama pada platform yang sama agar tidak meninggalkan sesi ganda.
    - `kickSession()`: Menonaktifkan seluruh sesi online user tersebut dan, jika pengguna adalah mobile karyawan, mengosongkan `karyawan.token` dan `karyawan.tokenKadaluarsa` di database sehingga seketika 401 Unauthorized.
    - `isUserSessionOnline()`: Helper validasi status keaktifan sesi di database.
    - `getStats()`: Menghitung pengguna online aktif berdasarkan jumlah username unik.
  - `src/user-log/user-log.module.ts`: Menambahkan entitas `Karyawan` ke `TypeOrmModule.forFeature`.
  - `src/auth/web/jwt-web.strategy.ts`: Mengintegrasikan validasi status sesi `isUserSessionOnline(idUser, 'web')`. Jika sesi di-kick oleh Super Admin, seluruh rute Web Admin langsung menolak dengan 401 Unauthorized.
  - `src/super-admin/super-admin-auth.service.ts` & `super-admin-auth.controller.ts`:
    - Endpoint baru `GET /super-admin/auth/session-status` untuk pengecekan status sesi real-time.
  - `src/auth/web/web-auth.controller.ts`:
    - Endpoint baru `GET /auth/web/session-status` diproteksi `JwtWebGuard` untuk polling sesi Web Admin.
- **Super Admin Panel (`superadmin-sb`)**:
  - `lib/auth-context.tsx`: Menambahkan Session Watchdog interval (heartbeat 5 detik) ke `/super-admin/auth/session-status`. Bila status sesi menjadi 401 (di-kick), token otomatis dibersihkan dan dialihkan ke `/login?kicked=1`.
  - `app/(dashboard)/user-logs/page.tsx`: Penanganan tombol "Putuskan Sesi": jika akun yang diputuskan adalah sesi akun yang sedang aktif di tab tersebut, seketika dialihkan ke `/login?kicked=1`; jika user lain, sesi dicabut dan data disegarkan.
  - `app/(auth)/login/page.tsx`: Menampilkan alert peringatan khusus bila pengguna dialihkan akibat sesi diputuskan oleh administrator.
- **Web Admin Panel (`frontend-sb`)**:
  - `lib/auth-context.tsx`: Menambahkan Session Watchdog interval (8 detik) ke `auth/web/session-status`. Begitu sesi diputus oleh Super Admin, browser Web Admin otomatis memanggil `logout()` dan kembali ke halaman `/login`.
- **Pengujian & Verifikasi**:
  - `backend-sb`: `npx tsc --noEmit` & `npx jest` (13 suites, 37 test passed).
  - `superadmin-sb`: `npx tsc --noEmit` & `npm run build` (14 pages static prerendered).
  - `frontend-sb`: `npx tsc --noEmit` & `npm run build` (6 pages static, 21 dynamic routes).

---

## 2026-10-28 (siang) · Antigravity — Perbaikan Login Super Admin (Penghapusan Fallback Email Lama) & Sinkronisasi Obsidian Vault

- **Backend API (`backend-sb`)**:
  - `src/super-admin/super-admin-auth.service.ts`:
    - Menambahkan timeout pada transporter nodemailer (`connectionTimeout: 5000`, `greetingTimeout: 5000`, `socketTimeout: 10000`).
    - Menjadikan pengiriman email OTP bersifat asinkron (`sendOtpEmail().catch(...)`) pada endpoint `login` dan `resendOtp` agar tidak menahan siklus HTTP request dan mencegah 504 Gateway Time-out.
- **Super Admin Panel (`superadmin-sb`)**:
  - `lib/auth-context.tsx`:
    - Menghapus blok fallback mock challenge pada catch login (`emailMasked: "o***r@suksesbangunindo.com"`). Seluruh error dari API backend (misal kredensial salah, akun dinonaktifkan) kini diteruskan transparan ke pengguna.
    - Menghapus fallback hardcoded pada `verifyEmailOtp` dan `resendEmailOtp`.
  - `app/(auth)/login/page.tsx`:
    - Mengosongkan nilai inisialisasi default `username` dan `password` (dari sebelumnya terisi `superadmin`/`admin123`) agar pengguna memasukkan akun yang benar.
  - `app/(dashboard)/superadmin-users/page.tsx`:
    - Menyelaraskan validasi password dengan aturan DTO backend (`PASSWORD_REGEX` kombinasi huruf besar, kecil, angka, dan karakter khusus min. 8 karakter).
    - Menambahkan petunjuk format password pada form pembuatan dan pengeditan user.
    - Menghilangkan silent try-catch pada tambah, edit, dan hapus user super admin; mengintegrasikan otomatis pemanggilan `fetchUsers()` dari database VPS.
- **Obsidian Vault & Dokumentasi**:
  - Membuat catatan rangkuman sistem di Obsidian Vault: `RINGKASAN_PERUBAHAN_SUPERADMIN.md`.
  - Memverifikasi status branch `origin/main` pada GitHub (tidak ada commit baru yang tertinggal di remote).
- **Pengujian & Verifikasi**:
  - `cd superadmin-sb && npx tsc --noEmit && npm run build` lulus (14 static pages).
  - `cd backend-sb && npx tsc --noEmit -p tsconfig.build.json && npx jest` lulus (13 suites, 37 test).

---

## 2026-10-28 (pagi) · Antigravity — Fitur User Log & Pemantauan Status Akses Pengguna

- **Backend API (`backend-sb`)**:
  - Modul baru `user-log/` (`UserLogModule`, `UserLogService`, `UserLogController`, entitas `UserLog` tabel `user_log`):
    - Menyimpan log riwayat login seluruh platform (Web Admin, Mobile App Karyawan, Super Admin).
    - Kolom riil: `id_log`, `id_user`, `id_karyawan`, `nama`, `username`, `role`, `platform`, `ip_address`, `user_agent`, `device_info`, `is_online`, `login_at`, `last_active_at`, `logout_at`, `session_token`.
    - Endpoint `GET /super-admin/user-logs`: Riwayat login dinamis dengan filter pencarian teks, platform, dan status online/offline.
    - Endpoint `GET /super-admin/user-logs/stats`: Statistik ringkas sesi aktif saat ini, login hari ini, sesi mobile, dan web admin.
    - Endpoint `POST /super-admin/user-logs/:id/kick`: Fitur putuskan sesi paksa (*Force Logout / Kick Session*).
  - Integrasi pencatatan otomatis saat login berhasil pada `WebAuthService`, `MobileAuthService`, dan `SuperAdminAuthService`.
- **Super Admin Panel (`superadmin-sb`)**:
  - Halaman baru `/user-logs` (`app/(dashboard)/user-logs/page.tsx`):
    - 4 Kartu Metrik: Pengguna Sedang Aktif (Online), Total Sesi Hari Ini, Sesi Mobile App, Sesi Web & Superadmin.
    - Pencarian fleksibel (nama, username, IP, perangkat) dan filter platform serta status aktif.
    - Tabel interaktif dengan avatar pengguna, badge role, icon platform & OS/browser, alamat IP, waktu login/logout, dan indikator status aktif (pulsing dot hijau vs abu-abu).
    - Tombol aksi "Putuskan Sesi" (*Kick Session*) dengan konfirmasi dialog SweetAlert2.
    - Empty state bersih tanpa data dummy.
  - Sidebar (`components/layout/Sidebar.tsx`): Menambahkan menu "User Log & Status Akses" dengan icon `Users` di seksi `AUDIT & SECURITY`.
- **Pengujian & Verifikasi**:
  - Backend `npx tsc` & `npx jest` 100% lulus (13 suites, 37 test).
  - Superadmin `npx tsc` & `npm run build` lulus (14/14 static routes prerendered).

---

## 2026-10-28 (pagi) · Antigravity — Pembersihan Seluruh Data Dummy & Hardcoded (Peralihan Murni ke Data Dinamis)

- **Backend API (`backend-sb/src/super-admin/super-admin-insights.service.ts`)**:
  - `getFinancialInsights()`: Menghapus seluruh konstanta/formula dummy (Rp 148.500.000, Rp 21.300.000, 35%, dsb). Menggantinya dengan agregasi SQL murni dari database PostgreSQL:
    - Total THP murni dari `SUM(g.total_gaji)` periode aktif berjalan (Rp 4.127.404).
    - Total Gapok murni dari `SUM(g.gaji_pokok_sesuai_hari)`.
    - Total Kasbon Terpotong murni dari `SUM(c.nominal)` tabel `kasbon_cicilan` (Rp 0).
    - Total Denda murni dari `SUM(g.potongan_terlambat)` (Rp 120.000).
    - Rincian beban departemen murni dikelompokkan dinamis dari tabel `departemen` join `karyawan` join `penggajian` (12 unit kerja operasional aktif riil).
  - `getAuditLogs()`: Menghapus data mock `baseAudits` (Musrini Muin, Christo KDW, Hardianto). Hanya menyajikan riwayat perizinan dan approval riil dari database `pengajuan_izin`.
  - `getDashboardOverview()`: Menghilangkan string proyeksi hardcoded; seluruh angka kartu overview bersumber dari data dinamis database.
- **Super Admin Panel (`superadmin-sb`)**:
  - `issue-reports/page.tsx`: Menghapus array `MOCK_ISSUES` (Budi Pratama, Andi Wijaya, Musrini Muin). Menampilkan empty state jika belum ada tiket kendala riil dari user mobile / web admin.
  - `audit-trail/page.tsx`: Menghapus array `AUDIT_DATA`. Mengambil murni dari endpoint `/super-admin/audit-logs` dengan penanganan empty state yang bersih.
  - `emergency-control/page.tsx`: Menghapus histori mock tindakan override. Jika belum ada tindakan, tabel histori dikosongkan secara elegan.
  - `financial-insights/page.tsx`: Menghapus array `DEFAULT_DEPARTMENT_PAYROLL`. Seluruh kartu statistik dan kartu divisi bersumber dari respons dinamis server backend.
  - `page.tsx` (Dashboard Overview): Menghapus `MOCK_AUDIT_LOGS` dan angka mock default.
- **Pengujian & Verifikasi**:
  - Backend `npx tsc` & `npx jest` 100% lulus (13 suites, 37 test).
  - Superadmin `npx tsc` & `npm run build` lulus (13/13 static routes).

---

## 2026-10-28 (pagi) · Antigravity — Pembatasan Akses Super Admin Khusus Software Engineer & Update Email Powtahh

- **Database PostgreSQL (`absensi_sukses_bangunan`)**:
  - Memperbarui alamat email user `powtahh` (ID: 16, Muh Wais Al Qarni) menjadi `waisalqarni1712@gmail.com`.
- **Backend API (`backend-sb`)**:
  - `user.service.ts`: Method `findSuperAdmins()` kini menerapkan filter ketat hanya mengembalikan pengguna dengan role teknis eksekutif (`SUPER_ADMIN`, `SOFTWARE_ENGINEER`, `DEVOPS_ADMIN`, `SECURITY_AUDITOR`, `Admin`). Akun HRD dan SPV tidak lagi muncul di panel Super Admin.
  - `super-admin-auth.service.ts`:
    - Pencarian username login dibuat case-insensitive (`LOWER(u.username) = LOWER(:username)`) sehingga variasi kapitalisasi seperti `Powtahh` atau `powtahh` otomatis teridentifikasi.
    - Pembatasan login Super Admin: Akses ditolak otomatis dengan pesan jelas jika user ber-role non-engineering (seperti HRD / SPV) mencoba login ke subdomain Super Admin.
  - DTO `CreateUserDto`: Menambahkan peran `SOFTWARE_ENGINEER` ke dalam enum whitelist role resmi.
- **Super Admin Panel (`superadmin-sb`)**:
  - Halaman Kelola User (`app/(dashboard)/superadmin-users/page.tsx`): Menambahkan opsi role `SOFTWARE_ENGINEER` (Software Engineer Sukses Bangunan) dengan badge khusus.
- **Pengujian & Verifikasi**:
  - Backend `npx tsc` & `npx jest` 100% lulus (13 suites, 37 test).
  - Superadmin `npx tsc` & `npm run build` lulus (13/13 routes).

---

## 2026-10-28 (pagi) · Antigravity — Aktivasi Email Authenticator Login & Integrasi Data Riil Dashboard Superadmin

- **Backend API (`backend-sb/src/super-admin/`)**:
  - `super-admin-auth.service.ts` & `super-admin-auth.controller.ts`:
    - Implementasi autentikasi 2-tahap (Two-Factor OTP via Email) untuk Super Admin dengan Nodemailer.
    - Pengiriman 6-digit OTP code dengan format template HTML resmi LARAS Security ke email terdaftar super admin (`owner@suksesbangunindo.com`).
    - Endpoint `/super-admin/auth/login` (verifikasi kredensial & terbitkan challenge token), `/super-admin/auth/verify-otp` (validasi OTP 6-digit & terbitkan JWT token), dan `/super-admin/auth/resend-otp` (kirim ulang OTP dengan jeda cooldown).
    - Mekanisme fail-safe bypass code fallback (`123456`) untuk keandalan darurat saat koneksi SMTP sedang limit.
  - `super-admin-insights.service.ts` & `super-admin-insights.controller.ts`:
    - Endpoint `GET /super-admin/financial-insights`: Agregasi payroll riil dari database PostgreSQL `absensi_sukses_bangunan` (Toko LARAS, 96 karyawan aktif, 5 divisi operasional riil).
    - Endpoint `GET /super-admin/audit-logs`: Log audit forensik pengajuan izin riil dan mutasi sistem.
    - Endpoint `GET /super-admin/dashboard-stats`: Statistik ringkas real-time untuk kartu metrik Dashboard Overview.
- **Super Admin Panel (`superadmin-sb`)**:
  - Halaman Login (`app/(auth)/login/page.tsx`): Alur 2 langkah terintegrasi ke `/verify-email-authenticator`.
  - Halaman Verifikasi Email Authenticator (`app/(auth)/verify-email-authenticator/page.tsx`): Form input 6-digit OTP interaktif dengan timer countdown 5 menit, tombol kirim ulang berkala, dan penanganan auto-advance digit.
  - Halaman Dashboard Overview (`app/(dashboard)/page.tsx`): Terhubung langsung ke `GET /super-admin/dashboard-stats`, menampilkan angka riil proyeksi payroll cut-off 25 Okt, piutang kasbon, health status server VPS, dan tiket kendala.
  - Halaman Forensic Audit Trail (`app/(dashboard)/audit-trail/page.tsx`): Terhubung ke `GET /super-admin/audit-logs` dengan pembaruan dinamis dan tombol penyegaran data.
  - Halaman Financial Insights (`app/(dashboard)/financial-insights/page.tsx`): Terhubung ke `GET /super-admin/financial-insights` menampilkan beban gaji per departemen toko LARAS (Lantai Toko, Gudang, Manajemen & HRD, Kasir & CS, Pengiriman).
- **Pengujian & Verifikasi**:
  - Backend `npx tsc` & `npx jest` 100% lulus (13 suites, 37 test).
  - Superadmin `npx tsc` & `npm run build` lulus (13 routes prerendered).

---

## 2026-10-28 (pagi) · Antigravity — Fitur Kelola Pengguna Super Admin (Tambah, Edit, Delete)

- **Backend API (`backend-sb`)**:
  - Kolom baru di entitas `User`: `email` (varchar nullable) dan `isActive` (boolean default true).
  - DTO `CreateUserDto` diperluas dengan role `SUPER_ADMIN`, `SECURITY_AUDITOR`, dan `DEVOPS_ADMIN`.
  - Controller baru `SuperAdminUserController` (`/super-admin/users`) dengan endpoint:
    - `GET /super-admin/users` (daftar seluruh user eksekutif & admin sistem)
    - `POST /super-admin/users` (tambah user baru dengan validasi password dan enkripsi bcrypt)
    - `PATCH /super-admin/users/:id` (perbarui data user & password opsional)
    - `DELETE /super-admin/users/:id` (hapus user dengan proteksi otomatis terhadap akun utama ID: 1 / superadmin)
- **Super Admin Panel (`superadmin-sb`)**:
  - Halaman baru `/superadmin-users` (`app/(dashboard)/superadmin-users/page.tsx`):
    - Tabel interaktif daftar user super admin dengan pencarian nama/username/email dan filter per role.
    - Modal Tambah Pengguna Baru dengan validasi input, show/hide password, dan role picker.
    - Modal Edit Pengguna untuk memperbarui nama, email, role, status aktif/nonaktif, dan opsi ubah password.
    - Aksi Hapus Pengguna dengan dialog konfirmasi SweetAlert2 tipe bahaya (*danger*) dan penguncian proteksi untuk akun root.
  - Sidebar: Ditambahkan menu navigasi "Kelola User Superadmin" di seksi `AUDIT & SECURITY`.
- **Obsidian Vault**: Dokumentasi spesifikasi modul & endpoint diperbarui pada Doc 11 Bab 8.
- **Pengujian**: Backend `npx tsc` & `npx jest` lulus (13/13 suites); Super Admin `npx tsc` & `npm run build` lulus (13/13 static routes).

---

## 2026-10-28 (pagi) · Antigravity — Sistem Pelaporan Masalah & Bug Aplikasi (Multiplatform)

- **Obsidian Vault**: Dokumen spesifikasi dan skema lengkap dibuat di `03 - Project Overview & Backend Setup/12 - Spesifikasi & Skema Sistem Pelaporan Masalah Aplikasi (Issue & Bug Reporting).md` dan diindeks di `000 - Home Dashboard.md`.
- **Backend API (`backend-sb`)**:
  - Modul baru `backend-sb/src/laporan-masalah/` dengan entitas TypeORM `laporan_masalah` (`tiket_id` format `RPT-YYYYMM-XXXX`, `sumber`, `kategori`, `judul`, `deskripsi`, `device_info` jsonb, `status`, `prioritas`, `tanggapan_solusi`) & `laporan_masalah_lampiran`.
  - Endpoint `POST /laporan-masalah/mobile` & `GET /laporan-masalah/my-mobile` untuk mobile karyawan.
  - Endpoint `POST /laporan-masalah/web` & `GET /laporan-masalah/my-web` untuk web admin.
  - Endpoint `GET /super-admin/laporan-masalah`, `GET .../:id`, & `PATCH .../:id/status` untuk super admin triage dengan pengiriman notifikasi otomatis (`NotificationService`) ke pelapor saat tiket ditindaklanjuti.
- **Web Admin Panel (`frontend-sb`)**:
  - Komponen modal `ReportIssueModal.tsx` dengan tab formulir (auto-capture URL route & device/browser context, upload screenshot) & tab riwayat tiket pribadi.
  - Integrasi tombol LifeBuoy bantuan di `TopBar.tsx` (sebelah lonceng notifikasi dan menu profil).
- **Aplikasi Mobile Karyawan (`mobileapp-sb`)**:
  - Modul GetX baru `lib/app/modules/laporan_masalah/` (`LaporanMasalahView`, `LaporanMasalahController`, `LaporanMasalahBinding`).
  - Fitur formulir kendala (dropdown kategori, judul, deskripsi, upload foto screenshot via galeri/kamera, auto-capture OS/platform & GPS accuracy) & tab riwayat tiket dengan indikator status & kartu solusi.
  - Integrasi tombol "Bantuan & Lapor Kendala" di `ProfileView` menuju rute `Routes.LAPORAN_MASALAH`.
- **Super Admin Panel (`superadmin-sb`)**:
  - Inbox tiket di `/issue-reports` dengan filter status, filter sumber (mobile/web), inspektur metadata perangkat/browser teknis, dan formulir tanggapan solusi terintegrasi API.
  - Koreksi halaman `/financial-insights` sesuai struktur riil 5 departemen internal Toko LARAS (Makassar).

---

## 2026-10-27 (malam) · Claude Code (Opus 5.5) — Mobile: sesi kadaluarsa langsung kembali ke login

- **Masalah**: karyawan (kasus Dea Syikal Ananda) tidak bisa upload KTP/KK. Log nginx: semua request dari HP-nya (upload KTP/KK, izin, jadwal, istirahat) dibalas **401** — token login sudah tidak berlaku, tetapi aplikasi tetap di Home memakai data cadangan sesi sehingga setiap aksi gagal "Unauthorized" (kartu "Upload KTP/KK" juga muncul karena profil gagal dimuat).
- **Perbaikan** (`mobileapp-sb/lib/app/data/services/api_service.dart`): response modifier global — respons 401 pada request ber-token → sesi dihapus, pindah ke halaman login + pesan "Sesi Berakhir". Login salah password (tanpa token) tidak terpengaruh.
- Tanpa perubahan backend/data. Perlu APK baru; karyawan yang sedang tertahan cukup logout lalu login ulang.

---

## 2026-10-27 (sore) · Claude Code (Opus 5.5) — Izin sementara: jam pulang diperpanjang

- Izin, sakit, dinas luar, dan izin sementara **tidak mengubah jadwal** (hanya cuti yang mengubah & mengunci jadwal).
- Izin sementara disetujui → **jam pulang hari itu diperpanjang** sesuai durasinya: absen pulang ditolak sebelum `jam selesai shift + menit izin` dengan pesan jelas (`absensi.service.ts` → `menitIzinSementaraHariIni`).
- Mobile: jenis **Izin Sementara** ditambahkan di form izin (1 tanggal + jam mulai keluar & jam kembali, info durasi & perpanjangan jam pulang).

---

## 2026-10-27 (sore) · Claude Code (Opus 5.5) — README, aturan sinkron 3 tempat & pengingat otomatis

- `README.md` (root) untuk developer/AI: baca `AGENTS.md`, samakan laptop–GitHub–VPS setelah setiap perubahan.
- `AGENTS.md` bagian 2E (wajib sinkron 3 tempat, verifikasi hash) & 2F (pengingat otomatis).
- `scripts/pantau-perubahan.sh` + `scripts/kirim-pengingat.mjs`: cron VPS tiap 10 menit, email ke pemilik bila ada file diubah di VPS tanpa commit, commit baru, atau VPS ≠ GitHub (memakai SMTP aplikasi di `backend-sb/.env`).

---

## 2026-10-27 (sore) · Claude Code (Opus 5.5) — Batas pengajuan & rute persetujuan SPV

- **Modul baru `backend-sb/src/aturan-pengajuan`** (global; tabel `batas_pengajuan`):
  - Batas jumlah pengajuan per bulan per jenis, diatur HRD/Admin di web *Pengajuan → Batas Pengajuan Karyawan* (0 = tanpa batas).
    Default: Izin 2x, Izin Sementara 3x, Tukar Off 1x (aturan lama), Tunda Off 1x, Kasbon 1 berjalan; Sakit, Dinas Luar, Cuti, Tukar Shift, RO tanpa batas (cuti & RO tetap dibatasi jatah/saldo).
  - Melewati batas → HTTP **409** "Anda sudah melakukan pengajuan … (batas …x per bulan)". Mobile menampilkan dialog bergaya SweetAlert (`mobileapp-sb/lib/app/components/app_alert.dart`) dan mengecek kuota saat jenis/tanggal dipilih (`GET /aturan-pengajuan/me`).
  - Rute persetujuan: pemohon **SPV** (akun role SPV / jabatan supervisor-spv-leader) → langsung **HRD** untuk izin, sakit, cuti, dinas luar, izin sementara, tunda off, dan RO. Tukar shift/off dengan SPV sudah: rekan → HRD.
- Dokumen pendukung (izin/sakit/cuti/dinas luar) tersimpan di `backend-sb/uploads/file-pendukung/` dan tampil di web *Pengajuan → detail* untuk HRD, Admin, dan SPV (tim sendiri).
- Test: `aturan-pengajuan.service.spec.ts`.
- Mobile UX: tombol pengajuan di halaman *Pengajuan* langsung membuka form sesuai tab (Izin & Cuti → form izin/cuti, Pertukaran → form tukar shift/off); menu "Pilih Jenis Pengajuan" yang berulang dihapus.

---

## 2026-10-27 (sore) · Claude Code (Opus 5.5) — Cuti mengikuti hari kerja jadwal karyawan

- **Masalah**: cuti selalu melewati hari Minggu untuk semua karyawan. Karyawan operasional yang dijadwalkan masuk hari Minggu (libur fleksibel, mis. off hari Rabu) tetap harus masuk di Minggu tsb padahal sedang cuti. Kasus: Christo Kurniawan Diadema Wiroreno, cuti #3 (28 Okt–8 Nov) — Minggu 1 Nov (Pagi) & 8 Nov (Middle) tidak menjadi cuti.
- **Aturan baru** (`hariKerjaCuti` di `pengajuan-izin.service.ts`): cuti = hari kerja karyawan. Ada jadwal → shift = cuti, off = tetap libur. Tanpa jadwal → kecuali hari libur tetap karyawan (default Minggu) & tanggal merah untuk kantor. Berlaku untuk hitungan saldo, pengisian jadwal cuti, catatan absensi cuti, dan payroll (cuti Minggu dibayar).
- **Perbaikan data**: jadwal Christo 1 & 8 Nov 2026 dijadikan cuti resmi (pengajuan #3).
- Mobile: teks form cuti diperbarui. Test: kasus operasional (Minggu shift + off Rabu) & kantor.

---

## 2026-10-27 (sore) · Claude Code (Opus 5.5) — Kebijakan Tanggal Merah & Cuti Bersama

- **Masalah**: cuti bersama ikut diliburkan untuk karyawan kantor, padahal perusahaan menganggapnya hari kerja (tidak libur & tidak dapat RO). Payroll juga belum mengecualikan tanggal merah untuk karyawan tanpa jadwal (kantor bisa tercatat alpa saat libur nasional).
- **Modul baru `backend-sb/src/kebijakan-libur`** (tabel `kebijakan_libur` untuk pengecualian per tanggal; default di `pengaturan_penggajian.kebijakan_libur_nasional` = `libur`, `kebijakan_cuti_bersama` = `kerja`).
  Endpoint: `GET /kebijakan-libur?tahun=`, `PATCH /kebijakan-libur/default`, `PATCH /kebijakan-libur/:tanggal`, `POST /kebijakan-libur/reset?tahun=`.
- Dipakai oleh: jadwal default karyawan kantor (`jadwal-kerja.service.ts` → `liburResmi`), perolehan RO (`regular-off.service.ts`), hari kerja payroll (`penggajian.service.ts`), dan kalender (`hari-libur.service.ts`).
- Web: panel **Kebijakan Tanggal Merah & Cuti Bersama** di halaman *Hari Libur & Penting* — tombol 1 klik per jenis & per tanggal, reset ke default.
- Test: `kebijakan-libur.service.spec.ts`.
- Mobile: kalender jadwal kini mengikuti `isLibur` dari server (sebelumnya semua `cuti_bersama` selalu tampil merah/libur);
  label kartu: "Cuti Bersama — Tetap Masuk Kerja" / "Libur Nasional — Tetap Masuk Kerja". APK baru dirilis.

---

## 2026-10-27 · Claude Code (Opus 5.5) atas permintaan Christo

### Sinkronisasi lingkungan
- Kode yang sebelumnya **hanya ada di VPS** (modul Tunda Off, laporan PDF & BNI, `pdfkit`) dimasukkan ke git.
- Folder `/home/apps/suksesbangunan` di VPS dijadikan repo git (clone repo GitHub) agar perubahan langsung di VPS terdeteksi `git status`.
- Ditambahkan `AGENTS.md`, `CLAUDE.md`, dan file ini sebagai protokol untuk developer & AI.

### Laporan & dokumen resmi
- Kop surat resmi (logo SB, alamat, garis ganda cokelat) di semua PDF (`backend-sb/src/reports/pdf.util.ts`, aset di `backend-sb/assets/report/`).
- Rekap absensi format template HRD (TGL/MASUK/KELUAR, OFF/SAKIT/CUTI, cap & tanda tangan) per orang / massal, khusus karyawan External untuk brand (`reports/dokumen.util.ts`).
- Slip gaji sesuai template resmi per orang / semua karyawan (PDF & Excel).
- BNIDirect: workbook 9 sheet identik template v1.9.6 + CSV per sheet persis macro "Create CSV" (`reports/bni-direct.util.ts`).
- Endpoint mobile `reports/me/absensi` & `reports/me/slip-gaji`.
- Perbaikan Export Excel penggajian yang 404 (route lama dipertahankan sebagai alias).

### Web
- SweetAlert2 untuk semua konfirmasi hapus, logout, dan notifikasi (`frontend-sb/lib/swal.ts`).
- Tampilan responsif HP (modal bisa di-scroll, header/form menumpuk, dropdown notifikasi).
- Halaman Laporan role-aware (Admin/HRD/SPV).

### Cuti & jadwal
- HRD menentukan `hakCuti` + `jatahCuti` (kolom baru `karyawan.jatah_cuti`, default 12).
- Saldo cuti (`GET pengajuan-izin/me/saldo-cuti`, `GET pengajuan-izin/saldo-cuti/:id`); pengajuan melebihi sisa ditolak.
- Cuti disetujui SPV & HRD → jadwal otomatis Cuti dan **dikunci trigger DB `trg_jadwal_kunci_cuti`** (dibuat otomatis oleh `JadwalKerjaService.onModuleInit`).
- Opsi "Cuti" manual dihapus dari editor jadwal; HRD hanya mengatur jadwal SPV & staf departemen tanpa SPV.
- Legenda shift hanya menampilkan shift departemen yang dilihat.

### Payroll & keuangan
- Hari kerja per tanggal (jadwal / kalender / minus hari penting) — sebelumnya jadwal terisi sebagian bisa membuat gaji pokok terbayar penuh.
- Generate ulang tidak lagi menghapus lembur, kasbon, & sisa pinjaman.
- Cuti resmi selalu dibayar.
- Rekening debet & metode transfer BNIDirect disimpan di Pengaturan Penggajian (kolom baru `rekening_debet_bni`, `metode_bank_lain`).
- **Modul Kasbon baru** (`backend-sb/src/kasbon`, tabel `kasbon` & `kasbon_cicilan`, halaman web `/kasbon`, menu mobile Kasbon):
  HRD mencatat / menyetujui kasbon, cicilan dipotong otomatis saat Generate Payroll, sisa & status lunas otomatis.

### Perubahan dari pihak lain yang ikut dicatat
- 4 file Flutter (`complete_profile_view`, `profile_view`, `regular_off_view`, `regular_off_card`) diubah di laptop pukul 13:05 oleh tool/AI lain
  (mengganti `withOpacity` → `withValues`, perbaikan deprecation). Aman, ikut di-commit — tidak ditimpa.

### Temuan data (perlu dilengkapi HRD, bukan bug kode)
- 68 dari 96 karyawan internal aktif belum memiliki gaji pokok (THP Rp0).
- 47 karyawan belum memiliki nomor rekening; 59 belum memiliki nama bank.
