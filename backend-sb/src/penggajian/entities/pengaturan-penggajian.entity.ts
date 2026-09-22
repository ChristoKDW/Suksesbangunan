import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('pengaturan_penggajian')
export class PengaturanPenggajian {
  @ApiProperty({ description: 'ID Pengaturan' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Tanggal awal cut-off penggajian (misal 25)', default: 25 })
  @Column({ name: 'tanggal_cut_off_mulai', type: 'int', default: 25 })
  tanggalCutOffMulai: number;

  @ApiProperty({ description: 'Tanggal akhir/tutup buku cut-off penggajian (misal 24)', default: 24 })
  @Column({ name: 'tanggal_cut_off_selesai', type: 'int', default: 24 })
  tanggalCutOffSelesai: number;

  @ApiProperty({ description: 'Denda keterlambatan default per kali telat (Rp)', default: 20000 })
  @Column({
    name: 'denda_per_telat_default',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 20000,
  })
  dendaPerTelatDefault: number;

  @ApiProperty({ description: 'Jumlah standar hari kerja sebulan (misal 26 hari)', default: 26 })
  @Column({ name: 'standar_hari_kerja', type: 'int', default: 26 })
  standarHariKerja: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
