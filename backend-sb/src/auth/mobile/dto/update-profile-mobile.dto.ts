import { IsString, IsOptional, IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileMobileDto {
  @ApiProperty({ description: 'Nama baru', required: false })
  @IsOptional()
  @IsString()
  nama?: string;

  @ApiProperty({ description: 'Email baru', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Nomor telepon baru', required: false })
  @IsOptional()
  @IsString()
  nomorTelepon?: string;
}
