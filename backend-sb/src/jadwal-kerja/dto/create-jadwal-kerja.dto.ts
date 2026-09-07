import { IsNotEmpty, IsNumber, IsDateString, IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateJadwalKerjaDto {
  @ApiProperty({ description: 'ID Karyawan', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  idKaryawan: number;

  @ApiProperty({ description: 'ID Shift', example: 1, required: false })
  @IsOptional()
  @IsNumber()
  idShift?: number;

  @ApiProperty({ description: 'Status Cuti', example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isCuti?: boolean;

  @ApiProperty({ description: 'Tanggal jadwal (YYYY-MM-DD)', example: '2026-01-15' })
  @IsNotEmpty()
  @IsDateString()
  tanggal: string;

  @ApiPropertyOptional({ description: 'Sumber upload', example: 'manual' })
  @IsOptional()
  @IsString()
  sumberUpload?: string;
}
