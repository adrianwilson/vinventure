'use client';

import { useState, useEffect } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getAppConfig } from '../../lib/config';

// Stripe instance will be loaded at runtime
let stripePromise: Promise<Stripe | null> | null = null;

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = getAppConfig().then(config => {
      if (!config.stripePublishableKey || config.stripePublishableKey === 'STRIPE_TEST_PK_NOT_SET') {
        console.error('Stripe publishable key not configured');
        return null;
      }
      return loadStripe(config.stripePublishableKey);
    });
  }
  return stripePromise;
};

interface PaymentFormProps {
  amount: number;
  currency?: string;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
  loading?: boolean;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  currency = 'usd',
  onPaymentSuccess,
  onPaymentError,
  loading = false
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Create payment intent
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://di0bluzj0y4p2.cloudfront.net';
      const response = await fetch(`${apiUrl}/api/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          metadata: {
            source: 'vinventure-booking'
          }
        }),
      });

      const { clientSecret, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      // Confirm payment
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        onPaymentSuccess(paymentIntent.id);
      } else {
        throw new Error('Payment was not successful');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setPaymentError(errorMessage);
      onPaymentError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Information
        </label>
        <div className="border rounded-md p-3 bg-white">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {paymentError && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
          {paymentError}
        </div>
      )}

      <div className="flex justify-between items-center pt-4">
        <div className="text-lg font-semibold">
          Total: ${amount.toFixed(2)}
        </div>
        <button
          type="submit"
          disabled={!stripe || isProcessing || loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
        </button>
      </div>
    </form>
  );
};

interface StripePaymentProps {
  amount: number;
  currency?: string;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
  loading?: boolean;
}

const StripePayment: React.FC<StripePaymentProps> = (props) => {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStripe()
      .then(stripeInstance => {
        setStripe(stripeInstance);
        if (!stripeInstance) {
          setError('Failed to load Stripe. Please check configuration.');
        }
      })
      .catch(err => {
        console.error('Failed to load Stripe:', err);
        setError('Failed to load payment system.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="text-gray-500">Loading payment system...</div>
      </div>
    );
  }

  if (error || !stripe) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-600 text-sm">{error}</div>
        <div className="text-xs text-gray-500 mt-2">
          Payment system unavailable. Please try the test mode below.
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripe}>
      <PaymentForm {...props} />
    </Elements>
  );
};

export default StripePayment;