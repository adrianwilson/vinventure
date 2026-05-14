import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticatedUser } from '../types/authenticated-request';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = AuthenticatedUser>(err: Error | null, user: TUser | false, info: unknown, context: ExecutionContext, status?: unknown): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid token');
    }
    return user;
  }
}
