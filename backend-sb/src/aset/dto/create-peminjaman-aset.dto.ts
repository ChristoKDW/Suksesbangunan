import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePeminjamanAsetDto {
  @ApiProperty({ description: 'ID Karyawan peminjam', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  idKaryawan: number;

  @ApiProperty({ description: 'Kode barang/aset', example: 'AST-001' })
  @IsNotEmpty()
  @IsString()
  kodeBarang: string;

  @ApiProperty({ description: 'Nama barang', example: 'Laptop Lenovo ThinkPad' })
  @IsNotEmpty()
  @IsString()
  namaBarang: string;

  @ApiProperty({ description: 'Tanggal pinjam (YYYY-MM-DD)', example: '2026-10-01' })
  @IsNotEmpty()
  @IsDateString()
  tanggalPinjam: string;

  @ApiProperty({
    description: 'Durasi peminjaman ("1 Tahun", "6 Bulan", "Selama Masa Kerja", dll)',
    example: 'Selama Masa Kerja',
  })
  @IsNotEmpty()
  @IsString()
  durasi: string;

  @ApiPropertyOptional({ description: 'Keterangan tambahan' })
  @IsOptional()
  @IsString()
  keterangan?: string;
}
