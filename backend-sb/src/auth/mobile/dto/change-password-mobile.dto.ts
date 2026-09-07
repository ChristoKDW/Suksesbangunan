import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordMobileDto {
  @ApiProperty({ description: 'Password saat ini' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ description: 'Password baru (gabungan huruf besar, kecil, angka, simbol, min 8 char)' })
  @IsString()
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^_\-.~+=#<>])[A-Za-z\d@$!%*?&#^_\-.~+=#<>]{8,}$/,
    {
      message:
        'Password baru harus minimal 8 karakter dan merupakan kombinasi huruf besar, huruf kecil, angka, dan karakter khusus',
    },
  )
  newPassword: string;
}
