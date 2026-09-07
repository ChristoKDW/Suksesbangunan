import { IsNotEmpty, IsString, IsIn, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApprovalPengajuanIzinDto {
  @ApiProperty({
    description: 'Keputusan: disetujui atau ditolak',
    enum: ['disetujui', 'ditolak'],
    example: 'disetujui',
  })
  @IsNotEmpty()
  @IsIn(['disetujui', 'ditolak'])
  status: string;

  @ApiPropertyOptional({
    description: 'Catatan dari SPV/HRD',
    example: 'Disetujui, segera sembuh',
  })
  @IsOptional()
  @IsString()
  catatanApproval?: string;
}
