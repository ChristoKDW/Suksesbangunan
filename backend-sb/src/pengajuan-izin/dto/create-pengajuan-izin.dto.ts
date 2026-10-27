import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsIn,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePengajuanIzinDto {
  @ApiProperty({ description: 'ID Karyawan', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  idKaryawan: number;

  @ApiProperty({
    description: 'Jenis izin',
    enum: ['izin', 'sakit', 'cuti', 'dinas luar', 'izin sementara'],
    example: 'sakit',
  })
  @IsNotEmpty()
  @IsIn(['izin', 'sakit', 'cuti', 'dinas luar', 'izin sementara'])
  jenisIzin: string;

  @ApiPropertyOptional({
    description: 'Jam mulai izin sementara (HH:mm), wajib untuk jenis izin sementara',
    example: '10:00',
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'Jam mulai harus berformat HH:mm',
  })
  jamMulai?: string;

  @ApiPropertyOptional({
    description: 'Jam selesai izin sementara (HH:mm), wajib untuk jenis izin sementara',
    example: '12:00',
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'Jam selesai harus berformat HH:mm',
  })
  jamSelesai?: string;

  @ApiProperty({
    description: 'Tanggal mulai (YYYY-MM-DD)',
    example: '2026-01-15',
  })
  @IsNotEmpty()
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Tanggal mulai harus berformat YYYY-MM-DD',
  })
  tanggalMulai: string;

  @ApiProperty({
    description: 'Tanggal selesai (YYYY-MM-DD)',
    example: '2026-01-16',
  })
  @IsNotEmpty()
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Tanggal selesai harus berformat YYYY-MM-DD',
  })
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
