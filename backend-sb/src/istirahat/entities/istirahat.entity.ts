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
import { Absensi } from '../../absensi/entities/absensi.entity.js';

@Entity('istirahat')
export class Istirahat {
  @ApiProperty({ description: 'ID Istirahat' })
  @PrimaryGeneratedColumn({ name: 'id_istirahat' })
  idIstirahat: number;

  @ApiProperty({ description: 'ID Absensi' })
  @Column({ name: 'id_absensi', type: 'int' })
  idAbsensi: number;

  @ManyToOne(() => Absensi, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_absensi' })
  absensi: Absensi;

  @ApiProperty({ description: 'Jam keluar istirahat' })
  @Column({ name: 'jam_keluar_istirahat', type: 'timestamp', nullable: true })
  jamKeluarIstirahat: Date;

  @ApiProperty({ description: 'Jam masuk istirahat (kembali)' })
  @Column({ name: 'jam_masuk_istirahat', type: 'timestamp', nullable: true })
  jamMasukIstirahat: Date;

  @ApiProperty({ description: 'Durasi istirahat dalam menit' })
  @Column({ name: 'durasi_menit', type: 'int', nullable: true })
  durasiMenit: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
