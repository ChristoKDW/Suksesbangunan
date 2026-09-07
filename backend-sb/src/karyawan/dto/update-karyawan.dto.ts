import { PartialType } from '@nestjs/swagger';
import { CreateKaryawanDto } from './create-karyawan.dto.js';

export class UpdateKaryawanDto extends PartialType(CreateKaryawanDto) {}
