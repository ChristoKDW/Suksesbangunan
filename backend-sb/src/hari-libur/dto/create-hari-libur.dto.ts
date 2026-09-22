import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHariLiburDto {
  @ApiProperty({
    description: 'Nama hari penting / hari libur',
    example: 'Hari Raya Idul Fitri 1447 H',
  })
  @IsNotEmpty({ message: 'Nama hari penting wajib diisi' })
  @IsString()
  nama: string;

  @ApiProperty({
    description: 'Tanggal hari penting / libur (format: YYYY-MM-DD)',
    example: '2026-03-20',
  })
  @IsNotEmpty({ message: 'Tanggal wajib diisi' })
  @IsDateString({}, { message: 'Format tanggal harus YYYY-MM-DD' })
  tanggal: string;

  @ApiPropertyOptional({
    description: 'Keterangan atau catatan tambahan',
    example: 'Libur Nasional Keagamaan',
  })
  @IsOptional()
  @IsString()
  keterangan?: string;

  @ApiPropertyOptional({
    description: 'ID Shift yang ditentukan HRD untuk hari penting ini',
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: 'ID Shift harus berupa angka bulat' })
  idShift?: number;

  @ApiPropertyOptional({
    description: 'Status libur kerja (default: true)',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isLibur?: boolean;
}
