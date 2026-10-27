import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

const PERIODE = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Kasbon dicatat langsung oleh HRD (langsung aktif). */
export class CreateKasbonDto {
  @ApiProperty({ example: 12 })
  @IsInt()
  idKaryawan: number;

  @ApiProperty({ example: 1500000 })
  @IsNumber()
  @Min(1000)
  jumlah: number;

  @ApiProperty({ example: 500000 })
  @IsNumber()
  @Min(1000)
  cicilanPerBulan: number;

  @ApiProperty({ example: '2026-11', description: 'Bulan periode gaji pertama yang dipotong' })
  @Matches(PERIODE, { message: 'mulaiPeriode harus format YYYY-MM' })
  mulaiPeriode: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  alasan?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  catatanHrd?: string;
}

/** Pengajuan kasbon dari aplikasi mobile (menunggu persetujuan HRD). */
export class PengajuanKasbonDto {
  @ApiProperty({ example: 1500000 })
  @IsNumber()
  @Min(1000)
  jumlah: number;

  @ApiProperty({ example: 500000 })
  @IsNumber()
  @Min(1000)
  cicilanPerBulan: number;

  @ApiProperty({ example: 'Biaya pengobatan keluarga' })
  @IsString()
  @MaxLength(500)
  alasan: string;
}

/** Persetujuan HRD; nominal cicilan & bulan mulai boleh disesuaikan. */
export class ApprovalKasbonDto {
  @ApiProperty()
  @IsBoolean()
  setuju: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1000)
  cicilanPerBulan?: number;

  @ApiPropertyOptional({ example: '2026-11' })
  @IsOptional()
  @Matches(PERIODE, { message: 'mulaiPeriode harus format YYYY-MM' })
  mulaiPeriode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  catatanHrd?: string;
}
