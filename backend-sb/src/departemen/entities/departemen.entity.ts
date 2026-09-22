import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
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

  @ApiProperty({ description: 'ID User utama pengelola departemen ini', required: false })
  @Column({ name: 'id_pengelola', type: 'int', nullable: true })
  idPengelola: number | null;

  @ApiProperty({ description: 'Daftar user (SPV / HRD) yang mengelola departemen ini' })
  @ManyToMany('User')
  @JoinTable({
    name: 'departemen_pengelola',
    joinColumn: { name: 'id_departemen', referencedColumnName: 'idDepartemen' },
    inverseJoinColumn: { name: 'id_user', referencedColumnName: 'idUser' },
  })
  pengelola: any[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
