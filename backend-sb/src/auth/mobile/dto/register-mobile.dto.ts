import { IsNotEmpty, IsString, IsEmail, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterMobileDto {
  @ApiProperty({ description: 'NIK karyawan', example: 'EMP001' })
  @IsNotEmpty()
  @IsString()
  nik: string;

  @ApiProperty({ description: 'Nama karyawan', example: 'Budi Santoso' })
  @IsNotEmpty()
  @IsString()
  nama: string;

  @ApiProperty({ description: 'Email', example: 'budi@email.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Username', example: 'budisantoso' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ description: 'Password (gabungan huruf besar, kecil, angka, simbol)', example: 'Admin#2026' })
  @IsNotEmpty()
  @IsString()
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^_\-.~+=#<>])[A-Za-z\d@$!%*?&#^_\-.~+=#<>]{8,}$/,
    {
      message:
        'Password harus minimal 8 karakter dan merupakan kombinasi huruf besar, huruf kecil, angka, dan karakter khusus',
    },
  )
  password: string;

  @ApiProperty({ description: 'Nomor Telepon/WhatsApp', example: '08123456789', required: false })
  @IsString()
  nomorTelepon?: string;
}
