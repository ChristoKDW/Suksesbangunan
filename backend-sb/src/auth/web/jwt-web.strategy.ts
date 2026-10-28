import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserLogService } from '../../user-log/user-log.service.js';

@Injectable()
export class JwtWebStrategy extends PassportStrategy(Strategy, 'jwt-web') {
  constructor(
    configService: ConfigService,
    private readonly userLogService: UserLogService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET_WEB', 'default_web_secret'),
    });
  }

  async validate(payload: any) {
    const idUser = payload.idUser || payload.sub;

    if (idUser) {
      const isOnline = await this.userLogService.isUserSessionOnline(idUser, 'web');
      if (!isOnline) {
        throw new UnauthorizedException('Sesi Anda telah diakhiri atau diputuskan oleh Super Administrator');
      }
    }

    return {
      idUser,
      role: payload.role,
      idDepartemen: payload.idDepartemen,
      type: 'web',
    };
  }
}
