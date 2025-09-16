#!/usr/bin/env node

/**
 * Extract GitHub Secrets from CDK Outputs
 * 
 * This script reads CDK output files and generates the GitHub secrets
 * that need to be configured for CI/CD to work properly.
 */

const fs = require('fs');
const path = require('path');

function extractSecretsFromCDKOutput(environment) {
  const outputFile = path.join(__dirname, '..', 'apps', 'infrastructure', `cdk-outputs-${environment}.json`);
  
  if (!fs.existsSync(outputFile)) {
    console.error(`❌ CDK output file not found: ${outputFile}`);
    console.log('Run CDK deploy first to generate this file:');
    console.log(`   cd apps/infrastructure`);
    console.log(`   npx cdk deploy VinventureStack-${environment.charAt(0).toUpperCase() + environment.slice(1)} --context environment=${environment} --outputs-file cdk-outputs-${environment}.json`);
    return null;
  }

  try {
    const outputs = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
    const stackName = `VinventureStack-${environment.charAt(0).toUpperCase() + environment.slice(1)}`;
    const stackOutputs = outputs[stackName];

    if (!stackOutputs) {
      console.error(`❌ No outputs found for stack: ${stackName}`);
      return null;
    }

    return {
      environment,
      outputs: stackOutputs,
    };
  } catch (error) {
    console.error(`❌ Error reading CDK output file: ${error.message}`);
    return null;
  }
}

function generateGitHubSecrets() {
  console.log('🔧 VinVenture GitHub Secrets Configuration');
  console.log('==========================================\n');

  // Extract staging outputs
  const staging = extractSecretsFromCDKOutput('staging');
  const production = extractSecretsFromCDKOutput('production');

  if (!staging && !production) {
    console.log('⚠️  No CDK outputs found. Deploy your infrastructure first.');
    return;
  }

  console.log('📋 GitHub Repository Secrets to Configure:');
  console.log('===========================================');
  console.log('Go to: GitHub Repository → Settings → Secrets and Variables → Actions\n');

  // AWS Credentials (required)
  console.log('🔐 **AWS Credentials** (Required):');
  console.log('   AWS_ACCESS_KEY_ID=<your-aws-access-key-id>');
  console.log('   AWS_SECRET_ACCESS_KEY=<your-aws-secret-access-key>');
  console.log('   AWS_REGION=ca-central-1\n');

  // Cognito (from CDK outputs)
  if (staging?.outputs || production?.outputs) {
    console.log('🔐 **Cognito Configuration** (from CDK):');
    
    const cognitoOutputs = staging?.outputs || production?.outputs;
    
    if (cognitoOutputs.CognitoUserPoolId) {
      console.log(`   NEXT_PUBLIC_COGNITO_USER_POOL_ID=${cognitoOutputs.CognitoUserPoolId}`);
    }
    
    if (cognitoOutputs.CognitoUserPoolClientId) {
      console.log(`   NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=${cognitoOutputs.CognitoUserPoolClientId}`);
    }
    
    console.log('');
  }

  // Stripe Configuration
  console.log('💳 **Stripe Configuration**:');
  console.log('   STRIPE_TEST_SECRET_KEY=sk_test_...');
  console.log('   STRIPE_TEST_PUBLISHABLE_KEY=pk_test_...');
  console.log('   STRIPE_TEST_WEBHOOK_SECRET=whsec_...');
  console.log('   STRIPE_LIVE_SECRET_KEY=sk_live_... (for production)');
  console.log('   STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_... (for production)');
  console.log('   STRIPE_LIVE_WEBHOOK_SECRET=whsec_... (for production)\n');

  // Environment URLs (from CDK outputs)
  if (staging?.outputs) {
    console.log('🌐 **Staging Environment URLs**:');
    console.log(`   Frontend: ${staging.outputs.CloudFrontUrl || 'Not deployed'}`);
    console.log(`   API: ${staging.outputs.ApiGatewayUrl || 'Not deployed'}`);
    console.log(`   Database: ${staging.outputs.DatabaseEndpoint || 'Not available'}`);
    console.log('');
  }

  if (production?.outputs) {
    console.log('🌐 **Production Environment URLs**:');
    console.log(`   Frontend: ${production.outputs.CloudFrontUrl || 'Not deployed'}`);
    console.log(`   API: ${production.outputs.ApiGatewayUrl || 'Not deployed'}`);
    console.log(`   Database: ${production.outputs.DatabaseEndpoint || 'Not available'}`);
    console.log('');
  }

  // GitHub Environment Configuration
  console.log('🏗️  **GitHub Environment Configuration**:');
  console.log('===========================================');
  console.log('Go to: GitHub Repository → Settings → Environments\n');

  console.log('1. Create "staging" environment:');
  console.log('   - No deployment protection rules needed');
  console.log('   - Add any staging-specific secrets here');
  console.log('');

  console.log('2. Create "production" environment:');
  console.log('   - ✅ Required reviewers: Add team members');
  console.log('   - ✅ Wait timer: 5 minutes (optional)');
  console.log('   - ✅ Deployment branches: Only "main" branch');
  console.log('   - Add production-specific secrets here');
  console.log('');

  // Next steps
  console.log('📝 **Next Steps**:');
  console.log('=================');
  console.log('1. Configure all the secrets above in GitHub');
  console.log('2. Set up GitHub environments with proper protection rules');
  console.log('3. Test the deployment by pushing to develop branch (staging)');
  console.log('4. Test production deployment by pushing to main branch');
  console.log('5. Monitor deployments in the GitHub Actions tab');
  console.log('');

  console.log('🚀 **Deployment Triggers**:');
  console.log('==========================');
  console.log('- Push to "develop" branch → Deploy to staging');
  console.log('- Push to "main" branch → Deploy to production');
  console.log('- Pull requests → Run tests and security scans');
  console.log('- Manual CDK deployment → Use cdk-deploy.yml workflow');
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length > 0 && ['--help', '-h'].includes(args[0])) {
    console.log('Usage: node extract-github-secrets.js');
    console.log('');
    console.log('This script reads CDK output files and shows you what GitHub secrets to configure.');
    console.log('Make sure you have deployed your CDK stack first:');
    console.log('');
    console.log('  cd apps/infrastructure');
    console.log('  npx cdk deploy VinventureStack-Staging --context environment=staging --outputs-file cdk-outputs-staging.json');
    console.log('  npx cdk deploy VinventureStack-Production --context environment=production --outputs-file cdk-outputs-production.json');
    process.exit(0);
  }

  generateGitHubSecrets();
}

module.exports = { extractSecretsFromCDKOutput, generateGitHubSecrets };