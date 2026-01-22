# OAuth Implementation Guide

## What I'm Implementing

### 1. Mobile OAuth Flow
- Using `expo-web-browser` to open Google OAuth
- Handling OAuth callback
- Storing tokens securely

### 2. Backend OAuth Endpoint
- Already implemented: `/api/auth/google` - Get OAuth URL
- Already implemented: `/api/auth/google/callback` - Handle callback
- Need to add: Return user data after OAuth

## Implementation Approach

For simplicity, we'll use a web-based OAuth flow:

1. **User clicks "Continue with Google"**
2. **App calls backend** `/api/auth/google` to get auth URL
3. **Opens browser** with Google OAuth URL
4. **User authenticates** with Google
5. **Google redirects** to backend callback URL
6. **Backend processes** and stores user/tokens
7. **Backend redirects** to app success page with user data
8. **App receives** user data and stores it

## What You Need to Do

### Step 1: Update Google OAuth Settings

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Click on your **OAuth 2.0 Client ID** (Web application)
5. Under **Authorized redirect URIs**, make sure you have:
   ```
   http://localhost:3001/api/auth/google/callback
   ```
6. Click **Save**

### Step 2: Update Backend Redirect (I'll do this)

The backend callback needs to redirect to the app after OAuth completes. For now, we'll return JSON with user data, and the app will handle it.

### Step 3: Test the Flow

1. Make sure backend is running: `cd backend && npm run dev`
2. Make sure frontend is running: `bun run start`
3. Open the app
4. Click "Continue with Google"
5. Complete OAuth in browser
6. Should redirect back to app with your Google account

## Files I'm Updating

1. `app/auth.tsx` - Implement real OAuth flow
2. `utils/oauth.ts` - OAuth utility functions (new file)
3. `utils/api.ts` - Add OAuth API calls
4. `store/AppContext.tsx` - Handle OAuth response
5. `backend/src/routes/auth.ts` - May need small updates

## Expected Timeline

- Implementation: ~30 minutes
- Testing: ~15 minutes
- Total: ~45 minutes

Let me implement this now!





