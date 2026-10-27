import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsNumber, IsIn, Matches } from 'class-validator';

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

  @ApiPropertyOptional({ description: 'Rekening debet perusahaan (angka) untuk BNIDirect', example: '7654321678' })
  @IsOptional()
  @Matches(/^\d{0,16}$/, { message: 'Rekening debet hanya boleh angka (maks. 16 digit)' })
  rekeningDebetBni?: string;

  @ApiPropertyOptional({ description: 'Metode transfer rekening non-BNI', example: 'bifast' })
  @IsOptional()
  @IsIn(['bifast', 'online', 'kliring', 'rtgs'])
  metodeBankLain?: string;
}
