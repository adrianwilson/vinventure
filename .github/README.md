# GitHub Actions CI/CD Setup for VinVenture

This directory contains the complete CI/CD pipeline setup for the VinVenture project, including automated testing, security scanning, and deployment workflows.

## 📋 Overview

The CI/CD setup includes:

- **Continuous Integration**: Automated testing and building for both frontend and backend
- **Security Scanning**: Comprehensive security analysis including dependencies, secrets, and code
- **Automated Deployment**: Deploy to staging and production environments
- **Dependency Management**: Automated dependency updates with Dependabot
- **Pull Request Validation**: Quality checks and validation for all PRs

## 🔧 Workflows

### 1. CI/CD Pipeline (`ci.yml`)

The main workflow that handles:
- **Change Detection**: Only runs relevant jobs based on changed files
- **Frontend CI**: Next.js app testing, linting, type-checking, and building
- **Backend CI**: NestJS Lambda testing, building, and database migrations  
- **Security Scanning**: Vulnerability scanning with Trivy and audit checks
- **Deployment**: Automated deployment to staging (develop) and production (main)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests targeting `main` or `develop`

### 2. Pull Request Validation (`pr-checks.yml`)

Comprehensive PR validation including:
- **Format Validation**: Ensures PR titles follow semantic conventions
- **Code Quality**: Prettier, linting, and code quality checks
- **Security Checks**: Secret scanning and vulnerability detection
- **Bundle Size**: Frontend bundle size analysis
- **Performance**: Dependency size analysis

**Triggers:**
- Pull request events (opened, synchronize, reopened, ready_for_review)

### 3. Security Scanning (`security-scan.yml`)

Daily security scans and on-demand security analysis:
- **Dependency Scanning**: OSV Scanner, Trivy, Snyk
- **Static Analysis**: CodeQL, ESLint security rules, Semgrep
- **Secrets Detection**: TruffleHog, GitLeaks, detect-secrets
- **Infrastructure Security**: Checkov for CDK/Terraform
- **License Compliance**: License compatibility checking

**Triggers:**
- Daily schedule at 2 AM UTC
- Push to main/develop branches
- Manual workflow dispatch

### 4. Dependabot Auto-Merge (`dependabot-auto-merge.yml`)

Automated dependency updates with intelligent merging:
- **Safe Updates**: Auto-merge patch updates and dev dependency minor updates
- **Security Updates**: Auto-merge security-related updates
- **Quality Checks**: Waits for CI checks before merging
- **Manual Review**: Flags major updates for manual review

**Triggers:**
- Dependabot pull requests

## 🔐 Required Secrets

Configure these secrets in your GitHub repository settings:

### AWS Deployment
```bash
AWS_ACCESS_KEY_ID           # AWS access key for deployment
AWS_SECRET_ACCESS_KEY       # AWS secret key for deployment  
AWS_REGION                  # AWS region (e.g., us-west-2)
```

### Staging Environment
```bash
STAGING_S3_BUCKET                     # S3 bucket for staging frontend
STAGING_CLOUDFRONT_DISTRIBUTION_ID   # CloudFront distribution ID for staging
STAGING_LAMBDA_FUNCTION_NAME          # Lambda function name for staging API
```

### Production Environment  
```bash
PRODUCTION_S3_BUCKET                     # S3 bucket for production frontend
PRODUCTION_CLOUDFRONT_DISTRIBUTION_ID   # CloudFront distribution ID for production
PRODUCTION_LAMBDA_FUNCTION_NAME          # Lambda function name for production API
PRODUCTION_DATABASE_URL                  # Production database connection string
```

### Security Scanning (Optional)
```bash
SNYK_TOKEN              # Snyk API token for vulnerability scanning
FOSSA_API_KEY          # FOSSA API key for license scanning
GITLEAKS_LICENSE       # GitLeaks license key (if using pro version)
```

## 🛠️ Configuration Files

### CodeQL Configuration (`.github/codeql-config.yml`)
Configures static analysis scanning with:
- Security and quality query packs
- Path exclusions for generated/build files
- Enhanced security scanning rules

### Dependabot Configuration (`.github/dependabot.yml`)
Manages automated dependency updates:
- Separate configs for root, web, lambda, and infrastructure
- Grouped updates for related packages
- Weekly update schedule with team assignment

## 📊 Environments

Create these environments in GitHub repository settings:

### Staging Environment
- **Name**: `staging`
- **URL**: `https://staging.vinventure.app`
- **Protection Rules**: Require passing CI checks
- **Deployment Branch**: `develop`

### Production Environment
- **Name**: `production`  
- **URL**: `https://vinventure.app`
- **Protection Rules**: 
  - Require passing CI checks
  - Require security scan success
  - Optional: Require manual approval

## 🏷️ Labels

The workflows use these labels (create them in your repository):

```bash
# Dependency Management
dependencies        # All dependency-related PRs
auto-merge         # PRs approved for auto-merging
needs-review       # PRs requiring manual review

# Package Ecosystems  
npm                # npm/pnpm dependency updates
github-actions     # GitHub Actions updates

# Components
frontend           # Frontend-related changes
backend            # Backend-related changes
infrastructure     # Infrastructure changes

# Security
security           # Security-related issues/PRs
automated          # Automated security reports
```

## 🚀 Getting Started

1. **Set up secrets**: Add all required secrets to your GitHub repository
2. **Create environments**: Set up staging and production environments
3. **Create labels**: Add the required labels to your repository
4. **Test workflows**: Push changes to trigger the workflows
5. **Monitor**: Check the Actions tab for workflow results

## 📝 Customization

### Modify Node.js Version
Update the `NODE_VERSION` environment variable in workflow files:
```yaml
env:
  NODE_VERSION: '18'  # Change to your desired version
```

### Adjust Security Thresholds
Modify audit levels in security scanning:
```yaml
- name: Run Security Audit
  run: pnpm audit --audit-level moderate  # Change to: low, moderate, high, critical
```

### Change Deployment Conditions
Modify deployment triggers in `ci.yml`:
```yaml
if: github.ref == 'refs/heads/develop'  # Change branch as needed
```

## 🐛 Troubleshooting

### Common Issues

1. **Build Failures**: Check Node.js version compatibility
2. **Secret Errors**: Verify all required secrets are configured
3. **Permission Errors**: Ensure GitHub token has necessary permissions
4. **Deployment Failures**: Verify AWS credentials and resource names

### Debug Mode

Enable debug logging by adding to workflow files:
```yaml
env:
  ACTIONS_STEP_DEBUG: true
  ACTIONS_RUNNER_DEBUG: true
```

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS CDK Actions](https://github.com/aws-actions)
- [Security Scanning Tools](https://github.com/analysis-tools-dev/static-analysis)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [NestJS Deployment](https://docs.nestjs.com/techniques/performance)

## 🤝 Contributing

When contributing to the CI/CD setup:

1. Test workflow changes in a fork first
2. Use semantic commit messages for workflow changes
3. Update this documentation when adding new features
4. Consider backwards compatibility when modifying existing workflows

---

*This CI/CD setup follows GitHub Actions best practices and is designed for scalability and security.*