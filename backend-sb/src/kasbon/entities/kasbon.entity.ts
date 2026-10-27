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
import { Penggajian } from '../../penggajian/entities/penggajian.entity.js';

const money = {
  type: 'decimal' as const,
  precision: 15,
  scale: 2,
  transformer: {
    to: (v: number) => v,
    from: (v: string | null) => (v === null ? 0 : Number(v)),
  },
};

export type StatusKasbon = 'menunggu' | 'aktif' | 'lunas' | 'ditolak' | 'dibatalkan';

/**
 * Kasbon / pinjaman karyawan. Cicilan dipotong otomatis setiap Generate Payroll
 * (lihat KasbonCicilan); sisa = jumlah - total cicilan tercatat.
 */
@Entity('kasbon')
export class Kasbon {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'id_kasbon' })
  idKasbon: number;

  @ApiProperty()
  @Index()
  @Column({ name: 'id_karyawan', type: 'int' })
  idKaryawan: number;

  @ManyToOne(() => Karyawan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_karyawan' })
  karyawan: Karyawan;

  @ApiProperty({ description: 'Total pinjaman (Rp)' })
  @Column({ name: 'jumlah', ...money })
  jumlah: number;

  @ApiProperty({ description: 'Cicilan dipotong per periode gaji (Rp)' })
  @Column({ name: 'cicilan_per_bulan', ...money })
  cicilanPerBulan: number;

  @ApiProperty({ description: 'Mulai dipotong pada periode gaji (YYYY-MM, bulan akhir cut-off)' })
  @Column({ name: 'mulai_periode', type: 'varchar', length: 7 })
  mulaiPeriode: string;

  @ApiProperty({ description: 'menunggu | aktif | lunas | ditolak | dibatalkan' })
  @Column({ name: 'status', type: 'varchar', length: 15, default: 'aktif' })
  status: StatusKasbon;

  @ApiProperty({ description: 'Keperluan / alasan kasbon' })
  @Column({ name: 'alasan', type: 'text', nullable: true })
  alasan: string | null;

  @ApiProperty({ description: 'Catatan HRD' })
  @Column({ name: 'catatan_hrd', type: 'text', nullable: true })
  catatanHrd: string | null;

  @ApiProperty({ description: 'hrd (dicatat HRD) | mobile (diajukan karyawan)' })
  @Column({ name: 'sumber', type: 'varchar', length: 10, default: 'hrd' })
  sumber: 'hrd' | 'mobile';

  @Column({ name: 'id_user_hrd', type: 'int', nullable: true })
  idUserHrd: number | null;

  @Column({ name: 'tanggal_diproses', type: 'timestamp', nullable: true })
  tanggalDiproses: Date | null;

  @OneToMany(() => KasbonCicilan, (c) => c.kasbon)
  cicilan: KasbonCicilan[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/** Satu potongan cicilan kasbon pada satu slip gaji. */
@Entity('kasbon_cicilan')
@Index(['idKasbon', 'idGaji'], { unique: true })
export class KasbonCicilan {
  @PrimaryGeneratedColumn({ name: 'id_cicilan' })
  idCicilan: number;

  @Column({ name: 'id_kasbon', type: 'int' })
  idKasbon: number;

  @ManyToOne(() => Kasbon, (k) => k.cicilan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_kasbon' })
  kasbon: Kasbon;

  @Index()
  @Column({ name: 'id_gaji', type: 'int' })
  idGaji: number;

  // Slip gaji dihapus → cicilannya ikut terhapus dan sisa kasbon kembali
  @ManyToOne(() => Penggajian, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_gaji' })
  penggajian: Penggajian;

  @Column({ name: 'periode_akhir', type: 'date' })
  periodeAkhir: string;

  @Column({ name: 'nominal', ...money })
  nominal: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
