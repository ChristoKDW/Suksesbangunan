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
import { Departemen } from '../../departemen/entities/departemen.entity.js';

@Entity('pengaturan_kantor')
export class PengaturanKantor {
  @ApiProperty({ description: 'ID Kantor' })
  @PrimaryGeneratedColumn({ name: 'id_kantor' })
  idKantor: number;

  @ApiProperty({ description: 'Nama kantor/cabang' })
  @Column({ name: 'nama_kantor', type: 'varchar' })
  namaKantor: string;

  @ApiProperty({ description: 'Latitude kantor' })
  @Column({ name: 'latitude', type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @ApiProperty({ description: 'Longitude kantor' })
  @Column({ name: 'longitude', type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @ApiProperty({ description: 'Radius toleransi dalam meter' })
  @Column({ name: 'radius_meter', type: 'int' })
  radiusMeter: number;

  @ApiProperty({ description: 'ID Departemen (opsional)' })
  @Column({ name: 'id_departemen', type: 'int', nullable: true })
  idDepartemen: number;

  @ManyToOne(() => Departemen, { nullable: true, eager: true })
  @JoinColumn({ name: 'id_departemen' })
  departemen: Departemen;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
