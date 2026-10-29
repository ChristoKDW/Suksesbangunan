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

export type JenisPencairan = 'ro' | 'cuti';
export type StatusPencairan =
  | 'menunggu_spv'
  | 'ditolak_spv'
  | 'menunggu_hrd'
  | 'ditolak_hrd'
  | 'disetujui'
  | 'dibatalkan';

/**
 * Pengajuan pencairan (diuangkan) saldo RO / cuti tahunan.
 * 1 hari = gaji pokok ÷ hari kerja periode; dibayar di slip periode cut-off
 * tempat HRD menyetujui (kolom `idGaji` & `nominal` diisi saat Generate Payroll).
 */
@Entity('pengajuan_pencairan')
export class PengajuanPencairan {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'id_pencairan' })
  idPencairan: number;

  @ApiProperty()
  @Index()
  @Column({ name: 'id_karyawan', type: 'int' })
  idKaryawan: number;

  @ManyToOne(() => Karyawan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_karyawan' })
  karyawan: Karyawan;

  @ApiProperty({ description: 'ro | cuti' })
  @Column({ name: 'jenis', type: 'varchar', length: 10 })
  jenis: JenisPencairan;

  @ApiProperty({ description: 'Jumlah hari yang dicairkan', example: 2 })
  @Column({ name: 'jumlah_hari', type: 'int' })
  jumlahHari: number;

  @ApiProperty({ description: 'Tahun jatah cuti yang dicairkan (khusus cuti)', required: false })
  @Column({ name: 'tahun', type: 'int', nullable: true })
  tahun: number | null;

  @ApiProperty({ required: false })
  @Column({ name: 'alasan', type: 'text', nullable: true })
  alasan: string | null;

  @ApiProperty({
    description: 'menunggu_spv | ditolak_spv | menunggu_hrd | ditolak_hrd | disetujui | dibatalkan',
  })
  @Column({ name: 'status', type: 'varchar', length: 20, default: 'menunggu_spv' })
  status: StatusPencairan;

  @Column({ name: 'id_user_spv', type: 'int', nullable: true })
  idUserSpv: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_user_spv' })
  userSpv: User | null;

  @Column({ name: 'catatan_spv', type: 'text', nullable: true })
  catatanSpv: string | null;

  @Column({ name: 'id_user_hrd', type: 'int', nullable: true })
  idUserHrd: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_user_hrd' })
  userHrd: User | null;

  @Column({ name: 'catatan_hrd', type: 'text', nullable: true })
  catatanHrd: string | null;

  @ApiProperty({ description: 'Tanggal disetujui HRD (YYYY-MM-DD, zona bisnis)', required: false })
  @Column({ name: 'tanggal_disetujui', type: 'date', nullable: true })
  tanggalDisetujui: string | null;

  @ApiProperty({ description: 'Slip gaji tempat pencairan dibayar', required: false })
  @Column({ name: 'id_gaji', type: 'int', nullable: true })
  idGaji: number | null;

  @ApiProperty({ description: 'Nominal dibayar (Rp), diisi saat Generate Payroll' })
  @Column({
    name: 'nominal',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    transformer: { to: (v: number) => v, from: (v: string | null) => (v === null ? 0 : Number(v)) },
  })
  nominal: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
