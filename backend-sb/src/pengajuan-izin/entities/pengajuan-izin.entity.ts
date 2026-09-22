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
import { Karyawan } from '../../karyawan/entities/karyawan.entity.js';
import { User } from '../../user/entities/user.entity.js';

@Entity('pengajuan_izin')
export class PengajuanIzin {
  @ApiProperty({ description: 'ID Izin' })
  @PrimaryGeneratedColumn({ name: 'id_izin' })
  idIzin: number;

  @ApiProperty({ description: 'ID Karyawan' })
  @Column({ name: 'id_karyawan', type: 'int' })
  idKaryawan: number;

  @ManyToOne(() => Karyawan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_karyawan' })
  karyawan: Karyawan;

  @ApiProperty({
    description: 'Jenis izin: izin, sakit, cuti, dinas luar',
  })
  @Column({ name: 'jenis_izin', type: 'varchar' })
  jenisIzin: string;

  @ApiProperty({ description: 'Tanggal mulai izin' })
  @Column({ name: 'tanggal_mulai', type: 'date' })
  tanggalMulai: Date;

  @ApiProperty({ description: 'Tanggal selesai izin' })
  @Column({ name: 'tanggal_selesai', type: 'date' })
  tanggalSelesai: Date;

  @ApiProperty({ description: 'Alasan izin' })
  @Column({ name: 'alasan', type: 'varchar' })
  alasan: string;

  @ApiProperty({ description: 'Path file pendukung (surat dokter, dll)' })
  @Column({ name: 'file_pendukung', type: 'varchar', nullable: true })
  filePendukung: string;

  @ApiProperty({
    description: 'Apakah menggunakan lokasi (diajukan dari kantor)?',
  })
  @Column({ name: 'menggunakan_lokasi', type: 'boolean', default: false })
  menggunakanLokasi: boolean;

  @ApiProperty({ description: 'Latitude saat pengajuan (jika dari kantor)' })
  @Column({
    name: 'lokasi_lat',
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  lokasiLat: number;

  @ApiProperty({ description: 'Longitude saat pengajuan (jika dari kantor)' })
  @Column({
    name: 'lokasi_lng',
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  lokasiLng: number;

  @ApiProperty({ description: 'Dalam radius kantor (validasi otomatis)' })
  @Column({ name: 'dalam_radius_kantor', type: 'boolean', nullable: true })
  dalamRadiusKantor: boolean;

  @ApiProperty({
    description:
      'Status: disetujui, menunggu, ditolak',
  })
  @Column({ name: 'status', type: 'varchar', default: 'menunggu' })
  status: string;

  @ApiProperty({ description: 'ID User yang memproses (kompatibilitas)' })
  @Column({ name: 'id_user_approval', type: 'int', nullable: true })
  idUserApproval: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'id_user_approval' })
  userApproval: User;

  @ApiProperty({ description: 'ID User SPV yang menyetujui' })
  @Column({ name: 'id_user_spv', type: 'int', nullable: true })
  idUserSpv: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_user_spv' })
  userSpv: User;

  @ApiProperty({ description: 'Catatan approval SPV' })
  @Column({ name: 'catatan_spv', type: 'text', nullable: true })
  catatanSpv: string | null;

  @ApiProperty({ description: 'ID User HRD yang menyetujui' })
  @Column({ name: 'id_user_hrd', type: 'int', nullable: true })
  idUserHrd: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_user_hrd' })
  userHrd: User;

  @ApiProperty({ description: 'Catatan approval HRD' })
  @Column({ name: 'catatan_hrd', type: 'text', nullable: true })
  catatanHrd: string | null;

  @ApiProperty({ description: 'Tanggal pengajuan' })
  @Column({ name: 'tanggal_pengajuan', type: 'timestamp' })
  tanggalPengajuan: Date;

  @ApiProperty({ description: 'Tanggal diproses' })
  @Column({ name: 'tanggal_diproses', type: 'timestamp', nullable: true })
  tanggalDiproses: Date;

  @ApiProperty({ description: 'Catatan approval umum' })
  @Column({ name: 'catatan_approval', type: 'varchar', nullable: true })
  catatanApproval: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
