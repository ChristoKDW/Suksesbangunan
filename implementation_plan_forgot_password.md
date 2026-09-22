# Implementation Plan: Lupa Password Karyawan (Ponytail Mode 👱‍♀️)

Sesuai dengan filosofi **Ponytail** (*The best code is the code never written* & *YAGNI*), kita tidak akan membuat tabel baru (seperti `password_reset_requests`) yang akan menambah kompleksitas relasi dan *maintenance*. Kita akan memanfaatkan tabel `Karyawan` yang sudah ada dengan menambahkan satu kolom penanda status.

## 1. Backend (NestJS)

### A. Modifikasi Entity `Karyawan`
Tambahkan satu kolom sederhana untuk melacak status lupa password.
```typescript
@Column({ 
  type: 'enum', 
  enum: ['none', 'pending', 'approved'], 
  default: 'none',
  name: 'reset_password_status'
})
resetPasswordStatus: string;
```

### B. Endpoints Mobile (`mobile-auth.controller.ts`)
Buat dua endpoint baru yang terpisah dari alur klaim akun awal:
1. `POST /auth/mobile/forgot-password/request`
   - **Input:** `username`
   - **Logika:** Cari karyawan berdasarkan username. Jika ada, set `resetPasswordStatus = 'pending'`.
2. `POST /auth/mobile/forgot-password/claim`
   - **Input:** `username`, `newPassword`
   - **Logika:** Cek apakah karyawan dengan username tersebut memiliki `resetPasswordStatus === 'approved'`.
   - Jika ya: Hash `newPassword`, simpan ke DB, lalu kembalikan `resetPasswordStatus = 'none'`.
   - Jika tidak: Tolak dengan pesan "Request belum disetujui HRD".

### C. Endpoints HRD Dashboard (`karyawan.controller.ts` / `user.controller.ts`)
1. `GET /karyawan/reset-requests` (Opsional, atau bisa gabung dengan get all karyawan menggunakan filter `resetPasswordStatus = 'pending'`).
2. `PATCH /karyawan/:id/approve-reset`
   - **Logika:** Set `resetPasswordStatus = 'approved'`.

## 2. Frontend HRD (Next.js Dashboard)

- **UI Minimalis:** Pada halaman daftar karyawan (`/employees`), tambahkan satu *badge* atau filter untuk karyawan dengan status `pending` reset password.
- Tambahkan tombol **"Setujui Reset"** di baris tabel karyawan tersebut. (Tidak perlu halaman khusus jika bisa di-handle di tabel yang sama).

## 3. Mobile App (Flutter)

- **Satu Halaman Baru:** `ForgotPasswordView`.
- **Dua State (Bisa pakai Toggle/Tab atau UI sederhana):**
  1. **Form Request:** 
     - Input: Username.
     - Tombol: "Ajukan Reset ke HRD".
     - Action: Memanggil endpoint `/request`. Tampilkan *snackbar* sukses.
  2. **Form Claim Ulang:**
     - Input: Username, Password Baru, Konfirmasi Password Baru.
     - Tombol: "Simpan Password Baru".
     - Action: Memanggil endpoint `/claim`. Jika sukses, langsung diarahkan kembali ke halaman Login.

## 💡 Ponytail Highlights:
- **Zero Boilerplate Database:** Tidak ada tabel tambahan. Relasi database tetap bersih.
- **No OTP needed:** Karena HRD yang melakukan validasi manual secara *offline/human-in-the-loop*, sistem tidak perlu buang *resource* untuk integrasi dan pengiriman OTP ulang.
- **Isolasi Fitur:** Fitur ini sepenuhnya berdiri sendiri (menggunakan endpoint `/forgot-password/...`) sehingga tidak menyentuh, merusak, atau membuat kompleks fitur `check-nik` dan `register` (klaim awal) yang sudah stabil.
