import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsNumber } from 'class-validator';

export class UpdatePengaturanPenggajianDto {
  @ApiPropertyOptional({ description: 'Tanggal awal cut-off (1 - 28)', example: 25 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(28)
  tanggalCutOffMulai?: number;

  @ApiPropertyOptional({ description: 'Tanggal akhir/tutup buku cut-off (1 - 31)', example: 24 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  tanggalCutOffSelesai?: number;

  @ApiPropertyOptional({ description: 'Denda keterlambatan default per kali telat', example: 20000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dendaPerTelatDefault?: number;

  @ApiPropertyOptional({ description: 'Jumlah standar hari kerja sebulan', example: 26 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  standarHariKerja?: number;
}
