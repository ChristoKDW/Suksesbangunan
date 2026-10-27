import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Karyawan } from '../../karyawan/entities/karyawan.entity.js';
import { User } from '../../user/entities/user.entity.js';
import { LaporanMasalahLampiran } from './laporan-masalah-lampiran.entity.js';

@Entity('laporan_masalah')
export class LaporanMasalah {
  @ApiProperty({ description: 'ID Laporan' })
  @PrimaryGeneratedColumn({ name: 'id_laporan' })
  idLaporan: number;

  @ApiProperty({ description: 'Nomor Tiket Unik (e.g. RPT-202610-0001)' })
  @Column({ name: 'tiket_id', type: 'varchar', length: 25, unique: true })
  tiketId: string;

  @ApiProperty({ description: 'Sumber pengirim: mobile atau web' })
  @Column({ name: 'sumber', type: 'varchar', length: 10 })
  sumber: 'mobile' | 'web';

  @ApiProperty({ description: 'ID Karyawan jika pelapor dari mobile', required: false })
  @Column({ name: 'id_karyawan', type: 'int', nullable: true })
  idKaryawan: number | null;

  @ManyToOne(() => Karyawan, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_karyawan' })
  karyawan: Karyawan | null;

  @ApiProperty({ description: 'ID User jika pelapor dari web admin', required: false })
  @Column({ name: 'id_user', type: 'int', nullable: true })
  idUser: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_user' })
  user: User | null;

  @ApiProperty({ description: 'Kategori masalah (absensi_gps, kamera_wajah, jadwal_shift, payroll, dll)' })
  @Column({ name: 'kategori', type: 'varchar', length: 50 })
  kategori: string;

  @ApiProperty({ description: 'Judul ringkas masalah' })
  @Column({ name: 'judul', type: 'varchar', length: 200 })
  judul: string;

  @ApiProperty({ description: 'Deskripsi detail masalah' })
  @Column({ name: 'deskripsi', type: 'text' })
  deskripsi: string;

  @ApiProperty({ description: 'Langkah reproduksi error (opsional)', required: false })
  @Column({ name: 'langkah_reproduksi', type: 'text', nullable: true })
  langkahReproduksi: string | null;

  @ApiProperty({ description: 'Prioritas: rendah, sedang, tinggi, kritis' })
  @Column({ name: 'prioritas', type: 'varchar', length: 20, default: 'sedang' })
  prioritas: 'rendah' | 'sedang' | 'tinggi' | 'kritis';

  @ApiProperty({ description: 'Status tiket: menunggu, sedang_diproses, selesai, ditolak' })
  @Column({ name: 'status', type: 'varchar', length: 30, default: 'menunggu' })
  status: 'menunggu' | 'sedang_diproses' | 'selesai' | 'ditolak';

  @ApiProperty({ description: 'Info perangkat & lingkungan (JSON)', required: false })
  @Column({ name: 'device_info', type: 'jsonb', nullable: true })
  deviceInfo: Record<string, any> | null;

  @ApiProperty({ description: 'ID Super Admin yang menangani', required: false })
  @Column({ name: 'id_super_admin', type: 'int', nullable: true })
  idSuperAdmin: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_super_admin' })
  superAdmin: User | null;

  @ApiProperty({ description: 'Tanggapan atau solusi resmi dari Super Admin', required: false })
  @Column({ name: 'tanggapan_solusi', type: 'text', nullable: true })
  tanggapanSolusi: string | null;

  @ApiProperty({ description: 'Tanggal penyelesaian laporan', required: false })
  @Column({ name: 'tanggal_selesai', type: 'timestamptz', nullable: true })
  tanggalSelesai: Date | null;

  @OneToMany(() => LaporanMasalahLampiran, (lampiran) => lampiran.laporan, { cascade: true })
  lampiran: LaporanMasalahLampiran[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
