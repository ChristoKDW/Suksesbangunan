---
trigger: always_on
description: "Aturan wajib untuk AI agent & developer di proyek LARAS / Sukses Bangunan (baca SEBELUM mengubah apa pun)."
---

# LARAS — Sistem Absensi & Payroll CV. Sukses Bangunindo

> **Untuk AI agent (Claude, Codex, Cursor, Antigravity, Gemini, dll.) dan developer:**
> File ini adalah aturan utama proyek. Ikuti **Protokol Wajib** di bawah sebelum menulis
> satu baris kode pun, supaya pekerjaan orang lain (di laptop, GitHub, atau langsung di VPS)
> tidak tertimpa.

## 1. Peta Proyek

| Bagian | Folder | Teknologi | Produksi |
|---|---|---|---|
| Backend API | `backend-sb/` | NestJS + TypeORM + PostgreSQL (pgvector) | PM2 `backend` port 3002 → https://api.larasbysuksesbangunan.my.id |
| Web Admin (Admin/HRD/SPV) | `frontend-sb/` | Next.js (App Router) + Tailwind + SWR + SweetAlert2 | PM2 `frontend` port 3000 → https://larasbysuksesbangunan.my.id |
| Aplikasi karyawan | `mobileapp-sb/` | Flutter + GetX | APK di `frontend-sb/public/apk/` (LARAS.apk & app-release.apk) |

- **VPS:** `root@103.247.11.91`, folder proyek `/home/apps/suksesbangunan/` (akses SSH key; minta ke pemilik).
- **GitHub:** `https://github.com/ChristoKDW/Suksesbangunan` branch `main` = **sumber kebenaran**.
- **Sejak 27 Okt 2026 folder proyek di VPS adalah repo git** (isi sama dengan repo GitHub).
  Artinya setiap perubahan langsung di VPS **terdeteksi** dengan `git status`.
- Database produksi: `absensi_sukses_bangunan` (TypeORM `synchronize: true` → kolom/tabel baru dibuat otomatis saat backend start).
- File rahasia **tidak** ada di git: `backend-sb/.env`, `frontend-sb/.env*`, `uploads/`, folder `Dokumen/`. Jangan pernah commit kredensial.

## 2. Protokol Wajib Sebelum Mengubah Kode

### A. Bekerja di laptop / komputer sendiri
```bash
git fetch origin && git status && git log --oneline -15 origin/main
git pull --rebase origin main          # selalu mulai dari versi terbaru
```
Lalu **cek apakah VPS punya perubahan yang belum masuk git** (lihat bagian C).

### B. Bekerja langsung di VPS (SSH)
```bash
cd /home/apps/suksesbangunan
git status                  # ADA file "modified"/"untracked"? → itu pekerjaan orang lain yang belum dicatat
git diff --stat && git diff # baca & pahami perubahannya
git log --oneline -15
```
- **JANGAN** `git checkout -- .`, `git reset --hard`, `git clean`, `git stash drop`, atau menimpa file yang berubah.
- Jika ada perubahan tak tercatat: analisis isinya, tulis entrinya di `CATATAN_PERUBAHAN.md`,
  lalu `git add -A && git commit -m "chore: catat perubahan langsung di VPS (<ringkas>)"` **sebelum** mulai kerja baru.

### C. Menarik perubahan VPS ke laptop (VPS belum punya token push GitHub)
```bash
git remote add vps root@103.247.11.91:/home/apps/suksesbangunan   # sekali saja
git fetch vps && git log --oneline main..vps/main                  # commit yang hanya ada di VPS
git merge vps/main && git push origin main
```

### D. Setelah selesai mengubah
1. Jalankan pemeriksaan:
   - backend: `cd backend-sb && npx tsc --noEmit -p tsconfig.build.json && npx jest`
   - frontend: `cd frontend-sb && npx tsc --noEmit && npm run build`
   - mobile: `cd mobileapp-sb && flutter analyze lib`
2. Tambahkan entri di **`CATATAN_PERUBAHAN.md`** (tanggal, siapa/AI apa, apa yang diubah, file, dampak data/migrasi).
3. `git commit` (pesan jelas, Bahasa Indonesia) → `git push origin main`.
4. Deploy (bagian 3). Jangan biarkan GitHub, laptop, dan VPS berbeda.

