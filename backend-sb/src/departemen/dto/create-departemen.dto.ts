import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDepartemenDto {
  @ApiProperty({ description: 'Nama departemen', example: 'Engineering' })
  @IsNotEmpty({ message: 'Nama departemen wajib diisi' })
  @IsString()
  namaDepartemen: string;

  @ApiProperty({
    description: 'ID User atau daftar ID User yang mengelola departemen ini (Supervisor/HRD/Manager)',
    example: [1, 2],
    required: false,
  })
  @IsOptional()
  idPengelola?: any;
}
