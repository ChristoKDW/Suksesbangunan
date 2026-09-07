import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { KaryawanService } from '../../karyawan/karyawan.service.js';

@Injectable()
export class JwtMobileStrategy extends PassportStrategy(
  Strategy,
  'jwt-mobile',
) {
  constructor(
    configService: ConfigService,
    private readonly karyawanService: KaryawanService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        'JWT_SECRET_MOBILE',
        'default_mobile_secret',
      ),
    });
  }

  async validate(payload: any) {
    const karyawan = await this.karyawanService.findOne(
      payload.idKaryawan || payload.sub,
    );

    // Validasi token belum kadaluarsa di sisi server (revocation check)
    if (!karyawan.token || !karyawan.tokenKadaluarsa) {
      throw new UnauthorizedException('Token tidak valid, silakan login ulang');
    }

    if (new Date() > new Date(karyawan.tokenKadaluarsa)) {
      throw new UnauthorizedException(
        'Token sudah kadaluarsa, silakan login ulang',
      );
    }

    return {
      idKaryawan: karyawan.idKaryawan,
      nik: karyawan.nik,
      nama: karyawan.nama,
      type: 'mobile',
    };
  }
}
