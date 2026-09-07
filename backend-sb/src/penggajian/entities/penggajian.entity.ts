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

  @ApiProperty({ description: 'Gaji pokok' })
  @Column({
    name: 'gaji_pokok',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  gajiPokok: number;

  @ApiProperty({ description: 'Potongan' })
  @Column({
    name: 'potongan',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  potongan: number;

  @ApiProperty({ description: 'Total gaji' })
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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
