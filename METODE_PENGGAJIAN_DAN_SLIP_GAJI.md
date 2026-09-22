# METODE BAKU & TRANSPARAN PENGGAJIAN CV SUKSES BANGUNINDO

Dokumen ini memuat standarisasi logika, rumus perhitungan, dan sinkronisasi sistem penggajian antara **Backend NestJS**, **Web Dashboard HRD**, dan **Aplikasi Mobile Karyawan**.

---

## 1. Metode Penentuan Total Hari Kerja (Dinamis Kalender / Jadwal Shift)

### Masalah Sebelumnya
Sebelumnya, sistem selalu mengunci total hari kerja pada angka `26` hari kerja karena pengaturan statis di database yang menimpa perhitungan kalender riil, sehingga ketika HRD mengubah tanggal dari `25 Agustus s/d 24 September` ke `25 Agustus s/d 25 September`, total hari kerja tidak bertambah dan tetap `26`.

### Solusi & Standar Baru
Total hari kerja kini dihitung **secara dinamis berbasis kalender cut-off aktual** atau **jadwal shift karyawan operasional**:

1. **Karyawan Kantor / Backoffice (Reguler)**:
   - Dihitung dari seluruh hari kalender dalam rentang cut-off (`periode_awal` s/d `periode_akhir`) **selain hari Minggu** (Senin s/d Sabtu).
   - **Simulasi 25 Agustus – 24 September 2026** (31 hari kalender):
     - Terdapat 4 hari Minggu (30 Ags, 6 Sep, 13 Sep, 20 Sep).
     - $\text{Total Hari Kerja} = 31 - 4 = \mathbf{27\text{ Hari}}$.
   - **Simulasi 25 Agustus – 25 September 2026** (32 hari kalender):
     - Tanggal 25 September adalah hari Jumat (hari kerja).
     - $\text{Total Hari Kerja} = 32 - 4 = \mathbf{28\text{ Hari}}$ (Otomatis bertambah 1 hari!).

2. **Karyawan Operasional (Shift)**:
   - Dihitung dari riwayat jadwal kerja resmi di tabel `jadwal_kerja` untuk rentang periode tersebut yang berstatus kerja (`isLibur = false` dan `isCuti = false`).
   - Apabila karyawan belum memiliki jadwal shift resmi di database, otomatis menggunakan fallback hari kerja kalender periode.

3. **Override Manual HRD (Opsional)**:
   - Pada modal **Generate Payroll** di Web Dashboard, HRD dapat melihat jumlah hari otomatis dan dapat mengubahnya secara manual jika terdapat kebijakan hari libur khusus.
   - Nilai dikirim via query parameter `total_hari_kerja`.

---

## 2. Metode Perhitungan Komponen Gaji & Denda

### A. Gaji Pokok Sesuai Hari Kerja (Metode Prorata Transparan)
- **Hari yang Berhak Dibayar Gaji Pokok**:
  $$\text{Hari Dibayar} = \min(\text{Total Hari Kerja}, \text{Total Hari Hadir Riil} + \text{Hari Sakit Resmi} + \text{Hari Cuti})$$
- **Rumus Nominal Gaji Pokok**:
  - Jika $\text{Hari Dibayar} \ge \text{Total Hari Kerja}$: Gaji pokok dibayarkan **100% Penuh**.
  - Jika $\text{Hari Dibayar} < \text{Total Hari Kerja}$ (ada alpa atau izin tidak dibayar):
    $$\text{Gaji Pokok Sesuai Hari} = \text{round}\left(\frac{\text{Hari Dibayar}}{\text{Total Hari Kerja}} \times \text{Gaji Pokok}\right)$$

### B. Tunjangan Konsumsi (Metode Harian Hadir Riil)
- Uang makan hanya diberikan untuk kehadiran fisik aktual di kantor/lapangan:
  $$\text{Tunjangan Konsumsi} = \text{Total Hari Hadir Riil} \times \text{Tarif Konsumsi Per Hari}$$
- Default tarif: **Rp 20.000 / hari**.
- Hari sakit, izin pribadi, cuti, maupun alpa **tidak mendapatkan** tunjangan konsumsi.

### C. Denda Keterlambatan (Metode Frekuensi & Tarif Baku)
- Dihitung dari rekam jejak absensi aktual dalam rentang cut-off:
  $$\text{Potongan Terlambat} = \text{Jumlah Kejadian Terlambat} \times \text{Tarif Denda}$$
- Default tarif denda: **Rp 20.000 / kali telat** (dapat diatur pada menu Pengaturan Cut-off).
- Rincian hari, jam masuk, dan nominal denda ditampilkan secara transparan di slip mobile dan preview slip web.

### D. Total Penghasilan (Bruto)
$$\text{Total Penghasilan} = \text{Gaji Pokok Sesuai Hari} + \text{Tunjangan Konsumsi} + \text{Tunjangan Transportasi} + \text{Tunjangan Komunikasi} + \text{Tunjangan Jabatan} + \text{Lembur}$$

### E. Total Potongan
$$\text{Total Potongan} = \text{Potongan BPJS} + \text{Potongan Terlambat} + \text{Potongan Pinjaman} + \text{Potongan Tambahan Global}$$

### F. Take Home Pay (Gaji Bersih Diterima)
$$\text{Take Home Pay} = \max(\text{Total Penghasilan} - \text{Total Potongan}, 0)$$

---

## 3. Sinkronisasi Antar Platform

| Komponen | Backend NestJS (VPS & Lokal) | Web HRD Dashboard (`/payroll`) | Mobile App Karyawan (`/slip-gaji`) |
|---|---|---|---|
| **Hari Kerja** | Dihitung dinamis via `hitungHariKerjaKalender()` & shift operasional | Live computed saat tanggal diubah, input override tersedia | Ditampilkan sesuai hasil kalkulasi dinamis periode/slip resmi |
| **Denda Telat** | Deteksi status `telat` riil, denda $\times$ frekuensi | Tampil di kolom potongan & modal edit | Banner peringatan real-time + tabel rincian keterlambatan |
| **Uang Makan** | Hari hadir fisik $\times$ tarif per hari | Otomatis dihitung harian | Tampil dengan formula `X Hari × Rp 20.000` |
| **Metode Baku** | Dilengkapi payload `metodePerhitungan` | Preview formula transparan di modal generate | Card khusus "Metode Perhitungan Transparan" |

---

## 4. Lokasi File Implementasi
- **Backend Service**: `backend-sb/src/penggajian/penggajian.service.ts`
- **Backend Controller**: `backend-sb/src/penggajian/penggajian.controller.ts`
- **Web Frontend**: `frontend-sb/app/(dashboard)/payroll/page.tsx`
- **Mobile View**: `mobileapp-sb/lib/app/modules/slip_gaji/views/slip_gaji_view.dart`
