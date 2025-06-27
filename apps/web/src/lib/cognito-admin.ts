// AWS Cognito JWT verification for server-side API routes
import { CognitoJwtVerifier } from 'aws-jwt-verify';

const userPoolId = process.env.COGNITO_USER_POOL_ID || 'ca-central-1_Z84EpCMUS';
const clientId = process.env.COGNITO_USER_POOL_CLIENT_ID || '16ccir3mongq4m7p1bh8dov16u';
const region = process.env.COGNITO_REGION || 'ca-central-1';

// Create a JWT verifier for Cognito User Pool tokens
const verifier = CognitoJwtVerifier.create({
  userPoolId,
  tokenUse: 'access',
  clientId,
});

export async function verifyCognitoToken(token: string) {
  try {
    const payload = await verifier.verify(token);
    return {
      uid: payload.sub,
      username: payload.username,
      email: payload.email,
      exp: payload.exp,
      iat: payload.iat,
    };
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export function getCognitoConfig() {
  return {
    userPoolId,
    clientId,
    region,
  };
}