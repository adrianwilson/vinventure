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
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as s3notifications from 'aws-cdk-lib/aws-s3-notifications';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { CloudFrontToS3 } from '@aws-solutions-constructs/aws-cloudfront-s3';
import { Construct } from 'constructs';

export class VinventureLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Environment variables
    const environment = this.node.tryGetContext('environment') || 'dev';
    const isProduction = environment === 'production';

    // VPC for database (Lambda functions can be VPC-less for better performance)
    const vpc = new ec2.Vpc(this, 'VinventureVpc', {
      maxAzs: 2,
      natGateways: 1, // Lambda doesn't need NAT gateways for most use cases
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Secrets for sensitive configuration
    const firebaseSecret = new secretsmanager.Secret(this, 'FirebaseSecret', {
      description: 'Firebase configuration for VinVenture',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          projectId: 'your-firebase-project',
          clientEmail: 'firebase-adminsdk@your-project.iam.gserviceaccount.com',
          apiKey: 'your-firebase-api-key',
          authDomain: 'your-project.firebaseapp.com',
          storageBucket: 'your-project.appspot.com',
          messagingSenderId: 'your-sender-id',
          appId: 'your-app-id',
        }),
        generateStringKey: 'privateKey',
        excludeCharacters: '"\\/',
      },
    });

    // Aurora Serverless v2 PostgreSQL Database (scales to zero when dormant)
    const databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      description: 'Database credentials for VinVenture',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'vinventure_admin' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
      },
    });

    // Aurora Serverless v2 Cluster
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
      readers: [rds.ClusterInstance.serverlessV2('reader')],
      serverlessV2MinCapacity: 0,
      serverlessV2MaxCapacity: isProduction ? 16 : 4,
      monitoringInterval: cdk.Duration.seconds(60),
      // Aurora Serverless v2 scales down to minimum capacity when idle
    });

    // S3 Buckets
    // const mediaBucket = new s3.Bucket(this, 'VinventureMediaBucket', {
    //   versioned: true,
    //   encryption: s3.BucketEncryption.S3_MANAGED,
    //   blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    //   removalPolicy: isProduction
    //     ? cdk.RemovalPolicy.RETAIN
    //     : cdk.RemovalPolicy.DESTROY,
    //   cors: [
    //     {
    //       allowedMethods: [
    //         s3.HttpMethods.GET,
    //         s3.HttpMethods.POST,
    //         s3.HttpMethods.PUT,
    //       ],
    //       allowedOrigins: ['*'], // Restrict this in production
    //       allowedHeaders: ['*'],
    //     },
    //   ],
    // });

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
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: isProduction 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
    });

    // Cognito User Pool Client (for web app)
    const userPoolClient = new cognito.UserPoolClient(this, 'VinventureUserPoolClient', {
      userPool,
      userPoolClientName: 'VinVenture Web Client',
      generateSecret: false, // Public client for SPA
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
          // CloudFront URL will be added after distribution is created
        ],
        logoutUrls: [
          'http://localhost:3000/',
          // CloudFront URL will be added after distribution is created
        ],
      },
      refreshTokenValidity: cdk.Duration.days(30),
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
    });

    // Cognito Identity Pool (for AWS resource access)
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

    // IAM roles for authenticated users
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
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonCognitoPowerUser'),
      ],
    });

    // Attach the role to the identity pool
    new cognito.CfnIdentityPoolRoleAttachment(this, 'VinventureIdentityPoolRoleAttachment', {
      identityPoolId: identityPool.ref,
      roles: {
        authenticated: authenticatedRole.roleArn,
      },
    });

    // Website hosting using AWS Solutions Constructs
    const website = new CloudFrontToS3(this, 'VinventureWebsite', {
      cloudFrontDistributionProps: {
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
      },
      insertHttpSecurityHeaders: false,
    });

    // Get references to the created resources
    const websiteBucket = website.s3Bucket!;
    const distribution = website.cloudFrontWebDistribution;

    // Lambda Layer for shared dependencies (will be added later)
    // const dependenciesLayer = new lambda.LayerVersion(this, 'VinventureDependenciesLayer', {
    //   code: lambda.Code.fromAsset('lambda-layers/dependencies'),
    //   compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
    //   description: 'Shared dependencies for VinVenture Lambda functions',
    // });

    // Shared Lambda execution role
    const lambdaRole = new iam.Role(this, 'VinventureLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Grant permissions
    databaseSecret.grantRead(lambdaRole);
    // Remove Firebase permissions as we're switching to Cognito
    // mediaBucket.grantReadWrite(lambdaRole);

    // Environment variables for Lambda functions
    const lambdaEnvironment = {
      NODE_ENV: isProduction ? 'production' : 'development',
      ENVIRONMENT: environment,
      DATABASE_SECRET_ARN: databaseSecret.secretArn,
      // AWS Cognito configuration
      COGNITO_USER_POOL_ID: userPool.userPoolId,
      COGNITO_USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      COGNITO_IDENTITY_POOL_ID: identityPool.ref,
      COGNITO_REGION: this.region,
      // MEDIA_BUCKET_NAME: mediaBucket.bucketName,
    };

    // API Lambda Function (handles all API routes)
    const apiFunction = new lambda.Function(this, 'VinventureApiFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('../../lambda'),
      handler: 'api-handler.handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: isProduction ? 1024 : 512,
      environment: lambdaEnvironment,
      role: lambdaRole,
      // No VPC for better cold start performance
      vpc: undefined,
    });

    // TODO: Add SSR Lambda function later for SEO optimization
    // Will be needed for:
    // - Individual winery pages (SEO)
    // - Landing page (fast loading + SEO)
    // - Public listings (search engine indexing)
    //
    // Implementation notes:
    // - Use Next.js serverless build
    // - Package with lambda-adapter.js
    // - Add CloudFront behavior for dynamic routes

    // Image Processing Lambda Function
    const imageProcessorFunction = new lambda.Function(
      this,
      'VinventureImageProcessor',
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Image processing event:', JSON.stringify(event));
          return { statusCode: 200, body: 'Image processed!' };
        };
      `),
        handler: 'index.handler',
        timeout: cdk.Duration.minutes(5),
        memorySize: 1024,
        environment: {
          // MEDIA_BUCKET_NAME: mediaBucket.bucketName,
        },
        role: lambdaRole,
      }
    );

    // S3 trigger for image processing
    // mediaBucket.addEventNotification(
    //   s3.EventType.OBJECT_CREATED,
    //   new s3notifications.LambdaDestination(imageProcessorFunction),
    //   { prefix: 'uploads/', suffix: '.jpg' }
    // );
    // mediaBucket.addEventNotification(
    //   s3.EventType.OBJECT_CREATED,
    //   new s3notifications.LambdaDestination(imageProcessorFunction),
    //   { prefix: 'uploads/', suffix: '.png' }
    // );

    // Lambda functions are VPC-less, will use Data API to connect to Aurora

    // API Gateway
    const api = new apigateway.RestApi(this, 'VinventureApi', {
      restApiName: 'VinVenture API',
      description: 'API for VinVenture wine booking platform',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
      },
    });

    // API routes
    const apiIntegration = new apigateway.LambdaIntegration(apiFunction);
    const apiResource = api.root.addResource('api');
    apiResource.addProxy({
      defaultIntegration: apiIntegration,
      anyMethod: true,
    });

    // TODO: Add SSR routes here when implementing server-side rendering
    // api.root.addProxy({
    //   defaultIntegration: ssrIntegration,
    //   anyMethod: false,
    // });

    // Deploy HTML pages with no cache
    new s3deploy.BucketDeployment(this, 'VinventureHtmlPages', {
      sources: [s3deploy.Source.asset('../../dist/apps/web')],
      destinationBucket: websiteBucket,
      cacheControl: [
        s3deploy.CacheControl.fromString('public, max-age=0, must-revalidate'), // HTML files
      ],
    });

    // Add additional CloudFront behaviors for API and media
    distribution.addBehavior('/api/*', new origins.RestApiOrigin(api), {
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
    });

    // Add behavior for media uploads from separate S3 bucket
    // distribution.addBehavior('/media/*', new origins.S3Origin(mediaBucket), {
    //   viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    //   cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
    //   compress: true,
    // });

    // CloudWatch Log Groups with retention
    new logs.LogGroup(this, 'ApiLogGroup', {
      logGroupName: `/aws/lambda/${apiFunction.functionName}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // TODO: Add SSR log group when implementing SSR
    // new logs.LogGroup(this, 'SSRLogGroup', {
    //   logGroupName: `/aws/lambda/${ssrFunction.functionName}`,
    //   retention: logs.RetentionDays.ONE_WEEK,
    //   removalPolicy: cdk.RemovalPolicy.DESTROY,
    // });

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

    // new cdk.CfnOutput(this, 'MediaBucketName', {
    //   value: mediaBucket.bucketName,
    //   description: 'S3 bucket for media storage',
    // });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: databaseSecret.secretArn,
      description: 'Database credentials secret ARN',
    });

    // AWS Cognito outputs for frontend configuration
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

    // TODO: Add SSR Lambda ARN output when implementing SSR
    // new cdk.CfnOutput(this, 'SSRLambdaArn', {
    //   value: ssrFunction.functionArn,
    //   description: 'SSR Lambda function ARN',
    // });
  }
}
