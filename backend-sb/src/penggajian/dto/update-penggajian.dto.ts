import { PartialType } from '@nestjs/swagger';
import { CreatePenggajianDto } from './create-penggajian.dto.js';

export class UpdatePenggajianDto extends PartialType(CreatePenggajianDto) {}
