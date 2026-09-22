import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

// Common
import { CommonModule } from './common/common.module.js';

// Auth
import { AuthModule } from './auth/auth.module.js';

// Feature modules
import { DepartemenModule } from './departemen/departemen.module.js';
import { JabatanModule } from './jabatan/jabatan.module.js';
import { PengaturanKantorModule } from './pengaturan-kantor/pengaturan-kantor.module.js';
import { UserModule } from './user/user.module.js';
import { KaryawanModule } from './karyawan/karyawan.module.js';
import { ShiftModule } from './shift/shift.module.js';
import { JadwalKerjaModule } from './jadwal-kerja/jadwal-kerja.module.js';
import { AbsensiModule } from './absensi/absensi.module.js';
import { IstirahatModule } from './istirahat/istirahat.module.js';
import { PengajuanIzinModule } from './pengajuan-izin/pengajuan-izin.module.js';
import { PenggajianModule } from './penggajian/penggajian.module.js';

import { ReportsModule } from './reports/reports.module.js';
import { NotificationModule } from './notification/notification.module.js';
import { FaceModule } from './face/face.module.js';
import { HariLiburModule } from './hari-libur/hari-libur.module.js';
import { PertukaranJadwalModule } from './pertukaran-jadwal/pertukaran-jadwal.module.js';
import { RegularOffModule } from './regular-off/regular-off.module.js';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        host: configService.get<string>('DATABASE_HOST', 'localhost'),
        port: configService.get<number>('DATABASE_PORT', 5432),
        username: configService.get<string>('DATABASE_USERNAME', 'postgres'),
        password: configService.get<string>('DATABASE_PASSWORD', 'postgres'),
        database: configService.get<string>(
          'DATABASE_NAME',
          'absensi_sukses_bangunan',
        ),
        autoLoadEntities: true,
        synchronize: true, // set false di production!
      }),
    }),

    // Common (global)
    CommonModule,

    // AI pengenalan wajah (model dimuat saat server start)
    FaceModule,

    // Auth
    AuthModule,

    // Rate Limiting (Anti Brute-Force & DDoS)
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120, // 120 requests per minute per IP
      },
    ]),

    // Feature modules
    DepartemenModule,
    JabatanModule,
    PengaturanKantorModule,
    UserModule,
    KaryawanModule,
    ShiftModule,
    JadwalKerjaModule,
    AbsensiModule,
    IstirahatModule,
    PengajuanIzinModule,
    PenggajianModule,
    ReportsModule,
    NotificationModule,
    HariLiburModule,
    PertukaranJadwalModule,
    RegularOffModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
