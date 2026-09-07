import { PartialType } from '@nestjs/swagger';
import { CreateAbsensiDto } from './create-absensi.dto.js';

export class UpdateAbsensiDto extends PartialType(CreateAbsensiDto) {}
