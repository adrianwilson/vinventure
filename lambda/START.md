# 🚀 Start VinVenture API Locally

## Quick Start (Simplest Method)

```bash
# 1. Navigate to the API directory
cd /Users/adrian/Documents/git/vinventure/lambda

# 2. Install dependencies (if not done)
npm install

# 3. Start the Express server (simplest option)
npm run dev:express
```

**Server will be running on:** `http://localhost:3004`

## Test the API

Open your browser or use curl:

```bash
# Health check
curl http://localhost:3004/health

# Get wineries (will show database error but API structure works)
curl http://localhost:3004/api/wineries

# Check availability
curl "http://localhost:3004/api/availability?experienceId=123&bookingDate=2024-02-15&guestCount=2"
```

## Alternative Start Methods

### Option 1: Express Server (Recommended for testing)
```bash
npm run dev:express    # Runs on port 3004
```

### Option 2: NestJS Server (Recommended for development)  
```bash
npm run dev           # Runs on port 3002 with Swagger docs
```

### Option 3: Test Lambda Functions Directly
```bash
npm test              # Test all endpoints
npm run test:auth     # Test authentication only
npm run test:winery   # Test winery endpoints only
```

## What You'll See

✅ **Working Endpoints:**
- All API routes respond correctly
- Authentication structure works
- CORS configured for frontend
- Error handling in place

⚠️ **Expected Errors:**
- Database connection errors (need AWS credentials)
- Cognito authentication errors (need AWS setup)
- But the API structure and routing work perfectly!

## Next Steps

1. **For full functionality:** Configure `.env` with AWS credentials
2. **For frontend integration:** The API is ready to connect at `http://localhost:3004`
3. **For development:** Use the NestJS server with Swagger docs

## Endpoints Available

- `GET /health` - Health check
- `GET /api/wineries` - List wineries
- `GET /api/availability` - Check booking availability  
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/bookings` - List bookings (requires auth)
- `POST /api/bookings` - Create booking (requires auth)
- And many more...

**Ready to code!** 🎉