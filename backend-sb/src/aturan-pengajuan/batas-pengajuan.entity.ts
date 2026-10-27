import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/** Batas jumlah pengajuan per bulan untuk setiap jenis pengajuan (0 = tanpa batas). */
@Entity('batas_pengajuan')
export class BatasPengajuan {
  @PrimaryColumn({ name: 'jenis', type: 'varchar', length: 30 })
  jenis: string;

  @Column({ name: 'maks_per_bulan', type: 'int', default: 0 })
  maksPerBulan: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
