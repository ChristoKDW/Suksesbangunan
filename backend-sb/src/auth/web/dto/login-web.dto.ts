import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginWebDto {
  @ApiProperty({ description: 'Username', example: 'admin' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ description: 'Password', example: 'password123' })
  @IsNotEmpty()
  @IsString()
  password: string;
}
