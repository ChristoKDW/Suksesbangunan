# Dokumentasi Sistem Regular Off (RO) - Sukses Bangunan

## 1. Konsep & Filosofi Bisnis Regular Off (RO)

Di lingkungan kerja PT Sukses Bangunan, terdapat perbedaan mendasar antara **Karyawan Kantor** (Divisi Backoffice / Office) dan **Karyawan Operasional** (Lapangan / Toko / Gudang):

1. **Karyawan Kantor**:
   - Jadwal kerja bersifat tetap (Senin - Sabtu, 08:45 - 17:00).
   - Dikelola langsung oleh **Admin & HRD**.
   - Otomatis **diliburkan** pada setiap Hari Libur Nasional resmi pemerintah (tanggal merah non-Minggu). Tidak mendapatkan hak RO karena sudah otomatis libur di hari tersebut.

2. **Karyawan Operasional**:
   - Jadwal kerja fleksibel berbasis shift yang diatur oleh **Supervisor (SPV)**.
   - Hari libur rutin (off mingguan) ditentukan bergantian oleh SPV agar operasional tetap berjalan setiap hari.
   - Karena tuntutan operasional, karyawan operasional seringkali tetap harus masuk bekerja pada hari libur nasional resmi.

---

## 2. Aturan Perolehan Saldo RO (Regular Off)

### A. Kapan Karyawan Mendapatkan RO?
Karyawan operasional berhak mendapatkan **1 Saldo Regular Off (RO)** jika dan hanya jika:
1. Hari tersebut merupakan **Hari Libur Nasional resmi** pemerintah (bukan hari Minggu).
2. Karyawan ditugaskan shift kerja dan **AKTUAL HADIR / MELAKUKAN ABSENSI MASUK** (status tepat waktu atau telat).
3. Saldo RO dicatat dengan masa aktif selama **3 bulan** terhitung sejak tanggal perolehan (`tanggal_kadaluarsa = tanggal_perolehan + 3 bulan`).

### B. Aturan Penting: Libur Rutin Bertabrakan dengan Libur Nasional
> **JIKA HARI LIBUR RUTIN (OFF) KARYAWAN BERTABRAKAN DENGAN HARI LIBUR NASIONAL:**
> - Libur nasional tersebut **TIDAK BISA DITUKAR MENJADI RO**.
> - Karena karyawan pada hari tersebut memang jadwalnya sudah libur (tidak bekerja / tidak melakukan absensi masuk), maka karyawan tersebut menikmati hari libur regulernya dan **TIDAK MENDAPATKAN HAK TAMBAHAN RO**.
> - Hak RO **hanya murni diberikan sebagai kompensasi bagi mereka yang mengorbankan hari libur nasionalnya untuk masuk bekerja**.

---

## 3. Ketentuan Penggunaan & Pengajuan RO

1. **Aturan Larangan Pemakaian di Bulan yang Sama**:
   - Hak RO yang didapatkan pada suatu bulan (misal bulan Mei) **TIDAK BISA** digunakan di bulan yang sama (bulan Mei).
   - RO **WAJIB** digunakan mulai **bulan depannya atau bulan-bulan berikutnya** (misal mulai 1 Juni dst).
   
2. **Masa Berlaku 3 Bulan & Status Hangus**:
   - Masa berlaku RO adalah tepat **3 bulan** sejak didapatkan.
   - Contoh: RO didapat pada tanggal 17 Agustus 2026, maka masa berlakunya berakhir pada 17 November 2026.
   - Sistem menampilkan countdown sisa hari hangus secara real-time (misal: *"Sisa 42 hari sebelum hangus"*).
   - Jika dalam 3 bulan tidak diajukan / digunakan, saldo RO otomatis **HANGUS** (`status = 'hangus'`) dan tidak dapat digunakan lagi.

3. **Fleksibilitas Jumlah Hari yang Diajukan**:
   - Karyawan dapat mengajukan libur RO sesuai dengan jumlah saldo RO aktif yang dimiliki (misal memiliki 3 RO, karyawan dapat memilih 1 hari, 2 hari, atau 3 hari sekaligus baik berturut-turut maupun terpisah).
   - Saat diajukan, saldo RO yang dialokasikan dikunci dengan status `diajukan`.

---

## 4. Alur Persetujuan (Approval Flow) Berjenjang

Alur persetujuan pengajuan RO mengikuti hierarki organisasi:

1. **Karyawan Operasional** mengajukan tanggal RO &rarr; Status: `menunggu_spv`
2. **Supervisor (SPV)** meninjau:
   - Jika Ditolak &rarr; Status `ditolak_spv` (saldo RO kembali `tersedia`).
   - Jika Disetujui &rarr; Status naik menjadi `menunggu_hrd`.
3. **HRD / Admin** meninjau:
   - Jika Ditolak &rarr; Status `ditolak_hrd` (saldo RO kembali `tersedia`).
   - Jika Disetujui &rarr; Status menjadi `disetujui` (saldo RO menjadi `digunakan`).

### Efek Persetujuan HRD Terhadap Jadwal Kerja
Saat HRD menyetujui pengajuan:
1. Status pengajuan berubah menjadi `disetujui`.
2. Saldo RO terkait diupdate menjadi `digunakan`.
3. **OTOMASI JADWAL**: Untuk setiap tanggal yang diajukan oleh karyawan:
   - Sistem secara otomatis memperbarui record `jadwal_kerja` karyawan pada tanggal tersebut:
     - `is_libur = true`
     - `id_shift = null` (shift dihapus)
     - `keterangan = 'RO (Regular Off)'`
     - `sumber_upload = 'regular_off'`
   - **Tindakan ini secara otomatis mengabaikan dan menimpa jadwal kerja sebelumnya yang dibuat oleh Supervisor (SPV)**.

---

## 5. Rangkuman Implementasi Teknis

### A. Backend (`backend-sb`)
- **Entities**:
  - `SaldoRo`: Menyimpan riwayat perolehan RO, tanggal libur nasional asal, masa kadaluarsa 3 bulan, dan status.
  - `PengajuanRo`: Menyimpan permohonan tanggal libur RO, status approval SPV & HRD, dan catatan persetujuan.
- **Service & Logic**:
  - `createSaldoRoIfEligible`: Mengecek kehadiran aktual pada hari libur nasional (non-Minggu).
  - `createPengajuanRo`: Memvalidasi batas saldo, aturan bulan depan, batas kadaluarsa 3 bulan, dan bentrokan jadwal.
  - `respondSpv` & `respondHrd`: Menangani persetujuan berjenjang dan otomatisasi pembaruan jadwal kerja karyawan.
- **Integrasi Absensi**: Terhubung langsung dengan modul absensi saat absen masuk berhasil dicatat.

### B. Frontend Web (`frontend-sb`)
- **Dashboard & Approval View**:
  - Halaman `regular-off/page.tsx` dan tab `regular-off-tab.tsx`.
  - Supervisor (SPV) dapat menyetujui pengajuan bawahan di divisinya.
  - HRD / Admin memverifikasi tahap akhir dengan peringatan otomatisasi perubahan jadwal.
  - Filter: Semua, Menunggu, Disetujui, Ditolak.

### C. Mobile App (`mobileapp-sb`)
- **Modul Regular Off**:
  - `RegularOffCard`: Widget card interaktif di dashboard yang menampilkan saldo RO aktif dan countdown sisa hari hangus.
  - `RegularOffView`: Tampilan lengkap saldo RO, kartu riwayat perolehan, kalender multi-date picker untuk pengajuan tanggal RO, dan status pelacakan approval.
  - `RegularOffService`: Integrasi client GetX ke backend REST API.
