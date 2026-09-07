import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDepartemenDto {
  @ApiProperty({ description: 'Nama departemen', example: 'Engineering' })
  @IsNotEmpty({ message: 'Nama departemen wajib diisi' })
  @IsString()
  namaDepartemen: string;
}
