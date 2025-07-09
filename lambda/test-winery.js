// Test script for winery endpoints
const { handler } = require('./api-handler');

// Mock environment variables
process.env.AWS_REGION = 'us-east-1';
process.env.COGNITO_USER_POOL_ID = 'us-east-1_XXXXXXXXX';
process.env.COGNITO_CLIENT_ID = 'XXXXXXXXXXXXXXXXXXXXXXXXXX';
process.env.DB_CLUSTER_ARN = 'arn:aws:rds:us-east-1:XXXXXXXXXXXX:cluster:vinventure-db';
process.env.DB_SECRET_ARN = 'arn:aws:secretsmanager:us-east-1:XXXXXXXXXXXX:secret:vinventure-db-secret';

async function testWineryEndpoints() {
  console.log('Testing winery endpoints...');
  
  // Test GET all wineries
  const getWineriesEvent = {
    httpMethod: 'GET',
    path: '/api/wineries',
    queryStringParameters: {
      page: '1',
      limit: '10',
      region: 'Napa Valley'
    },
    headers: {}
  };
  
  const getWineriesResult = await handler(getWineriesEvent);
  console.log('GET /api/wineries result:', getWineriesResult);
  
  // Test GET single winery
  const getWineryEvent = {
    httpMethod: 'GET',
    path: '/api/wineries/123',
    headers: {}
  };
  
  const getWineryResult = await handler(getWineryEvent);
  console.log('GET /api/wineries/123 result:', getWineryResult);
  
  // Test POST create winery (without auth - should fail)
  const createWineryEvent = {
    httpMethod: 'POST',
    path: '/api/wineries',
    body: JSON.stringify({
      name: 'Test Winery',
      description: 'A test winery',
      email: 'test@winery.com',
      address: '123 Wine St',
      city: 'Napa',
      region: 'Napa Valley',
      country: 'USA'
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const createWineryResult = await handler(createWineryEvent);
  console.log('POST /api/wineries result (no auth):', createWineryResult);
  
  // Test PUT update winery (without auth - should fail)
  const updateWineryEvent = {
    httpMethod: 'PUT',
    path: '/api/wineries/123',
    body: JSON.stringify({
      name: 'Updated Winery Name'
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const updateWineryResult = await handler(updateWineryEvent);
  console.log('PUT /api/wineries/123 result (no auth):', updateWineryResult);
  
  // Test DELETE winery (without auth - should fail)
  const deleteWineryEvent = {
    httpMethod: 'DELETE',
    path: '/api/wineries/123',
    headers: {}
  };
  
  const deleteWineryResult = await handler(deleteWineryEvent);
  console.log('DELETE /api/wineries/123 result (no auth):', deleteWineryResult);
}

// Run tests
if (require.main === module) {
  testWineryEndpoints().catch(console.error);
}

module.exports = { testWineryEndpoints };