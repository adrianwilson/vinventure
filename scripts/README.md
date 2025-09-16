# VinVenture Scripts Directory

This directory contains utility scripts for the VinVenture project.

## Available Scripts

### `extract-github-secrets.js`
**Purpose**: Extract GitHub secrets configuration from CDK outputs

**Usage**:
```bash
node scripts/extract-github-secrets.js
```

**Description**: 
- Reads CDK output files (`cdk-outputs-staging.json`, `cdk-outputs-production.json`)
- Generates the exact GitHub secrets you need to configure
- Shows step-by-step setup instructions
- Displays environment URLs and configuration

**Prerequisites**: Deploy CDK stack first to generate output files

**Reason**: This script was creating AWS resources manually, which conflicts with our CDK Infrastructure-as-Code approach. All AWS infrastructure is now managed through:
- `apps/infrastructure/` - CDK stack definitions
- GitHub Actions workflows for automated deployment

## Usage Instructions

### For GitHub Secrets Setup:
1. Deploy your CDK stack first:
   ```bash
   cd apps/infrastructure
   npx cdk deploy VinventureStack-Staging --context environment=staging --outputs-file cdk-outputs-staging.json
   ```

2. Extract secrets:
   ```bash
   node scripts/extract-github-secrets.js
   ```

3. Follow the output instructions to configure GitHub repository secrets

### For Infrastructure Management:
- Use CDK commands in `apps/infrastructure/`
- Use GitHub Actions workflows for automated deployment
- Never use manual AWS CLI commands for infrastructure

## Best Practices

- ✅ **Use CDK** for all infrastructure management
- ✅ **Use GitHub Actions** for automated deployments  
- ✅ **Use these scripts** for configuration assistance
- ❌ **Don't use manual AWS setup scripts**
- ❌ **Don't create AWS resources outside of CDK**