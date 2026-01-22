# OAuth Setup Guide - Priority 1

## What You Need to Do

### Step 1: Update Google OAuth Settings (5 minutes)

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com
   - Select your project: "Steward AI" (or whatever you named it)

2. **Update OAuth Redirect URI**
   - Go to **APIs & Services** → **Credentials**
   - Click on your OAuth 2.0 Client ID (Web application)
   - Under **Authorized redirect URIs**, add:
     ```
     http://localhost:3001/api/auth/google/callback
     steward://oauth/callback
     ```
   - Click **Save**

3. **Update Authorized JavaScript Origins** (if not already there)
   - Add:
     ```
     http://localhost:3001
     ```

### Step 2: Update app.json for Deep Linking (2 minutes)

We need to add a URL scheme for OAuth callbacks. I'll handle this in the code.

### Step 3: Test the OAuth Flow (10 minutes)

1. **Make sure backend is running**
   ```bash
   cd backend
   npm run dev
   ```

2. **Make sure frontend is running**
   ```bash
   bun run start
   ```

3. **Test OAuth**
   - Open the app
   - Click "Continue with Google"
   - Should open browser for Google login
   - After login, should redirect back to app
   - Should show your Google account info

## What I'm Implementing

1. ✅ Real OAuth flow in `app/auth.tsx`
2. ✅ OAuth API integration
3. ✅ Deep linking setup
4. ✅ Token storage
5. ✅ User authentication with real Google account

## Expected Behavior

**Before**: Mock login (no real OAuth)

**After**: 
- Click "Continue with Google"
- Opens browser
- You login with Google
- App receives your Google account
- Tokens stored securely
- You're logged in!

## Troubleshooting

### Issue: "Redirect URI mismatch"
- Check Google Cloud Console redirect URIs
- Make sure `steward://oauth/callback` is added

### Issue: "Network error"
- Make sure backend is running
- Check API URL in `utils/api.ts`

### Issue: "Cannot connect to app"
- Check deep linking setup
- Make sure URL scheme is correct

## Next Steps After OAuth Works

1. Test calendar operations with real Google Calendar
2. Test email operations with real Gmail
3. Verify tokens are stored correctly
4. Test token refresh

---

**Ready to implement?** I'll start coding now, then you follow the steps above!





