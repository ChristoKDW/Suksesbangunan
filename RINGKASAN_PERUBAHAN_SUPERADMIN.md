# Ringkasan Pembaruan Sistem & Super Admin Panel (LARAS)

**Tanggal:** 29 Oktober 2026, Pukul 17:15 WITA  
**Status Sinkronisasi Git:** Bersih & Terverifikasi (`origin/main`, `vps/main`, Laptop)  
**Dokumentasi:** Obsidian Vault / CV. Sukses Bangunindo  

---

## 1. Integrasi Firebase Core & FlutterFire CLI (Mobile App)
*Waktu Eksekusi: 29 Oktober 2026, 17:00 WITA*

### A. Dependensi & Tooling
- Penambahan paket `firebase_core: ^5.1.0` ke dalam `mobileapp-sb/pubspec.yaml`.
- Aktivasi global `flutterfire_cli` (v1.4.1) dan instalasi `firebase-tools` CLI (v15.34.2).
- Konfigurasi gem `xcodeproj` di lingkungan build macOS untuk mendukung integrasi file Xcode project.

### B. Registrasi & Konfigurasi Multi-Platform (`sukses-bangunan`)
- Eksekusi `flutterfire configure --project=sukses-bangunan`:
  - **Android**: `com.comp_attendance.comp_attendance_mobile` (tergenerate `android/app/google-services.json`).
  - **iOS**: `com.compattendance.compAttendanceMobile` (tergenerate `ios/Runner/GoogleService-Info.plist`).
  - **macOS**: `com.compattendance.compAttendanceMobile` (tergenerate `macos/Runner/GoogleService-Info.plist`).
  - **Web & Windows**: `comp_attendance_mobile (web)` & `comp_attendance_mobile (windows)`.
- Konfigurasi otomatis build gradle: `android/app/build.gradle.kts` (plugin `com.google.gms.google-services`) dan `android/settings.gradle.kts`.

### C. Inisialisasi Firebase di Dart
- File konfigurasi `lib/firebase_options.dart` tergenerate otomatis dengan kunci API resmi platform.
- Modifikasi `lib/main.dart` untuk menginisialisasi Firebase saat boot aplikasi:
  ```dart
  import 'package:firebase_core/firebase_core.dart';
  import 'firebase_options.dart';

  void main() async {
    WidgetsFlutterBinding.ensureInitialized();
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    // ...
  }
  ```
- **Hasil Verifikasi**: `flutter analyze lib` (0 errors), Gradle tasks dry run (`BUILD SUCCESSFUL`).

---

## 2. Rincian Data Karyawan & Payroll per Departemen (Financial Insights)
*Waktu Eksekusi: 28 Oktober 2026, 23:45 WITA*

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

## 3. Integrasi WebSocket Gateway & Redis Heartbeat (Real-time & Dynamic)
*Waktu Eksekusi: 28 Oktober 2026, 14:30 WITA*

### A. Infrastruktur Redis Server di VPS (Native Linux, Non-Docker)
- Paket `redis-server` (v7.0.15) diinstal langsung di Ubuntu VPS host `root@103.247.11.91` tanpa container/Docker.
- Dikonfigurasi terikat ke localhost (`bind 127.0.0.1 -::1`), `port 6379`, `protected-mode yes`, dan berjalan otomatis via systemd (`redis-server.service`).

### B. Modul Redis & WebSocket di Backend (`backend-sb`)
- **`RedisService` (`ioredis`)**: Key `laras:heartbeat:{platform}:{username}` dengan TTL 25 detik.
- **`RealtimeGateway` (`@nestjs/websockets` + `socket.io`)**: Room dinamis, event `session_kicked` untuk pemutusan instan, dan event `user_status_changed` untuk pembaruan status pengguna realtime.

### C. Integrasi Frontend (`superadmin-sb`)
- Background heartbeat berkala dari browser ke Redis via WebSocket.
- Pada halaman User Log (`/user-logs`), listener `user_status_changed` memperbarui daftar pengguna dan angka statistik otomatis secara realtime.
- Penanganan force logout seketika bila sesi di-kick oleh Super Admin.

---

## 4. Sinkronisasi Pembaruan Sistem Operasional & Bisnis
*Waktu Sinkronisasi: 29 Oktober 2026, 16:50 WITA*

1. **Absen Pulang & Pengajuan Pulang Cepat**:
   - Jam shift dan absensi dihitung presisi menurut zona waktu bisnis WITA (+08:00).
   - Absen pulang dikunci hingga shift berakhir (+ durasi izin sementara), kecuali karyawan memiliki pengajuan **Pulang Cepat** yang telah disetujui SPV & HRD.
2. **Pencairan (Diuangkan) Hak RO & Cuti**:
   - Pengajuan pencairan saldo RO dan jatah cuti tahunan via aplikasi mobile.
   - Perhitungan otomatis 1 hari = gaji pokok ÷ hari kerja periode, dibayarkan saat Generate Payroll.
3. **Hari Penting / Libur HRD**:
   - Dihitung sebagai hari kerja dibayar penuh + uang makan tanpa absen jika bertepatan dengan jadwal kerja karyawan.

---

*Disinkronkan secara otomatis mengikuti Protokol AGENTS.md (3-Way Hash Sync: Laptop, GitHub origin/main, VPS vps/main).*
