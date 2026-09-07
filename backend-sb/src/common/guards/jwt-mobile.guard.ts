import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtMobileGuard extends AuthGuard('jwt-mobile') {}
