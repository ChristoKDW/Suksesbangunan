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

@Entity('penggajian')
export class Penggajian {
  @ApiProperty({ description: 'ID Gaji' })
  @PrimaryGeneratedColumn({ name: 'id_gaji' })
  idGaji: number;

  @ApiProperty({ description: 'ID Karyawan' })
  @Column({ name: 'id_karyawan', type: 'int' })
  idKaryawan: number;

  @ManyToOne(() => Karyawan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_karyawan' })
  karyawan: Karyawan;

  @ApiProperty({ description: 'Periode awal' })
  @Column({ name: 'periode_awal', type: 'date' })
  periodeAwal: Date;

  @ApiProperty({ description: 'Periode akhir' })
  @Column({ name: 'periode_akhir', type: 'date' })
  periodeAkhir: Date;

  @ApiProperty({ description: 'Total jam kerja dalam periode' })
  @Column({ name: 'total_jam_kerja', type: 'int', default: 0 })
  totalJamKerja: number;

  @ApiProperty({ description: 'Total hari kerja standar dalam periode (misal 26 hari)' })
  @Column({ name: 'total_hari_kerja', type: 'int', default: 26 })
  totalHariKerja: number;

  @ApiProperty({ description: 'Total hari kerja aktual yang dihadiri' })
  @Column({ name: 'total_hari_hadir', type: 'int', default: 0 })
  totalHariHadir: number;

  @ApiProperty({ description: 'Gaji pokok bulanan' })
  @Column({
    name: 'gaji_pokok',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  gajiPokok: number;

  @ApiProperty({ description: 'Gaji pokok sesuai hari kerja' })
  @Column({
    name: 'gaji_pokok_sesuai_hari',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  gajiPokokSesuaiHari: number;

  @ApiProperty({ description: 'Tarif tunjangan konsumsi per hari' })
  @Column({
    name: 'tarif_konsumsi_per_hari',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 20000,
  })
  tarifKonsumsiPerHari: number;

  @ApiProperty({ description: 'Total tunjangan konsumsi (tarif * kehadiran)' })
  @Column({
    name: 'tunjangan_konsumsi',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  tunjanganKonsumsi: number;

  @ApiProperty({ description: 'Tunjangan transportasi' })
  @Column({
    name: 'tunjangan_transportasi',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  tunjanganTransportasi: number;

  @ApiProperty({ description: 'Tunjangan komunikasi' })
  @Column({
    name: 'tunjangan_komunikasi',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  tunjanganKomunikasi: number;

  @ApiProperty({ description: 'Tunjangan jabatan' })
  @Column({
    name: 'tunjangan_jabatan',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  tunjanganJabatan: number;

  @ApiProperty({ description: 'Upah lembur' })
  @Column({
    name: 'lembur',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  lembur: number;

  @ApiProperty({ description: 'Total seluruh penghasilan kotor' })
  @Column({
    name: 'total_penghasilan',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  totalPenghasilan: number;

  @ApiProperty({ description: 'Potongan BPJS Ketenagakerjaan' })
  @Column({
    name: 'potongan_bpjs',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  potonganBpjs: number;

  @ApiProperty({ description: 'Potongan keterlambatan' })
  @Column({
    name: 'potongan_terlambat',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  potonganTerlambat: number;

  @ApiProperty({ description: 'Potongan pinjaman / kasbon' })
  @Column({
    name: 'potongan_pinjaman',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  potonganPinjaman: number;

  @ApiProperty({ description: 'Potongan lainnya / potongan global' })
  @Column({
    name: 'potongan_lainnya',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  potonganLainnya: number;

  @ApiProperty({ description: 'Sisa pinjaman setelah potongan' })
  @Column({
    name: 'sisa_pinjaman',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  sisaPinjaman: number;

  @ApiProperty({ description: 'Total seluruh potongan' })
  @Column({
    name: 'potongan',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  potongan: number;

  @ApiProperty({ description: 'Total Take Home Pay / Total Diterima' })
  @Column({
    name: 'total_gaji',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  totalGaji: number;

  @ApiProperty({ description: 'Tanggal pembayaran' })
  @Column({ name: 'tanggal_bayar', type: 'date', nullable: true })
  tanggalBayar: Date;

  @ApiProperty({ description: 'Catatan tambahan slip gaji', required: false })
  @Column({ name: 'catatan', type: 'text', nullable: true })
  catatan: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
