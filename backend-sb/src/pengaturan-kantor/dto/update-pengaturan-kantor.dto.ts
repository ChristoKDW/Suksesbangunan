import { PartialType } from '@nestjs/swagger';
import { CreatePengaturanKantorDto } from './create-pengaturan-kantor.dto.js';

export class UpdatePengaturanKantorDto extends PartialType(CreatePengaturanKantorDto) {}
