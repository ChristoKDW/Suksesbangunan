import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsString, Matches, IsOptional } from 'class-validator';

export class CreatePengajuanRoDto {
  @ApiProperty({
    description: 'Daftar tanggal RO yang diajukan karyawan (format YYYY-MM-DD)',
    example: ['2026-09-15', '2026-09-16'],
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'Pilih minimal 1 tanggal untuk pengajuan Regular Off' })
  @IsString({ each: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    each: true,
    message: 'Format tanggal harus YYYY-MM-DD',
  })
  tanggalDipilih: string[];

  @ApiProperty({
    description: 'Alasan atau catatan pengajuan RO (opsional)',
    required: false,
    example: 'Mengambil hak libur RO',
  })
  @IsOptional()
  @IsString()
  alasan?: string;
}
