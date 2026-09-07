import { PartialType } from '@nestjs/swagger';
import { CreateIstirahatDto } from './create-istirahat.dto.js';

export class UpdateIstirahatDto extends PartialType(CreateIstirahatDto) {}
