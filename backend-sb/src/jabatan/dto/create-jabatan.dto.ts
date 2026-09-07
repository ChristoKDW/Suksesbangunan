import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateJabatanDto {
  @ApiProperty({ description: 'Nama jabatan', example: 'Manager' })
  @IsNotEmpty({ message: 'Nama jabatan wajib diisi' })
  @IsString()
  namaJabatan: string;
}
