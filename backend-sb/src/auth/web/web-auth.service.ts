import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../../user/user.service.js';

@Injectable()
export class WebAuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async login(username: string, password: string) {
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

    return {
      accessToken: this.jwtService.sign(payload),
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
