import {
  IsOptional,
  IsNumber,
  IsDateString,
  IsString,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePenggajianDto {
  @ApiPropertyOptional({ description: 'ID Karyawan' })
  @IsOptional()
  @IsNumber()
  idKaryawan?: number;

  @ApiPropertyOptional({ description: 'Periode awal (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  periodeAwal?: string;

  @ApiPropertyOptional({ description: 'Periode akhir (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  periodeAkhir?: string;

  @ApiPropertyOptional({ description: 'Total jam kerja' })
  @IsOptional()
  @IsNumber()
  totalJamKerja?: number;

  @ApiPropertyOptional({ description: 'Total hari kerja standar', example: 26 })
  @IsOptional()
  @IsNumber()
  totalHariKerja?: number;

  @ApiPropertyOptional({ description: 'Total hari hadir aktual' })
  @IsOptional()
  @IsNumber()
  totalHariHadir?: number;

  @ApiPropertyOptional({ description: 'Gaji pokok bulanan' })
  @IsOptional()
  @IsNumber()
  gajiPokok?: number;

  @ApiPropertyOptional({ description: 'Gaji pokok sesuai hari kerja' })
  @IsOptional()
  @IsNumber()
  gajiPokokSesuaiHari?: number;

  @ApiPropertyOptional({ description: 'Tarif tunjangan konsumsi per hari', example: 20000 })
  @IsOptional()
  @IsNumber()
  tarifKonsumsiPerHari?: number;

  @ApiPropertyOptional({ description: 'Total tunjangan konsumsi' })
  @IsOptional()
  @IsNumber()
  tunjanganKonsumsi?: number;

  @ApiPropertyOptional({ description: 'Tunjangan transportasi' })
  @IsOptional()
  @IsNumber()
  tunjanganTransportasi?: number;

  @ApiPropertyOptional({ description: 'Tunjangan komunikasi' })
  @IsOptional()
  @IsNumber()
  tunjanganKomunikasi?: number;

  @ApiPropertyOptional({ description: 'Tunjangan jabatan' })
  @IsOptional()
  @IsNumber()
  tunjanganJabatan?: number;

  @ApiPropertyOptional({ description: 'Upah lembur' })
  @IsOptional()
  @IsNumber()
  lembur?: number;

  @ApiPropertyOptional({ description: 'Total penghasilan kotor' })
  @IsOptional()
  @IsNumber()
  totalPenghasilan?: number;

  @ApiPropertyOptional({ description: 'Potongan BPJS Ketenagakerjaan' })
  @IsOptional()
  @IsNumber()
  potonganBpjs?: number;

  @ApiPropertyOptional({ description: 'Potongan keterlambatan' })
  @IsOptional()
  @IsNumber()
  potonganTerlambat?: number;

  @ApiPropertyOptional({ description: 'Potongan pinjaman / kasbon' })
  @IsOptional()
  @IsNumber()
  potonganPinjaman?: number;

  @ApiPropertyOptional({ description: 'Potongan lainnya / potongan global' })
  @IsOptional()
  @IsNumber()
  potonganLainnya?: number;

  @ApiPropertyOptional({ description: 'Sisa pinjaman' })
  @IsOptional()
  @IsNumber()
  sisaPinjaman?: number;

  @ApiPropertyOptional({ description: 'Total potongan' })
  @IsOptional()
  @IsNumber()
  potongan?: number;

  @ApiPropertyOptional({ description: 'Total diterima / Take home pay' })
  @IsOptional()
  @IsNumber()
  totalGaji?: number;

  @ApiPropertyOptional({ description: 'Tanggal bayar' })
  @IsOptional()
  @ValidateIf((o) => o.tanggalBayar !== '' && o.tanggalBayar !== null && o.tanggalBayar !== undefined)
  @IsDateString()
  tanggalBayar?: string | null;

  @ApiPropertyOptional({ description: 'Catatan slip gaji' })
  @IsOptional()
  @IsString()
  catatan?: string;
}
