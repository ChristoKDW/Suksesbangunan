// Konfigurasi global aplikasi mobile.
class AppConfig {
  AppConfig._();

  // Base URL backend NestJS:
  // - Production: 'https://api.larasbysuksesbangunan.my.id' (Swagger: https://api.larasbysuksesbangunan.my.id/api)
  // - Local Development: 'http://localhost:3002'
  // - Android Emulator (Local): 'http://10.0.2.2:3002'
  static const String baseUrl = 'https://api.larasbysuksesbangunan.my.id';

  // Timeout request (detik)
  static const int requestTimeout = 25;

  // Dimensi embedding wajah MobileFaceNet di backend AI (pgvector)
  static const int faceEmbeddingDim = 512;
}
