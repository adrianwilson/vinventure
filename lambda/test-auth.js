// Test script for authentication endpoints
// This is a simple test to validate the authentication flow

const testEvent = {
  httpMethod: 'POST',
  path: '/api/auth/login',
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'testpass123'
  }),
  headers: {
    'Content-Type': 'application/json'
  }
};

// Mock environment variables for testing
process.env.AWS_REGION = 'us-east-1';
process.env.COGNITO_USER_POOL_ID = 'us-east-1_XXXXXXXXX';
process.env.COGNITO_CLIENT_ID = 'XXXXXXXXXXXXXXXXXXXXXXXXXX';
process.env.DB_CLUSTER_ARN = 'arn:aws:rds:us-east-1:XXXXXXXXXXXX:cluster:vinventure-db';
process.env.DB_SECRET_ARN = 'arn:aws:secretsmanager:us-east-1:XXXXXXXXXXXX:secret:vinventure-db-secret';

// Test the handler
const { handler } = require('./api-handler');

async function testAuth() {
  console.log('Testing authentication endpoints...');
  
  // Test health endpoint
  const healthResult = await handler({
    httpMethod: 'GET',
    path: '/health',
    headers: {}
  });
  
  console.log('Health check result:', healthResult);
  
  // Test authentication structure (won't work without real AWS credentials)
  const authResult = await handler(testEvent);
  console.log('Auth test result:', authResult);
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAuth().catch(console.error);
}

module.exports = { testAuth };