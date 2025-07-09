// Stripe payment integration for VinVenture bookings
// This module handles payment processing and webhook verification

const crypto = require('crypto');

// Note: Stripe SDK would be added to package.json for production
// For now, we'll implement the structure without the actual SDK

/**
 * Create a Stripe payment intent
 * @param {Object} bookingData - Booking details
 * @param {string} bookingData.amount - Amount in cents
 * @param {string} bookingData.currency - Currency code (default: 'usd')
 * @param {string} bookingData.bookingId - Booking ID for metadata
 * @param {string} bookingData.customerEmail - Customer email
 * @param {string} bookingData.description - Payment description
 * @returns {Object} Payment intent result
 */
async function createPaymentIntent(bookingData) {
  try {
    // In production, this would use the Stripe SDK:
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    const paymentIntent = {
      id: `pi_${generateRandomId()}`,
      amount: bookingData.amount,
      currency: bookingData.currency || 'usd',
      status: 'requires_payment_method',
      client_secret: `pi_${generateRandomId()}_secret_${generateRandomId()}`,
      metadata: {
        bookingId: bookingData.bookingId,
        customerEmail: bookingData.customerEmail
      },
      description: bookingData.description || 'Wine experience booking'
    };
    
    // Production code would be:
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: bookingData.amount,
    //   currency: bookingData.currency || 'usd',
    //   metadata: {
    //     bookingId: bookingData.bookingId,
    //     customerEmail: bookingData.customerEmail
    //   },
    //   description: bookingData.description || 'Wine experience booking'
    // });
    
    return {
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status
      }
    };
    
  } catch (error) {
    console.error('Create payment intent error:', error);
    return {
      success: false,
      error: 'Failed to create payment intent'
    };
  }
}

/**
 * Confirm a payment intent
 * @param {string} paymentIntentId - Payment intent ID
 * @param {string} paymentMethodId - Payment method ID
 * @returns {Object} Payment confirmation result
 */
async function confirmPaymentIntent(paymentIntentId, paymentMethodId) {
  try {
    // Production code would be:
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
    //   payment_method: paymentMethodId
    // });
    
    // Mock response for testing
    const paymentIntent = {
      id: paymentIntentId,
      status: 'succeeded',
      amount: 10000, // $100.00
      currency: 'usd',
      charges: {
        data: [{
          id: `ch_${generateRandomId()}`,
          amount: 10000,
          currency: 'usd',
          status: 'succeeded'
        }]
      }
    };
    
    return {
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        chargeId: paymentIntent.charges.data[0].id
      }
    };
    
  } catch (error) {
    console.error('Confirm payment intent error:', error);
    return {
      success: false,
      error: 'Failed to confirm payment'
    };
  }
}

/**
 * Retrieve a payment intent
 * @param {string} paymentIntentId - Payment intent ID
 * @returns {Object} Payment intent details
 */
async function getPaymentIntent(paymentIntentId) {
  try {
    // Production code would be:
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    // Mock response for testing
    const paymentIntent = {
      id: paymentIntentId,
      status: 'succeeded',
      amount: 10000,
      currency: 'usd',
      metadata: {
        bookingId: 'booking-123',
        customerEmail: 'customer@example.com'
      }
    };
    
    return {
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata
      }
    };
    
  } catch (error) {
    console.error('Get payment intent error:', error);
    return {
      success: false,
      error: 'Failed to retrieve payment intent'
    };
  }
}

/**
 * Create a refund for a payment
 * @param {string} paymentIntentId - Payment intent ID
 * @param {number} amount - Amount to refund in cents (optional, full refund if not provided)
 * @param {string} reason - Refund reason
 * @returns {Object} Refund result
 */
