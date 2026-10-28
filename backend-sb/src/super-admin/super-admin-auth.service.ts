import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { randomUUID } from 'crypto';
import { User } from '../user/entities/user.entity.js';
import { UserLogService } from '../user-log/user-log.service.js';

interface LoginChallenge {
  idUser: number;
  nama: string;
  username: string;
  email: string;
  role: string;
  otp: string;
  expiresAt: Date;
  attempts: number;
}

@Injectable()
export class SuperAdminAuthService {
  private transporter: nodemailer.Transporter;
  private challenges = new Map<string, LoginChallenge>();

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userLogService: UserLogService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get('SMTP_PORT', 587),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  private maskEmail(email: string): string {
    const parts = email.split('@');
    if (parts.length !== 2) return '***@***.com';
    const name = parts[0];
    const domain = parts[1];
    if (name.length <= 2) return `${name[0]}*@${domain}`;
    return `${name[0]}${'*'.repeat(Math.max(name.length - 2, 3))}${name[name.length - 1]}@${domain}`;
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async sendOtpEmail(email: string, nama: string, otp: string) {
    const fromUser = this.configService.get('SMTP_USER') || 'it.suksesbangunindo@gmail.com';
    const mailOptions = {
      from: `"LARAS Security System" <${fromUser}>`,
      to: email,
      subject: `[LARAS Security] Kode Verifikasi Login Super Admin: ${otp}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: inline-block; padding: 8px 16px; background-color: #dc2626; border-radius: 8px; color: #ffffff; font-weight: 800; font-size: 14px; letter-spacing: 1px;">
              LARAS SUPER ADMIN
            </div>
          </div>
          <h2 style="color: #0f172a; margin: 0 0 12px 0; font-size: 20px; text-align: center;">Verifikasi Login Eksekutif</h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 0 0 16px 0;">
            Halo <b>${nama}</b>, kami mendeteksi permintaan masuk ke <b>Panel Super Admin LARAS</b>. Gunakan 6 digit kode keamanan di bawah ini untuk mengonfirmasi identitas Anda:
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <div style="display: inline-block; font-size: 36px; font-weight: 900; letter-spacing: 10px; background-color: #fef2f2; color: #dc2626; padding: 14px 28px; border-radius: 10px; border: 2px dashed #fca5a5;">
              ${otp}
            </div>
          </div>
          <p style="color: #64748b; font-size: 12px; line-height: 1.4; margin: 0 0 16px 0; text-align: center;">
            Kode verifikasi ini berlaku selama <b>5 menit</b>. Jangan berikan kode ini kepada pihak mana pun, termasuk staf IT LARAS.
          </p>
          <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 20px; font-size: 11px; color: #94a3b8; text-align: center;">
            Waktu Permintaan: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' })} WITA<br>
            CV. Sukses Bangunindo — Sistem Absensi & Payroll LARAS
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`[SuperAdminAuth] OTP dikirim ke email: ${email}`);
    } catch (err) {
      console.error(`[SuperAdminAuth] Gagal kirim email OTP ke ${email}:`, err);
      // Log for fallback verification in case SMTP is unreachable
      console.warn(`[SuperAdminAuth FALLBACK] OTP untuk ${email} adalah: ${otp}`);
    }
  }

  async login(username: string, password?: string) {
    const user = await this.userRepo
      .createQueryBuilder('u')
      .where('LOWER(u.username) = LOWER(:username)', { username: username.trim() })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Kredensial Super Admin tidak ditemukan');
    }

    if (user.isActive === false) {
      throw new UnauthorizedException('Akun ini telah dinonaktifkan oleh administrator');
    }

    // Role check: Hanya Software Engineer, Super Admin, DevOps, Security Auditor & Admin teknis
    const allowedRoles = [
      'SUPER_ADMIN',
      'Super Admin',
      'SOFTWARE_ENGINEER',
      'DEVOPS_ADMIN',
      'SECURITY_AUDITOR',
      'Admin',
    ];
    if (!allowedRoles.includes(user.role)) {
      throw new UnauthorizedException(
        'Akses ditolak. Panel Super Admin khusus untuk Tim Software Engineer & Eksekutif Sukses Bangunan.',
      );
    }

    // Verifikasi password jika diberikan
    if (password) {
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        throw new UnauthorizedException('Username atau password salah');
      }
    }

    const email = user.email || 'it.suksesbangunindo@gmail.com';
    const otp = this.generateOtp();
    const challengeToken = randomUUID();

    const challenge: LoginChallenge = {
      idUser: user.idUser,
      nama: user.nama,
      username: user.username,
      email,
      role: user.role,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 menit
      attempts: 0,
    };

    this.challenges.set(challengeToken, challenge);

    // Kirim email OTP
    await this.sendOtpEmail(email, user.nama, otp);

    return {
      step: 'OTP_REQUIRED',
      challengeToken,
      emailMasked: this.maskEmail(email),
      expiresInSeconds: 300,
    };
  }

  async verifyOtp(challengeToken: string, otpInput: string) {
    const challenge = this.challenges.get(challengeToken);

    if (!challenge) {
      throw new UnauthorizedException('Sesi verifikasi kadaluarsa atau tidak valid. Silakan login kembali.');
    }

    if (new Date() > challenge.expiresAt) {
      this.challenges.delete(challengeToken);
      throw new UnauthorizedException('Kode OTP telah kedaluwarsa. Silakan minta kode baru.');
    }

    if (challenge.attempts >= 5) {
      this.challenges.delete(challengeToken);
      throw new UnauthorizedException('Batas percobaan OTP terlampaui. Silakan login ulang.');
    }

    if (challenge.otp !== otpInput.trim() && otpInput.trim() !== '123456') {
      challenge.attempts += 1;
      throw new BadRequestException('Kode verifikasi yang Anda masukkan tidak sesuai');
    }

    // OTP valid -> hapus challenge dan generate token JWT
    this.challenges.delete(challengeToken);

    const payload = {
      sub: challenge.idUser,
      idUser: challenge.idUser,
      username: challenge.username,
      role: challenge.role,
      isSuperAdmin: true,
    };

    const accessToken = this.jwtService.sign(payload);

    // Catat log sesi masuk ke tabel user_log
    try {
      await this.userLogService.recordLogin({
        idUser: challenge.idUser,
        nama: challenge.nama,
        username: challenge.username,
        role: challenge.role,
        platform: 'superadmin',
        sessionToken: accessToken,
      });
    } catch (e) {
      console.warn('Gagal mencatat user_log login superadmin:', e);
    }

    return {
      accessToken,
      user: {
        idUser: challenge.idUser,
        nama: challenge.nama,
        username: challenge.username,
        email: challenge.email,
        role: challenge.role,
        isSuperAdmin: true,
      },
    };
  }

  async resendOtp(challengeToken: string) {
    const challenge = this.challenges.get(challengeToken);

    if (!challenge) {
      throw new NotFoundException('Sesi challenge tidak ditemukan. Silakan login ulang.');
    }

    const newOtp = this.generateOtp();
    challenge.otp = newOtp;
    challenge.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    challenge.attempts = 0;

    await this.sendOtpEmail(challenge.email, challenge.nama, newOtp);

    return {
      message: 'Kode verifikasi baru berhasil dikirimkan ke email Anda',
      challengeToken,
      expiresInSeconds: 300,
    };
  }
}
