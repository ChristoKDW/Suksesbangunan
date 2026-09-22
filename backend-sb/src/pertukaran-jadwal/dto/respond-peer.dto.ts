import { IsBoolean, IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RespondPeerDto {
  @ApiPropertyOptional({ description: 'Apakah rekan menyetujui pertukaran ini?', example: true })
  @IsOptional()
  @IsBoolean()
  setuju?: boolean;

  @ApiPropertyOptional({ description: 'Status persetujuan rekan', example: 'disetujui' })
  @IsOptional()
  @IsIn(['disetujui', 'ditolak'])
  status?: 'disetujui' | 'ditolak';

  @ApiPropertyOptional({ description: 'Catatan dari rekan', example: 'Bisa, saya setuju tukar shift' })
  @IsOptional()
  @IsString()
  catatan?: string;
}
