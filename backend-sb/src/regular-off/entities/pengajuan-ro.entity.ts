import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Karyawan } from '../../karyawan/entities/karyawan.entity.js';
import { User } from '../../user/entities/user.entity.js';
import { SaldoRo } from './saldo-ro.entity.js';

@Entity('pengajuan_ro')
export class PengajuanRo {
  @ApiProperty({ description: 'ID Pengajuan Regular Off' })
  @PrimaryGeneratedColumn({ name: 'id_pengajuan_ro' })
  idPengajuanRo: number;

  @ApiProperty({ description: 'ID Karyawan pemohon RO' })
  @Column({ name: 'id_karyawan', type: 'int' })
  @Index()
  idKaryawan: number;

  @ManyToOne(() => Karyawan, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_karyawan' })
  karyawan: Karyawan;

  @ApiProperty({
    description: 'Daftar tanggal RO yang diajukan karyawan (YYYY-MM-DD)',
    example: ['2026-09-15', '2026-09-16'],
  })
  @Column({ name: 'tanggal_dipilih', type: 'simple-array' })
  tanggalDipilih: string[];

  @ApiProperty({ description: 'Jumlah hari RO yang diajukan', example: 2 })
  @Column({ name: 'jumlah_hari', type: 'int' })
  jumlahHari: number;

  @ApiProperty({ description: 'Alasan atau catatan pengajuan RO', required: false })
  @Column({ name: 'alasan', type: 'text', nullable: true })
  alasan: string | null;

  @ApiProperty({
    description:
      'Status pengajuan: menunggu_spv, ditolak_spv, menunggu_hrd, ditolak_hrd, disetujui, dibatalkan',
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

  @ApiProperty({ description: 'ID User SPV yang menyetujui/menolak', required: false })
  @Column({ name: 'id_user_spv', type: 'int', nullable: true })
  idUserSpv: number | null;

  @ManyToOne(() => User, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_user_spv' })
  userSpv: User | null;

  @ApiProperty({ description: 'Catatan dari SPV', required: false })
  @Column({ name: 'catatan_spv', type: 'text', nullable: true })
  catatanSpv: string | null;

  @ApiProperty({ description: 'Waktu persetujuan/penolakan SPV', required: false })
  @Column({ name: 'tanggal_approval_spv', type: 'timestamp', nullable: true })
  tanggalApprovalSpv: Date | null;

  @ApiProperty({ description: 'ID User HRD yang menyetujui/menolak', required: false })
  @Column({ name: 'id_user_hrd', type: 'int', nullable: true })
  idUserHrd: number | null;

  @ManyToOne(() => User, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_user_hrd' })
  userHrd: User | null;

  @ApiProperty({ description: 'Catatan dari HRD', required: false })
  @Column({ name: 'catatan_hrd', type: 'text', nullable: true })
  catatanHrd: string | null;

  @ApiProperty({ description: 'Waktu persetujuan/penolakan HRD', required: false })
  @Column({ name: 'tanggal_approval_hrd', type: 'timestamp', nullable: true })
  tanggalApprovalHrd: Date | null;

  @OneToMany(() => SaldoRo, (saldo) => saldo.pengajuanRo)
  saldoRoList: SaldoRo[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
