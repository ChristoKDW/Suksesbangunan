import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebAuthService } from './web-auth.service.js';
import { LoginWebDto } from './dto/login-web.dto.js';

@ApiTags('Auth Web')
@Controller('auth/web')
export class WebAuthController {
  constructor(private readonly webAuthService: WebAuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login user web (Admin/HRD/SPV)' })
  login(@Body() dto: LoginWebDto) {
    return this.webAuthService.login(dto.username, dto.password);
  }
}
