import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({ description: 'NIK karyawan', example: 'EMP001' })
  @IsNotEmpty()
  @IsString()
  nik: string;

  @ApiProperty({ description: 'Kode OTP 6 digit dari email', example: '123456' })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  otp: string;
}
