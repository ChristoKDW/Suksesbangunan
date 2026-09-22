import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../user/entities/user.entity.js';

@Entity('hari_libur')
export class HariLibur {
  @ApiProperty({ description: 'ID Hari Libur / Hari Penting' })
  @PrimaryGeneratedColumn({ name: 'id_hari_libur' })
  idHariLibur: number;

  @ApiProperty({ description: 'Nama hari libur / hari penting', example: 'Hari Raya Idul Fitri' })
  @Column({ name: 'nama', type: 'varchar' })
  nama: string;

  @ApiProperty({ description: 'Tanggal hari libur / hari penting (YYYY-MM-DD)', example: '2026-03-20' })
  @Index({ unique: true })
  @Column({ name: 'tanggal', type: 'date' })
  tanggal: string;

  @ApiProperty({ description: 'Keterangan tambahan', required: false })
  @Column({ name: 'keterangan', type: 'text', nullable: true })
  keterangan: string | null;

  @ApiProperty({ description: 'Apakah statusnya hari libur kerja', default: true })
  @Column({ name: 'is_libur', type: 'boolean', default: true })
  isLibur: boolean;

  @ApiProperty({ description: 'ID User HRD/Admin pembuat', required: false })
  @Column({ name: 'id_user', type: 'int', nullable: true })
  idUser: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_user' })
  user: User;

  @ApiProperty({ description: 'ID Shift khusus yang ditentukan HRD untuk hari ini', required: false })
  @Column({ name: 'id_shift', type: 'int', nullable: true })
  idShift: number | null;

  @ManyToOne('Shift', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_shift' })
  shift: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
