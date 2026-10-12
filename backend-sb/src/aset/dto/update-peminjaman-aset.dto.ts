import { PartialType, OmitType } from '@nestjs/swagger';
import { CreatePeminjamanAsetDto } from './create-peminjaman-aset.dto.js';

export class UpdatePeminjamanAsetDto extends PartialType(
  OmitType(CreatePeminjamanAsetDto, ['idKaryawan'] as const),
) {}
