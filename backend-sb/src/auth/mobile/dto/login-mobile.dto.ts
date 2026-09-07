import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginMobileDto {
  @ApiProperty({ description: 'Username', example: 'budisantoso' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ description: 'Password', example: 'password123' })
  @IsNotEmpty()
  @IsString()
  password: string;
}
