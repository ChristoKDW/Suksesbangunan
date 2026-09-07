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
import { Shift } from '../../shift/entities/shift.entity.js';
import { User } from '../../user/entities/user.entity.js';

@Entity('jadwal_kerja')
@Index(['idKaryawan', 'tanggal'])
export class JadwalKerja {
  @ApiProperty({ description: 'ID Jadwal' })
  @PrimaryGeneratedColumn({ name: 'id_jadwal' })
  idJadwal: number;

  @ApiProperty({ description: 'ID Karyawan' })
  @Column({ name: 'id_karyawan', type: 'int' })
  idKaryawan: number;

  @ManyToOne(() => Karyawan, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_karyawan' })
  karyawan: Karyawan;

  @ApiProperty({ description: 'ID Shift' })
  @Column({ name: 'id_shift', type: 'int', nullable: true })
  idShift: number;

  @ManyToOne(() => Shift, { eager: true, nullable: true })
  @JoinColumn({ name: 'id_shift' })
  shift: Shift;

  @ApiProperty({ description: 'Penanda Cuti (True jika karyawan cuti di tanggal ini)' })
  @Column({ name: 'is_cuti', type: 'boolean', default: false })
  isCuti: boolean;

  @ApiProperty({ description: 'ID User (SPV pembuat jadwal)' })
  @Column({ name: 'id_user', type: 'int', nullable: true })
  idUser: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'id_user' })
  user: User;

  @ApiProperty({ description: 'Tanggal jadwal' })
  @Column({ name: 'tanggal', type: 'date' })
  tanggal: Date;

  @ApiProperty({ description: 'Sumber upload: manual, excel' })
  @Column({
    name: 'sumber_upload',
    type: 'varchar',
    default: 'manual',
  })
  sumberUpload: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
