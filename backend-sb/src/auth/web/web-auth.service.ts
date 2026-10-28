import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../../user/user.service.js';
import { UserLogService } from '../../user-log/user-log.service.js';

@Injectable()
export class WebAuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly userLogService: UserLogService,
  ) {}

  async login(username: string, password: string, ipAddress?: string, userAgent?: string) {
    const user = await this.userService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Username atau password salah');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Username atau password salah');
    }

    const payload = {
      sub: user.idUser,
      idUser: user.idUser,
      role: user.role,
      idDepartemen: user.idDepartemen,
      type: 'web',
    };

    const accessToken = this.jwtService.sign(payload);

    try {
      await this.userLogService.recordLogin({
        idUser: user.idUser,
        nama: user.nama,
        username: user.username,
        role: user.role,
        platform: 'web',
        ipAddress: ipAddress || '103.247.11.91',
        userAgent: userAgent || null,
        sessionToken: accessToken,
      });
    } catch (e) {
      console.warn('Gagal mencatat user_log login web:', e);
    }

    return {
      accessToken,
      user: {
        idUser: user.idUser,
        nama: user.nama,
        role: user.role,
        username: user.username,
        idDepartemen: user.idDepartemen,
      },
    };
  }
}
