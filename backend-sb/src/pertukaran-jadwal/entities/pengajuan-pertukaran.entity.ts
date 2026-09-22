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
import { Karyawan } from '../../karyawan/entities/karyawan.entity.js';
import { Shift } from '../../shift/entities/shift.entity.js';
import { User } from '../../user/entities/user.entity.js';

@Entity('pengajuan_pertukaran')
export class PengajuanPertukaran {
  @ApiProperty({ description: 'ID Pertukaran' })
  @PrimaryGeneratedColumn({ name: 'id_pertukaran' })
  idPertukaran: number;

  @ApiProperty({ description: 'ID Karyawan Pemohon' })
  @Column({ name: 'id_karyawan_pemohon', type: 'int' })
  idKaryawanPemohon: number;

  @ManyToOne(() => Karyawan, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_karyawan_pemohon' })
  karyawanPemohon: Karyawan;

  @ApiProperty({ description: 'ID Karyawan Target (Rekan yang diajak tukar)' })
  @Column({ name: 'id_karyawan_target', type: 'int' })
  idKaryawanTarget: number;

  @ManyToOne(() => Karyawan, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_karyawan_target' })
  karyawanTarget: Karyawan;

  @ApiProperty({ description: 'Jenis pertukaran: shift atau off' })
  @Column({ name: 'jenis_pertukaran', type: 'varchar', length: 20 })
  jenisPertukaran: 'shift' | 'off';

  @ApiProperty({ description: 'Tanggal jadwal milik pemohon (YYYY-MM-DD)' })
  @Column({ name: 'tanggal_pemohon', type: 'date' })
  tanggalPemohon: string;

  @ApiProperty({ description: 'ID Shift asal milik pemohon (null jika off)' })
  @Column({ name: 'id_shift_pemohon', type: 'int', nullable: true })
  idShiftPemohon: number | null;

  @ManyToOne(() => Shift, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_shift_pemohon' })
  shiftPemohon: Shift | null;

  @ApiProperty({ description: 'Tanggal jadwal milik rekan target (YYYY-MM-DD)' })
  @Column({ name: 'tanggal_target', type: 'date' })
  tanggalTarget: string;

  @ApiProperty({ description: 'ID Shift tujuan milik rekan target (null jika off)' })
  @Column({ name: 'id_shift_target', type: 'int', nullable: true })
  idShiftTarget: number | null;

  @ManyToOne(() => Shift, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_shift_target' })
  shiftTarget: Shift | null;

  @ApiProperty({ description: 'Alasan pengajuan pertukaran', required: false })
  @Column({ name: 'alasan', type: 'text', nullable: true })
  alasan: string | null;

  @ApiProperty({
    description:
      'Status pertukaran: menunggu_rekan, ditolak_rekan, menunggu_spv, ditolak_spv, menunggu_hrd, ditolak_hrd, disetujui, dibatalkan',
    default: 'menunggu_rekan',
  })
  @Column({
    name: 'status',
    type: 'varchar',
    length: 30,
    default: 'menunggu_rekan',
  })
  status:
    | 'menunggu_rekan'
    | 'ditolak_rekan'
    | 'menunggu_spv'
    | 'ditolak_spv'
    | 'menunggu_hrd'
    | 'ditolak_hrd'
    | 'disetujui'
    | 'dibatalkan';

  @ApiProperty({ description: 'Catatan dari rekan yang diajak tukar', required: false })
  @Column({ name: 'catatan_rekan', type: 'text', nullable: true })
  catatanRekan: string | null;

  @ApiProperty({ description: 'ID User SPV yang menyetujui/menolak', required: false })
  @Column({ name: 'id_user_spv', type: 'int', nullable: true })
  idUserSpv: number | null;

  @ManyToOne(() => User, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_user_spv' })
  userSpv: User | null;

  @ApiProperty({ description: 'Catatan dari SPV', required: false })
  @Column({ name: 'catatan_spv', type: 'text', nullable: true })
  catatanSpv: string | null;

  @ApiProperty({ description: 'ID User HRD yang menyetujui/menolak', required: false })
  @Column({ name: 'id_user_hrd', type: 'int', nullable: true })
  idUserHrd: number | null;

  @ManyToOne(() => User, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_user_hrd' })
  userHrd: User | null;

  @ApiProperty({ description: 'Catatan dari HRD', required: false })
  @Column({ name: 'catatan_hrd', type: 'text', nullable: true })
  catatanHrd: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
