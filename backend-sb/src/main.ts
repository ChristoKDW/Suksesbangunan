import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

import { json, urlencoded } from 'express';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Security Headers via Helmet
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginOpenerPolicy: false,
      contentSecurityPolicy: false, // Allows Swagger UI and local development assets
    }),
  );

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS: Reflect request origin dynamically so credentials: true works with modern browsers (Safari/Chrome)
  app.enableCors({
    origin: (requestOrigin, callback) => {
      // Allow any origin or requests without origin (e.g. mobile apps, curl)
      callback(null, requestOrigin || true);
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Requested-With',
      'Origin',
    ],
    exposedHeaders: ['Content-Disposition'],
    credentials: true,
  });

  // Static file serving for uploads
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('API Absensi Karyawan - Sukses Bangunan')
    .setDescription(
      'Backend API untuk aplikasi absensi karyawan dengan geofencing, dual-auth (web + mobile), jadwal kerja, pengajuan izin, dan penggajian.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth Web', 'Login untuk user web (Admin, HRD, SPV)')
    .addTag('Auth Mobile', 'Register, login, verifikasi email untuk karyawan')
    .addTag('Departemen', 'Kelola data departemen')
    .addTag('Jabatan', 'Kelola data jabatan')
    .addTag('Pengaturan Kantor', 'Kelola pengaturan kantor (koordinat, radius)')
    .addTag('User', 'Kelola user web')
    .addTag('Karyawan', 'Kelola data karyawan')
    .addTag('Shift', 'Kelola data shift')
    .addTag('Jadwal Kerja', 'Kelola jadwal kerja (single, bulk, excel import)')
    .addTag('Absensi', 'Submit & kelola absensi (geofencing)')
    .addTag('Istirahat', 'Kelola data istirahat')
    .addTag('Pengajuan Izin', 'Submit & proses izin (dual-path)')
    .addTag('Penggajian', 'Generate & kelola penggajian')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3002;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Server running on http://0.0.0.0:${port}`);
  console.log(`📚 Swagger docs: http://0.0.0.0:${port}/api`);
}
bootstrap();
