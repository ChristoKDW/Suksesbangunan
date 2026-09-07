import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Karyawan } from '../../karyawan/entities/karyawan.entity.js';
import { JadwalKerja } from '../../jadwal-kerja/entities/jadwal-kerja.entity.js';
import { PengajuanIzin } from '../../pengajuan-izin/entities/pengajuan-izin.entity.js';
import { PengaturanKantor } from '../../pengaturan-kantor/entities/pengaturan-kantor.entity.js';
import { Istirahat } from '../../istirahat/entities/istirahat.entity.js';

@Entity('absensi')
export class Absensi {
  @ApiProperty({ description: 'ID Absensi' })
  @PrimaryGeneratedColumn({ name: 'id_absensi' })
  idAbsensi: number;

  @ApiProperty({ description: 'ID Karyawan' })
  @Column({ name: 'id_karyawan', type: 'int' })
  idKaryawan: number;

  @ManyToOne(() => Karyawan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_karyawan' })
  karyawan: Karyawan;

  @ApiProperty({ description: 'ID Jadwal Kerja' })
  @Column({ name: 'id_jadwal', type: 'int', nullable: true })
  idJadwal: number;

  @ManyToOne(() => JadwalKerja, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_jadwal' })
  jadwalKerja: JadwalKerja;

  @ApiProperty({
    description: 'ID Izin (jika absen karena izin/sakit/cuti yang disetujui)',
  })
  @Column({ name: 'id_izin', type: 'int', nullable: true })
  idIzin: number;

  @ManyToOne(() => PengajuanIzin, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_izin' })
  pengajuanIzin: PengajuanIzin;

  @ApiProperty({ description: 'ID Kantor tempat absen tercatat valid (geofence)' })
  @Column({ name: 'id_kantor', type: 'int', nullable: true })
  idKantor: number;

  @ManyToOne(() => PengaturanKantor, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_kantor' })
  kantor: PengaturanKantor;

  @ApiProperty({ description: 'Jam masuk aktual' })
  @Column({ name: 'jam_masuk_aktual', type: 'timestamp', nullable: true })
  jamMasukAktual: Date;

  @ApiProperty({ description: 'Jam keluar aktual' })
  @Column({ name: 'jam_keluar_aktual', type: 'timestamp', nullable: true })
  jamKeluarAktual: Date;

  @ApiProperty({ description: 'Latitude GPS saat absen' })
  @Column({
    name: 'lokasi_lat',
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  lokasiLat: number;

  @ApiProperty({ description: 'Longitude GPS saat absen' })
  @Column({
    name: 'lokasi_lng',
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  lokasiLng: number;

  @ApiProperty({ description: 'Dalam radius kantor?' })
  @Column({ name: 'dalam_radius_kantor', type: 'boolean', nullable: true })
  dalamRadiusKantor: boolean;

  @ApiProperty({
    description:
      'Status kehadiran: tepat waktu, telat, tidak sesuai jadwal, tidak hadir, izin, sakit, cuti',
  })
  @Column({ name: 'status_kehadiran', type: 'varchar', nullable: true })
  statusKehadiran: string;

  @ApiProperty({ description: 'Metode absen: fingerprint, wajah, gps, manual' })
  @Column({ name: 'metode_absen', type: 'varchar', nullable: true })
  metodeAbsen: string;

  @OneToMany(() => Istirahat, (istirahat) => istirahat.absensi)
  istirahat: Istirahat[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
