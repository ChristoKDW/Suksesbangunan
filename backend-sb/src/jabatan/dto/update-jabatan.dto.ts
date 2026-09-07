import { PartialType } from '@nestjs/swagger';
import { CreateJabatanDto } from './create-jabatan.dto.js';

export class UpdateJabatanDto extends PartialType(CreateJabatanDto) {}
