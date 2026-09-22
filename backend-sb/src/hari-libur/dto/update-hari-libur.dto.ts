import { PartialType } from '@nestjs/swagger';
import { CreateHariLiburDto } from './create-hari-libur.dto.js';

export class UpdateHariLiburDto extends PartialType(CreateHariLiburDto) {}
