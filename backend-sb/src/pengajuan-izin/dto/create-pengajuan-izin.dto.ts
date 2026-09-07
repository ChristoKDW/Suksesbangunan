import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePengajuanIzinDto {
  @ApiProperty({ description: 'ID Karyawan', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  idKaryawan: number;

  @ApiProperty({
    description: 'Jenis izin',
    enum: ['izin', 'sakit', 'cuti', 'dinas luar'],
    example: 'sakit',
  })
  @IsNotEmpty()
  @IsIn(['izin', 'sakit', 'cuti', 'dinas luar'])
  jenisIzin: string;

  @ApiProperty({
    description: 'Tanggal mulai (YYYY-MM-DD)',
    example: '2026-01-15',
  })
  @IsNotEmpty()
  @IsDateString()
  tanggalMulai: string;

  @ApiProperty({
    description: 'Tanggal selesai (YYYY-MM-DD)',
    example: '2026-01-16',
  })
  @IsNotEmpty()
  @IsDateString()
  tanggalSelesai: string;

  @ApiProperty({ description: 'Alasan izin', example: 'Demam tinggi' })
  @IsNotEmpty()
  @IsString()
  alasan: string;

  @ApiPropertyOptional({
    description: 'Latitude GPS (jika izin mendadak dari kantor)',
    example: -6.2088,
  })
  @IsOptional()
  @IsNumber()
  lokasiLat?: number;

  @ApiPropertyOptional({
    description: 'Longitude GPS (jika izin mendadak dari kantor)',
    example: 106.8456,
  })
  @IsOptional()
  @IsNumber()
  lokasiLng?: number;
}
