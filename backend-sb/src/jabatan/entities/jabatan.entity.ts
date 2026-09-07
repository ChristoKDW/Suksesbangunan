import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('jabatan')
export class Jabatan {
  @ApiProperty({ description: 'ID Jabatan' })
  @PrimaryGeneratedColumn({ name: 'id_jabatan' })
  idJabatan: number;

  @ApiProperty({ description: 'Nama jabatan' })
  @Column({ name: 'nama_jabatan', type: 'varchar' })
  namaJabatan: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
