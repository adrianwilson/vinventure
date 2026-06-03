// AWS Cognito Authentication Service
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  GetUserCommand,
  GlobalSignOutCommand,
  AdminConfirmSignUpCommand,
  AdminGetUserCommand,
  ResendConfirmationCodeCommand,
  AuthFlowType,
} from '@aws-sdk/client-cognito-identity-provider';

// Cognito configuration
const getCognitoConfig = () => {
  return {
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || 'ca-central-1_Z84EpCMUS',
    clientId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID || '16ccir3mongq4m7p1bh8dov16u',
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'ca-central-1',
  };
};

// Initialize Cognito client
const createCognitoClient = () => {
  const config = getCognitoConfig();
  return new CognitoIdentityProviderClient({
    region: config.region,
  });
};

export interface CognitoUser {
  username: string;
  sub?: string;
  name?: string;
  email: string;
  attributes: Record<string, string>;
  accessToken: string;
  idToken: string;
  refreshToken: string;
  role?: 'GUEST' | 'WINERY_ADMIN' | 'PLATFORM_ADMIN';
  displayName?: string;
  cognitoUid?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export class CognitoAuthService {
  private static client: CognitoIdentityProviderClient | null = null;
  private static config = getCognitoConfig();

  private static getClient() {
    if (!this.client) {
      this.client = createCognitoClient();
    }
    return this.client;
  }

  private static isConfigured() {
    return !!(this.config.userPoolId && this.config.clientId);
  }

  static async signUp(data: SignUpData): Promise<{ user: unknown; confirmationRequired: boolean }> {
    if (!this.isConfigured()) {
      throw new Error('Cognito is not configured. Please set up Cognito credentials.');
    }

    const client = this.getClient();

    try {
      const command = new SignUpCommand({
        ClientId: this.config.clientId,
        Username: data.email,
        Password: data.password,
        UserAttributes: [
          {
            Name: 'email',
            Value: data.email,
          },
          {
            Name: 'name',
            Value: data.name,
          },
        ],
      });

      const response = await client.send(command);

      return {
        user: {
          username: response.UserSub,
          email: data.email,
          name: data.name,
        },
        confirmationRequired: !response.UserConfirmed,
      };
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Sign up failed');
    }
  }

  static async signIn(data: SignInData): Promise<CognitoUser> {
    if (!this.isConfigured()) {
      throw new Error('Cognito is not configured. Please set up Cognito credentials.');
    }

    const client = this.getClient();

    try {
      const command = new InitiateAuthCommand({
        ClientId: this.config.clientId,
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        AuthParameters: {
          USERNAME: data.email,
          PASSWORD: data.password,
        },
      });

      const response = await client.send(command);

      if (!response.AuthenticationResult) {
        throw new Error('Authentication failed');
      }

      const tokens = response.AuthenticationResult;

      // Get user attributes
      const getUserCommand = new GetUserCommand({
        AccessToken: tokens.AccessToken ?? '',
      });

      const userResponse = await client.send(getUserCommand);

      const attributes: Record<string, string> = {};
      userResponse.UserAttributes?.forEach((attr) => {
        if (attr.Name && attr.Value) {
          attributes[attr.Name] = attr.Value;
        }
      });

      return {
        username: userResponse.Username || '',
        email: attributes.email || '',
        attributes,
        accessToken: tokens.AccessToken || '',
        idToken: tokens.IdToken || '',
        refreshToken: tokens.RefreshToken || '',
      };
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Sign in failed');
    }
  }

  static async signOut(accessToken: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Cognito is not configured. Please set up Cognito credentials.');
    }

    const client = this.getClient();

    try {
      const command = new GlobalSignOutCommand({
        AccessToken: accessToken,
      });

      await client.send(command);
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Sign out failed');
    }
  }

  static async forgotPassword(email: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Cognito is not configured. Please set up Cognito credentials.');
    }

    const client = this.getClient();

