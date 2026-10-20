import {
  IsNotEmpty,
  IsString,
  Matches,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShiftDto {
  @ApiProperty({
    description: 'ID Departemen pemilik shift',
    example: 8,
  })
  @IsNotEmpty({ message: 'Departemen wajib dipilih untuk setiap shift' })
  @IsNumber({}, { message: 'ID Departemen harus berupa angka' })
  idDepartemen: number;

  @ApiProperty({ description: 'Nama shift', example: 'Pagi' })
  @IsNotEmpty({ message: 'Nama shift wajib diisi' })
  @IsString()
  namaShift: string;

  @ApiProperty({ description: 'Jam mulai (HH:mm)', example: '08:15' })
  @IsNotEmpty({ message: 'Jam mulai wajib diisi' })
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, {
    message: 'Format jam mulai harus HH:mm atau HH:mm:ss',
  })
  jamMulai: string;

  @ApiProperty({ description: 'Jam selesai (HH:mm)', example: '16:30' })
  @IsNotEmpty({ message: 'Jam selesai wajib diisi' })
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, {
    message: 'Format jam selesai harus HH:mm atau HH:mm:ss',
  })
  jamSelesai: string;
}
