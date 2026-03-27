# OAuth Redirect URI Fix

## The Problem

After completing OAuth, Google redirects to `http://localhost:3001/api/auth/google/callback`, but on mobile devices, `localhost` refers to the device itself, not your computer. This causes "Safari can't open the page" error.

## The Fix

I've updated the backend to use your network IP (`192.168.0.103`) instead of `localhost` for the redirect URI.

## What You Need to Do

### Step 1: Update Google Cloud Console (5 minutes)

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com
   - Select your project

2. **Update OAuth Redirect URI**
   - Go to **APIs & Services** → **Credentials**
   - Click on your **OAuth 2.0 Client ID** (Web application)
   - Under **Authorized redirect URIs**, add:
     ```
     http://192.168.0.103:3001/api/auth/google/callback
     ```
   - Keep the existing `http://localhost:3001/api/auth/google/callback` too
   - Click **Save**

### Step 2: Update .env File (Optional)

If you want to explicitly set it, update `backend/.env`:

```env
GOOGLE_REDIRECT_URI=http://192.168.0.103:3001/api/auth/google/callback
```

**Note**: The backend will use the network IP automatically if not set in .env.

### Step 3: Restart Backend

The backend should auto-restart (nodemon), but if not:

```bash
cd backend
npm run dev
```

### Step 4: Test OAuth Again

1. **Open the app**
2. **Click "Continue with Google"**
3. **Login with Google**
4. **Allow permissions**
5. **Should redirect successfully!**
6. **Should see success page** with your email

## What Changed

**Before:**
- Redirect URI: `http://localhost:3001/api/auth/google/callback`
- Mobile device tries to connect to itself → fails

**After:**
- Redirect URI: `http://192.168.0.103:3001/api/auth/google/callback`
- Mobile device connects to your computer → works!

## Expected Behavior

After completing OAuth:
1. ✅ Browser redirects to callback URL
2. ✅ Backend processes OAuth
3. ✅ User stored in database
4. ✅ Success page shown with your email
5. ✅ You can close browser and return to app

## Verify It Worked

1. **Check backend console** - should see OAuth callback received
2. **Check database** - user should be stored with tokens
3. **Check browser** - should see success page

---

**Update Google Cloud Console redirect URI, then try OAuth again!**





