import { IsIn, IsNumber, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateIstirahatDto {
  @ApiPropertyOptional({ description: 'ID Absensi', example: 1 })
  @IsOptional()
  @IsNumber()
  idAbsensi?: number;

  @ApiPropertyOptional({
    description: 'Tipe: keluar atau masuk',
    example: 'keluar',
  })
  @IsOptional()
  @IsIn(['keluar', 'masuk'], {
    message: 'Tipe istirahat harus keluar atau masuk',
  })
  tipe?: 'keluar' | 'masuk';
}
