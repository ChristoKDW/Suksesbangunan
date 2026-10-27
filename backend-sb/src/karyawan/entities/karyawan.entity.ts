import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Departemen } from '../../departemen/entities/departemen.entity.js';
import { Jabatan } from '../../jabatan/entities/jabatan.entity.js';

@Entity('karyawan')
export class Karyawan {
  @ApiProperty({ description: 'ID Karyawan' })
  @PrimaryGeneratedColumn({ name: 'id_karyawan' })
  idKaryawan: number;

  @ApiProperty({ description: 'NIK karyawan (unik)' })
  @Column({ name: 'nik', type: 'varchar', unique: true })
  nik: string;

  @ApiProperty({ description: 'Nama karyawan' })
  @Column({ name: 'nama', type: 'varchar' })
  nama: string;

  @ApiProperty({ description: 'ID Departemen' })
  @Column({ name: 'id_departemen', type: 'int', nullable: true })
  idDepartemen: number;

  @ManyToOne(() => Departemen, { nullable: true, eager: true })
  @JoinColumn({ name: 'id_departemen' })
  departemen: Departemen;

  @ApiProperty({ description: 'ID Jabatan' })
  @Column({ name: 'id_jabatan', type: 'int', nullable: true })
  idJabatan: number;

  @ManyToOne(() => Jabatan, { nullable: true, eager: true })
  @JoinColumn({ name: 'id_jabatan' })
  jabatan: Jabatan;

  @ApiProperty({ description: 'Tanggal masuk kerja' })
  @Column({ name: 'tanggal_masuk', type: 'date', nullable: true })
  tanggalMasuk: Date;

  @ApiProperty({ description: 'Jenis kelamin (Laki-laki / Perempuan)', required: false })
  @Column({ name: 'jenis_kelamin', type: 'varchar', length: 20, nullable: true })
  jenisKelamin: string;

  @ApiProperty({ description: 'Status aktif: aktif, resign, cuti' })
  @Column({
    name: 'status_aktif',
    type: 'varchar',
    default: 'aktif',
  })
  statusAktif: string;

  @ApiProperty({ description: 'Status karyawan: Internal (digaji perusahaan) / External (hanya absensi)', default: 'Internal' })
  @Column({ name: 'status_karyawan', type: 'varchar', length: 20, default: 'Internal' })
  statusKaryawan: string;

  @ApiProperty({ description: 'Username login mobile' })
  @Column({ name: 'username', type: 'varchar', nullable: true })
  username: string;

  @Exclude()
  @Column({ name: 'password', type: 'varchar', nullable: true })
  password: string;

  @ApiProperty({ description: 'Email karyawan' })
  @Column({ name: 'email', type: 'varchar', unique: true, nullable: true })
  email: string;

  @ApiProperty({ description: 'Nomor Telepon / WhatsApp', required: false })
  @Column({ name: 'nomor_telepon', type: 'varchar', nullable: true })
  nomorTelepon: string;

  @ApiProperty({ description: 'Nomor rekening bank payroll', required: false })
  @Column({ name: 'no_rekening', type: 'varchar', length: 34, nullable: true })
  noRekening: string | null;

  @ApiProperty({ description: 'Nama bank rekening payroll', required: false })
  @Column({ name: 'nama_bank', type: 'varchar', length: 50, nullable: true })
  namaBank: string | null;

  @ApiProperty({ description: 'Nama panggilan karyawan', required: false })
  @Column({ name: 'nama_panggilan', type: 'varchar', length: 100, nullable: true })
  namaPanggilan: string | null;

  @ApiProperty({ description: 'Agama sesuai KTP', required: false })
  @Column({ name: 'agama', type: 'varchar', length: 50, nullable: true })
  agama: string | null;

  @ApiProperty({ description: 'Tempat lahir sesuai KTP', required: false })
  @Column({ name: 'tempat_lahir', type: 'varchar', length: 100, nullable: true })
  tempatLahir: string | null;

  @ApiProperty({ description: 'Tanggal lahir sesuai KTP', required: false })
  @Column({ name: 'tanggal_lahir', type: 'varchar', length: 100, nullable: true })
  tanggalLahir: string | null;

  @ApiProperty({ description: 'Status perkawinan sesuai KTP', required: false })
  @Column({ name: 'status_perkawinan', type: 'varchar', length: 50, nullable: true })
  statusPerkawinan: string | null;

  @ApiProperty({ description: 'Nama ibu kandung', required: false })
  @Column({ name: 'nama_ibu_kandung', type: 'varchar', length: 150, nullable: true })
  namaIbuKandung: string | null;

  @ApiProperty({ description: 'Lokasi kota terbit KTP', required: false })
  @Column({ name: 'kota_terbit_ktp', type: 'varchar', length: 100, nullable: true })
  kotaTerbitKtp: string | null;

  @ApiProperty({ description: 'Kabupaten sesuai KTP', required: false })
  @Column({ name: 'kabupaten', type: 'varchar', length: 100, nullable: true })
  kabupaten: string | null;

  @ApiProperty({ description: 'Kecamatan sesuai KTP', required: false })
  @Column({ name: 'kecamatan', type: 'varchar', length: 100, nullable: true })
  kecamatan: string | null;

