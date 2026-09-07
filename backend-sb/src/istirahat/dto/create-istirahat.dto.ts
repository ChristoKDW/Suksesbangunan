import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateIstirahatDto {
  @ApiPropertyOptional({ description: 'ID Absensi', example: 1 })
  @IsOptional()
  @IsNumber()
  idAbsensi?: number;

  @ApiPropertyOptional({ description: 'Tipe: keluar atau masuk', example: 'keluar' })
  @IsOptional()
  tipe?: string;
}
