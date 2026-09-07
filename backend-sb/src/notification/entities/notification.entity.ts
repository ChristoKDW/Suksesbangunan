import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../user/entities/user.entity.js';
import { Karyawan } from '../../karyawan/entities/karyawan.entity.js';

@Entity('notification')
export class Notification {
  @ApiProperty({ description: 'ID Notifikasi' })
  @PrimaryGeneratedColumn({ name: 'id_notification' })
  idNotification: number;

  @ApiProperty({ description: 'ID User penerima (jika untuk Admin/HRD)' })
  @Column({ name: 'id_user', type: 'int', nullable: true })
  idUser: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_user' })
  user: User;

  @ApiProperty({ description: 'ID Karyawan penerima (jika untuk Karyawan)' })
  @Column({ name: 'id_karyawan', type: 'int', nullable: true })
  idKaryawan: number;

  @ManyToOne(() => Karyawan, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_karyawan' })
  karyawan: Karyawan;

  @ApiProperty({ description: 'Judul Notifikasi' })
  @Column({ name: 'title', type: 'varchar' })
  title: string;

  @ApiProperty({ description: 'Pesan / Isi Notifikasi' })
  @Column({ name: 'message', type: 'text' })
  message: string;

  @ApiProperty({ description: 'Tipe Notifikasi (misal: LEAVE_REQUEST, SYSTEM, ANNOUNCEMENT)' })
  @Column({ name: 'type', type: 'varchar', default: 'SYSTEM' })
  type: string;

  @ApiProperty({ description: 'Apakah sudah dibaca?' })
  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
