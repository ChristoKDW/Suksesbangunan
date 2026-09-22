import { IsNotEmpty, IsNumber, IsDateString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkJadwalKerjaItemDto {
  @ApiProperty({ description: 'ID Karyawan', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  idKaryawan: number;

  @ApiProperty({ description: 'Tanggal (YYYY-MM-DD)', example: '2026-01-15' })
  @IsNotEmpty()
  @IsDateString()
  tanggal: string;

  @ApiProperty({ description: 'ID Shift', example: 1, required: false })
  @IsOptional()
  @IsNumber()
  idShift?: number;

  @ApiProperty({ description: 'Status Cuti', example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isCuti?: boolean;

  @ApiProperty({ description: 'Status Libur Rutin', example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isLibur?: boolean;

  @ApiProperty({ description: 'Keterangan', example: 'Libur Rutin', required: false })
  @IsOptional()
  keterangan?: string;
}
