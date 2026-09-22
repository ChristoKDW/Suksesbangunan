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
