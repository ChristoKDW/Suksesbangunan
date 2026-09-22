import { IsOptional, IsString, IsIn, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ApprovalPengajuanIzinDto {
  @ApiPropertyOptional({
    description: 'Keputusan: disetujui atau ditolak',
    enum: ['disetujui', 'ditolak'],
    example: 'disetujui',
  })
  @IsOptional()
  @IsIn(['disetujui', 'ditolak'])
  status?: string;

  @ApiPropertyOptional({ description: 'Flag persetujuan boolean' })
  @IsOptional()
  @IsBoolean()
  setuju?: boolean;

  @ApiPropertyOptional({
    description: 'Catatan dari SPV/HRD',
    example: 'Disetujui, segera sembuh',
  })
  @IsOptional()
  @IsString()
  catatanApproval?: string;

  @ApiPropertyOptional({ description: 'Catatan persetujuan / penolakan' })
  @IsOptional()
  @IsString()
  catatan?: string;
}
