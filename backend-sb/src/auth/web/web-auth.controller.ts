import { Controller, Post, Body, Req, Headers, Ip } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebAuthService } from './web-auth.service.js';
import { LoginWebDto } from './dto/login-web.dto.js';

@ApiTags('Auth Web')
@Controller('auth/web')
export class WebAuthController {
  constructor(private readonly webAuthService: WebAuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login user web (Admin/HRD/SPV)' })
  login(
    @Body() dto: LoginWebDto,
    @Ip() ip?: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.webAuthService.login(dto.username, dto.password, ip, userAgent);
  }
}
