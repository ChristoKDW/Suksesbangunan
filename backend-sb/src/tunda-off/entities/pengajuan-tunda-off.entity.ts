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
import { User } from '../../user/entities/user.entity.js';

@Entity('pengajuan_tunda_off')
export class PengajuanTundaOff {
  @ApiProperty({ description: 'ID Pengajuan Tunda Off' })
  @PrimaryGeneratedColumn({ name: 'id_tunda_off' })
  idTundaOff: number;

  @ApiProperty({ description: 'ID Karyawan pemohon' })
  @Column({ name: 'id_karyawan', type: 'int' })
  @Index()
  idKaryawan: number;

  @ManyToOne(() => Karyawan, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_karyawan' })
  karyawan: Karyawan;

  @ApiProperty({
    description:
      'Tanggal off terjadwal yang akan ditunda (karyawan masuk kerja di tanggal ini)',
  })
  @Column({ name: 'tanggal_off_asal', type: 'date' })
  tanggalOffAsal: Date;

  @ApiProperty({
    description: 'Tanggal pengganti yang diajukan menjadi hari off baru',
  })
  @Column({ name: 'tanggal_off_baru', type: 'date' })
  tanggalOffBaru: Date;

  @ApiProperty({ description: 'Alasan jelas penundaan off (wajib)' })
  @Column({ name: 'alasan', type: 'text' })
  alasan: string;

  @ApiProperty({
    description:
      'Status: menunggu_spv, ditolak_spv, menunggu_hrd, ditolak_hrd, disetujui, dibatalkan',
    default: 'menunggu_spv',
  })
  @Column({
    name: 'status',
    type: 'varchar',
    length: 30,
    default: 'menunggu_spv',
  })
  status:
    | 'menunggu_spv'
    | 'ditolak_spv'
    | 'menunggu_hrd'
    | 'ditolak_hrd'
    | 'disetujui'
    | 'dibatalkan';

  @ApiProperty({ description: 'ID User SPV yang memproses', required: false })
  @Column({ name: 'id_user_spv', type: 'int', nullable: true })
  idUserSpv: number | null;

  @ManyToOne(() => User, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_user_spv' })
  userSpv: User | null;

  @ApiProperty({ description: 'Catatan dari SPV', required: false })
  @Column({ name: 'catatan_spv', type: 'text', nullable: true })
  catatanSpv: string | null;

  @ApiProperty({ description: 'Waktu keputusan SPV', required: false })
  @Column({ name: 'tanggal_approval_spv', type: 'timestamp', nullable: true })
  tanggalApprovalSpv: Date | null;

  @ApiProperty({ description: 'ID User HRD yang memproses', required: false })
  @Column({ name: 'id_user_hrd', type: 'int', nullable: true })
  idUserHrd: number | null;

  @ManyToOne(() => User, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_user_hrd' })
  userHrd: User | null;

  @ApiProperty({ description: 'Catatan dari HRD', required: false })
  @Column({ name: 'catatan_hrd', type: 'text', nullable: true })
  catatanHrd: string | null;

  @ApiProperty({ description: 'Waktu keputusan HRD', required: false })
  @Column({ name: 'tanggal_approval_hrd', type: 'timestamp', nullable: true })
  tanggalApprovalHrd: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
