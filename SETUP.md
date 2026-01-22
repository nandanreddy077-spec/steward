# Steward Setup Guide

Complete setup instructions for Steward AI Personal Chief of Staff.

## Prerequisites

- Node.js 18+ installed
- Bun installed (for frontend)
- Supabase account (free tier works)
- Google Cloud account
- OpenAI API key

## Step 1: Database Setup (Supabase)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Open your project (or create a new one)
3. Navigate to **SQL Editor**
4. Copy and paste the contents of `backend/database/schema.sql`
5. Click **Run**
6. Verify tables are created in **Table Editor**

## Step 2: Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. The `.env` file should already be created with your credentials. Verify it contains:
   - OpenAI API key
   - Supabase URL and key
   - Google OAuth credentials

4. Start the backend server:
```bash
npm run dev
```

The server should start on `http://localhost:3001`

Test it: `curl http://localhost:3001/health`

## Step 3: Frontend Setup

1. In the root directory, install dependencies (if not already done):
```bash
bun install
```

2. Start the Expo dev server:
```bash
bun run start
```

3. The frontend will automatically connect to the backend API

## Step 4: Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Ensure your OAuth credentials are set up:
   - **Authorized redirect URI**: `http://localhost:3001/api/auth/google/callback`
   - **Authorized JavaScript origins**: `http://localhost:3001`

## Step 5: Test the Flow

1. **Start Backend**: `cd backend && npm run dev`
2. **Start Frontend**: `bun run start`
3. **Test Command Parsing**:
   - Open the app
   - Go to Command tab
   - Type: "Move my 3pm meeting to tomorrow"
   - Should parse via AI and show preview

## API Endpoints

### Health Check
```
GET http://localhost:3001/health
```

### Parse Command
```
POST http://localhost:3001/api/tasks/parse
Body: { "command": "Move my 3pm meeting to tomorrow" }
```

### Google OAuth
```
GET http://localhost:3001/api/auth/google
Returns: { "authUrl": "..." }
```

## Troubleshooting

### Backend won't start
- Check if port 3001 is available
- Verify `.env` file exists and has all credentials
- Check Node.js version: `node --version` (should be 18+)

### Database errors
- Verify Supabase URL and key in `.env`
- Check if tables exist in Supabase dashboard
- Run schema.sql again if needed

### OAuth errors
- Verify redirect URI matches exactly
- Check Google Cloud Console credentials
- Ensure APIs are enabled (Calendar, Gmail)

### Frontend can't connect to backend
- Check backend is running on port 3001
- Verify CORS settings in `backend/src/server.ts`
- Check network tab in browser/dev tools

## Next Steps

1. ✅ Backend API running
2. ✅ Database schema created
3. ✅ Frontend connected
4. ⏳ Test OAuth flow
5. ⏳ Test calendar integration
6. ⏳ Test email integration

## Production Deployment

When ready for production:

1. **Backend**: Deploy to Railway, Render, or Vercel
2. **Database**: Use Supabase production instance
3. **Frontend**: Build and deploy to App Store/Play Store
4. **Update `.env`**: Use production URLs and keys
5. **Update `utils/api.ts`**: Change `API_BASE_URL` to production URL





