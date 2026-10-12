import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsEmail,
  IsIn,
  IsDateString,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateKaryawanDto {
  @ApiProperty({ description: 'NIK karyawan', example: 'EMP001' })
  @IsNotEmpty()
  @IsString()
  nik: string;

  @ApiProperty({ description: 'Nama karyawan', example: 'Budi Santoso' })
  @IsNotEmpty()
  @IsString()
  nama: string;

  @ApiPropertyOptional({ description: 'ID Departemen' })
  @IsOptional()
  @IsNumber()
  idDepartemen?: number;

  @ApiPropertyOptional({ description: 'ID Jabatan' })
  @IsOptional()
  @IsNumber()
  idJabatan?: number;

  @ApiPropertyOptional({ description: 'Tanggal masuk kerja' })
  @IsOptional()
  @IsDateString()
  tanggalMasuk?: string;

  @ApiPropertyOptional({
    description: 'Jenis kelamin',
    enum: ['Laki-laki', 'Perempuan'],
  })
  @IsOptional()
  @IsIn(['Laki-laki', 'Perempuan'])
  jenisKelamin?: string;

  @ApiPropertyOptional({
    description: 'Status aktif',
    enum: ['aktif', 'resign', 'cuti'],
  })
  @IsOptional()
  @IsIn(['aktif', 'resign', 'cuti'])
  statusAktif?: string;

  @ApiPropertyOptional({
    description: 'Status karyawan: Internal (digaji perusahaan) / External (hanya absensi)',
    enum: ['Internal', 'External'],
  })
  @IsOptional()
  @IsIn(['Internal', 'External'])
  statusKaryawan?: string;

  @ApiPropertyOptional({ description: 'Username login mobile' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ description: 'Password (gabungan huruf besar, kecil, angka, simbol, min 8 char)' })
  @IsOptional()
  @IsString()
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^_\-.~+=#<>])[A-Za-z\d@$!%*?&#^_\-.~+=#<>]{8,}$/,
    {
      message:
        'Password harus minimal 8 karakter dan merupakan kombinasi huruf besar, huruf kecil, angka, dan karakter khusus',
    },
  )
  password?: string;

  @ApiProperty({ description: 'Email karyawan (wajib)' })
  @IsNotEmpty({ message: 'Email wajib diisi' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email: string;

  @ApiPropertyOptional({ description: 'Gaji pokok bulanan' })
  @IsOptional()
  @IsNumber()
  gajiPokok?: number;

  @ApiPropertyOptional({ description: 'Tunjangan konsumsi per hari', example: 20000 })
  @IsOptional()
  @IsNumber()
  tunjanganKonsumsiHari?: number;

  @ApiPropertyOptional({ description: 'Tunjangan transportasi bulanan', example: 200000 })
  @IsOptional()
  @IsNumber()
  tunjanganTransportasi?: number;

  @ApiPropertyOptional({ description: 'Tunjangan komunikasi bulanan', example: 150000 })
  @IsOptional()
  @IsNumber()
  tunjanganKomunikasi?: number;

  @ApiPropertyOptional({ description: 'Tunjangan jabatan bulanan', example: 255000 })
  @IsOptional()
  @IsNumber()
  tunjanganJabatan?: number;

  @ApiPropertyOptional({ description: 'Potongan BPJS Ketenagakerjaan bulanan', example: 0 })
  @IsOptional()
  @IsNumber()
  potonganBpjs?: number;

  @ApiPropertyOptional({ description: 'Hak cuti berbayar' })
  @IsOptional()
  hakCuti?: boolean;


  @ApiProperty({ description: 'Nomor Telepon/WhatsApp (wajib)' })
  @IsNotEmpty({ message: 'Nomor telepon wajib diisi' })
  @IsString()
  nomorTelepon: string;

  @ApiPropertyOptional({ description: 'Nomor rekening bank untuk payroll' })
  @IsOptional()
  @IsString()
  noRekening?: string;

  @ApiPropertyOptional({ description: 'Nama bank rekening payroll', example: 'BNI' })
  @IsOptional()
  @IsString()
  namaBank?: string;

  @ApiPropertyOptional({ description: 'Hari Libur Paten' })
  @IsOptional()
  @IsString()
  hariLibur?: string;

  @ApiPropertyOptional({ description: 'Status lupa password (none, pending, approved)' })
  @IsOptional()
  @IsString()
  resetPasswordStatus?: string;

  @ApiPropertyOptional({ description: 'Nama panggilan' })
  @IsOptional()
  @IsString()
  namaPanggilan?: string;

  @ApiPropertyOptional({ description: 'Agama sesuai KTP' })
  @IsOptional()
  @IsString()
  agama?: string;

  @ApiPropertyOptional({ description: 'Tempat lahir sesuai KTP' })
  @IsOptional()
  @IsString()
  tempatLahir?: string;

  @ApiPropertyOptional({ description: 'Tanggal lahir sesuai KTP' })
  @IsOptional()
  @IsString()
  tanggalLahir?: string;

  @ApiPropertyOptional({ description: 'Status perkawinan' })
  @IsOptional()
  @IsString()
  statusPerkawinan?: string;

  @ApiPropertyOptional({ description: 'Nama ibu kandung' })
  @IsOptional()
  @IsString()
  namaIbuKandung?: string;

  @ApiPropertyOptional({ description: 'Lokasi kota terbit KTP' })
  @IsOptional()
  @IsString()
  kotaTerbitKtp?: string;

  @ApiPropertyOptional({ description: 'Kabupaten sesuai KTP' })
  @IsOptional()
  @IsString()
  kabupaten?: string;

  @ApiPropertyOptional({ description: 'Kecamatan sesuai KTP' })
  @IsOptional()
  @IsString()
  kecamatan?: string;

  @ApiPropertyOptional({ description: 'Kelurahan sesuai KTP' })
  @IsOptional()
  @IsString()
  kelurahan?: string;

  @ApiPropertyOptional({ description: 'RT/RW sesuai KTP' })
  @IsOptional()
  @IsString()
  rtRw?: string;

  @ApiPropertyOptional({ description: 'Path atau URL foto KTP' })
  @IsOptional()
  @IsString()
  fotoKtp?: string;

  @ApiPropertyOptional({ description: 'Path atau URL foto KK' })
  @IsOptional()
  @IsString()
  fotoKartuKeluarga?: string;

  @ApiPropertyOptional({ description: 'Path atau URL foto profil' })
  @IsOptional()
  @IsString()
  fotoProfil?: string;
}
