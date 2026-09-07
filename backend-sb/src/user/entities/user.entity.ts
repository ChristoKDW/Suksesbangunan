import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

@Entity('user')
export class User {
  @ApiProperty({ description: 'ID User' })
  @PrimaryGeneratedColumn({ name: 'id_user' })
  idUser: number;

  @ApiProperty({ description: 'Nama user' })
  @Column({ name: 'nama', type: 'varchar' })
  nama: string;

  @ApiProperty({ description: 'Role: SPV, HRD, Admin' })
  @Column({ name: 'role', type: 'varchar' })
  role: string;

  @ApiProperty({ description: 'Username login' })
  @Column({ name: 'username', type: 'varchar', unique: true })
  username: string;

  @ApiProperty({ description: 'Path foto profil', required: false })
  @Column({ name: 'foto_profil', type: 'text', nullable: true })
  fotoProfil: string;

  @ApiProperty({ description: 'ID Departemen (Khusus SPV)', required: false })
  @Column({ name: 'id_departemen', type: 'int', nullable: true })
  idDepartemen: number;

  @Exclude()
  @Column({ name: 'password', type: 'varchar' })
  password: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
