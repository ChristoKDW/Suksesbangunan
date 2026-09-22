import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShiftDto {
  @ApiPropertyOptional({
    description: 'ID Departemen (jika null berlaku umum)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  idDepartemen?: number | null;

  @ApiProperty({ description: 'Nama shift', example: 'Pagi' })
  @IsNotEmpty()
  @IsString()
  namaShift: string;

  @ApiProperty({ description: 'Jam mulai (HH:mm)', example: '08:00' })
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, {
    message: 'Format jam mulai harus HH:mm atau HH:mm:ss',
  })
  jamMulai: string;

  @ApiProperty({ description: 'Jam selesai (HH:mm)', example: '17:00' })
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, {
    message: 'Format jam selesai harus HH:mm atau HH:mm:ss',
  })
  jamSelesai: string;
}
