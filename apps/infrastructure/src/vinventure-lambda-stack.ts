import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export class VinventureLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Environment variables
    const environment = this.node.tryGetContext('environment') || 'dev';
    const isProduction = environment === 'production';

    // VPC for database and Lambda
    const vpc = new ec2.Vpc(this, 'VinventureVpc', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Database credentials
    const databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      description: 'Database credentials for VinVenture',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'vinventure_admin' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
      },
    });

    // Stripe secrets stored in Secrets Manager (not baked into CloudFormation)
    const stripeSecret = new secretsmanager.Secret(this, 'StripeSecret', {
      description: 'Stripe API keys for VinVenture',
      secretObjectValue: {
        secretKey: cdk.SecretValue.unsafePlainText(
          isProduction
            ? process.env.STRIPE_LIVE_SECRET_KEY || 'STRIPE_LIVE_KEY_NOT_SET'
            : process.env.STRIPE_TEST_SECRET_KEY || 'STRIPE_TEST_KEY_NOT_SET'
        ),
        publishableKey: cdk.SecretValue.unsafePlainText(
          isProduction
            ? process.env.STRIPE_LIVE_PUBLISHABLE_KEY || 'STRIPE_LIVE_PK_NOT_SET'
            : process.env.STRIPE_TEST_PUBLISHABLE_KEY || 'STRIPE_TEST_PK_NOT_SET'
        ),
        webhookSecret: cdk.SecretValue.unsafePlainText(
          isProduction
            ? process.env.STRIPE_LIVE_WEBHOOK_SECRET || 'STRIPE_LIVE_WEBHOOK_NOT_SET'
            : process.env.STRIPE_TEST_WEBHOOK_SECRET || 'STRIPE_TEST_WEBHOOK_NOT_SET'
        ),
      },
    });

    // Aurora Serverless v2 PostgreSQL Database
    const database = new rds.DatabaseCluster(this, 'VinventureDatabase', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_17_4,
      }),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      credentials: rds.Credentials.fromSecret(databaseSecret),
      defaultDatabaseName: 'vinventure',
      backup: {
        retention: cdk.Duration.days(isProduction ? 30 : 7),
      },
      deletionProtection: isProduction,
      removalPolicy: isProduction
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
      writer: rds.ClusterInstance.serverlessV2('writer'),
      serverlessV2MinCapacity: 0,
      serverlessV2MaxCapacity: isProduction ? 16 : 4,
      monitoringInterval: cdk.Duration.seconds(60),
    });

    // Security group for Lambda to access Aurora
    const lambdaSg = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc,
      description: 'Security group for Lambda functions',
      allowAllOutbound: true,
    });

    database.connections.allowFrom(lambdaSg, ec2.Port.tcp(5432), 'Lambda to Aurora');

    // AWS Cognito User Pool for Authentication
    const userPool = new cognito.UserPool(this, 'VinventureUserPool', {
      userPoolName: 'VinVenture Users',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: false,
      },
      autoVerify: {
        email: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      userVerification: {
        emailSubject: 'Verify your VinVenture account',
        emailBody: 'Welcome to VinVenture! Your verification code is {####}',
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: isProduction
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });

    // S3 bucket for static website (private, served via CloudFront OAC)
    const websiteBucket = new s3.Bucket(this, 'VinventureWebsiteBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const distribution = new cloudfront.Distribution(this, 'VinventureDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // Cognito User Pool Client -- callback URLs include CloudFront distribution
    const userPoolClient = new cognito.UserPoolClient(this, 'VinventureUserPoolClient', {
      userPool,
      userPoolClientName: 'VinVenture Web Client',
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: [
          'http://localhost:3000/auth/callback',
          `https://${distribution.domainName}/auth/callback`,
        ],
        logoutUrls: [
          'http://localhost:3000/',
          `https://${distribution.domainName}/`,
        ],
      },
      refreshTokenValidity: cdk.Duration.days(30),
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
    });

    // Cognito Identity Pool
    const identityPool = new cognito.CfnIdentityPool(this, 'VinventureIdentityPool', {
      identityPoolName: 'VinVenture Identity Pool',
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        {
          clientId: userPoolClient.userPoolClientId,
          providerName: userPool.userPoolProviderName,
        },
      ],
    });

    // IAM roles for authenticated users (least-privilege)
    const authenticatedRole = new iam.Role(this, 'VinventureAuthenticatedRole', {
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
    });

    new cognito.CfnIdentityPoolRoleAttachment(this, 'VinventureIdentityPoolRoleAttachment', {
      identityPoolId: identityPool.ref,
      roles: {
        authenticated: authenticatedRole.roleArn,
      },
    });

    // Lambda execution role
    const lambdaRole = new iam.Role(this, 'VinventureLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
    });

    databaseSecret.grantRead(lambdaRole);
    stripeSecret.grantRead(lambdaRole);

    // Construct DATABASE_URL from the secret for Prisma
    const dbHost = database.clusterEndpoint.hostname;
    const dbPort = database.clusterEndpoint.port.toString();

    // Environment-specific CORS origins
    const corsOrigins = [
      'http://localhost:3000',
      `https://${distribution.domainName}`,
    ];

    // Lambda environment variables
    const lambdaEnvironment = {
      NODE_ENV: isProduction ? 'production' : 'development',
      ENVIRONMENT: environment,
      DATABASE_SECRET_ARN: databaseSecret.secretArn,
      DATABASE_HOST: dbHost,
      DATABASE_PORT: dbPort,
      DATABASE_NAME: 'vinventure',
      COGNITO_USER_POOL_ID: userPool.userPoolId,
      COGNITO_USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      COGNITO_IDENTITY_POOL_ID: identityPool.ref,
      COGNITO_REGION: this.region,
      STRIPE_SECRET_ARN: stripeSecret.secretArn,
      CORS_ALLOWED_ORIGINS: corsOrigins.join(','),
    };

    // API Lambda Function
    const apiFunction = new lambda.Function(this, 'VinventureApiFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambda.Code.fromAsset('../../lambda'),
      handler: 'dist/lambda.handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: isProduction ? 1024 : 512,
      environment: lambdaEnvironment,
      role: lambdaRole,
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [lambdaSg],
    });

    // API Gateway with environment-specific CORS
    const api = new apigateway.RestApi(this, 'VinventureApi', {
      restApiName: 'VinVenture API',
      description: 'API for VinVenture wine booking platform',
      defaultCorsPreflightOptions: {
        allowOrigins: corsOrigins,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
      },
    });

    const apiIntegration = new apigateway.LambdaIntegration(apiFunction);
    const apiResource = api.root.addResource('api');
    apiResource.addProxy({
      defaultIntegration: apiIntegration,
      anyMethod: true,
    });

    // Deploy static frontend to S3
    new s3deploy.BucketDeployment(this, 'VinventureHtmlPages', {
      sources: [s3deploy.Source.asset('../../apps/web/out')],
      destinationBucket: websiteBucket,
      cacheControl: [
        s3deploy.CacheControl.fromString('public, max-age=0, must-revalidate'),
      ],
    });

    // CloudFront behavior for API (no cache)
    distribution.addBehavior('/api/*', new origins.RestApiOrigin(api), {
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
    });

    // CloudWatch Log Groups
    new logs.LogGroup(this, 'ApiLogGroup', {
      logGroupName: `/aws/lambda/${apiFunction.functionName}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Outputs
    new cdk.CfnOutput(this, 'CloudFrontUrl', {
      value: `https://${distribution.domainName}`,
      description: 'CloudFront Distribution URL',
    });

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.clusterEndpoint.hostname,
      description: 'Aurora Serverless cluster endpoint',
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: databaseSecret.secretArn,
      description: 'Database credentials secret ARN',
    });

    new cdk.CfnOutput(this, 'StripeSecretArn', {
      value: stripeSecret.secretArn,
      description: 'Stripe API keys secret ARN',
    });

    new cdk.CfnOutput(this, 'CognitoUserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'CognitoUserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'CognitoIdentityPoolId', {
      value: identityPool.ref,
      description: 'Cognito Identity Pool ID',
    });

    new cdk.CfnOutput(this, 'ApiLambdaArn', {
      value: apiFunction.functionArn,
      description: 'API Lambda function ARN',
    });
  }
}
