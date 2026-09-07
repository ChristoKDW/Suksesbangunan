import { PartialType } from '@nestjs/swagger';
import { CreateDepartemenDto } from './create-departemen.dto.js';

export class UpdateDepartemenDto extends PartialType(CreateDepartemenDto) {}
