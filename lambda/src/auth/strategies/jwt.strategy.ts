import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../types/jwt-payload';
import { AuthenticatedUser } from '../types/authenticated-request';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: (() => {
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error('JWT_SECRET environment variable is required');
        return secret;
      })(),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    return {
      sub: payload.sub,
      cognitoUid: payload.cognitoUid,
      email: payload.email,
      role: payload.role,
    };
  }
}