  @ApiProperty({ description: 'Kelurahan sesuai KTP', required: false })
  @Column({ name: 'kelurahan', type: 'varchar', length: 100, nullable: true })
  kelurahan: string | null;

  @ApiProperty({ description: 'RT/RW sesuai KTP', required: false })
  @Column({ name: 'rt_rw', type: 'varchar', length: 50, nullable: true })
  rtRw: string | null;

  @ApiProperty({ description: 'Path atau link foto KTP', required: false })
  @Column({ name: 'foto_ktp', type: 'text', nullable: true })
  fotoKtp: string | null;

  @ApiProperty({ description: 'Path atau link foto Kartu Keluarga (KK)', required: false })
  @Column({ name: 'foto_kartu_keluarga', type: 'text', nullable: true })
  fotoKartuKeluarga: string | null;

  @ApiProperty({ description: 'Email sudah terverifikasi?' })
  @Column({
    name: 'email_terverifikasi',
    type: 'boolean',
    default: false,
  })
  emailTerverifikasi: boolean;

  @Exclude()
  @Column({ name: 'token', type: 'varchar', nullable: true })
  token: string;

  @Column({ name: 'token_kadaluarsa', type: 'timestamp', nullable: true })
  tokenKadaluarsa: Date;

  @Exclude()
  @Column({ name: 'otp_code', type: 'varchar', length: 6, nullable: true })
  otpCode: string | null;

  @Column({ name: 'otp_kadaluarsa', type: 'timestamp', nullable: true })
  otpKadaluarsa: Date | null;

  @ApiProperty({ description: 'Data wajah untuk referensi absensi' })
  @Column({ name: 'foto_wajah_referensi', type: 'text', nullable: true })
  fotoWajahReferensi: string;

  // pgvector: kolom "vector" native PostgreSQL untuk face recognition.
  // length = dimensi embedding MobileFaceNet (w600k_mbf) = 512.
  @ApiProperty({
    description: 'Embedding wajah (vector 512-dim) untuk face recognition',
    type: [Number],
    required: false,
  })
  @Column('vector', {
    name: 'face_embedding',
    length: 512,
    nullable: true,
    transformer: {
      to: (value: number[] | null) => {
        if (!value) return null;
        return Array.isArray(value) ? `[${value.join(',')}]` : value;
      },
      from: (value: string | number[] | null): number[] | null => {
        if (!value) return null;
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
          const cleaned = value.replace(/[\[\]]/g, '').trim();
          if (!cleaned) return null;
          return cleaned
            .split(',')
            .map((v) => parseFloat(v.trim()))
            .filter((n) => !isNaN(n));
        }
        return null;
      },
    },
  })
  faceEmbedding: number[] | null;

  @ApiProperty({ description: 'Gaji pokok bulanan' })
  @Column({
    name: 'gaji_pokok',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  gajiPokok: number;

  @ApiProperty({ description: 'Tunjangan konsumsi per hari', required: false })
  @Column({
    name: 'tunjangan_konsumsi_hari',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 20000,
    nullable: true,
  })
  tunjanganKonsumsiHari: number;

  @ApiProperty({ description: 'Tunjangan transportasi bulanan', required: false })
  @Column({
    name: 'tunjangan_transportasi',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    nullable: true,
  })
  tunjanganTransportasi: number;

  @ApiProperty({ description: 'Tunjangan komunikasi bulanan', required: false })
  @Column({
    name: 'tunjangan_komunikasi',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    nullable: true,
  })
  tunjanganKomunikasi: number;

  @ApiProperty({ description: 'Tunjangan jabatan bulanan', required: false })
  @Column({
    name: 'tunjangan_jabatan',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    nullable: true,
  })
  tunjanganJabatan: number;

  @ApiProperty({ description: 'Potongan BPJS Ketenagakerjaan bulanan', required: false })
  @Column({
    name: 'potongan_bpjs',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    nullable: true,
  })
  potonganBpjs: number;

  @ApiProperty({ description: 'Hak Cuti (Apakah digaji saat cuti)' })
  @Column({
    name: 'hak_cuti',
    type: 'boolean',
    default: false,
  })
  hakCuti: boolean;

  @ApiProperty({ description: 'Jatah cuti tahunan (hari) yang ditetapkan HRD', example: 12 })
  @Column({ name: 'jatah_cuti', type: 'int', default: 12 })
  jatahCuti: number;

  @ApiProperty({ description: 'Hari Libur Paten (pisahkan koma)', required: false })
  @Column({
    name: 'hari_libur',
    type: 'varchar',
    nullable: true,
  })
  hariLibur: string;

  @ApiProperty({ description: 'Path foto profil karyawan', required: false })
  @Column({
    name: 'foto_profil',
    type: 'varchar',
    nullable: true,
  })
  fotoProfil: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ApiProperty({ description: 'Status request lupa password', enum: ['none', 'pending', 'approved'] })
  @Column({ 
    type: 'enum', 
    enum: ['none', 'pending', 'approved'], 
    default: 'none',
    name: 'reset_password_status'
  })
  resetPasswordStatus: string;
}
