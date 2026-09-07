import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('departemen')
export class Departemen {
  @ApiProperty({ description: 'ID Departemen' })
  @PrimaryGeneratedColumn({ name: 'id_departemen' })
  idDepartemen: number;

  @ApiProperty({ description: 'Nama departemen' })
  @Column({ name: 'nama_departemen', type: 'varchar' })
  namaDepartemen: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
