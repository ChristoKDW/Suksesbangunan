import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

/** Pengajuan pencairan dari aplikasi mobile. */
export class CreatePencairanDto {
  @ApiProperty({ enum: ['ro', 'cuti'] })
  @IsIn(['ro', 'cuti'], { message: 'Jenis pencairan harus ro atau cuti' })
  jenis: 'ro' | 'cuti';

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1, { message: 'Minimal 1 hari' })
  jumlahHari: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  alasan?: string;
}

export class ApprovalPencairanDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  setuju: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  catatan?: string;
}
