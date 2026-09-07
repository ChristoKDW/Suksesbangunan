// Konfigurasi global aplikasi mobile.
class AppConfig {
  AppConfig._();

  // Base URL backend NestJS:
  // - HP Fisik (Wi-Fi): gunakan IP LAN komputer ini (172.25.195.132)
  // - Emulator Android: gunakan 'http://10.0.2.2:3002'
  static const String baseUrl = 'http://172.25.195.132:3002';

  // Timeout request (detik)
  static const int requestTimeout = 25;

  // Dimensi embedding wajah MobileFaceNet di backend AI (pgvector)
  static const int faceEmbeddingDim = 512;
}
