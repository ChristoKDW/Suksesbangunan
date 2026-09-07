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
    description: 'Status aktif',
    enum: ['aktif', 'resign', 'cuti'],
  })
  @IsOptional()
  @IsIn(['aktif', 'resign', 'cuti'])
  statusAktif?: string;

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

  @ApiPropertyOptional({ description: 'Email karyawan' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Gaji pokok bulanan' })
  @IsOptional()
  @IsNumber()
  gajiPokok?: number;

  @ApiPropertyOptional({ description: 'Hak cuti berbayar' })
  @IsOptional()
  hakCuti?: boolean;


  @ApiProperty({ description: 'Nomor Telepon/WhatsApp' })
  @IsString()
  @IsOptional()
  nomorTelepon?: string;

  @ApiPropertyOptional({ description: 'Hari Libur Paten' })
  @IsOptional()
  @IsString()
  hariLibur?: string;
}
