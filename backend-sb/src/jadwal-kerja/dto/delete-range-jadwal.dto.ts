import { IsNotEmpty, IsArray, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteRangeJadwalDto {
  @ApiProperty({ description: 'Daftar ID Karyawan', example: [1, 2] })
  @IsNotEmpty()
  @IsArray()
  idKaryawan: number[];

  @ApiProperty({ description: 'Tanggal mulai (YYYY-MM-DD)', example: '2026-10-01' })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Tanggal selesai (YYYY-MM-DD)', example: '2026-10-31' })
  @IsNotEmpty()
  @IsDateString()
  endDate: string;
}
