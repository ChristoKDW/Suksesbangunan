import { PartialType } from '@nestjs/swagger';
import { CreateJadwalKerjaDto } from './create-jadwal-kerja.dto.js';

export class UpdateJadwalKerjaDto extends PartialType(CreateJadwalKerjaDto) {}
