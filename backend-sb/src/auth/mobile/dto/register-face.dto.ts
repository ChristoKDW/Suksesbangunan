import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterFaceDto {
  @ApiProperty({
    description:
      'Foto wajah base64 (boleh dengan prefix data:image/jpeg;base64,). ' +
      'Server yang mengekstraksi embedding 512-dim memakai model AI.',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...',
  })
  @IsNotEmpty()
  @IsString()
  imageBase64: string;
}
