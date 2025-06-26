# VinVenture AWS Deployment Guide

This guide covers deploying VinVenture to AWS using CDK (Cloud Development Kit) with a production-ready architecture.

## Architecture Overview

The deployment creates:

- **ECS Fargate**: Containerized Next.js application
- **RDS PostgreSQL**: Database with automated backups
- **CloudFront**: Global CDN with optimized caching
- **S3**: Media storage with lifecycle policies
- **Secrets Manager**: Secure credential storage
- **VPC**: Private networking with NAT gateways
- **Application Load Balancer**: SSL termination and health checks

## Prerequisites

1. **AWS CLI configured**:
   ```bash
   aws configure
   ```

2. **Docker installed** for container builds

3. **Node.js dependencies installed**:
   ```bash
   npm install
   ```

4. **Firebase project created** (for authentication)

## Quick Deployment

### Development Environment
```bash
npm run deploy:dev
```

### Production Environment
```bash
npm run deploy:prod
```

## Manual Deployment Steps

### 1. Infrastructure Deployment

```bash
# Navigate to infrastructure directory
cd apps/infrastructure

# Install CDK dependencies
npm install

# Bootstrap CDK (first time only)
npx cdk bootstrap

# Deploy infrastructure
npx cdk deploy VinventureStack --context environment=dev
```

### 2. Configure Secrets

After infrastructure deployment, update the secrets in AWS Secrets Manager:

```bash
# Get secret ARNs from CDK outputs
aws cloudformation describe-stacks --stack-name VinventureStack

# Update Firebase secret
aws secretsmanager update-secret \
  --secret-id "arn:aws:secretsmanager:..." \
  --secret-string '{
    "projectId": "your-firebase-project-id",
    "clientEmail": "firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com",
    "privateKey": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
  }'
```

### 3. Build and Deploy Application

```bash
# Build Docker image
docker build -t vinventure-app -f apps/Dockerfile .

# Get ECR login
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag and push image
docker tag vinventure-app:latest <ecr-uri>:latest
docker push <ecr-uri>:latest

# Update ECS service
aws ecs update-service --cluster <cluster-name> --service <service-name> --force-new-deployment
```

### 4. Database Migrations

```bash
# Set DATABASE_URL from secrets manager
export DATABASE_URL="postgresql://username:password@endpoint:5432/vinventure"

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

## Environment Configuration

### Development
- Single AZ deployment
- t3.micro RDS instance
- 1 ECS task
- Basic monitoring

### Production
- Multi-AZ deployment
- t3.small RDS instance
- 2+ ECS tasks
- Enhanced monitoring
- Performance Insights
- Deletion protection

## Monitoring and Logging

### CloudWatch Logs
- ECS task logs: `/aws/ecs/vinventure`
- Application logs: Available in ECS console

### Metrics
- ECS service metrics
- RDS performance metrics
- CloudFront analytics
- Custom application metrics

### Alarms
Set up CloudWatch alarms for:
- ECS service health
- Database connections
- Error rates
- Response times

## Scaling

### Auto Scaling
The ECS service includes auto-scaling based on:
- CPU utilization (target: 70%)
- Memory utilization (target: 80%)
- Request count

### Database Scaling
- Read replicas for read-heavy workloads
- Vertical scaling by instance type
- Connection pooling

## Security Features

### Network Security
- Private subnets for database
- Security groups with minimal access
- VPC endpoints for AWS services

### Data Security
- Encryption at rest (RDS, S3)
- Encryption in transit (HTTPS/TLS)
- Secrets Manager for credentials
- IAM roles with least privilege

### Application Security
- Security headers via CloudFront
- WAF rules (optional)
- Regular security updates

## Cost Optimization

### Development Environment
- ~$30-50/month for basic setup
- Single AZ, smaller instances
- Reduced backup retention

### Production Environment
- ~$100-200/month depending on usage
- Multi-AZ, larger instances
- Extended backup retention
- Enhanced monitoring

### Cost-Saving Tips
1. Use Spot instances for non-critical workloads
2. Schedule non-production environments
3. Optimize CloudFront caching
4. Monitor S3 storage classes
5. Regular cost reviews

## Troubleshooting

### Common Issues

1. **ECS tasks failing to start**
   - Check CloudWatch logs
   - Verify environment variables
   - Ensure secrets are accessible

2. **Database connection issues**
   - Verify security group rules
   - Check VPC configuration
   - Validate connection string

3. **Image build failures**
   - Check Dockerfile syntax
   - Verify build context
   - Ensure dependencies are available

### Debug Commands

```bash
# Check ECS service status
aws ecs describe-services --cluster <cluster> --services <service>

# View task logs
aws logs get-log-events --log-group-name /aws/ecs/vinventure --log-stream-name <stream>

# Test database connectivity
aws rds describe-db-instances --db-instance-identifier <instance-id>

# Check secrets
aws secretsmanager get-secret-value --secret-id <secret-arn>
```

## Backup and Recovery

### Database Backups
- Automated daily backups
- Point-in-time recovery
- Cross-region backup copying (production)

### Application Backups
- ECR image versioning
- Infrastructure as code (CDK)
- Configuration in version control

### Disaster Recovery
1. Database restoration from backup
2. ECS service recreation
3. DNS failover (if using Route 53)
4. Data replication strategies

## Maintenance

### Regular Tasks
- OS and package updates via new container builds
- Database maintenance windows
- Certificate renewals (automated)
- Security patch deployment

### Monitoring Tasks
- Review CloudWatch dashboards
- Check cost reports
- Security audit logs
- Performance optimization

## Support

For deployment issues:
1. Check CloudWatch logs
2. Review CDK stack events
3. Validate AWS service quotas
4. Contact AWS support if needed

## Next Steps

After successful deployment:
1. Set up custom domain with Route 53
2. Configure monitoring alerts
3. Implement CI/CD pipeline
4. Set up staging environment
5. Configure backup testing