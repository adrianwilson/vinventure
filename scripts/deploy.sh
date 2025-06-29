#!/bin/bash

# VinVenture AWS Deployment Script
set -e

# Configuration
ENVIRONMENT=${1:-dev}
AWS_REGION=${AWS_REGION:-us-east-1}
ECR_REGISTRY=""
REPOSITORY_NAME="vinventure-app"

echo "🚀 Starting VinVenture deployment for environment: $ENVIRONMENT"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "📦 Building and deploying to AWS Account: $AWS_ACCOUNT_ID"
echo "🌍 Region: $AWS_REGION"
echo "🏷️  Environment: $ENVIRONMENT"

# Step 1: Deploy CDK Infrastructure
echo "🏗️  Deploying infrastructure..."

echo "📥 Installing CDK dependencies..."
npm install --prefix apps/infrastructure

echo "📥 Installing app dependencies..."
npm install --prefix apps/web

echo "🔨 Building web application..."
npm run build --prefix apps/web

# Bootstrap CDK if needed
if ! aws cloudformation describe-stacks --stack-name CDKToolkit > /dev/null 2>&1; then
    echo "🔧 Bootstrapping CDK..."
    npx cdk bootstrap
fi

# Deploy the stack
echo "🚀 Deploying VinVenture Lambda stack..."
cd apps/infrastructure
npx cdk deploy VinventureLambdaStack --context environment=$ENVIRONMENT --require-approval never

# Lambda functions are deployed automatically with CDK
echo "✅ Lambda functions deployed successfully!"

cd ../..

# Step 4: Run Database Migrations
echo "🗄️  Running database migrations..."

# Get database connection details from secrets
DB_SECRET_ARN=$(aws cloudformation describe-stacks \
    --stack-name VinventureLambdaStack \
    --query 'Stacks[0].Outputs[?OutputKey==`DatabaseSecretArn`].OutputValue' \
    --output text)

if [ ! -z "$DB_SECRET_ARN" ]; then
    echo "📊 Database migrations would be run here..."
    echo "💡 Use: npx prisma migrate deploy"
    echo "🔗 Database secret: $DB_SECRET_ARN"
fi

# Step 5: Display deployment information
echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Get and display all CDK outputs
aws cloudformation describe-stacks \
    --stack-name VinventureLambdaStack \
    --query 'Stacks[0].Outputs[].[OutputKey,OutputValue,Description]' \
    --output table

echo ""
echo "🌐 Your VinVenture application is now deployed!"
echo "📖 Next steps:"
echo "   1. Update your Firebase configuration in AWS Secrets Manager"
echo "   2. Configure your custom domain (if applicable)"
echo "   3. Set up monitoring and alerts"
echo "   4. Run database migrations: npx prisma migrate deploy"
echo ""