async function createRefund(paymentIntentId, amount = null, reason = 'requested_by_customer') {
  try {
    // Production code would be:
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const refund = await stripe.refunds.create({
    //   payment_intent: paymentIntentId,
    //   amount: amount,
    //   reason: reason
    // });
    
    // Mock response for testing
    const refund = {
      id: `re_${generateRandomId()}`,
      amount: amount || 10000,
      currency: 'usd',
      status: 'succeeded',
      payment_intent: paymentIntentId,
      reason: reason
    };
    
    return {
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason
      }
    };
    
  } catch (error) {
    console.error('Create refund error:', error);
    return {
      success: false,
      error: 'Failed to create refund'
    };
  }
}

/**
 * Verify Stripe webhook signature
 * @param {string} payload - Webhook payload
 * @param {string} signature - Stripe signature header
 * @param {string} endpointSecret - Webhook endpoint secret
 * @returns {boolean} Whether signature is valid
 */
function verifyWebhookSignature(payload, signature, endpointSecret) {
  try {
    // Production code would be:
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
    // return { success: true, event };
    
    // Mock verification for testing
    const elements = signature.split(',');
    const timestamp = elements.find(el => el.startsWith('t='))?.split('=')[1];
    const v1 = elements.find(el => el.startsWith('v1='))?.split('=')[1];
    
    if (!timestamp || !v1) {
      return { success: false, error: 'Invalid signature format' };
    }
    
    // In production, verify the signature using HMAC
    const expectedSignature = crypto
      .createHmac('sha256', endpointSecret)
      .update(timestamp + '.' + payload)
      .digest('hex');
    
    const isValid = crypto.timingSafeEqual(
      Buffer.from(v1, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
    
    if (!isValid) {
      return { success: false, error: 'Invalid signature' };
    }
    
    // Mock event for testing
    const event = {
      id: `evt_${generateRandomId()}`,
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: `pi_${generateRandomId()}`,
          status: 'succeeded',
          amount: 10000,
          currency: 'usd',
          metadata: {
            bookingId: 'booking-123'
          }
        }
      }
    };
    
    return { success: true, event };
    
  } catch (error) {
    console.error('Webhook verification error:', error);
    return { success: false, error: 'Webhook verification failed' };
  }
}

/**
 * Process Stripe webhook events
 * @param {Object} event - Stripe webhook event
 * @param {Function} updateBookingCallback - Callback to update booking
 * @returns {Object} Processing result
 */
async function processWebhookEvent(event, updateBookingCallback) {
  try {
    const { type, data } = event;
    const paymentIntent = data.object;
    
    switch (type) {
      case 'payment_intent.succeeded':
        // Update booking status to confirmed
        if (paymentIntent.metadata?.bookingId) {
          await updateBookingCallback(paymentIntent.metadata.bookingId, {
            status: 'CONFIRMED',
            stripePaymentId: paymentIntent.id,
            paidAt: new Date().toISOString()
          });
        }
        break;
        
      case 'payment_intent.payment_failed':
        // Log payment failure
        console.error('Payment failed:', paymentIntent.id, paymentIntent.last_payment_error);
        break;
        
      case 'payment_intent.canceled':
        // Handle payment cancellation
        if (paymentIntent.metadata?.bookingId) {
          await updateBookingCallback(paymentIntent.metadata.bookingId, {
            status: 'CANCELLED'
          });
        }
        break;
        
      default:
        console.log('Unhandled event type:', type);
    }
    
    return {
      success: true,
      processed: true
    };
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    return {
      success: false,
      error: 'Failed to process webhook event'
    };
  }
}

/**
 * Calculate booking amount in cents
 * @param {number} experiencePrice - Experience price per person
 * @param {number} guestCount - Number of guests
 * @param {number} taxRate - Tax rate (default: 0.08 = 8%)
 * @returns {number} Total amount in cents
 */
function calculateBookingAmount(experiencePrice, guestCount, taxRate = 0.08) {
  const subtotal = experiencePrice * guestCount;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;
  
  // Convert to cents and round
  return Math.round(total * 100);
}

/**
 * Generate random ID for mocking
 * @returns {string} Random ID
 */
function generateRandomId() {
  return Math.random().toString(36).substr(2, 24);
}

module.exports = {
  createPaymentIntent,
  confirmPaymentIntent,
  getPaymentIntent,
  createRefund,
  verifyWebhookSignature,
  processWebhookEvent,
  calculateBookingAmount
};