import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';

export class CreateLaporanMasalahDto {
  @ApiProperty({
    description: 'Kategori masalah',
    example: 'absensi_gps',
    enum: [
      'absensi_gps',
      'kamera_wajah',
      'jadwal_shift',
      'penggajian_slip',
      'laporan_export',
      'performa_crash',
      'tampilan_ui',
      'lainnya',
    ],
  })
  @IsNotEmpty({ message: 'Kategori masalah wajib diisi' })
  @IsString()
  kategori: string;

  @ApiProperty({ description: 'Judul ringkas masalah', example: 'GPS terbaca di luar radius' })
  @IsNotEmpty({ message: 'Judul masalah wajib diisi' })
  @IsString()
  judul: string;

  @ApiProperty({ description: 'Deskripsi lengkap masalah', example: 'Aplikasi menampilkan di luar radius 60m saat di pintu depan toko' })
  @IsNotEmpty({ message: 'Deskripsi masalah wajib diisi' })
  @IsString()
  deskripsi: string;

  @ApiPropertyOptional({ description: 'Langkah reproduksi error', example: '1. Buka tab absensi. 2. Tekan tombol absen masuk' })
  @IsOptional()
  @IsString()
  langkahReproduksi?: string;

  @ApiPropertyOptional({
    description: 'Prioritas laporan',
    enum: ['rendah', 'sedang', 'tinggi', 'kritis'],
    default: 'sedang',
  })
  @IsOptional()
  @IsIn(['rendah', 'sedang', 'tinggi', 'kritis'])
  prioritas?: 'rendah' | 'sedang' | 'tinggi' | 'kritis';

  @ApiPropertyOptional({ description: 'Info teknis perangkat dalam format JSON string' })
  @IsOptional()
  deviceInfo?: string | Record<string, any>;
}
