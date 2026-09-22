import { IsBoolean, IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RespondApprovalDto {
  @ApiPropertyOptional({ description: 'Persetujuan (boolean)', example: true })
  @IsOptional()
  @IsBoolean()
  setuju?: boolean;

  @ApiPropertyOptional({ description: 'Persetujuan (status string)', example: 'disetujui' })
  @IsOptional()
  @IsIn(['disetujui', 'ditolak'])
  status?: 'disetujui' | 'ditolak';

  @ApiPropertyOptional({ description: 'Catatan persetujuan / penolakan', example: 'Disetujui' })
  @IsOptional()
  @IsString()
  catatan?: string;
}
