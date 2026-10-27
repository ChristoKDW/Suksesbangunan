import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export type PerlakuanLibur = 'libur' | 'kerja';
export type JenisLibur = 'libur_nasional' | 'cuti_bersama';

/**
 * Pengecualian kebijakan untuk satu tanggal merah / cuti bersama resmi.
 * Tanggal tanpa baris di sini mengikuti kebijakan default di Pengaturan Penggajian.
 */
@Entity('kebijakan_libur')
export class KebijakanLibur {
  @ApiProperty({ example: '2026-08-17' })
  @PrimaryColumn({ name: 'tanggal', type: 'date' })
  tanggal: string;

  @ApiProperty({ description: 'libur = tanggal merah (kantor off, operasional masuk dapat RO) | kerja = hari kerja biasa' })
  @Column({ name: 'perlakuan', type: 'varchar', length: 10 })
  perlakuan: PerlakuanLibur;

  @Column({ name: 'id_user', type: 'int', nullable: true })
  idUser: number | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
