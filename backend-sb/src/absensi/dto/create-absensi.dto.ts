import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAbsensiDto {
  @ApiProperty({ description: 'ID Karyawan', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  idKaryawan: number;

  @ApiProperty({ description: 'Latitude GPS saat absen', example: -6.2088 })
  @IsNotEmpty()
  @IsNumber()
  lokasiLat: number;

  @ApiProperty({ description: 'Longitude GPS saat absen', example: 106.8456 })
  @IsNotEmpty()
  @IsNumber()
  lokasiLng: number;

  @ApiProperty({
    description: 'Metode absen',
    example: 'wajah',
    enum: ['fingerprint', 'wajah', 'gps', 'manual'],
  })
  @IsNotEmpty()
  @IsString()
  metodeAbsen: string;

  @ApiPropertyOptional({ description: 'Tipe: masuk atau keluar', default: 'masuk' })
  @IsOptional()
  @IsString()
  tipe?: string;

  @ApiPropertyOptional({
    description:
      'Foto wajah base64 saat absen. Wajib jika metodeAbsen = "wajah". ' +
      'Server memverifikasi dengan model AI terhadap wajah terdaftar.',
  })
  @IsOptional()
  @IsString()
  faceImageBase64?: string;
}
