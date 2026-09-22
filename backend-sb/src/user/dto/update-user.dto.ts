import { PartialType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional } from 'class-validator';
import { CreateUserDto } from './create-user.dto.js';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({
    description: 'ID user dari klien lama; nilai ini diabaikan',
  })
  @IsOptional()
  @IsInt()
  idUser?: number;

  @ApiPropertyOptional({
    description: 'ID Departemen; diabaikan karena dikelola dari Departemen',
  })
  @IsOptional()
  idDepartemen?: number;
}
