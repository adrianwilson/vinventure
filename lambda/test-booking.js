// Test script for booking endpoints
const { handler } = require('./api-handler');

// Mock environment variables
process.env.AWS_REGION = 'us-east-1';
process.env.COGNITO_USER_POOL_ID = 'us-east-1_XXXXXXXXX';
process.env.COGNITO_CLIENT_ID = 'XXXXXXXXXXXXXXXXXXXXXXXXXX';
process.env.DB_CLUSTER_ARN = 'arn:aws:rds:us-east-1:XXXXXXXXXXXX:cluster:vinventure-db';
process.env.DB_SECRET_ARN = 'arn:aws:secretsmanager:us-east-1:XXXXXXXXXXXX:secret:vinventure-db-secret';

async function testBookingEndpoints() {
  console.log('Testing booking endpoints...');
  
  // Test availability check (public endpoint)
  const availabilityEvent = {
    httpMethod: 'GET',
    path: '/api/availability',
    queryStringParameters: {
      experienceId: 'exp-123',
      bookingDate: '2024-02-15',
      guestCount: '2'
    },
    headers: {}
  };
  
  const availabilityResult = await handler(availabilityEvent);
  console.log('GET /api/availability result:', availabilityResult);
  
  // Test GET all bookings (without auth - should fail)
  const getBookingsEvent = {
    httpMethod: 'GET',
    path: '/api/bookings',
    queryStringParameters: {
      page: '1',
      limit: '10'
    },
    headers: {}
  };
  
  const getBookingsResult = await handler(getBookingsEvent);
  console.log('GET /api/bookings result (no auth):', getBookingsResult);
  
  // Test GET single booking (without auth - should fail)
  const getBookingEvent = {
    httpMethod: 'GET',
    path: '/api/bookings/booking-123',
    headers: {}
  };
  
  const getBookingResult = await handler(getBookingEvent);
  console.log('GET /api/bookings/booking-123 result (no auth):', getBookingResult);
  
  // Test POST create booking (without auth - should fail)
  const createBookingEvent = {
    httpMethod: 'POST',
    path: '/api/bookings',
    body: JSON.stringify({
      experienceId: 'exp-123',
      bookingDate: '2024-02-15T14:00:00Z',
      guestCount: 2,
      guestName: 'John Doe',
      guestEmail: 'john@example.com',
      guestPhone: '555-1234',
      specialRequests: 'Vegetarian options please'
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const createBookingResult = await handler(createBookingEvent);
  console.log('POST /api/bookings result (no auth):', createBookingResult);
  
  // Test PUT update booking (without auth - should fail)
  const updateBookingEvent = {
    httpMethod: 'PUT',
    path: '/api/bookings/booking-123',
    body: JSON.stringify({
      guestCount: 3,
      specialRequests: 'Updated special requests'
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const updateBookingResult = await handler(updateBookingEvent);
  console.log('PUT /api/bookings/booking-123 result (no auth):', updateBookingResult);
  
  // Test booking cancellation (without auth - should fail)
  const cancelBookingEvent = {
    httpMethod: 'POST',
    path: '/api/bookings/booking-123/cancel',
    headers: {}
  };
  
  const cancelBookingResult = await handler(cancelBookingEvent);
  console.log('POST /api/bookings/booking-123/cancel result (no auth):', cancelBookingResult);
  
  // Test with mock JWT token (should fail token verification)
  const mockToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  
  const authBookingEvent = {
    httpMethod: 'GET',
    path: '/api/bookings',
    headers: {
      'Authorization': mockToken
    }
  };
  
  const authBookingResult = await handler(authBookingEvent);
  console.log('GET /api/bookings result (with mock token):', authBookingResult);
}

// Run tests
if (require.main === module) {
  testBookingEndpoints().catch(console.error);
}

module.exports = { testBookingEndpoints };