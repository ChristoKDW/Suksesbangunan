import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePengaturanKantorDto {
  @ApiProperty({ description: 'Nama kantor/cabang', example: 'Kantor Pusat' })
  @IsNotEmpty()
  @IsString()
  namaKantor: string;

  @ApiProperty({ description: 'Latitude kantor', example: -6.2088 })
  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @ApiProperty({ description: 'Longitude kantor', example: 106.8456 })
  @IsNotEmpty()
  @IsNumber()
  longitude: number;

  @ApiProperty({ description: 'Radius toleransi (meter)', example: 100 })
  @IsNotEmpty()
  @IsNumber()
  radiusMeter: number;

  @ApiPropertyOptional({ description: 'ID Departemen (opsional)' })
  @IsOptional()
  @IsNumber()
  idDepartemen?: number;
}
