import { Request } from 'express';
import { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  sub: string;
  cognitoUid: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
