// VinVenture API Lambda Handler
const { registerUser, loginUser, getUserProfile, updateUserProfile, verifyToken } = require('./auth');
const { getAllWineries, getWineryById, createWinery, updateWinery, deleteWinery } = require('./winery');
const { checkAvailability, getAllBookings, getBookingById, createBooking, updateBooking, cancelBooking } = require('./booking');
const { createPaymentIntent, confirmPaymentIntent, getPaymentIntent, createRefund, verifyWebhookSignature, processWebhookEvent, calculateBookingAmount } = require('./stripe-payment');

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  const { httpMethod, path, body, headers } = event;
  
  try {
    // CORS headers
    const corsHeaders = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };
    
    // Handle CORS preflight requests
    if (httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'CORS preflight successful' })
      };
    }
    
    // Basic health check
    if (httpMethod === 'GET' && path === '/health') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ 
          status: 'healthy', 
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        })
      };
    }
    
    // Handle API routes
    if (path.startsWith('/api/')) {
      return await handleApiRequest(httpMethod, path, body, headers, event);
    }
    
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Not Found' })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message })
    };
  }
};

async function handleApiRequest(method, path, body, headers, event) {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
  
  // Parse JSON body
  let requestBody = {};
  if (body) {
    try {
      requestBody = JSON.parse(body);
    } catch (error) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }
  }
  
  // Extract authorization token
  const authHeader = headers?.Authorization || headers?.authorization;
  const token = authHeader?.replace('Bearer ', '');
  
  // Authentication endpoints
  if (path === '/api/auth/register' && method === 'POST') {
    const { email, password, name } = requestBody;
    
    if (!email || !password) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Email and password are required' })
      };
    }
    
    const result = await registerUser(email, password, name);
    
    return {
      statusCode: result.success ? 201 : 400,
      headers: corsHeaders,
      body: JSON.stringify(result)
    };
  }
  
  if (path === '/api/auth/login' && method === 'POST') {
    const { email, password } = requestBody;
    
    if (!email || !password) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Email and password are required' })
      };
    }
    
    const result = await loginUser(email, password);
    
    return {
      statusCode: result.success ? 200 : 401,
      headers: corsHeaders,
      body: JSON.stringify(result)
    };
  }
  
  if (path === '/api/auth/profile' && method === 'GET') {
    if (!token) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Authorization token required' })
      };
    }
    
    const tokenResult = await verifyToken(token);
    if (!tokenResult.success) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: tokenResult.error })
      };
    }
    
    const result = await getUserProfile(tokenResult.user.cognitoUid);
    
    return {
      statusCode: result.success ? 200 : 404,
      headers: corsHeaders,
      body: JSON.stringify(result)
    };
  }
  
  if (path === '/api/auth/profile' && method === 'PUT') {
    if (!token) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Authorization token required' })
      };
    }
    
    const tokenResult = await verifyToken(token);
    if (!tokenResult.success) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: tokenResult.error })
      };
    }
    
    const result = await updateUserProfile(tokenResult.user.cognitoUid, requestBody);
    
    return {
      statusCode: result.success ? 200 : 400,
      headers: corsHeaders,
      body: JSON.stringify(result)
    };
  }
  
  if (path === '/api/auth/verify' && method === 'GET') {
    if (!token) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Authorization token required' })
      };
    }
    
    const result = await verifyToken(token);
    
    return {
      statusCode: result.success ? 200 : 401,
      headers: corsHeaders,
      body: JSON.stringify(result)
    };
  }
  
  // Winery endpoints
  if (path === '/api/wineries' && method === 'GET') {
    const queryParams = event.queryStringParameters || {};
    const filters = {
      region: queryParams.region,
      wineType: queryParams.wineType,
      sustainable: queryParams.sustainable === 'true',
      featured: queryParams.featured === 'true',
      status: queryParams.status,
      search: queryParams.search
    };
    
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 20;
    
    const result = await getAllWineries(filters, page, limit);
    
    return {
      statusCode: result.success ? 200 : 400,
      headers: corsHeaders,
      body: JSON.stringify(result)
    };
  }
  
  if (path === '/api/wineries' && method === 'POST') {
    if (!token) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Authorization token required' })
      };
    }
    
    const tokenResult = await verifyToken(token);
    if (!tokenResult.success) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: tokenResult.error })
      };
    }
    
    const result = await createWinery(requestBody, tokenResult.user.id);
    
    return {
      statusCode: result.success ? 201 : 400,
      headers: corsHeaders,
      body: JSON.stringify(result)
    };
  }
  
  // Dynamic winery ID routes
  const wineryIdMatch = path.match(/^\/api\/wineries\/([^\/]+)$/);
  if (wineryIdMatch) {
    const wineryId = wineryIdMatch[1];
    
    if (method === 'GET') {
      const result = await getWineryById(wineryId);
      
      return {
        statusCode: result.success ? 200 : 404,
        headers: corsHeaders,
        body: JSON.stringify(result)
      };
    }
    
    if (method === 'PUT') {
      if (!token) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Authorization token required' })
        };
      }
      
      const tokenResult = await verifyToken(token);
      if (!tokenResult.success) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: tokenResult.error })
        };
      }
      
      const result = await updateWinery(wineryId, requestBody, tokenResult.user.id, tokenResult.user.role);
      
      return {
        statusCode: result.success ? 200 : 400,
        headers: corsHeaders,
        body: JSON.stringify(result)
      };
    }
    
    if (method === 'DELETE') {
      if (!token) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Authorization token required' })
        };
      }
      
      const tokenResult = await verifyToken(token);
      if (!tokenResult.success) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: tokenResult.error })
        };
      }
      
      const result = await deleteWinery(wineryId, tokenResult.user.id, tokenResult.user.role);
      
      return {
        statusCode: result.success ? 200 : 400,
        headers: corsHeaders,
        body: JSON.stringify(result)
      };
    }
  }
  
  // Booking endpoints
  if (path === '/api/bookings' && method === 'GET') {
    if (!token) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Authorization token required' })
      };
    }
    
    const tokenResult = await verifyToken(token);
    if (!tokenResult.success) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: tokenResult.error })
      };
    }
    
    const queryParams = event.queryStringParameters || {};
    const filters = {
      status: queryParams.status,
      wineryId: queryParams.wineryId,
      experienceId: queryParams.experienceId,
      startDate: queryParams.startDate,
      endDate: queryParams.endDate
    };
    
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 20;
    
    const result = await getAllBookings(filters, tokenResult.user.id, tokenResult.user.role, page, limit);
    
    return {
      statusCode: result.success ? 200 : 400,
      headers: corsHeaders,
      body: JSON.stringify(result)
    };
  }
  
  if (path === '/api/bookings' && method === 'POST') {
    if (!token) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Authorization token required' })
      };
    }
    
    const tokenResult = await verifyToken(token);
    if (!tokenResult.success) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: tokenResult.error })
      };
    }
    
    const result = await createBooking(requestBody, tokenResult.user.id);
    
    return {
      statusCode: result.success ? 201 : 400,
      headers: corsHeaders,
      body: JSON.stringify(result)
    };
  }
  
  // Availability check endpoint
  if (path === '/api/availability' && method === 'GET') {
    const queryParams = event.queryStringParameters || {};
    const { experienceId, bookingDate, guestCount } = queryParams;
    
    if (!experienceId || !bookingDate || !guestCount) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing required parameters: experienceId, bookingDate, guestCount' })
      };
    }
    
    const result = await checkAvailability(experienceId, bookingDate, parseInt(guestCount));
    
    return {
      statusCode: result.success ? 200 : 400,
      headers: corsHeaders,
      body: JSON.stringify(result)
    };
  }
  
  // Dynamic booking ID routes
  const bookingIdMatch = path.match(/^\/api\/bookings\/([^\/]+)$/);
  if (bookingIdMatch) {
    const bookingId = bookingIdMatch[1];
    
    if (method === 'GET') {
      if (!token) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Authorization token required' })
        };
      }
      
      const tokenResult = await verifyToken(token);
      if (!tokenResult.success) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: tokenResult.error })
        };
      }
      
      const result = await getBookingById(bookingId, tokenResult.user.id, tokenResult.user.role);
      
      return {
        statusCode: result.success ? 200 : 404,
        headers: corsHeaders,
        body: JSON.stringify(result)
      };
    }
    
    if (method === 'PUT') {
      if (!token) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Authorization token required' })
        };
      }
      
      const tokenResult = await verifyToken(token);
      if (!tokenResult.success) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: tokenResult.error })
        };
      }
      
      const result = await updateBooking(bookingId, requestBody, tokenResult.user.id, tokenResult.user.role);
      
      return {
        statusCode: result.success ? 200 : 400,
        headers: corsHeaders,
        body: JSON.stringify(result)
      };
    }
  }
  
  // Booking cancellation endpoint
  const bookingCancelMatch = path.match(/^\/api\/bookings\/([^\/]+)\/cancel$/);
  if (bookingCancelMatch && method === 'POST') {
    const bookingId = bookingCancelMatch[1];
    
    if (!token) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Authorization token required' })
      };
    }
    
    const tokenResult = await verifyToken(token);
    if (!tokenResult.success) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: tokenResult.error })
      };
    }
    
    const result = await cancelBooking(bookingId, tokenResult.user.id, tokenResult.user.role);
    
    return {
      statusCode: result.success ? 200 : 400,
      headers: corsHeaders,
      body: JSON.stringify(result)
    };
  }
  
  // Payment endpoints
  if (path === '/api/payment/create-intent' && method === 'POST') {
    if (!token) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Authorization token required' })
      };
    }
    
    const tokenResult = await verifyToken(token);
    if (!tokenResult.success) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: tokenResult.error })
      };
    }
    
    const { bookingId, experiencePrice, guestCount, customerEmail, description } = requestBody;
    
    if (!bookingId || !experiencePrice || !guestCount || !customerEmail) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing required fields: bookingId, experiencePrice, guestCount, customerEmail' })
      };
    }
    
    const amount = calculateBookingAmount(experiencePrice, guestCount);
    
    const result = await createPaymentIntent({
      amount,
      currency: 'usd',
      bookingId,
      customerEmail,
      description: description || 'Wine experience booking'
    });
    
    return {
      statusCode: result.success ? 200 : 400,
      headers: corsHeaders,
      body: JSON.stringify(result)
    };
  }
  
  if (path === '/api/payment/confirm' && method === 'POST') {
    if (!token) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Authorization token required' })
      };
    }
    
    const tokenResult = await verifyToken(token);
    if (!tokenResult.success) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: tokenResult.error })
      };
    }
    
    const { paymentIntentId, paymentMethodId } = requestBody;
    
    if (!paymentIntentId || !paymentMethodId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing required fields: paymentIntentId, paymentMethodId' })
      };
    }
    
    const result = await confirmPaymentIntent(paymentIntentId, paymentMethodId);
    
    return {
      statusCode: result.success ? 200 : 400,
      headers: corsHeaders,
      body: JSON.stringify(result)
    };
  }
  
  if (path === '/api/payment/refund' && method === 'POST') {
    if (!token) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Authorization token required' })
      };
    }
    
    const tokenResult = await verifyToken(token);
    if (!tokenResult.success) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: tokenResult.error })
      };
    }
    
    // Only winery admin or platform admin can process refunds
    if (tokenResult.user.role !== 'WINERY_ADMIN' && tokenResult.user.role !== 'PLATFORM_ADMIN') {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Insufficient permissions' })
      };
    }
    
    const { paymentIntentId, amount, reason } = requestBody;
    
    if (!paymentIntentId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing required field: paymentIntentId' })
      };
    }
    
    const result = await createRefund(paymentIntentId, amount, reason);
    
    return {
      statusCode: result.success ? 200 : 400,
      headers: corsHeaders,
      body: JSON.stringify(result)
    };
  }
  
  // Stripe webhook endpoint
  if (path === '/api/webhook/stripe' && method === 'POST') {
    const signature = headers['stripe-signature'] || headers['Stripe-Signature'];
    
    if (!signature) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing stripe signature' })
      };
    }
    
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const verificationResult = verifyWebhookSignature(body, signature, endpointSecret);
    
    if (!verificationResult.success) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: verificationResult.error })
      };
    }
    
    // Process the webhook event
    const processingResult = await processWebhookEvent(verificationResult.event, async (bookingId, updates) => {
      // This callback would update the booking in the database
      console.log('Updating booking:', bookingId, updates);
      // In production, call updateBooking here
    });
    
    return {
      statusCode: processingResult.success ? 200 : 400,
      headers: corsHeaders,
      body: JSON.stringify({ received: true })
    };
  }

  if (path === '/api/health' && method === 'GET') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ 
        status: 'API healthy',
        timestamp: new Date().toISOString()
      })
    };
  }
  
  return {
    statusCode: 404,
    headers: corsHeaders,
    body: JSON.stringify({ error: 'API endpoint not found' })
  };
}