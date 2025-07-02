#!/usr/bin/env node

/**
 * CLI script to manage Cognito users
 * Usage: node scripts/confirm-user.js <command> <email>
 * 
 * Commands:
 *   get <email>     - Get user information
 *   confirm <email> - Admin confirm user
 *   resend <email>  - Resend confirmation code
 */

const {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
  AdminConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

// Configuration - you can also use environment variables
const COGNITO_CONFIG = {
  userPoolId: process.env.COGNITO_USER_POOL_ID || 'ca-central-1_Z84EpCMUS',
  clientId: process.env.COGNITO_USER_POOL_CLIENT_ID || '16ccir3mongq4m7p1bh8dov16u',
  region: process.env.AWS_REGION || 'ca-central-1',
};

const client = new CognitoIdentityProviderClient({
  region: COGNITO_CONFIG.region,
});

async function getUser(email) {
  try {
    const command = new AdminGetUserCommand({
      UserPoolId: COGNITO_CONFIG.userPoolId,
      Username: email,
    });

    const response = await client.send(command);
    
    const attributes = response.UserAttributes?.reduce((acc, attr) => {
      if (attr.Name && attr.Value) {
        acc[attr.Name] = attr.Value;
      }
      return acc;
    }, {});

    console.log('\\n📧 User Information:');
    console.log('Email:', attributes.email);
    console.log('Name:', attributes.name);
    console.log('Status:', response.UserStatus);
    console.log('Enabled:', response.Enabled);
    console.log('Created:', response.UserCreateDate);
    console.log('Last Modified:', response.UserLastModifiedDate);
    
    if (response.UserStatus === 'UNCONFIRMED') {
      console.log('\\n⚠️  User is UNCONFIRMED - can use admin confirm or resend code');
    } else if (response.UserStatus === 'CONFIRMED') {
      console.log('\\n✅ User is CONFIRMED - ready to login');
    }
    
  } catch (error) {
    console.error('❌ Error getting user:', error.message);
    process.exit(1);
  }
}

async function confirmUser(email) {
  try {
    const command = new AdminConfirmSignUpCommand({
      UserPoolId: COGNITO_CONFIG.userPoolId,
      Username: email,
    });

    await client.send(command);
    console.log(`✅ User ${email} has been confirmed by admin`);
    
    // Show updated user info
    await getUser(email);
    
  } catch (error) {
    console.error('❌ Error confirming user:', error.message);
    process.exit(1);
  }
}

async function resendCode(email) {
  try {
    const command = new ResendConfirmationCodeCommand({
      ClientId: COGNITO_CONFIG.clientId,
      Username: email,
    });

    await client.send(command);
    console.log(`📨 Confirmation code resent to ${email}`);
    
  } catch (error) {
    console.error('❌ Error resending code:', error.message);
    process.exit(1);
  }
}

function showUsage() {
  console.log(`
🔧 Cognito User Management CLI

Usage: node scripts/confirm-user.js <command> <email>

Commands:
  get <email>       Get user information and status
  confirm <email>   Admin confirm user (bypasses email verification)
  resend <email>    Resend confirmation code to user's email

Examples:
  node scripts/confirm-user.js get user@example.com
  node scripts/confirm-user.js confirm user@example.com
  node scripts/confirm-user.js resend user@example.com

Environment Variables:
  COGNITO_USER_POOL_ID     User Pool ID (default: ca-central-1_Z84EpCMUS)
  COGNITO_USER_POOL_CLIENT_ID  Client ID (default: 16ccir3mongq4m7p1bh8dov16u)
  AWS_REGION               AWS Region (default: ca-central-1)
`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    showUsage();
    process.exit(1);
  }

  const [command, email] = args;

  if (!email || !email.includes('@')) {
    console.error('❌ Please provide a valid email address');
    process.exit(1);
  }

  console.log(`🚀 Running command: ${command} for user: ${email}`);
  console.log(`🔗 User Pool: ${COGNITO_CONFIG.userPoolId}`);
  console.log(`🌍 Region: ${COGNITO_CONFIG.region}`);

  switch (command.toLowerCase()) {
    case 'get':
    case 'info':
      await getUser(email);
      break;
      
    case 'confirm':
    case 'approve':
      await confirmUser(email);
      break;
      
    case 'resend':
    case 'send':
      await resendCode(email);
      break;
      
    default:
      console.error(`❌ Unknown command: ${command}`);
      showUsage();
      process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
}