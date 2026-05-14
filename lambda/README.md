# VinVenture API Server

A NestJS-based local development server for the VinVenture API that wraps the Lambda functions.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Copy the environment template and configure your settings:
```bash
cp .env.example .env
```

Edit `.env` with your actual AWS credentials and configuration.

### 3. Run Development Server
```bash
npm run dev
```

The server will start on `http://localhost:3002`

## Available Endpoints

### 🏥 Health Check
- `GET /health` - Basic health check

### 🔐 Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (requires auth)
- `PUT /api/auth/profile` - Update user profile (requires auth)
- `GET /api/auth/verify` - Verify JWT token (requires auth)

### 🍷 Wineries
- `GET /api/wineries` - List wineries with filtering
- `GET /api/wineries/:id` - Get single winery
- `POST /api/wineries` - Create winery (requires auth)
- `PUT /api/wineries/:id` - Update winery (requires auth)
- `DELETE /api/wineries/:id` - Delete winery (requires auth)

### 📅 Bookings
- `GET /api/availability` - Check availability (public)
- `GET /api/bookings` - List user bookings (requires auth)
- `GET /api/bookings/:id` - Get booking details (requires auth)
- `POST /api/bookings` - Create booking (requires auth)
- `PUT /api/bookings/:id` - Update booking (requires auth)
- `POST /api/bookings/:id/cancel` - Cancel booking (requires auth)

### 💳 Payments
- `POST /api/payment/create-intent` - Create payment intent (requires auth)
- `POST /api/payment/confirm` - Confirm payment (requires auth)
- `POST /api/payment/refund` - Process refund (admin only)
- `POST /api/webhook/stripe` - Stripe webhook endpoint

## API Documentation

Once the server is running, visit:
- **Swagger UI**: `http://localhost:3002/api/docs`

## Development Commands

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test
npm run test:auth
npm run test:winery
npm run test:booking
npm run test:payment
```

## Environment Variables

Required environment variables for full functionality:

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012

# Cognito Configuration
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX

# Database Configuration
DB_CLUSTER_ARN=arn:aws:rds:us-east-1:123456789012:cluster:vinventure-db
DB_SECRET_ARN=arn:aws:secretsmanager:us-east-1:123456789012:secret:vinventure-db-secret

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Server Configuration
PORT=3002
NODE_ENV=development
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

Get a token by calling the login endpoint first.

## Example API Calls

### Register a User
```bash
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"John Doe"}'
```

### Login
```bash
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Get Wineries
```bash
curl http://localhost:3002/api/wineries?region=Napa%20Valley&page=1&limit=10
```

### Create Booking (requires auth token)
```bash
curl -X POST http://localhost:3002/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "experienceId": "exp-123",
    "bookingDate": "2024-02-15T14:00:00Z",
    "guestCount": 2,
    "guestName": "John Doe",
    "guestEmail": "john@example.com"
  }'
```

## Development Notes

- The server wraps the existing Lambda functions, so all business logic remains the same
- Database connections require real AWS credentials to work
- In development, mock data will be returned if AWS services are unavailable
- Swagger documentation is automatically generated from the NestJS decorators

## Troubleshooting

1. **Database connection errors**: Ensure your AWS credentials and database ARNs are correct
2. **Authentication failures**: Check your Cognito configuration
3. **CORS issues**: The server is configured to allow localhost origins
4. **Port conflicts**: Change the PORT environment variable if 3002 is in use