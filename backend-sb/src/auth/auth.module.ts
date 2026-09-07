import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WebAuthService } from './web/web-auth.service.js';
import { WebAuthController } from './web/web-auth.controller.js';
import { JwtWebStrategy } from './web/jwt-web.strategy.js';
import { MobileAuthService } from './mobile/mobile-auth.service.js';
import { MobileAuthController } from './mobile/mobile-auth.controller.js';
import { JwtMobileStrategy } from './mobile/jwt-mobile.strategy.js';
import { UserModule } from '../user/user.module.js';
import { KaryawanModule } from '../karyawan/karyawan.module.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt-web' }),
    // Kita pakai JwtModule.registerAsync untuk web secret sebagai default
    // Mobile strategy menggunakan secret sendiri via constructor
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>(
          'JWT_SECRET_WEB',
          'default_web_secret',
        ),
        signOptions: { expiresIn: '8h' },
      }),
    }),
    UserModule,
    KaryawanModule,
  ],
  controllers: [WebAuthController, MobileAuthController],
  providers: [
    WebAuthService,
    MobileAuthService,
    JwtWebStrategy,
    JwtMobileStrategy,
  ],
  exports: [WebAuthService, MobileAuthService],
})
export class AuthModule {}
