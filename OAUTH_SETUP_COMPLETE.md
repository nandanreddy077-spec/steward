# Complete OAuth Setup Guide

## Issues Found in Your Configuration

Based on your Google Console screenshots, here are the **critical issues** preventing OAuth from working:

### ✅ What's Correct:
1. **Web Client exists** with Client ID: `11159124068-s4jsa5odjlj694ilgc751uuyp2ndujf`
2. **Redirect URIs are configured** correctly for development
3. **iOS Client exists** with Client ID: `11159124068-gg9dr9ibc5u9q2a50b2bkq0pq24omg7c`

### ❌ Critical Issues to Fix:

#### 1. Backend Dependencies Not Installed
**Error**: TypeScript compilation failing with "Cannot find module" errors

**Fix**:
```bash
cd backend
npm install
```

This will install all required packages:
- `express` + `@types/express`
- `googleapis`
- `google-auth-library`
- `cors` + `@types/cors`
- `openai`
- `@supabase/supabase-js`

#### 2. iOS Client Bundle ID Not Configured
**Problem**: In your screenshot, the iOS client shows empty fields for:
- Bundle ID
- App Store ID

**Fix in Google Console**:
1. Go to **Google Cloud Console** → **APIs & Services** → **Credentials**
2. Click on the **iOS client** (named "steward")
3. Fill in these fields:
   ```
   Bundle ID: app.rork.executask-ai
   App Store ID: (leave empty for development)
   ```
4. Click **Save**
5. **Wait 5 minutes** for changes to propagate

#### 3. Backend Environment Variables Missing
**Problem**: Backend has no `.env` file configured

**Fix**:
```bash
cd backend
cp .env.template .env
```

Then edit `backend/.env` with these values:

```env
NODE_ENV=development
PORT=3001

# Use Web Client credentials (NOT iOS client)
GOOGLE_CLIENT_ID=11159124068-s4jsa5odjlj694ilgc751uuyp2ndujf.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<get from Web Client in Google Console>
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback

# Supabase (from Expo environment variables)
SUPABASE_URL=<your_supabase_url>
SUPABASE_ANON_KEY=<your_supabase_key>

# OpenAI (required for task parsing)
OPENAI_API_KEY=<your_openai_key>
```

**IMPORTANT**: Use the **Web Client** credentials in backend, NOT the iOS client!

#### 4. Mobile Network Configuration
**Problem**: Mobile devices can't reach `localhost:3001`

**Fix**: Update `utils/api.ts` line 12 with your computer's local IP:

Find your local IP:
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows  
ipconfig
```

Update the file:
```typescript
return Platform.OS === 'web' 
  ? 'http://localhost:3001/api'
  : 'http://YOUR_LOCAL_IP:3001/api'; // e.g., http://192.168.1.100:3001/api
```

## Complete Setup Process

### Step 1: Install Backend Dependencies
```bash
cd backend
npm install
```

**Expected output**: All packages installed without errors

### Step 2: Configure Backend Environment
```bash
cd backend
cp .env.template .env
nano .env  # or use any text editor
```

Fill in all required values (see section above).

### Step 3: Fix Google Console iOS Client

1. Open https://console.cloud.google.com/apis/credentials
2. Select your project ("Steward")
3. Click on iOS client "steward"
4. Enter:
   - **Bundle ID**: `app.rork.executask-ai`
5. Click **Save**
6. Wait 5 minutes

### Step 4: Enable Required Google APIs

1. Go to **APIs & Services** → **Library**
2. Enable these APIs:
   - ✅ Google Calendar API
   - ✅ Gmail API
   - ✅ Google OAuth2 API (should already be enabled)

### Step 5: Start Backend Server
```bash
cd backend
npm run dev
```

**Expected output**:
```
[nodemon] starting `ts-node src/server.ts`
Server running on http://localhost:3001
```

### Step 6: Update Mobile API Endpoint

Get your local IP address:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Then update `utils/api.ts` line 12 with this IP.

### Step 7: Start Mobile App
```bash
npx expo start
```

Press `i` for iOS or `a` for Android.

### Step 8: Test OAuth Flow

1. Open app
2. Tap "Continue with Google"
3. Browser should open with Google login
4. After login, should redirect back to app
5. You should see the home screen

## OAuth Flow Explained

```
┌─────────────┐
│  Mobile App │
└──────┬──────┘
       │ 1. Tap "Continue with Google"
       │
       ▼
┌──────────────────────┐
│ GET /auth/google     │◄─── Backend generates OAuth URL
└──────┬───────────────┘
       │ 2. Return authUrl
       │
       ▼
