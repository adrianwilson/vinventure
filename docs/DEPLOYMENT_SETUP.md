# VinVenture Deployment Setup Guide

This guide will help you set up automated deployments for VinVenture using AWS CDK and GitHub Actions.

## 🏗️ Architecture Overview

- **Infrastructure**: AWS CDK (TypeScript)
- **Frontend**: Next.js → S3 + CloudFront
- **Backend**: NestJS → Lambda + API Gateway
- **Database**: Aurora Serverless v2 (PostgreSQL)
- **Authentication**: AWS Cognito
- **Payments**: Stripe
- **CI/CD**: GitHub Actions

## 🚀 Quick Start

### 1. Prerequisites

- AWS Account with appropriate permissions
- GitHub repository
- Node.js 18+
- AWS CLI configured
- CDK CLI installed globally

```bash
npm install -g aws-cdk
```

### 2. Deploy Infrastructure

```bash
# Navigate to infrastructure directory
cd apps/infrastructure

# Install dependencies
pnpm install

# Bootstrap CDK (one-time setup)
npx cdk bootstrap

# Deploy staging environment
npx cdk deploy VinventureStack-Staging \
  --context environment=staging \
  --outputs-file cdk-outputs-staging.json

# Deploy production environment (optional)
npx cdk deploy VinventureStack-Production \
  --context environment=production \
  --outputs-file cdk-outputs-production.json
```

### 3. Extract GitHub Secrets

```bash
# Run the secret extraction script
node scripts/extract-github-secrets.js
```

This will show you exactly what secrets to configure in GitHub.

### 4. Configure GitHub

1. **Go to your GitHub repository**
2. **Settings** → **Secrets and variables** → **Actions**
3. **Add the following secrets** (from the script output):

#### Required AWS Secrets:
```
AWS_ACCESS_KEY_ID=<your-aws-access-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>
AWS_REGION=ca-central-1
```

#### Cognito Secrets (from CDK outputs):
```
NEXT_PUBLIC_COGNITO_USER_POOL_ID=<from-cdk-output>
NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=<from-cdk-output>
```

#### Stripe Secrets:
```
STRIPE_TEST_SECRET_KEY=sk_test_...
STRIPE_TEST_PUBLISHABLE_KEY=pk_test_...
STRIPE_TEST_WEBHOOK_SECRET=whsec_...
STRIPE_LIVE_SECRET_KEY=sk_live_...
STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_...
STRIPE_LIVE_WEBHOOK_SECRET=whsec_...
```

### 5. Create GitHub Environments

1. **Go to Settings** → **Environments**
2. **Create "staging" environment**:
   - No protection rules needed
3. **Create "production" environment**:
   - ✅ Required reviewers
   - ✅ Wait timer (optional)
   - ✅ Deployment branches: only "main"

### 6. Test Deployment

```bash
# Test staging deployment (create a pull request)
git checkout -b feature/test-deployment
git push origin feature/test-deployment
# Create PR to main branch - this triggers staging deployment

# Test production deployment  
git checkout main
git push origin main
```

## 📋 Workflow Details

### Available Workflows

1. **`ci.yml`** - Main CI/CD pipeline
   - Builds frontend and backend
   - Runs security scans
   - Deploys to staging on PR, production on merge
   - Intelligent change detection

2. **`app-deploy.yml`** - Alternative application deployment
   - CDK-based deployment approach
   - Environment-specific builds

3. **`cdk-deploy.yml`** - Infrastructure-only deployment
   - CDK diff on PRs
   - Deploy infrastructure changes
   - Manual destroy capability

3. **`dependabot-auto-merge.yml`** - Dependency management
   - Auto-merge safe updates
   - Smart decision making

4. **`pr-checks.yml`** - Pull request validation
   - Code quality checks
   - Security scanning
   - Bundle size analysis

5. **`security-scan.yml`** - Comprehensive security
   - Daily security scans
   - Multiple vulnerability scanners
   - Automated reporting

### Deployment Triggers

- **Pull Request to `main`** → Deploy to staging (preview environment)
- **Push to `main`** → Deploy to production
- **Pull Request** → Run tests and security scans
- **Manual trigger** → Deploy specific environment

## 🔧 Configuration Options

### Environment Variables

You can customize deployment by setting these environment variables:

```bash
# AWS Configuration
AWS_REGION=ca-central-1
CDK_DEFAULT_ACCOUNT=123456789012

# Environment Selection
ENVIRONMENT=staging  # or production

# Stripe Configuration
STRIPE_TEST_SECRET_KEY=sk_test_...
STRIPE_LIVE_SECRET_KEY=sk_live_...
```

### CDK Context Values

```bash
# Deploy with custom context
npx cdk deploy --context environment=staging
npx cdk deploy --context environment=production
```

## 📊 Monitoring and Maintenance

### Viewing Deployments

1. **GitHub Actions**: Check the Actions tab for deployment status
2. **AWS Console**: View CloudFormation stacks, Lambda functions, etc.
3. **CDK Outputs**: Check `cdk-outputs-*.json` files for URLs and ARNs

### Troubleshooting

#### Common Issues:

1. **CDK Bootstrap Required**:
   ```bash
   npx cdk bootstrap aws://ACCOUNT/REGION
   ```

2. **Permission Errors**:
   - Ensure your AWS credentials have sufficient permissions
   - Check IAM policies for CDK deployment

3. **Secrets Not Configured**:
   - Verify all GitHub secrets are set correctly
   - Check environment variable names match exactly

4. **Build Failures**:
   - Check Node.js version (must be 18+)
   - Verify pnpm is working correctly
   - Review build logs in GitHub Actions

### Updates and Maintenance

- **Dependencies**: Dependabot will automatically create PRs for updates
- **Security**: Daily security scans will create issues if vulnerabilities found
- **Infrastructure**: CDK changes can be previewed in PRs before deployment

## 🛡️ Security Best Practices

1. **Secrets Management**:
   - Never commit secrets to version control
   - Use GitHub Secrets for sensitive values
   - Rotate credentials regularly

2. **Environment Protection**:
   - Production requires manual approval
   - Limit deployment permissions
   - Monitor access logs

3. **Automated Scanning**:
   - Security scans on every PR
   - Dependency vulnerability checks
   - Infrastructure compliance scanning

## 🚀 Advanced Features

### Custom Domains

To use custom domains, update the CDK stack:

```typescript
// In vinventure-lambda-stack.ts
domainName: 'app.vinventure.com',
certificateArn: 'arn:aws:acm:...',
```

### Multiple Environments

You can create additional environments:

```bash
# Deploy to custom environment
npx cdk deploy VinventureStack-Demo \
  --context environment=demo
```

### Manual Deployments

Use the workflow dispatch feature:

1. Go to **Actions** → **CDK Infrastructure Deployment**
2. Click **Run workflow**
3. Select environment and options
4. Click **Run workflow**

## 📞 Support

If you encounter issues:

1. Check the GitHub Actions logs for detailed error messages
2. Review the CDK CloudFormation events in AWS Console
3. Verify all prerequisites are met
4. Check AWS service limits and quotas

---

**Next Steps**: After completing this setup, your VinVenture application will have fully automated CI/CD with proper security, monitoring, and multi-environment support!