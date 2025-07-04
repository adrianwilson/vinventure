# Stripe Integration Setup

## ⚠️ Security Notice
API keys should NEVER be committed to code repositories. Always use environment variables or secure secret management systems.

## Development Setup

### 1. Get Your Stripe Keys
1. Create a Stripe account at https://dashboard.stripe.com/register
2. Go to https://dashboard.stripe.com/test/apikeys
3. Copy your **Publishable key** (starts with `pk_test_`)
4. Copy your **Secret key** (starts with `sk_test_`)

### 2. Frontend Configuration (.env.local)
```bash
# In apps/web/.env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here
```

### 3. Backend Configuration (Environment Variables)
Set these environment variables before deploying:

```bash
# For development/test
export STRIPE_TEST_SECRET_KEY="sk_test_your_actual_secret_key_here"
export STRIPE_TEST_WEBHOOK_SECRET="whsec_your_webhook_secret_here"

# For production (when ready)
export STRIPE_LIVE_SECRET_KEY="sk_live_your_actual_live_secret_key_here"
export STRIPE_LIVE_WEBHOOK_SECRET="whsec_your_live_webhook_secret_here"
```

### 4. Deploy with Environment Variables
```bash
# Set the environment variables first
export STRIPE_TEST_SECRET_KEY="your_key_here"

# Then deploy
npm run infrastructure:deploy
```

## Production Deployment

For production, use AWS Secrets Manager:

1. Store Stripe keys in AWS Secrets Manager
2. Update the Lambda function to read from Secrets Manager
3. Never commit production keys to code

## Test Cards
Use these test card numbers for testing:

**Successful Payment:**
- Card: `4242424242424242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**Declined Payment:**
- Card: `4000000000000002`

## Security Best Practices
- ✅ Use environment variables for all API keys
- ✅ Use different keys for development and production
- ✅ Store production keys in AWS Secrets Manager
- ✅ Rotate keys regularly
- ❌ Never commit keys to git
- ❌ Never log sensitive keys
- ❌ Never share keys in chat/email