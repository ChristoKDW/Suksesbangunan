import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { LaporanMasalah } from './laporan-masalah.entity.js';

@Entity('laporan_masalah_lampiran')
export class LaporanMasalahLampiran {
  @ApiProperty({ description: 'ID Lampiran' })
  @PrimaryGeneratedColumn({ name: 'id_lampiran' })
  idLampiran: number;

  @ApiProperty({ description: 'ID Laporan Terkait' })
  @Column({ name: 'id_laporan', type: 'int' })
  idLaporan: number;

  @ManyToOne(() => LaporanMasalah, (laporan) => laporan.lampiran, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_laporan' })
  laporan: LaporanMasalah;

  @ApiProperty({ description: 'Path berkas di server' })
  @Column({ name: 'file_path', type: 'text' })
  filePath: string;

  @ApiProperty({ description: 'Nama berkas asli' })
  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  fileName: string;

  @ApiProperty({ description: 'Mime type berkas' })
  @Column({ name: 'file_type', type: 'varchar', length: 50 })
  fileType: string;

  @ApiProperty({ description: 'Ukuran berkas dalam bytes' })
  @Column({ name: 'file_size_bytes', type: 'int' })
  fileSizeBytes: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
