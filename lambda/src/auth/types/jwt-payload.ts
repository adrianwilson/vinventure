import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  cognitoUid: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
