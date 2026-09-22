import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { MobileAuthService } from './mobile-auth.service.js';
import { RegisterMobileDto } from './dto/register-mobile.dto.js';
import { LoginMobileDto } from './dto/login-mobile.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { ResendOtpDto } from './dto/resend-otp.dto.js';
import { RegisterFaceDto } from './dto/register-face.dto.js';
import { UpdateProfileMobileDto } from './dto/update-profile-mobile.dto.js';
import { ChangePasswordMobileDto } from './dto/change-password-mobile.dto.js';
import { JwtMobileGuard } from '../../common/guards/jwt-mobile.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@ApiTags('Auth Mobile')
@Controller('auth/mobile')
export class MobileAuthController {
  constructor(private readonly mobileAuthService: MobileAuthService) {}

  @Post('check-nik')
  @ApiOperation({ summary: 'Cek validitas NIK untuk klaim akun' })
  checkNik(@Body('nik') nik: string) {
    return this.mobileAuthService.checkNik(nik);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register karyawan (mobile) + kirim OTP' })
  register(@Body() dto: RegisterMobileDto) {
    return this.mobileAuthService.register(
      dto.email,
      dto.username,
      dto.password,
      dto.nama,
      dto.nik,
      dto.nomorTelepon,
    );
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verifikasi OTP untuk aktivasi akun' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.mobileAuthService.verifyOtp(dto.nik, dto.otp);
  }

  @Post('resend-otp')
  @ApiOperation({ summary: 'Kirim ulang kode OTP' })
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.mobileAuthService.resendOtp(dto.nik);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login karyawan (mobile)' })
  login(@Body() dto: LoginMobileDto) {
    return this.mobileAuthService.login(dto.username, dto.password);
  }

  @Post('forgot-password/request')
  @ApiOperation({ summary: 'Request lupa password (butuh approval HRD)' })
  forgotPasswordRequest(@Body('username') username: string) {
    return this.mobileAuthService.forgotPasswordRequest(username);
  }

  @Post('forgot-password/claim')
  @ApiOperation({ summary: 'Claim password baru setelah di-approve HRD' })
  forgotPasswordClaim(
    @Body('username') username: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.mobileAuthService.forgotPasswordClaim(username, newPassword);
  }

  @Post('register-face')
  @UseGuards(JwtMobileGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Daftarkan wajah karyawan (server menjalankan model AI)',
  })
  registerFace(
    @CurrentUser('idKaryawan') idKaryawan: number,
    @Body() dto: RegisterFaceDto,
  ) {
    return this.mobileAuthService.registerFace(idKaryawan, dto.imageBase64);
  }

  @Get('me')
  @UseGuards(JwtMobileGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Profil karyawan yang login (mobile)' })
  getMyProfile(@CurrentUser('idKaryawan') idKaryawan: number) {
    return this.mobileAuthService.getProfile(idKaryawan);
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Verifikasi email karyawan via link (legacy)' })
  @ApiQuery({ name: 'token', description: 'Token verifikasi email' })
  verifyEmail(@Query('token') token: string) {
    return this.mobileAuthService.verifyEmail(token);
  }

  // ---------- Profile Management ----------

  @Patch('update-profile')
  @UseGuards(JwtMobileGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update profil karyawan (nama, email, telepon)' })
  updateProfile(
    @CurrentUser('idKaryawan') idKaryawan: number,
    @Body() dto: UpdateProfileMobileDto,
  ) {
    return this.mobileAuthService.updateProfile(idKaryawan, dto);
  }

  @Patch('change-password')
  @UseGuards(JwtMobileGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ganti password karyawan' })
  changePassword(
    @CurrentUser('idKaryawan') idKaryawan: number,
    @Body() dto: ChangePasswordMobileDto,
  ) {
    return this.mobileAuthService.changePassword(
      idKaryawan,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Patch('profile-photo')
  @UseGuards(JwtMobileGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload foto profil karyawan' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('foto', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const uploadPath = './uploads/foto-profil';
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (_req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname) || '.jpg';
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname || '').toLowerCase();
        const isAllowedExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
        const isAllowedMime = !!file.mimetype?.match(
          /\/(jpg|jpeg|png|webp|octet-stream)$/i,
        );

        if (isAllowedExt || isAllowedMime) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Hanya file gambar (JPG, PNG, WEBP) yang diizinkan',
            ),
            false,
          );
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async uploadProfilePhoto(
    @CurrentUser('idKaryawan') idKaryawan: number,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File foto profil wajib diupload');
    }
    return this.mobileAuthService.updateProfilePhoto(idKaryawan, file.path);
  }
}
