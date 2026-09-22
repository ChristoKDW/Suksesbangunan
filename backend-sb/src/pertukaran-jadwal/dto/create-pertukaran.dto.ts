import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsIn,
  IsDateString,
  IsOptional,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePertukaranDto {
  @ApiProperty({
    description: 'ID Karyawan target (rekan yang diajak bertukar)',
    example: 3,
  })
  @IsNotEmpty()
  @IsNumber()
  idKaryawanTarget: number;

  @ApiProperty({
    description: 'Jenis pertukaran: shift atau off',
    example: 'shift',
    enum: ['shift', 'off'],
  })
  @IsNotEmpty()
  @IsIn(['shift', 'off'])
  jenisPertukaran: 'shift' | 'off';

  @ApiProperty({
    description: 'Tanggal jadwal milik pemohon (YYYY-MM-DD)',
    example: '2026-09-15',
  })
  @IsNotEmpty()
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Tanggal pemohon harus berformat YYYY-MM-DD',
  })
  tanggalPemohon: string;

  @ApiPropertyOptional({
    description: 'ID shift asal pemohon (kosongkan jika off)',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  idShiftPemohon?: number;

  @ApiProperty({
    description: 'Tanggal jadwal milik rekan target (YYYY-MM-DD)',
    example: '2026-09-15',
  })
  @IsNotEmpty()
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Tanggal target harus berformat YYYY-MM-DD',
  })
  tanggalTarget: string;

  @ApiPropertyOptional({
    description: 'ID shift tujuan milik target (kosongkan jika off)',
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  idShiftTarget?: number;

  @ApiPropertyOptional({
    description: 'Alasan pertukaran',
    example: 'Ada keperluan keluarga mendesak',
  })
  @IsOptional()
  @IsString()
  alasan?: string;
}
