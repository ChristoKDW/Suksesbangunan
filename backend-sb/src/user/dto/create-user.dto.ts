import { IsNotEmpty, IsString, IsIn, IsOptional, IsNumber, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'Nama user', example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  nama: string;

  @ApiProperty({
    description: 'Role user',
    enum: ['Admin', 'HRD', 'SPV'],
    example: 'HRD',
  })
  @IsNotEmpty()
  @IsIn(['Admin', 'HRD', 'SPV'], { message: 'Role harus Admin, HRD, atau SPV' })
  role: string;

  @ApiProperty({ description: 'Username login', example: 'johndoe' })
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

  @ApiProperty({ description: 'Path foto profil', required: false })
  @IsOptional()
  @IsString()
  fotoProfil?: string;

  @ApiProperty({ description: 'ID Departemen', required: false })
  @IsOptional()
  @IsNumber()
  idDepartemen?: number;
}
