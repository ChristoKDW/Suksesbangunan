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

@Entity('peminjaman_aset')
export class PeminjamanAset {
  @ApiProperty({ description: 'ID Peminjaman Aset' })
  @PrimaryGeneratedColumn({ name: 'id_peminjaman_aset' })
  idPeminjamanAset: number;

  @ApiProperty({ description: 'ID Karyawan peminjam' })
  @Column({ name: 'id_karyawan', type: 'int' })
  @Index()
  idKaryawan: number;

  @ManyToOne(() => Karyawan, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_karyawan' })
  karyawan: Karyawan;

  @ApiProperty({ description: 'Kode barang/aset perusahaan', example: 'AST-001' })
  @Column({ name: 'kode_barang', type: 'varchar', length: 50 })
  kodeBarang: string;

  @ApiProperty({ description: 'Nama barang yang dipinjam', example: 'Laptop Lenovo ThinkPad' })
  @Column({ name: 'nama_barang', type: 'varchar' })
  namaBarang: string;

  @ApiProperty({ description: 'Tanggal mulai dipinjam (YYYY-MM-DD)' })
  @Column({ name: 'tanggal_pinjam', type: 'date' })
  tanggalPinjam: Date;

  @ApiProperty({
    description: 'Durasi peminjaman, mis. "1 Tahun", "6 Bulan", atau "Selama Masa Kerja"',
    example: 'Selama Masa Kerja',
  })
  @Column({ name: 'durasi', type: 'varchar', length: 100 })
  durasi: string;

  @ApiProperty({ description: 'Keterangan tambahan', required: false })
  @Column({ name: 'keterangan', type: 'text', nullable: true })
  keterangan: string | null;

  @ApiProperty({ description: 'Status: dipinjam / dikembalikan', default: 'dipinjam' })
  @Column({ name: 'status', type: 'varchar', length: 20, default: 'dipinjam' })
  status: 'dipinjam' | 'dikembalikan';

  @ApiProperty({ description: 'Tanggal aset dikembalikan', required: false })
  @Column({ name: 'tanggal_dikembalikan', type: 'date', nullable: true })
  tanggalDikembalikan: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
