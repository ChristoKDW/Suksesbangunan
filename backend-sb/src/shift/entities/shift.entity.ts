import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Departemen } from '../../departemen/entities/departemen.entity.js';

@Entity('shift')
export class Shift {
  @ApiProperty({ description: 'ID Shift' })
  @PrimaryGeneratedColumn({ name: 'id_shift' })
  idShift: number;

  @ApiProperty({ description: 'ID Departemen (jika null berlaku umum)', required: false })
  @Column({ name: 'id_departemen', type: 'int', nullable: true })
  idDepartemen: number | null;

  @ManyToOne(() => Departemen, { nullable: true, eager: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_departemen' })
  departemen: Departemen | null;

  @ApiProperty({ description: 'Nama shift' })
  @Column({ name: 'nama_shift', type: 'varchar' })
  namaShift: string;

  @ApiProperty({ description: 'Jam mulai shift' })
  @Column({ name: 'jam_mulai', type: 'time' })
  jamMulai: string;

  @ApiProperty({ description: 'Jam selesai shift' })
  @Column({ name: 'jam_selesai', type: 'time' })
  jamSelesai: string;

  @ApiProperty({
    description: 'Jam mulai istirahat',
    example: '12:00',
    required: false,
  })
  @Column({ name: 'jam_mulai_istirahat', type: 'time', nullable: true })
  jamMulaiIstirahat?: string;

  @ApiProperty({
    description: 'Jam selesai istirahat',
    example: '13:00',
    required: false,
  })
  @Column({ name: 'jam_selesai_istirahat', type: 'time', nullable: true })
  jamSelesaiIstirahat?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
