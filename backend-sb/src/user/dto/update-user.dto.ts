import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Matches, ValidateIf } from 'class-validator';
import { CreateUserDto } from './create-user.dto.js';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({
    description: 'ID user dari klien lama; nilai ini diabaikan',
  })
  @IsOptional()
  @IsInt()
  idUser?: number;

  @ApiPropertyOptional({
    description: 'ID Departemen; diabaikan karena dikelola dari Departemen',
  })
  @IsOptional()
  idDepartemen?: number;

  @ApiPropertyOptional({
    description: 'Password baru (minimal 8 karakter kombinasi huruf besar, kecil, angka, dan simbol)',
  })
  @IsOptional()
  @ValidateIf((o) => typeof o.password === 'string' && o.password.trim().length > 0)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^_\-.~+=#<>])[A-Za-z\d@$!%*?&#^_\-.~+=#<>]{8,}$/,
    {
      message:
        'Password harus minimal 8 karakter dan merupakan kombinasi huruf besar, huruf kecil, angka, dan karakter khusus',
    },
  )
  password?: string;
}

