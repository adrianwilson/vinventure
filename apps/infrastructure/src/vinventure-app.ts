#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { VinventureLambdaStack } from './vinventure-lambda-stack';

const app = new cdk.App();

// Get environment from context or environment variable
const environment = app.node.tryGetContext('environment') || process.env.ENVIRONMENT || 'dev';
const region = process.env.AWS_REGION || 'ca-central-1';

// Environment-specific configuration
const envConfig = {
  dev: {
    stackName: 'VinventureStack-Dev',
    domainName: undefined, // Use CloudFront domain for dev
  },
  staging: {
    stackName: 'VinventureStack-Staging',
    domainName: 'staging.vinventure.com', // Optional: custom domain
  },
  production: {
    stackName: 'VinventureStack-Production',
    domainName: 'vinventure.com', // Optional: custom domain
  },
};

const config = envConfig[environment as keyof typeof envConfig] || envConfig.dev;

// Create the stack with environment-specific configuration
const stack = new VinventureLambdaStack(app, config.stackName, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: region,
  },
  description: `VinVenture infrastructure for ${environment} environment`,
  tags: {
    Environment: environment,
    Project: 'VinVenture',
    ManagedBy: 'CDK',
  },
});

// Add environment-specific tags
cdk.Tags.of(stack).add('Environment', environment);
cdk.Tags.of(stack).add('Project', 'VinVenture');
cdk.Tags.of(stack).add('ManagedBy', 'AWS CDK');

app.synth();