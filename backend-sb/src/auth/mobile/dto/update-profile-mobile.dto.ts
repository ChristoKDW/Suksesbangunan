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

  @ApiProperty({ description: 'Nama panggilan', required: false })
  @IsOptional()
  @IsString()
  namaPanggilan?: string;

  @ApiProperty({ description: 'Agama sesuai KTP', required: false })
  @IsOptional()
  @IsString()
  agama?: string;

  @ApiProperty({ description: 'Tempat lahir sesuai KTP', required: false })
  @IsOptional()
  @IsString()
  tempatLahir?: string;

  @ApiProperty({ description: 'Tanggal lahir sesuai KTP', required: false })
  @IsOptional()
  @IsString()
  tanggalLahir?: string;

  @ApiProperty({ description: 'Status perkawinan', required: false })
  @IsOptional()
  @IsString()
  statusPerkawinan?: string;

  @ApiProperty({ description: 'Nama ibu kandung', required: false })
  @IsOptional()
  @IsString()
  namaIbuKandung?: string;

  @ApiProperty({ description: 'Kota terbit KTP', required: false })
  @IsOptional()
  @IsString()
  kotaTerbitKtp?: string;

  @ApiProperty({ description: 'Kabupaten sesuai KTP', required: false })
  @IsOptional()
  @IsString()
  kabupaten?: string;

  @ApiProperty({ description: 'Kecamatan sesuai KTP', required: false })
  @IsOptional()
  @IsString()
  kecamatan?: string;

  @ApiProperty({ description: 'Kelurahan sesuai KTP', required: false })
  @IsOptional()
  @IsString()
  kelurahan?: string;

  @ApiProperty({ description: 'RT/RW sesuai KTP', required: false })
  @IsOptional()
  @IsString()
  rtRw?: string;
}