### E. WAJIB: samakan 3 tempat setiap selesai mengubah (aturan untuk AI)
AI agent **tidak boleh** mengakhiri pekerjaan selama laptop, GitHub, dan VPS belum sama:
```bash
git add -A && git commit -m "<ringkas, Bahasa Indonesia>"   # + entri CATATAN_PERUBAHAN.md
git push origin main                                        # GitHub
git push vps main:incoming && ssh root@103.247.11.91 "cd /home/apps/suksesbangunan && git merge --ff-only incoming"
# lalu build & restart sesuai bagian 3, kemudian verifikasi:
git fetch origin && git fetch vps && git rev-parse HEAD origin/main vps/main   # tiga hash SAMA
```
Jika push/merge ditolak karena ada perubahan orang lain: **jangan paksa** (`--force` dilarang) — tarik dulu (`git pull --rebase origin main`, `git fetch vps && git merge vps/main`), selesaikan konflik, ulangi.

### F. Pengingat otomatis ke pemilik
`scripts/pantau-perubahan.sh` berjalan di VPS tiap 10 menit (cron root) dan **mengirim email ke pemilik** bila:
file diubah langsung di VPS tanpa commit, ada commit baru di VPS, atau VPS ≠ GitHub (tertinggal / bercabang).
Penerima diatur di `/root/.laras-pantau/email` (bukan di git). Jangan menonaktifkan cron ini.

## 3. Cara Deploy (hanya lewat git — DILARANG `scp -r` seluruh folder)
```bash
# Dari laptop: kirim commit ke VPS (VPS menerima push ke branch lain, lalu di-merge)
git push vps main:incoming

# Di VPS
ssh root@103.247.11.91
cd /home/apps/suksesbangunan
git status                                   # harus bersih (lihat Protokol B)
tar czf /root/backup-$(date +%Y%m%d-%H%M).tgz backend-sb/src backend-sb/dist frontend-sb/app frontend-sb/components frontend-sb/lib frontend-sb/.next
git merge --ff-only incoming                 # gagal = ada perubahan di VPS yang belum ditarik → ikuti Protokol B/C dulu
cd backend-sb  && npm install && npm run build && pm2 restart backend
cd ../frontend-sb && npm install && npm run build && pm2 restart frontend
pm2 logs backend --lines 30 --nostream       # pastikan "Nest application successfully started"
```
APK baru: `cd mobileapp-sb && flutter build apk --release`, salin ke `frontend-sb/public/apk/app-release.apk`
**dan** `LARAS.apk` di VPS (file APK tidak masuk git). APK ditandatangani debug keystore laptop pemilik —
APK dari keystore lain tidak bisa meng-update aplikasi yang sudah terpasang.

## 4. Aturan Bisnis Kritis (jangan dilanggar tanpa persetujuan pemilik)
- **Cuti**: hanya lewat pengajuan mobile. HRD menentukan `hakCuti` & `jatahCuti` (hari/tahun). Saldo = jatah − disetujui − menunggu. Yang dihitung & dijadikan cuti hanya **hari kerja karyawan**: menurut jadwal bila ada (operasional bisa cuti di hari Minggu bila Minggu-nya ada shift; hari off fleksibel tetap libur), bila belum ada jadwal → kecuali hari libur tetap (`hariLibur`, default Minggu) dan, untuk kantor, tanggal merah (`hariKerjaCuti` di `pengajuan-izin.service.ts`).
  Cuti yang disetujui SPV & HRD mengisi `jadwal_kerja` (`is_cuti=true`, `sumber_upload='pengajuan_cuti'`) dan **dikunci trigger database `trg_jadwal_kunci_cuti`** — tidak bisa diubah/dihapus oleh siapa pun. Jangan hapus trigger ini.
