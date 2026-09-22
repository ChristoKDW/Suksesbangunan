// =============================================================================
// TypeScript interfaces matching backend entity responses exactly
// Database: PostgreSQL — absensi_sukses_bangunan
// =============================================================================

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  accessToken: string
  user: AuthUser
}

export interface AuthUser {
  idUser: number
  nama: string
  role: "Admin" | "HRD" | "SPV"
  username: string
  fotoProfil?: string | null
  idDepartemen?: number | null
}

// ─── User (Web Admin) ───────────────────────────────────────────────────────

export interface User {
  idUser: number
  nama: string
  role: "Admin" | "HRD" | "SPV"
  username: string
  password?: string
  fotoProfil?: string | null
  idDepartemen?: number | null
  departemen?: {
    idDepartemen: number
    namaDepartemen: string
  } | null
  createdAt?: string
  updatedAt?: string
}

// ─── Departemen ─────────────────────────────────────────────────────────────

export interface Departemen {
  idDepartemen: number
  namaDepartemen: string
  idPengelola?: number | null
  pengelola?: Array<{
    idUser: number
    nama: string
    username: string
    role: string
    fotoProfil?: string | null
  }> | {
    idUser: number
    nama: string
    username: string
    role: string
    fotoProfil?: string | null
  } | null
  createdAt?: string
  updatedAt?: string
}

// ─── Hari Libur & Hari Penting ──────────────────────────────────────────────

export interface HariLibur {
  idHariLibur: number
  nama: string
  tanggal: string
  keterangan?: string | null
  isLibur: boolean
  idShift?: number | null
  shift?: {
    idShift: number
    namaShift: string
    jamMulai: string
    jamSelesai: string
  } | null
  idUser?: number | null
  user?: {
    idUser: number
    nama: string
    username: string
  } | null
  createdAt?: string
  updatedAt?: string
}

// ─── Jabatan ────────────────────────────────────────────────────────────────

export interface Jabatan {
  idJabatan: number
  namaJabatan: string
  createdAt?: string
  updatedAt?: string
}

// ─── Karyawan ───────────────────────────────────────────────────────────────

export interface Karyawan {
  idKaryawan: number
  nik: string
  nama: string
  email: string | null
  nomorTelepon?: string | null
  idDepartemen: number | null
  departemen: Departemen | null
  idJabatan: number | null
  jabatan: Jabatan | null
  tanggalMasuk: string | null
  jenisKelamin?: string | null
  statusAktif: string // "aktif" | "resign" | "cuti"
  username: string | null
  emailTerverifikasi: boolean
  fotoWajahReferensi: string | null
  fotoProfil?: string | null
  gajiPokok: number | null
  tunjanganKonsumsiHari?: number | null
  tunjanganTransportasi?: number | null
  tunjanganKomunikasi?: number | null
  tunjanganJabatan?: number | null
  potonganBpjs?: number | null
  hakCuti: boolean
  hariLibur: string | null
  resetPasswordStatus?: string
  createdAt?: string
  updatedAt?: string
}

// ─── Shift ──────────────────────────────────────────────────────────────────

export interface Shift {
  idShift: number
  idDepartemen?: number | null
  departemen?: Departemen | null
  namaShift: string
  jamMulai: string   // "HH:mm:ss"
  jamSelesai: string  // "HH:mm:ss"
  createdAt?: string
  updatedAt?: string
}

// ─── Jadwal Kerja ───────────────────────────────────────────────────────────

export interface JadwalKerja {
  idJadwal: number
  idKaryawan: number
  karyawan: Karyawan
  idShift: number | null
  shift: Shift | null
  isCuti: boolean
  idUser: number | null
  user: User | null
  tanggal: string   // "YYYY-MM-DD"
  sumberUpload: string // "manual" | "excel"
  createdAt?: string
  updatedAt?: string
}

// ─── Absensi ────────────────────────────────────────────────────────────────

export interface Absensi {
  idAbsensi: number
  idKaryawan: number
  karyawan: Karyawan
  idJadwal: number | null
  jadwalKerja: JadwalKerja | null
  idIzin: number | null
  pengajuanIzin: PengajuanIzin | null
  jamMasukAktual: string | null  // ISO timestamp
  jamKeluarAktual: string | null // ISO timestamp
  lokasiLat: number | null
  lokasiLng: number | null
  dalamRadiusKantor: boolean | null
  statusKehadiran: string | null // "tepat waktu" | "telat" | "tidak sesuai jadwal" | "tidak hadir" | "izin" | "sakit" | "cuti"
  metodeAbsen: string | null     // "fingerprint" | "wajah" | "gps" | "manual"
  createdAt?: string
  updatedAt?: string
}

