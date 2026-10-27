# LARAS — Sistem Absensi & Payroll CV. Sukses Bangunindo

> ## ⚠️ Untuk developer & AI: BACA DULU SEBELUM MENGUBAH APA PUN
> 1. Baca **[`AGENTS.md`](AGENTS.md)** (aturan & protokol wajib) dan **[`CATATAN_PERUBAHAN.md`](CATATAN_PERUBAHAN.md)** (riwayat perubahan).
> 2. Kode ada di **3 tempat yang harus selalu sama**: laptop/komputer kerja, **GitHub** (`ChristoKDW/Suksesbangunan`, branch `main`), dan **VPS** (`/home/apps/suksesbangunan`, sudah berupa repo git).
> 3. Setelah setiap perubahan **langsung samakan ketiganya** (commit → push GitHub → deploy ke VPS lewat git) dan catat di `CATATAN_PERUBAHAN.md`.
> 4. **Pemilik otomatis menerima email** setiap ada perubahan di VPS (file diubah tanpa commit, commit baru, atau VPS ≠ GitHub). Jadi ikuti protokol — jangan ubah file langsung di VPS tanpa commit.

## Isi repo
| Folder | Isi |
|---|---|
| `backend-sb/` | API NestJS + PostgreSQL (PM2 `backend`, port 3002) |
| `frontend-sb/` | Web Admin/HRD/SPV Next.js (PM2 `frontend`, port 3000) |
| `mobileapp-sb/` | Aplikasi karyawan Flutter (APK di `frontend-sb/public/apk/`) |
| `scripts/` | Pemantau perubahan VPS & pengirim email pengingat |

## Cek cepat: apakah ketiga tempat sudah sama?
```bash
git fetch origin && git fetch vps
git rev-parse HEAD origin/main vps/main   # ketiga hash harus SAMA
ssh root@103.247.11.91 "cd /home/apps/suksesbangunan && git status --short"   # harus kosong
```
(`vps` = remote `root@103.247.11.91:/home/apps/suksesbangunan` — cara menambahkannya ada di `AGENTS.md` bagian 2C.)
