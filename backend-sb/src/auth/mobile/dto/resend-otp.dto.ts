import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendOtpDto {
  @ApiProperty({ description: 'NIK karyawan', example: 'EMP001' })
  @IsNotEmpty()
  @IsString()
  nik: string;
}