    try {
      const command = new ForgotPasswordCommand({
        ClientId: this.config.clientId,
        Username: email,
      });

      await client.send(command);
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Password reset failed');
    }
  }

  static async confirmSignUp(email: string, confirmationCode: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Cognito is not configured. Please set up Cognito credentials.');
    }

    const client = this.getClient();

    try {
      const command = new ConfirmSignUpCommand({
        ClientId: this.config.clientId,
        Username: email,
        ConfirmationCode: confirmationCode,
      });

      await client.send(command);
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Email confirmation failed');
    }
  }

  static async confirmForgotPassword(
    email: string,
    confirmationCode: string,
    newPassword: string
  ): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Cognito is not configured. Please set up Cognito credentials.');
    }

    const client = this.getClient();

    try {
      const command = new ConfirmForgotPasswordCommand({
        ClientId: this.config.clientId,
        Username: email,
        ConfirmationCode: confirmationCode,
        Password: newPassword,
      });

      await client.send(command);
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Password confirmation failed');
    }
  }

  static async getCurrentUser(accessToken: string): Promise<CognitoUser | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const client = this.getClient();

    try {
      const command = new GetUserCommand({
        AccessToken: accessToken,
      });

      const response = await client.send(command);

      const attributes: Record<string, string> = {};
      response.UserAttributes?.forEach((attr) => {
        if (attr.Name && attr.Value) {
          attributes[attr.Name] = attr.Value;
        }
      });

      // Check for development role override first
      const getDevRole = () => {
        if (typeof window !== 'undefined') {
          const savedRole = localStorage.getItem('dev_user_role');
          if (savedRole) {
            console.log(`[DEV] Using development role override: ${savedRole}`);
            return savedRole as 'GUEST' | 'WINERY_ADMIN' | 'PLATFORM_ADMIN';
          }
        }
        return null;
      };

      const devRole = getDevRole();

      const baseUser = {
        username: response.Username || '',
        email: attributes.email || '',
        attributes,
        accessToken,
        idToken: '', // We don't have ID token from GetUser
        refreshToken: '', // We don't have refresh token from GetUser
        displayName: attributes.name || attributes.email || '',
        role: devRole || ('GUEST' as const), // Use dev role if available, otherwise default to GUEST
      };

      // Only try to fetch role from backend if no dev role override exists
      if (!devRole) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
          
          const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);

          if (apiResponse.ok) {
            const profileData = await apiResponse.json();
            baseUser.role = profileData.role || 'GUEST';
            baseUser.displayName = profileData.name || baseUser.displayName;
          }
        } catch (error: unknown) {
          if (error instanceof Error && error.name === 'AbortError') {
            console.warn('Backend API request timed out, defaulting to GUEST role');
          } else {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.warn('Could not fetch user role from backend, defaulting to GUEST:', message);
          }
        }
      }

      return baseUser;
    } catch {
      return null;
    }
  }

  static async refreshTokens(refreshToken: string): Promise<{
    accessToken: string;
    idToken: string;
  }> {
    if (!this.isConfigured()) {
      throw new Error('Cognito is not configured. Please set up Cognito credentials.');
    }

    const client = this.getClient();

    try {
      const command = new InitiateAuthCommand({
        ClientId: this.config.clientId,
        AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
      });

      const response = await client.send(command);

      if (!response.AuthenticationResult) {
        throw new Error('Token refresh failed');
      }

      const tokens = response.AuthenticationResult;

      return {
        accessToken: tokens.AccessToken || '',
        idToken: tokens.IdToken || '',
      };
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Token refresh failed');
    }
  }

  static async resendConfirmationCode(email: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Cognito is not configured. Please set up Cognito credentials.');
    }

    const client = this.getClient();

    try {
      const command = new ResendConfirmationCodeCommand({
        ClientId: this.config.clientId,
        Username: email,
      });

      await client.send(command);
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to resend confirmation code');
    }
  }

  static async adminConfirmSignUp(email: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Cognito is not configured. Please set up Cognito credentials.');
    }

    const client = this.getClient();

    try {
      const command = new AdminConfirmSignUpCommand({
        UserPoolId: this.config.userPoolId,
        Username: email,
      });

      await client.send(command);
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Admin confirmation failed');
    }
  }

  static async adminGetUser(email: string): Promise<{
    username: string | undefined;
    userStatus: string | undefined;
    enabled: boolean | undefined;
    userCreateDate: Date | undefined;
    userLastModifiedDate: Date | undefined;
    attributes: Record<string, string>;
  }> {
    if (!this.isConfigured()) {
      throw new Error('Cognito is not configured. Please set up Cognito credentials.');
    }

    const client = this.getClient();

    try {
      const command = new AdminGetUserCommand({
        UserPoolId: this.config.userPoolId,
        Username: email,
      });

      const response = await client.send(command);
      return {
        username: response.Username,
        userStatus: response.UserStatus,
        enabled: response.Enabled,
        userCreateDate: response.UserCreateDate,
        userLastModifiedDate: response.UserLastModifiedDate,
        attributes: response.UserAttributes?.reduce((acc, attr) => {
          if (attr.Name && attr.Value) {
            acc[attr.Name] = attr.Value;
          }
          return acc;
        }, {} as Record<string, string>),
      };
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get user information');
    }
  }

  static isAvailable(): boolean {
    return this.isConfigured();
  }
}