import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Karyawan } from '../../karyawan/entities/karyawan.entity.js';
import { HariLibur } from '../../hari-libur/entities/hari-libur.entity.js';
import { PengajuanRo } from './pengajuan-ro.entity.js';

@Entity('saldo_ro')
export class SaldoRo {
  @ApiProperty({ description: 'ID Saldo Regular Off' })
  @PrimaryGeneratedColumn({ name: 'id_saldo_ro' })
  idSaldoRo: number;

  @ApiProperty({ description: 'ID Karyawan penerima RO' })
  @Column({ name: 'id_karyawan', type: 'int' })
  @Index()
  idKaryawan: number;

  @ManyToOne(() => Karyawan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_karyawan' })
  karyawan: Karyawan;

  @ApiProperty({ description: 'ID Hari Libur / Hari Penting jika ada', required: false })
  @Column({ name: 'id_hari_libur', type: 'int', nullable: true })
  idHariLibur: number | null;

  @ManyToOne(() => HariLibur, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_hari_libur' })
  hariLibur: HariLibur | null;

  @ApiProperty({
    description: 'Tanggal merah / Hari libur nasional yang dikerjakan (YYYY-MM-DD)',
    example: '2026-08-17',
  })
  @Column({ name: 'tanggal_libur_nasional', type: 'date' })
  tanggalLiburNasional: string;

  @ApiProperty({
    description: 'Nama hari libur nasional yang diganti menjadi RO',
    example: 'Hari Proklamasi Kemerdekaan RI',
  })
  @Column({ name: 'nama_hari_libur', type: 'varchar', length: 255 })
  namaHariLibur: string;

  @ApiProperty({
    description: 'Tanggal saat RO didapatkan (YYYY-MM-DD)',
    example: '2026-08-17',
  })
  @Column({ name: 'tanggal_perolehan', type: 'date' })
  tanggalPerolehan: string;

  @ApiProperty({
    description: 'Tanggal kadaluarsa RO (3 bulan setelah perolehan) (YYYY-MM-DD)',
    example: '2026-11-17',
  })
  @Column({ name: 'tanggal_kadaluarsa', type: 'date' })
  tanggalKadaluarsa: string;

  @ApiProperty({
    description: 'Status saldo RO: tersedia, diajukan, digunakan, hangus',
    default: 'tersedia',
  })
  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: 'tersedia',
  })
  status: 'tersedia' | 'diajukan' | 'digunakan' | 'hangus';

  @ApiProperty({
    description: 'ID Pengajuan RO yang mengunci/menggunakan saldo ini',
    required: false,
  })
  @Column({ name: 'id_pengajuan_ro', type: 'int', nullable: true })
  idPengajuanRo: number | null;

  @ManyToOne(() => PengajuanRo, (pengajuan) => pengajuan.saldoRoList, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'id_pengajuan_ro' })
  pengajuanRo: PengajuanRo | null;

  @ApiProperty({ description: 'Keterangan tambahan', required: false })
  @Column({ name: 'keterangan', type: 'text', nullable: true })
  keterangan: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
