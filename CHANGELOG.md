# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0.0] - 2026-05-27

### Added
- NestJS backend with modular architecture (auth, booking, winery, experience, payment, review modules)
- Prisma ORM with PostgreSQL schema (User, Winery, Experience, Booking, Review, FavoriteWinery)
- AWS Lambda handler via serverless-express for NestJS deployment
- Stripe payment integration with webhook handling
- Cognito authentication with JWT validation and local password fallback
- Password reset flow with confirmation code UI
- Swagger API documentation at /api/docs
- Health check endpoint at /api/health
- Claude Code agent definitions for specialized development workflows

### Changed
- Migrated backend from plain JavaScript to TypeScript + NestJS
- Upgraded CDK stack: private S3 bucket with CloudFront OAC, least-privilege IAM
- Moved Stripe keys from environment variables to Secrets Manager
- Put Lambda in VPC with security group for direct Aurora TCP access
- Restricted CORS to environment-specific origins
- Added CloudFront distribution URL to Cognito OAuth callback URLs
- Upgraded Node.js from 18 (EOL) to 22 across CDK and CI workflows
- Switched CI from npm to pnpm

### Removed
- Legacy plain JavaScript Lambda handlers (api-handler.js, auth.js, booking.js, winery.js, stripe-payment.js)
- Legacy test scripts (test-auth.js, test-booking.js, test-payment.js, test-winery.js)
- Redundant pr-checks.yml and app-deploy.yml workflows
- Unconfigured security scan tools (Snyk, FOSSA, GitLeaks, Docker Scout)
- Dead/commented infrastructure code and stub image processor Lambda
- Public S3 bucket access (replaced with CloudFront OAC)
- Overpermissive AmazonCognitoPowerUser IAM policy

### Security
- S3 website bucket now uses BlockPublicAccess.BLOCK_ALL with CloudFront Origin Access Control
- Cognito authenticated role stripped of AmazonCognitoPowerUser managed policy
- Stripe secret keys moved to AWS Secrets Manager (no longer in CloudFormation templates)
- Added production deployment gate (requires AWS_ENABLED and environment protection)
- CDK bootstrap runs conditionally instead of unconditionally
