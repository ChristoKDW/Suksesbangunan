import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { User } from '../user/entities/user.entity.js';
import { Karyawan } from '../karyawan/entities/karyawan.entity.js';
import { Departemen } from '../departemen/entities/departemen.entity.js';
import { Penggajian } from '../penggajian/entities/penggajian.entity.js';
import { Kasbon, KasbonCicilan } from '../kasbon/entities/kasbon.entity.js';
import { LaporanMasalah } from '../laporan-masalah/entities/laporan-masalah.entity.js';
import { PengajuanIzin } from '../pengajuan-izin/entities/pengajuan-izin.entity.js';

import { SuperAdminAuthService } from './super-admin-auth.service.js';
import { SuperAdminAuthController } from './super-admin-auth.controller.js';
import { SuperAdminInsightsService } from './super-admin-insights.service.js';
import { SuperAdminInsightsController } from './super-admin-insights.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Karyawan,
      Departemen,
      Penggajian,
      Kasbon,
      KasbonCicilan,
      LaporanMasalah,
      PengajuanIzin,
    ]),
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>(
          'JWT_SECRET_WEB',
          'default_web_secret',
        ),
        signOptions: { expiresIn: '12h' },
      }),
    }),
  ],
  controllers: [SuperAdminAuthController, SuperAdminInsightsController],
  providers: [SuperAdminAuthService, SuperAdminInsightsService],
  exports: [SuperAdminAuthService, SuperAdminInsightsService],
})
export class SuperAdminModule {}
