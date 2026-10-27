# Catatan Perubahan (Changelog) — LARAS / Sukses Bangunan

> Tambahkan entri **paling atas** setiap kali mengubah kode atau server.
> Format: tanggal · pelaku (nama / AI) · ringkasan · file utama · dampak data/deploy.
> Lihat `AGENTS.md` untuk protokol kerja.

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
