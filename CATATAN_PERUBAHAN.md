# Catatan Perubahan (Changelog) — LARAS / Sukses Bangunan

> Tambahkan entri **paling atas** setiap kali mengubah kode atau server.
> Format: tanggal · pelaku (nama / AI) · ringkasan · file utama · dampak data/deploy.
> Lihat `AGENTS.md` untuk protokol kerja.

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
