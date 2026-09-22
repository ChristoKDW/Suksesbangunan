import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { KaryawanService } from '../../karyawan/karyawan.service.js';
import { FaceRecognitionService } from '../../face/face-recognition.service.js';

@Injectable()
export class MobileAuthService {
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly karyawanService: KaryawanService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly faceService: FaceRecognitionService,
  ) {
    const smtpPort = Number(this.configService.get('SMTP_PORT', '587'));
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST', 'smtp.gmail.com'),
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  /**
   * Cek validitas NIK sebelum registrasi
   */
  async checkNik(nik: string) {
    const karyawan = await this.karyawanService.findByNik(nik);
    if (!karyawan) {
      throw new BadRequestException('NIK tidak ditemukan. Silakan hubungi HRD.');
    }
    // Jika password sudah ada, berarti akun sudah diklaim
    if (karyawan.password) {
      throw new ConflictException('Akun untuk NIK ini sudah diklaim. Silakan hubungi HRD jika ini sebuah kesalahan.');
    }
    return {
      nik: karyawan.nik,
      nama: karyawan.nama,
      email: karyawan.email,
      nomorTelepon: karyawan.nomorTelepon || null,
    };
  }

  /**
   * Daftarkan wajah karyawan: foto dikirim dari mobile, server yang menjalankan
   * model AI (SCRFD + MobileFaceNet) lalu menyimpan embedding 512-dim ke pgvector.
   */
  async registerFace(idKaryawan: number, imageBase64: string) {
    const karyawan = await this.karyawanService.findOne(idKaryawan);

    if (!this.faceService.isReady()) {
      throw new ServiceUnavailableException(
        'Model AI wajah belum siap di server. Coba beberapa saat lagi.',
      );
    }

    const buffer = this.faceService.decodeBase64Image(imageBase64);
    const result = await this.faceService.extractEmbedding(buffer);

    if (!result) {
      throw new BadRequestException(
        'Wajah tidak terdeteksi. Pastikan wajah terlihat jelas, pencahayaan cukup, dan tidak memakai masker.',
      );
    }

    // Validasi Keamanan: 1 Akun 1 Wajah (Anti-Duplikasi Wajah)
    // Cek apakah wajah yang di-scan sudah terdaftar pada akun karyawan lain
    const duplicate = await this.karyawanService.findDuplicateFace(
      result.embedding,
      idKaryawan,
      0.4,
    );

    if (duplicate) {
      throw new BadRequestException(
        `Wajah ini sudah terdaftar pada akun karyawan lain (${duplicate.nama} - NIK: ${duplicate.nik}). Satu wajah hanya dapat digunakan untuk satu akun dan tidak dapat didaftarkan berulang.`,
      );
    }

    karyawan.faceEmbedding = result.embedding;
    await this.karyawanService.saveEntity(karyawan);

    return {
      message: 'Data wajah berhasil didaftarkan.',
      confidence: Number(result.score.toFixed(3)),
    };
  }

  /**
   * Generate kode OTP 6 digit.
   */
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Kirim kode OTP ke email karyawan.
   */
  private async sendOtpEmail(email: string, nama: string, otp: string) {
    try {
      const fromUser = this.configService.get('SMTP_USER');
      await this.transporter.sendMail({
        from: `"Sukses Bangunan" <${fromUser}>`,
        to: email,
        subject: 'Kode OTP Registrasi - Sukses Bangunan',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #dc2626; margin-top: 0;">Verifikasi Akun Karyawan</h2>
            <p>Halo <b>${nama}</b>,</p>
            <p>Gunakan kode OTP berikut untuk menyelesaikan aktivasi akun absensi Anda:</p>
            <div style="text-align: center; margin: 24px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; background: #fef2f2; color: #dc2626; padding: 12px 24px; border-radius: 6px; display: inline-block;">${otp}</span>
            </div>
            <p style="color: #64748b; font-size: 13px;">Kode OTP ini berlaku selama 10 menit. Jangan bagikan kode ini kepada siapapun.</p>
          </div>
        `,
      });
      console.log(`[OTP] Email berhasil dikirim ke ${email}`);
    } catch (error) {
      console.error('Gagal kirim email OTP:', error);
      throw new ServiceUnavailableException(
        'Kode OTP gagal dikirim. Silakan coba kembali atau hubungi administrator.',
      );
    }
  }

  /**
   * Register karyawan: klaim akun (username/password), kirim OTP ke email,
   * akun BELUM aktif sampai OTP diverifikasi.
   */
  async register(
    email: string,
    username: string,
    password: string,
    nama: string,
    nik: string,
    nomorTelepon?: string,
  ) {
    // NIK wajib sudah didaftarkan HRD
    const karyawan = await this.karyawanService.findByNik(nik);
    if (!karyawan) {
      throw new BadRequestException(
        'NIK tidak ditemukan. Silakan hubungi HRD.',
      );
    }

    // Jika sudah punya password DAN email terverifikasi, berarti sudah diklaim
    if (karyawan.password && karyawan.emailTerverifikasi) {
      throw new ConflictException(
        'Akun untuk NIK ini sudah diklaim. Silakan hubungi HRD jika ini sebuah kesalahan.',
      );
    }

    // Pastikan email & username tidak dipakai NIK lain
    const existingEmail = await this.karyawanService.findByEmail(email);
    if (existingEmail && existingEmail.nik !== nik) {
      throw new ConflictException('Email sudah terdaftar pada NIK lain');
    }
    const existingUsername =
      await this.karyawanService.findByUsername(username);
    if (existingUsername && existingUsername.nik !== nik) {
      throw new ConflictException('Username sudah digunakan');
    }

    // Simpan kredensial + OTP
    const otp = this.generateOtp();
    const otpKadaluarsa = new Date(Date.now() + 10 * 60 * 1000); // 10 menit

    karyawan.email = email;
    karyawan.username = username;
    karyawan.password = await bcrypt.hash(password, 10);
    karyawan.nama = nama;
    if (nomorTelepon) karyawan.nomorTelepon = nomorTelepon;
    karyawan.emailTerverifikasi = false;
    karyawan.otpCode = otp;
    karyawan.otpKadaluarsa = otpKadaluarsa;
    await this.karyawanService.saveEntity(karyawan);

    await this.sendOtpEmail(email, nama, otp);

    return {
      message: 'Registrasi berhasil. Kode OTP telah dikirim ke email Anda.',
      idKaryawan: karyawan.idKaryawan,
      email,
    };
  }

  /**
   * Verifikasi OTP: jika valid, aktifkan akun (email_terverifikasi = true).
   */
  async verifyOtp(nik: string, otp: string) {
    const karyawan = await this.karyawanService.findByNik(nik);
    if (!karyawan) {
      throw new BadRequestException('NIK tidak ditemukan.');
    }

    if (karyawan.emailTerverifikasi) {
      return { message: 'Akun sudah aktif. Silakan login.' };
    }

    if (
      !karyawan.otpCode ||
      !karyawan.otpKadaluarsa ||
      new Date() > new Date(karyawan.otpKadaluarsa)
    ) {
      throw new BadRequestException(
        'Kode OTP sudah kadaluarsa. Silakan minta kode baru.',
      );
    }

    if (karyawan.otpCode !== otp) {
      throw new BadRequestException('Kode OTP salah.');
    }

    karyawan.emailTerverifikasi = true;
    karyawan.otpCode = null;
    karyawan.otpKadaluarsa = null;
    await this.karyawanService.saveEntity(karyawan);

    return { message: 'Verifikasi berhasil. Akun Anda sudah aktif.' };
  }

  /**
   * Kirim ulang OTP ke email karyawan.
   */
  async resendOtp(nik: string) {
    const karyawan = await this.karyawanService.findByNik(nik);
    if (!karyawan) {
      throw new BadRequestException('NIK tidak ditemukan.');
    }
    if (karyawan.emailTerverifikasi) {
      throw new ConflictException('Akun sudah aktif. Silakan login.');
    }
    if (!karyawan.email) {
      throw new BadRequestException('Email belum terdaftar. Ulangi registrasi.');
    }

    const otp = this.generateOtp();
    karyawan.otpCode = otp;
    karyawan.otpKadaluarsa = new Date(Date.now() + 10 * 60 * 1000);
    await this.karyawanService.saveEntity(karyawan);

    await this.sendOtpEmail(karyawan.email, karyawan.nama, otp);

    return { message: 'Kode OTP baru telah dikirim ke email Anda.' };
  }

  /**
   * Verifikasi email: klik link → set email_terverifikasi = true
   */
  async verifyEmail(token: string) {
    try {
      const payload = this.jwtService.verify(token);

      if (payload.type !== 'email-verify') {
        throw new BadRequestException('Token tidak valid');
      }

      const karyawan = await this.karyawanService.findOne(
        payload.idKaryawan,
      );

      if (karyawan.emailTerverifikasi) {
        return { message: 'Email sudah terverifikasi sebelumnya' };
      }

      karyawan.emailTerverifikasi = true;
      await this.karyawanService.saveEntity(karyawan);

      return { message: 'Email berhasil diverifikasi' };
    } catch (error) {
      throw new BadRequestException(
        'Token verifikasi tidak valid atau sudah kadaluarsa',
      );
    }
  }

  /**
   * Login mobile: cek email terverifikasi, return JWT, simpan token + kadaluarsa
   */
  async login(username: string, password: string) {
    const karyawan = await this.karyawanService.findByUsername(username);
    if (!karyawan) {
      throw new UnauthorizedException('Username atau password salah');
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      karyawan.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Username atau password salah');
    }

    if (!karyawan.emailTerverifikasi) {
      throw new UnauthorizedException(
        'Email belum terverifikasi. Silakan cek email Anda.',
      );
    }

    if (karyawan.statusAktif !== 'aktif') {
      throw new UnauthorizedException(
        `Akun Anda tidak aktif (status: ${karyawan.statusAktif}). Silakan hubungi HRD.`,
      );
    }

    const payload = {
      sub: karyawan.idKaryawan,
      idKaryawan: karyawan.idKaryawan,
      type: 'mobile',
    };

    // Tanda tangani dengan secret mobile agar konsisten dengan JwtMobileStrategy
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>(
        'JWT_SECRET_MOBILE',
        'default_mobile_secret',
      ),
      expiresIn: '7d',
    });

    // Simpan token dan kadaluarsa ke DB
    const tokenKadaluarsa = new Date();
    tokenKadaluarsa.setDate(tokenKadaluarsa.getDate() + 7);

    karyawan.token = accessToken;
    karyawan.tokenKadaluarsa = tokenKadaluarsa;
    await this.karyawanService.saveEntity(karyawan);

    return {
      accessToken,
      // Flag untuk mobile: apakah wajah sudah didaftarkan?
      sudahRegistrasiWajah:
        Array.isArray(karyawan.faceEmbedding) &&
        karyawan.faceEmbedding.length > 0,
      karyawan: {
        idKaryawan: karyawan.idKaryawan,
        nik: karyawan.nik,
        nama: karyawan.nama,
        email: karyawan.email,
        jenisKelamin: karyawan.jenisKelamin ?? null,
      },
    };
  }

  // 👱‍♀️ PONYTAIL: Isolasi fitur Lupa Password tanpa OTP, hanya ganti status flag.
  async forgotPasswordRequest(username: string) {
    if (!username) throw new BadRequestException('Username harus diisi');
    const karyawan = await this.karyawanService.findByUsername(username);
    if (!karyawan) {
      // Return ok to prevent username enumeration
      return { message: 'Jika username terdaftar, permintaan telah dikirim ke HRD' };
    }

    await this.karyawanService.update(karyawan.idKaryawan, { resetPasswordStatus: 'pending' });
    return { message: 'Permintaan reset password berhasil dikirim ke HRD' };
  }

  async forgotPasswordClaim(username: string, newPassword: string) {
    if (!username || !newPassword) throw new BadRequestException('Username dan password baru harus diisi');
    
    const karyawan = await this.karyawanService.findByUsername(username);
    if (!karyawan) throw new UnauthorizedException('Username tidak valid');

    if (karyawan.resetPasswordStatus !== 'approved') {
      throw new UnauthorizedException('Permintaan reset password Anda belum disetujui oleh HRD');
    }

    await this.karyawanService.update(karyawan.idKaryawan, {
      password: newPassword,
      resetPasswordStatus: 'none',
    });

    return { message: 'Password berhasil diubah. Silakan login dengan password baru.' };
  }

  /**
   * Profil karyawan lengkap untuk halaman mobile (GET /auth/mobile/me).
   */
  async getProfile(idKaryawan: number) {
    const k = await this.karyawanService.findOne(idKaryawan);
    return {
      idKaryawan: k.idKaryawan,
      nik: k.nik,
      nama: k.nama,
      email: k.email,
      nomorTelepon: k.nomorTelepon,
      jenisKelamin: k.jenisKelamin ?? null,
      departemen: k.departemen?.namaDepartemen ?? null,
      jabatan: k.jabatan?.namaJabatan ?? null,
      statusAktif: k.statusAktif,
      tanggalMasuk: k.tanggalMasuk,
      gajiPokok: k.gajiPokok,
      hakCuti: k.hakCuti,
      fotoProfil: k.fotoProfil
        ? `/uploads/foto-profil/${k.fotoProfil.split(/[\\/]/).pop()}`
        : null,
      sudahRegistrasiWajah:
        Array.isArray(k.faceEmbedding) && k.faceEmbedding.length > 0,
    };
  }

  /**
   * Update profil karyawan (nama, email, telepon) dari mobile.
   */
  async updateProfile(
    idKaryawan: number,
    dto: { nama?: string; email?: string; nomorTelepon?: string },
  ) {
    const karyawan = await this.karyawanService.findOne(idKaryawan);

    if (dto.email && dto.email !== karyawan.email) {
      const existingEmail = await this.karyawanService.findByEmail(dto.email);
      if (existingEmail && existingEmail.idKaryawan !== idKaryawan) {
        throw new ConflictException('Email sudah digunakan oleh karyawan lain');
      }
      karyawan.email = dto.email;
    }

    if (dto.nama) karyawan.nama = dto.nama;
    if (dto.nomorTelepon !== undefined)
      karyawan.nomorTelepon = dto.nomorTelepon;

    await this.karyawanService.saveEntity(karyawan);
    return { message: 'Profil berhasil diperbarui' };
  }

  /**
   * Ganti password karyawan dari mobile.
   */
  async changePassword(
    idKaryawan: number,
    currentPassword: string,
    newPassword: string,
  ) {
    const karyawan = await this.karyawanService.findOne(idKaryawan);

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      karyawan.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Password saat ini salah');
    }

    karyawan.password = await bcrypt.hash(newPassword, 10);
    await this.karyawanService.saveEntity(karyawan);
    return { message: 'Password berhasil diganti' };
  }

  /**
   * Upload foto profil karyawan.
   */
  async updateProfilePhoto(idKaryawan: number, filePath: string) {
    const karyawan = await this.karyawanService.findOne(idKaryawan);
    const cleanPath = `/uploads/foto-profil/${filePath.split(/[\\/]/).pop()}`;
    karyawan.fotoProfil = cleanPath;
    await this.karyawanService.saveEntity(karyawan);

    return {
      message: 'Foto profil berhasil diperbarui',
      fotoProfil: cleanPath,
    };
  }
}
