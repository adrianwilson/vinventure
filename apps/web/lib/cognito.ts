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
  email: string;
  attributes: Record<string, string>;
  accessToken: string;
  idToken: string;
  refreshToken: string;
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

  static async signUp(data: SignUpData): Promise<{ user: any; confirmationRequired: boolean }> {
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
    } catch (error: any) {
      throw new Error(error.message || 'Sign up failed');
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
        AccessToken: tokens.AccessToken!,
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
    } catch (error: any) {
      throw new Error(error.message || 'Sign in failed');
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
    } catch (error: any) {
      throw new Error(error.message || 'Sign out failed');
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
    } catch (error: any) {
      throw new Error(error.message || 'Password reset failed');
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
    } catch (error: any) {
      throw new Error(error.message || 'Password confirmation failed');
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

      return {
        username: response.Username || '',
        email: attributes.email || '',
        attributes,
        accessToken,
        idToken: '', // We don't have ID token from GetUser
        refreshToken: '', // We don't have refresh token from GetUser
      };
    } catch (error) {
      return null;
    }
  }

  static isAvailable(): boolean {
    return this.isConfigured();
  }
}