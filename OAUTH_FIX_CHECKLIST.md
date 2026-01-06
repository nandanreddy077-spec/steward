# OAuth Configuration Fix Checklist

## Critical Issues Found

### 1. Backend Dependencies Not Installed
**Problem**: TypeScript compilation failing due to missing node_modules
**Fix**: Install backend dependencies

```bash
cd backend
npm install
```

Or use the install script:
```bash
cd backend && chmod +x install-deps.sh && ./install-deps.sh
```

### 2. Google Console iOS Client Incomplete
**Problem**: iOS client exists but Bundle ID is not configured

**Current State** (from screenshot):
- Client ID exists: `11159124068-gg9dr9ibc5u9q2a50b2bkq0pq24omg7c`
- Bundle ID field: EMPTY ❌
- App Store ID field: EMPTY (optional for development)

**Required Fix in Google Console**:
1. Go to the iOS client configuration
2. Fill in **Bundle ID**: `com.steward.app`
3. Save changes

### 3. OAuth Redirect URI Configuration
**Current Configuration** (from screenshot):

**Web Client**:
- ✅ Authorized JavaScript origins:
  - `http://localhost:3001`
  - `http://localhost:8081`
- ✅ Authorized redirect URIs:
  - `http://localhost:3001/api/auth/google/callback`
  - `https://8fcba2112409.ngrok-free.app/api/auth/google/callback`

**This is correct for development!**

### 4. Backend Environment Variables
**Problem**: Backend needs proper .env configuration

Create `backend/.env` with these values:

```env
# Server Configuration
NODE_ENV=development
PORT=3001

# Google OAuth - GET THESE FROM GOOGLE CONSOLE
GOOGLE_CLIENT_ID=11159124068-s4jsa5odjlj694ilgc751uuyp2ndujf.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=****Ny9n
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback

# Supabase - GET THESE FROM EXPO ENV VARS
SUPABASE_URL=<from process.env.EXPO_PUBLIC_RORK_DB_ENDPOINT>
SUPABASE_ANON_KEY=<from process.env.EXPO_PUBLIC_RORK_DB_TOKEN>

# OpenAI (for AI intent parsing)
OPENAI_API_KEY=<your_openai_api_key_here>

# Security
API_RATE_LIMIT=100
RATE_LIMIT_WINDOW_MS=900000
```

### 5. App Bundle Identifier Mismatch
**Problem**: app.json shows different bundle ID than Google Console needs

**Current**: `app.rork.executask-ai`
**Should match Google Console**: `com.steward.app` (or update Google Console to match)

**Recommendation**: Keep `app.rork.executask-ai` and update Google Console iOS client to use this Bundle ID.

## Step-by-Step Fix Process

### Step 1: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 2: Configure Backend Environment
```bash
cd backend
cp .env.example .env
# Edit .env with correct values from Google Console
```

**Critical values to add**:
- `GOOGLE_CLIENT_ID`: Get from Web Client in Google Console
- `GOOGLE_CLIENT_SECRET`: Get from Web Client in Google Console  
- `SUPABASE_URL`: Already available in project env vars
- `SUPABASE_ANON_KEY`: Already available in project env vars
- `OPENAI_API_KEY`: Get from OpenAI dashboard

### Step 3: Fix Google Console iOS Client
1. Open Google Console → APIs & Services → Credentials
2. Click on the iOS client (`steward`)
3. **Add Bundle ID**: `app.rork.executask-ai`
4. **Add iOS URL scheme** (reversed client ID): 
   `com.googleusercontent.apps.11159124068-gg9dr9ibc5u9q2a50b2bkq0pq24omg7c`
5. Save changes
6. Wait 5 minutes for changes to propagate

### Step 4: Update app.json URL Scheme
The iOS URL scheme needs to include the reversed client ID for Google Sign-In:

```json
{
  "expo": {
    "scheme": "rork-app",
    "ios": {
      "bundleIdentifier": "app.rork.executask-ai",
      "infoPlist": {
        "CFBundleURLTypes": [
          {
            "CFBundleURLSchemes": [
              "rork-app",
              "com.googleusercontent.apps.11159124068-gg9dr9ibc5u9q2a50b2bkq0pq24omg7c"
            ]
          }
        ]
      }
    }
  }
}
```

### Step 5: Start Backend Server
```bash
cd backend
npm run dev
```

Should see:
```
Server running on http://localhost:3001
```

### Step 6: Get Your Local IP Address
For mobile testing, find your local network IP:

**macOS/Linux**:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows**:
```bash
ipconfig
```

Update `utils/api.ts` line 12 with your IP address.

### Step 7: Test OAuth Flow

1. Start Expo app:
   ```bash
   npx expo start
   ```

2. Open app on device/simulator
3. Tap "Continue with Google"
4. Should redirect to Google login
5. After approval, should redirect back to app

## OAuth Flow Diagram

```
Mobile App → Backend /auth/google → Get OAuth URL
           → Open Browser with OAuth URL
           → User logs in on Google
           → Google redirects to: http://localhost:3001/api/auth/google/callback?code=XXX
           → Backend processes code, saves user
           → Backend returns HTML page that redirects to: rork-app://auth/callback?success=true&userId=XXX
           → App receives deep link
           → App logs in user
```

## Common Errors and Fixes

### Error: "redirect_uri_mismatch"
**Cause**: Backend redirect URI doesn't match Google Console configuration
**Fix**: Ensure `GOOGLE_REDIRECT_URI` in backend/.env matches exactly what's in Google Console

### Error: "Failed to authenticate"
**Causes**:
1. Backend not running
2. Wrong Client ID/Secret
3. iOS Bundle ID not configured in Google Console

**Fix**: Check all 3 items above

### Error: "Network error"
**Cause**: Mobile device can't reach backend on localhost
**Fix**: Update `utils/api.ts` with your local network IP address

### Error: "Invalid client"
**Cause**: Using iOS client credentials instead of Web client credentials
**Fix**: Use the **Web Client** credentials in backend/.env

## Testing Checklist

- [ ] Backend dependencies installed (`node_modules` exists)
- [ ] Backend `.env` file configured
- [ ] Backend server starts without errors
- [ ] Google Console iOS client has Bundle ID configured
- [ ] Can access `http://localhost:3001/api/auth/google` and get JSON response
- [ ] Mobile app can reach backend (test with your local IP)
- [ ] OAuth flow completes without errors
- [ ] User is logged in and redirected to home screen

## Production Deployment Notes

For production, you'll need to:

1. Deploy backend to a public URL (Render, Railway, Vercel)
2. Add production redirect URI to Google Console
3. Update `GOOGLE_REDIRECT_URI` in production environment
4. Update `utils/api.ts` to use production URL
5. Enable Google Calendar API and Gmail API for production
6. Set up proper error monitoring (Sentry)
7. Configure rate limiting
8. Set up SSL/HTTPS

## Important Security Notes

1. **Never commit `.env` file to git** - It contains secrets
2. **Use Web Client credentials** for the backend OAuth flow
3. **iOS Client credentials** are only needed if using native Google Sign-In SDK
4. **Keep client secret secure** - Never expose in frontend code
5. **Rotate credentials** if accidentally exposed

## Next Steps After OAuth Works

1. Test calendar integration
2. Test email integration  
3. Add proper error handling
4. Implement token refresh mechanism
5. Add user settings page
6. Test task execution flow
7. Add approval workflow
8. Prepare for production deployment
