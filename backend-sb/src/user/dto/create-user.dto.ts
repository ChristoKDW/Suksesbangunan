import { IsNotEmpty, IsString, IsIn, IsOptional, IsNumber, Matches, IsEmail, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'Nama user', example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  nama: string;

  @ApiProperty({
    description: 'Role user',
    enum: ['Admin', 'HRD', 'SPV', 'Super Admin', 'SUPER_ADMIN', 'SOFTWARE_ENGINEER', 'SECURITY_AUDITOR', 'DEVOPS_ADMIN'],
    example: 'SUPER_ADMIN',
  })
  @IsNotEmpty()
  @IsIn(
    ['Admin', 'HRD', 'SPV', 'Super Admin', 'SUPER_ADMIN', 'SOFTWARE_ENGINEER', 'SECURITY_AUDITOR', 'DEVOPS_ADMIN'],
    { message: 'Role harus Admin, HRD, SPV, SUPER_ADMIN, SOFTWARE_ENGINEER, SECURITY_AUDITOR, atau DEVOPS_ADMIN' },
  )
  role: string;

  @ApiProperty({ description: 'Username login', example: 'johndoe' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiPropertyOptional({ description: 'Email resmi user / super admin', example: 'superadmin@laras.id' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Status aktif', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

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

  @ApiProperty({ description: 'ID Departemen (diatur dari modul Departemen)', required: false })
  @IsOptional()
  idDepartemen?: number;
}
