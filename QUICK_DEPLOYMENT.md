# Quick Deployment Guide (15 Minutes)

## Prerequisites
- Google Cloud account
- Supabase account
- OpenAI API key
- Railway/Render account

---

## Step 1: Backend (5 min)

### Install Dependencies
```bash
cd backend
npm install
```

### Set Environment Variables
Create `backend/.env`:
```env
NODE_ENV=production
PORT=3001
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-backend.railway.app/api/auth/google/callback
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
API_RATE_LIMIT=100
RATE_LIMIT_WINDOW_MS=900000
```

### Deploy to Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize
cd backend
railway init

# Deploy
railway up

# Get URL
railway domain
```

---

## Step 2: Google OAuth (5 min)

1. Go to https://console.cloud.google.com/
2. Create project
3. Enable APIs:
   - Google Calendar API
   - Gmail API
4. Create OAuth credentials
5. Add redirect URI: `https://your-backend.railway.app/api/auth/google/callback`
6. Copy Client ID and Secret to backend `.env`
7. Redeploy: `railway up`

---

## Step 3: Frontend (5 min)

### Update API URL
Edit `utils/api.ts`:
```typescript
return 'https://your-backend.railway.app/api';
```

### Test Locally
```bash
npm start
```

### Build for Production
```bash
# iOS
npx expo run:ios --configuration Release

# Android
npx expo run:android --variant release
```

---

## Verify Deployment

### Backend Health
```bash
curl https://your-backend.railway.app/health
```

### Test OAuth
1. Open app
2. Click "Continue with Google"
3. Complete OAuth flow
4. Verify you're logged in

### Test Task Creation
1. Type command: "Block 2 hours for deep work tomorrow at 9am"
2. Verify task appears
3. Approve if needed
4. Check Google Calendar

---

## Troubleshooting

### OAuth Fails
- Check redirect URI matches exactly
- Verify Google APIs are enabled
- Check Client ID/Secret are correct

### Backend Not Responding
- Check Railway logs: `railway logs`
- Verify environment variables
- Check database connection

### Tasks Not Executing
- Verify Google tokens in database
- Check Supabase logs
- Test API endpoints manually

---

## You're Live! 🎉

Next steps:
- Monitor Railway logs
- Test all features
- Collect user feedback
- Add monitoring (Sentry)
- Set up billing (RevenueCat)
