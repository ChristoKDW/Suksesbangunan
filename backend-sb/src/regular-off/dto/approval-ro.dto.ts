import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ApprovalRoDto {
  @ApiProperty({
    description: 'Status persetujuan (true: disetujui, false: ditolak)',
    example: true,
  })
  @IsBoolean()
  setuju: boolean;

  @ApiProperty({
    description: 'Catatan persetujuan / alasan penolakan',
    required: false,
    example: 'Disetujui',
  })
  @IsOptional()
  @IsString()
  catatan?: string;
}
