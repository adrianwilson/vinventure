import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

export class VinventureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC for secure networking
    const vpc = new ec2.Vpc(this, 'VinventureVpc', {
      maxAzs: 2,
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
      ],
    });

    // RDS PostgreSQL Database
    const database = new rds.DatabaseInstance(this, 'VinventureDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_3,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      credentials: rds.Credentials.fromGeneratedSecret('vinventure-db-admin'),
      databaseName: 'vinventure',
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false, // Set to true for production
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change for production
    });

    // S3 Bucket for media storage
    const mediaBucket = new s3.Bucket(this, 'VinventureMediaBucket', {
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change for production
    });

    // CloudFront distribution for media
    const distribution = new cloudfront.Distribution(this, 'VinventureDistribution', {
      defaultBehavior: {
        origin: new cloudfront.S3Origin(mediaBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
    });

    // Lambda function for API
    const apiLambda = new lambda.Function(this, 'VinventureApiLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'index.handler',
      environment: {
        DATABASE_URL: `postgresql://vinventure-db-admin:${database.secret?.secretValueFromJson('password')}@${database.instanceEndpoint.hostname}:${database.instanceEndpoint.port}/vinventure`,
        MEDIA_BUCKET: mediaBucket.bucketName,
        CLOUDFRONT_DOMAIN: distribution.distributionDomainName,
      },
      vpc,
    });

    // Allow Lambda to access RDS
    database.connections.allowFrom(apiLambda, ec2.Port.tcp(5432));

    // Allow Lambda to access S3
    mediaBucket.grantReadWrite(apiLambda);

    // API Gateway
    const api = new apigateway.RestApi(this, 'VinventureApi', {
      restApiName: 'Vinventure Service',
      description: 'API for Vinventure wine booking platform',
    });

    const integration = new apigateway.LambdaIntegration(apiLambda);
    api.root.addProxy({
      defaultIntegration: integration,
    });

    // Outputs
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
    });

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
    });

    new cdk.CfnOutput(this, 'MediaBucketName', {
      value: mediaBucket.bucketName,
    });

    new cdk.CfnOutput(this, 'CloudFrontDomain', {
      value: distribution.distributionDomainName,
    });
  }
}