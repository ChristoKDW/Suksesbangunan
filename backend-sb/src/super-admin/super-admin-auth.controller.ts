import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SuperAdminAuthService } from './super-admin-auth.service.js';

class SuperAdminLoginDto {
  username: string;
  password?: string;
}

class SuperAdminVerifyOtpDto {
  challengeToken: string;
  otp: string;
}

class SuperAdminResendOtpDto {
  challengeToken: string;
}

@ApiTags('Super Admin Auth')
@Controller('super-admin/auth')
export class SuperAdminAuthController {
  constructor(private readonly authService: SuperAdminAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login tahap 1 Super Admin -> Mengirimkan OTP ke email' })
  login(@Body() dto: SuperAdminLoginDto) {
    return this.authService.login(dto.username, dto.password);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login tahap 2 Super Admin -> Verifikasi OTP 6 digit' })
  verifyOtp(@Body() dto: SuperAdminVerifyOtpDto) {
    return this.authService.verifyOtp(dto.challengeToken, dto.otp);
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kirim ulang kode OTP Super Admin' })
  resendOtp(@Body() dto: SuperAdminResendOtpDto) {
    return this.authService.resendOtp(dto.challengeToken);
  }
}
