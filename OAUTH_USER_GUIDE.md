# OAuth Setup - What You Need to Do

## Step 1: Update Google Cloud Console (5 minutes)

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com
   - Select your project (the one you created for OAuth)

2. **Update OAuth Credentials**
   - Go to **APIs & Services** → **Credentials**
   - Click on your **OAuth 2.0 Client ID** (the Web application one)
   - Under **Authorized redirect URIs**, make sure you have:
     ```
     http://localhost:3001/api/auth/google/callback
     ```
   - Click **Save**

3. **Verify APIs are Enabled**
   - Go to **APIs & Services** → **Enabled APIs**
   - Make sure these are enabled:
     - ✅ Google Calendar API
     - ✅ Gmail API

## Step 2: Test Backend OAuth Endpoint (2 minutes)

1. **Make sure backend is running**
   ```bash
   cd backend
   npm run dev
   ```

2. **Test OAuth URL endpoint**
   ```bash
   curl http://localhost:3001/api/auth/google
   ```
   
   **Expected**: JSON with `authUrl` field

## Step 3: Test in the App (5 minutes)

1. **Make sure frontend is running**
   ```bash
   bun run start
   ```

2. **Open the app**

3. **Click "Continue with Google"**
   - Should open browser
   - Login with Google
   - Should redirect back to app
   - Should show your Google account

## What I'm Implementing

I'm updating:
- ✅ `app/auth.tsx` - Real OAuth flow using expo-web-browser
- ✅ `utils/api.ts` - OAuth API calls  
- ✅ `store/AppContext.tsx` - Handle OAuth response
- ✅ Backend callback (if needed)

## Expected Flow

1. Click "Continue with Google"
2. App calls backend `/api/auth/google`
3. Gets OAuth URL
4. Opens browser with Google OAuth
5. You login with Google
6. Google redirects to backend callback
7. Backend processes and stores tokens
8. App gets user data
9. You're logged in!

## Troubleshooting

### "Redirect URI mismatch"
- Check Google Cloud Console
- Make sure redirect URI matches exactly

### "Network error"  
- Make sure backend is running
- Check API URL in utils/api.ts

### "Cannot connect"
- Make sure phone and computer on same WiFi
- Check firewall settings

---

**Ready?** I'll implement the code now, then you follow the steps above!





