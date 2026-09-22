import type { Karyawan } from './types.js';

export interface SaldoRo {
  idSaldoRo: number;
  idKaryawan: number;
  karyawan?: Karyawan;
  idHariLibur?: number | null;
  tanggalLiburNasional: string;
  namaHariLibur: string;
  tanggalPerolehan: string;
  tanggalKadaluarsa: string;
  status: 'tersedia' | 'diajukan' | 'digunakan' | 'hangus';
  idPengajuanRo?: number | null;
  keterangan?: string | null;
  sisaHari?: number;
  statusKeterangan?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PengajuanRo {
  idPengajuanRo: number;
  idKaryawan: number;
  karyawan?: {
    idKaryawan: number;
    nama: string;
    nik: string;
    departemen?: { namaDepartemen: string };
    jabatan?: { namaJabatan: string };
  };
  tanggalDipilih: string[] | string;
  jumlahHari: number;
  alasan?: string | null;
  status:
    | 'menunggu_spv'
    | 'ditolak_spv'
    | 'menunggu_hrd'
    | 'ditolak_hrd'
    | 'disetujui'
    | 'dibatalkan';
  idUserSpv?: number | null;
  userSpv?: { idUser: number; nama: string } | null;
  catatanSpv?: string | null;
  tanggalApprovalSpv?: string | null;
  idUserHrd?: number | null;
  userHrd?: { idUser: number; nama: string } | null;
  catatanHrd?: string | null;
  tanggalApprovalHrd?: string | null;
  saldoRoList?: SaldoRo[];
  createdAt?: string;
  updatedAt?: string;
}
