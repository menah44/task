import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'super-secret-key', // Secret key matching JwtModule registration
    });
  }

  async validate(payload: { sub: number; email: string; role: string }) {
    // Value returned here is attached to request.user
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
