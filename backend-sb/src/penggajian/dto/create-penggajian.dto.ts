import { IsOptional, IsNumber, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePenggajianDto {
  @ApiPropertyOptional({ description: 'Potongan tambahan', example: 50000 })
  @IsOptional()
  @IsNumber()
  potongan?: number;

  @ApiPropertyOptional({ description: 'Tanggal bayar' })
  @IsOptional()
  @IsDateString()
  tanggalBayar?: string;
}
