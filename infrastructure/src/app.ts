#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VinventureLambdaStack } from './vinventure-lambda-stack';

const app = new cdk.App();
new VinventureLambdaStack(app, 'VinventureLambdaStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});