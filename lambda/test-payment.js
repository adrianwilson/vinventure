// Test script for payment endpoints
const { handler } = require('./api-handler');

// Mock environment variables
process.env.AWS_REGION = 'us-east-1';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';

async function testPaymentEndpoints() {
  console.log('Testing payment endpoints...');
  
  // Test create payment intent (without auth - should fail)
  const createIntentEvent = {
    httpMethod: 'POST',
    path: '/api/payment/create-intent',
    body: JSON.stringify({
      bookingId: 'booking-123',
      experiencePrice: 50.00,
      guestCount: 2,
      customerEmail: 'customer@example.com',
      description: 'Wine tasting experience'
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const createIntentResult = await handler(createIntentEvent);
  console.log('POST /api/payment/create-intent result (no auth):', createIntentResult);
  
  // Test confirm payment (without auth - should fail)
  const confirmPaymentEvent = {
    httpMethod: 'POST',
    path: '/api/payment/confirm',
    body: JSON.stringify({
      paymentIntentId: 'pi_1234567890',
      paymentMethodId: 'pm_card_visa'
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const confirmPaymentResult = await handler(confirmPaymentEvent);
  console.log('POST /api/payment/confirm result (no auth):', confirmPaymentResult);
  
  // Test refund (without auth - should fail)
  const refundEvent = {
    httpMethod: 'POST',
    path: '/api/payment/refund',
    body: JSON.stringify({
      paymentIntentId: 'pi_1234567890',
      amount: 5000,
      reason: 'requested_by_customer'
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const refundResult = await handler(refundEvent);
  console.log('POST /api/payment/refund result (no auth):', refundResult);
  
  // Test Stripe webhook (without signature - should fail)
  const webhookEvent = {
    httpMethod: 'POST',
    path: '/api/webhook/stripe',
    body: JSON.stringify({
      id: 'evt_test_webhook',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_1234567890',
          status: 'succeeded',
          amount: 10000,
          currency: 'usd',
          metadata: {
            bookingId: 'booking-123'
          }
        }
      }
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const webhookResult = await handler(webhookEvent);
  console.log('POST /api/webhook/stripe result (no signature):', webhookResult);
  
  // Test Stripe webhook with mock signature
  const webhookWithSigEvent = {
    httpMethod: 'POST',
    path: '/api/webhook/stripe',
    body: JSON.stringify({
      id: 'evt_test_webhook',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_1234567890',
          status: 'succeeded',
          amount: 10000,
          currency: 'usd',
          metadata: {
            bookingId: 'booking-123'
          }
        }
      }
    }),
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': 't=1234567890,v1=mock_signature_hash'
    }
  };
  
  const webhookWithSigResult = await handler(webhookWithSigEvent);
  console.log('POST /api/webhook/stripe result (with signature):', webhookWithSigResult);
  
  // Test amount calculation
  const { calculateBookingAmount } = require('./stripe-payment');
  
  console.log('Amount calculations:');
  console.log('$50 x 2 guests = $', calculateBookingAmount(50, 2) / 100);
  console.log('$75 x 4 guests = $', calculateBookingAmount(75, 4) / 100);
  console.log('$100 x 1 guest = $', calculateBookingAmount(100, 1) / 100);
}

// Run tests
if (require.main === module) {
  testPaymentEndpoints().catch(console.error);
}

module.exports = { testPaymentEndpoints };