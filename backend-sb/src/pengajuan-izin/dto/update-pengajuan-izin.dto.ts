import { PartialType } from '@nestjs/swagger';
import { CreatePengajuanIzinDto } from './create-pengajuan-izin.dto.js';

export class UpdatePengajuanIzinDto extends PartialType(CreatePengajuanIzinDto) {}