┌──────────────────────┐
│ Open Browser         │◄─── User sees Google login page
└──────┬───────────────┘
       │ 3. User logs in and approves
       │
       ▼
┌─────────────────────────────────────────┐
│ GET /auth/google/callback?code=XXX      │◄─── Google redirects here
└──────┬──────────────────────────────────┘
       │ 4. Backend exchanges code for tokens
       │ 5. Backend saves user to database
       │
       ▼
┌────────────────────────────────────────────────────┐
│ HTML Page with redirect:                           │
│ rork-app://auth/callback?success=true&userId=XXX   │◄─── Deep link back to app
└──────┬─────────────────────────────────────────────┘
       │ 6. App receives deep link
       │
       ▼
┌──────────────────────┐
│ Home Screen          │◄─── User logged in!
└──────────────────────┘
```

## Troubleshooting

### Error: "Cannot find module 'express'"
**Cause**: Backend dependencies not installed
**Fix**: 
```bash
cd backend && npm install
```

### Error: "redirect_uri_mismatch"
**Cause**: Backend redirect URI doesn't match Google Console
**Fix**: 
1. Check `backend/.env` → `GOOGLE_REDIRECT_URI`
2. Check Google Console Web Client → Authorized redirect URIs
3. They must match exactly

### Error: "invalid_client"
**Cause**: Wrong client ID or secret
**Fix**: 
- Use **Web Client** credentials (NOT iOS client)
- Double-check Client ID and Secret from Google Console

### Error: "Failed to authenticate"
**Causes**:
1. Backend not running
2. Wrong credentials in .env
3. iOS Bundle ID not configured

**Fix**: Check all three items

### Error: "Network error" on mobile
**Cause**: Device can't reach localhost
**Fix**: Update `utils/api.ts` with your local IP address

### Error: Deep link not working
**Causes**:
1. URL scheme not configured in app.json
2. iOS client Bundle ID doesn't match
3. Browser blocking redirect

**Fix**:
- Verify app.json has `"scheme": "rork-app"`
- Verify Google Console iOS client has Bundle ID: `app.rork.executask-ai`
- Try manual redirect if automatic fails

## Verification Checklist

Before testing OAuth, verify:

- [ ] Backend dependencies installed (`backend/node_modules` exists)
- [ ] Backend `.env` file configured with all values
- [ ] Backend server running (`npm run dev` in backend folder)
- [ ] Can access http://localhost:3001/api/auth/google (should return JSON with authUrl)
- [ ] Google Console iOS client has Bundle ID configured
- [ ] Google Calendar API enabled in Google Console
- [ ] Gmail API enabled in Google Console
- [ ] `utils/api.ts` updated with correct IP for mobile testing
- [ ] Mobile app can reach backend (test API endpoint first)

## Testing the Backend API

Test if backend is accessible:

**From terminal**:
```bash
curl http://localhost:3001/api/auth/google
```

**Expected response**:
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

**From mobile device** (replace with your IP):
```bash
curl http://192.168.1.100:3001/api/auth/google
```

If this fails, backend is not accessible from mobile network.

## Important Notes

1. **Use Web Client credentials** for backend OAuth flow
2. **iOS Client** is only for reversed client ID URL scheme
3. **Never commit `.env`** file to git
4. **Client Secret** must be kept secure
5. **Bundle ID** must match exactly between app.json and Google Console
6. **Wait 5 minutes** after changing Google Console settings
7. **Test on device**, not just simulator (network issues)

## Production Deployment

For production, you'll need to:

1. Deploy backend to public URL (Render, Railway, Vercel)
2. Add production redirect URI to Google Console:
   ```
   https://your-domain.com/api/auth/google/callback
   ```
3. Update backend production env vars
4. Update `utils/api.ts` production URL
5. Configure SSL/HTTPS
6. Set up monitoring (Sentry)
7. Enable rate limiting
8. Add error tracking

## Next Steps After OAuth Works

1. ✅ OAuth authentication working
2. Test calendar event creation
3. Test email reading/sending
4. Test task parsing and execution
5. Test approval workflow
6. Add proper error handling
7. Add loading states
8. Add offline mode
9. Production deployment
10. App store submission

## Support

If OAuth still doesn't work after following this guide:

1. Check backend logs for errors
2. Check mobile console logs
3. Verify all credentials are correct
4. Test backend API directly with curl
5. Ensure Google APIs are enabled
6. Wait full 5 minutes after Google Console changes
7. Try on different network (WiFi vs cellular)
