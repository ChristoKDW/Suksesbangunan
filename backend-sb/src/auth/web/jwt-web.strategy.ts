import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtWebStrategy extends PassportStrategy(Strategy, 'jwt-web') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET_WEB', 'default_web_secret'),
    });
  }

  async validate(payload: any) {
    return {
      idUser: payload.idUser || payload.sub,
      role: payload.role,
      idDepartemen: payload.idDepartemen,
      type: 'web',
    };
  }
}