// ─── Istirahat ──────────────────────────────────────────────────────────────

export interface Istirahat {
  idIstirahat: number
  idAbsensi: number
  absensi: Absensi
  jamKeluarIstirahat: string | null  // ISO timestamp
  jamMasukIstirahat: string | null   // ISO timestamp (null = masih istirahat)
  durasiMenit: number | null
  durasiAktifMenit: number | null
  kelebihanMenit: number
  terlambatKembali: boolean
  terlambatAktif: boolean
  createdAt?: string
  updatedAt?: string
}

// ─── Pengajuan Izin ─────────────────────────────────────────────────────────

export interface PengajuanIzin {
  idIzin: number
  idKaryawan: number
  karyawan: Karyawan
  jenisIzin: string // "izin" | "sakit" | "cuti" | "dinas luar"
  tanggalMulai: string  // "YYYY-MM-DD"
  tanggalSelesai: string // "YYYY-MM-DD"
  alasan: string
  filePendukung: string | null
  menggunakanLokasi: boolean
  lokasiLat: number | null
  lokasiLng: number | null
  dalamRadiusKantor: boolean | null
  status: string // "menunggu_spv" | "menunggu_hrd" | "disetujui" | "ditolak_spv" | "ditolak_hrd" | "menunggu" | "ditolak"
  idUserApproval: number | null
  userApproval: User | null
  idUserSpv?: number | null
  userSpv?: User | null
  catatanSpv?: string | null
  idUserHrd?: number | null
  userHrd?: User | null
  catatanHrd?: string | null
  tanggalPengajuan: string   // ISO timestamp
  tanggalDiproses: string | null // ISO timestamp
  catatanApproval: string | null
  createdAt?: string
  updatedAt?: string
}

// ─── Penggajian ─────────────────────────────────────────────────────────────

export interface Penggajian {
  idGaji: number
  idKaryawan: number
  karyawan: Karyawan
  periodeAwal: string  // "YYYY-MM-DD"
  periodeAkhir: string // "YYYY-MM-DD"
  totalJamKerja: number
  totalHariKerja: number
  totalHariHadir: number
  gajiPokok: number
  gajiPokokSesuaiHari: number
  tarifKonsumsiPerHari: number
  tunjanganKonsumsi: number
  tunjanganTransportasi: number
  tunjanganKomunikasi: number
  tunjanganJabatan: number
  lembur: number
  totalPenghasilan: number
  potonganBpjs: number
  potonganTerlambat: number
  potonganPinjaman: number
  potonganLainnya: number
  sisaPinjaman: number
  potongan: number
  totalGaji: number
  tanggalBayar: string | null
  catatan?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface PengaturanPenggajian {
  id: number
  tanggalCutOffMulai: number
  tanggalCutOffSelesai: number
  dendaPerTelatDefault: number
  standarHariKerja: number
  updatedAt?: string
}

// ─── Pengaturan Kantor (Geofence) ───────────────────────────────────────────

export interface PengaturanKantor {
  idKantor: number
  namaKantor: string
  latitude: number
  longitude: number
  radiusMeter: number
  idDepartemen: number | null
  departemen: Departemen | null
  createdAt?: string
  updatedAt?: string
}

// ─── Pengajuan Pertukaran Shift / Off ───────────────────────────────────────

export interface PengajuanPertukaran {
  idPertukaran: number
  idKaryawanPemohon: number
  karyawanPemohon?: {
    idKaryawan: number
    nama: string
    nik: string
    departemen?: { namaDepartemen: string }
  }
  idKaryawanTarget: number
  karyawanTarget?: {
    idKaryawan: number
    nama: string
    nik: string
    departemen?: { namaDepartemen: string }
  }
  jenisPertukaran: "shift" | "off"
  tanggalPemohon: string
  idShiftPemohon?: number | null
  shiftPemohon?: { namaShift: string; jamMulai: string; jamSelesai: string } | null
  tanggalTarget: string
  idShiftTarget?: number | null
  shiftTarget?: { namaShift: string; jamMulai: string; jamSelesai: string } | null
  alasan: string
  status:
    | "menunggu_rekan"
    | "menunggu_spv"
    | "menunggu_hrd"
    | "disetujui"
    | "ditolak_rekan"
    | "ditolak_spv"
    | "ditolak_hrd"
  catatanRekan?: string | null
  idUserSpv?: number | null
  catatanSpv?: string | null
  idUserHrd?: number | null
  catatanHrd?: string | null
  createdAt?: string
  updatedAt?: string
}