- **Izin / sakit / dinas luar / izin sementara** tidak mengubah jadwal. Izin sementara disetujui → jam pulang diperpanjang sebesar durasinya (validasi absen pulang di `absensi.service.ts`).
- **Hak atur jadwal**: SPV → staf departemennya. HRD → jadwal Supervisor & staf departemen tanpa SPV. Admin → semua (cadangan). Divalidasi di `jadwal-kerja.service.ts` (`validateKaryawanAccess`).
- **Payroll** (`penggajian.service.ts`): periode = cut-off (default 25 → 24), bulan periode = bulan tanggal akhir.
  Hari kerja dihitung per tanggal (jadwal bila ada, kalender Sen–Sab bila kosong, minus tanggal merah).
  Hari penting/libur HRD (outing dll) = hari kerja dibayar penuh + uang makan tanpa absen, hanya bila tanggal itu hari kerja karyawan (bukan off rutin/Minggu).
  Gaji pokok prorata hari dibayar (hadir + hari penting HRD + sakit resmi + dinas luar + cuti resmi). Uang makan × (hari hadir riil + hari penting HRD).
  Telat & kembali istirahat > 60 menit = denda per kejadian (Pengaturan Penggajian). Slip yang sudah dibayar (`tanggalBayar`) tidak bisa di-generate/diedit.
  Generate ulang mempertahankan lembur & potongan lain input HRD.
- **Pencairan RO & Cuti** (`backend-sb/src/pencairan`): hanya lewat pengajuan mobile, alur SPV → HRD (pemohon SPV/kantor langsung HRD). RO: saldo `saldo_ro` dikunci FIFO (`diajukan`, kolom `id_pencairan`) → `digunakan` saat disetujui, kembali `tersedia` bila ditolak/batal. Cuti: memotong `getSaldoCuti` (jatah − cuti − pencairan cuti, per `tahun`). Dibayar saat Generate Payroll di slip periode yang `tanggal_disetujui` ≤ akhir periode (kolom `penggajian.pencairan_hak`, 1 hari = gaji pokok ÷ hari kerja periode), `id_gaji` & `nominal` dicatat (idempoten). Tidak diedit manual.
- **Kasbon** (`backend-sb/src/kasbon`): cicilan dipotong otomatis saat Generate Payroll (tabel `kasbon_cicilan` per slip, idempoten), maksimal sisa & tidak membuat THP minus, otomatis `lunas`. Potongan kasbon di slip tidak boleh diedit manual.
- **Tanggal merah & cuti bersama** (`backend-sb/src/kebijakan-libur`): satu-satunya sumber keputusan libur resmi. `libur` = kantor off, operasional yang masuk dapat RO, bukan hari kerja payroll; `kerja` = hari kerja biasa tanpa RO. Default: libur nasional = libur, cuti bersama = kerja. **Jangan** memakai `checkIndonesianHoliday` langsung untuk keputusan libur/RO/payroll — pakai `KebijakanLiburService`.
- **Batas & rute pengajuan** (`backend-sb/src/aturan-pengajuan`): setiap pengajuan baru wajib memanggil `AturanPengajuanService.cekBatas` (409 bila melewati batas) dan memakai `statusAwal`/`isSpv` — pemohon SPV langsung ke HRD. Batas diatur HRD di tabel `batas_pengajuan`, jangan di-hardcode.
- **Karyawan External**: tidak masuk payroll/kasbon/slip; hanya absensi (rekap berkop untuk brand).
- **BNIDirect** (`reports/bni-direct.util.ts`): replika template `BNIDIRECT-EXCEL_TEMPLATE_v1.9.6` (9 sheet) & output macro "Create CSV". Ubah format hanya jika template bank berubah.
- **Dokumen resmi** (kop, logo, cap & tanda tangan HRD) ada di `backend-sb/assets/report/` dan `reports/pdf.util.ts`.

## 5. Gaya Kerja: Ponytail
Bertindak sebagai *lazy senior developer* — *the best code is the code never written*:
1. Utamakan reuse, hapus kode yang tidak perlu, pilih solusi paling sederhana.
2. Pertanyakan setiap abstraksi, boilerplate, dan dependency baru.
3. Ikuti gaya kode di sekitarnya (komentar Bahasa Indonesia, pola modul NestJS/GetX yang sudah ada).
4. Notifikasi/konfirmasi web memakai helper `frontend-sb/lib/swal.ts` (SweetAlert2), unduhan memakai `lib/download.ts`.
