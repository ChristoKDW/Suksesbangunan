import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTundaOffDto {
  @ApiProperty({
    description: 'Tanggal off terjadwal yang akan ditunda (YYYY-MM-DD)',
    example: '2026-10-12',
  })
  @IsNotEmpty()
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  tanggalOffAsal: string;

  @ApiProperty({
    description: 'Tanggal pengganti menjadi hari off baru (YYYY-MM-DD)',
    example: '2026-10-15',
  })
  @IsNotEmpty()
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  tanggalOffBaru: string;

  @ApiProperty({
    description: 'Alasan jelas penundaan off (wajib, min 10 karakter)',
    example: 'Mengejar target penjualan akhir bulan, perlu masuk di hari libur',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(10, { message: 'Alasan harus jelas (minimal 10 karakter)' })
  alasan: string;
}

export class ApprovalTundaOffDto {
  @ApiProperty({ description: 'Setujui (true) atau tolak (false)' })
  @IsNotEmpty()
  @IsBoolean()
  setuju: boolean;

  @ApiPropertyOptional({ description: 'Catatan approval' })
  @IsOptional()
  @IsString()
  catatan?: string;
}
