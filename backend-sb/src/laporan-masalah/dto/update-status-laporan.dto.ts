import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateStatusLaporanDto {
  @ApiProperty({
    description: 'Status baru tiket',
    enum: ['menunggu', 'sedang_diproses', 'selesai', 'ditolak'],
    example: 'selesai',
  })
  @IsNotEmpty({ message: 'Status wajib diisi' })
  @IsIn(['menunggu', 'sedang_diproses', 'selesai', 'ditolak'])
  status: 'menunggu' | 'sedang_diproses' | 'selesai' | 'ditolak';

  @ApiPropertyOptional({
    description: 'Ubah prioritas jika perlu',
    enum: ['rendah', 'sedang', 'tinggi', 'kritis'],
  })
  @IsOptional()
  @IsIn(['rendah', 'sedang', 'tinggi', 'kritis'])
  prioritas?: 'rendah' | 'sedang' | 'tinggi' | 'kritis';

  @ApiPropertyOptional({
    description: 'Tanggapan atau solusi resmi dari Super Admin untuk pelapor',
    example: 'Masalah akurasi GPS telah diperbaiki dengan penyesuaian radius geofence menjadi 55 meter.',
  })
  @IsOptional()
  @IsString()
  tanggapanSolusi?: string;
}
