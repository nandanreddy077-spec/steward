# 🔴 Fix: redirect_uri_mismatch Error

## Problem
You're seeing: **Error 400: redirect_uri_mismatch**

This means the redirect URI in your backend doesn't match what's configured in Google Cloud Console.

## Current Configuration

**Backend .env has:**
```
GOOGLE_REDIRECT_URI=https://b56f76e59b50.ngrok-free.app/api/auth/google/callback
```

**Google Cloud Console needs:**
```
https://b56f76e59b50.ngrok-free.app/api/auth/google/callback
```

## Fix Steps (5 minutes)

### Step 1: Verify Backend Configuration

The backend should already have the correct URL. Let's verify:

```bash
cd backend
cat .env | grep GOOGLE_REDIRECT_URI
```

Should show: `GOOGLE_REDIRECT_URI=https://b56f76e59b50.ngrok-free.app/api/auth/google/callback`

### Step 2: Update Google Cloud Console (CRITICAL)

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com
   - Select your project

2. **Navigate to OAuth Credentials:**
   - Click **APIs & Services** → **Credentials**
   - Find your **Web Client** (Client ID: `11159124068-s4jsa5od1jf594llg6c751uuvp2nduif.apps.googleusercontent.com`)
   - Click on it to edit

3. **Check Authorized redirect URIs:**
   - Scroll to **Authorized redirect URIs** section
   - **Remove ALL old ngrok URLs** (if any)
   - **Add this EXACT URL:**
     ```
     https://b56f76e59b50.ngrok-free.app/api/auth/google/callback
     ```
   - ⚠️ **IMPORTANT:** The URL must match EXACTLY:
     - Must start with `https://`
     - Must include `/api/auth/google/callback` at the end
     - No trailing slashes
     - No extra spaces

4. **Click Save**

5. **Wait 2-3 minutes** for changes to propagate

### Step 3: Restart Backend (if needed)

If you changed the .env file, restart the backend:

```bash
cd backend
npm run dev
```

### Step 4: Test Again

1. Make sure ngrok is running: `ngrok http 3001`
2. Make sure backend is running: `npm run dev` in backend folder
3. Try OAuth again in the app

## Common Mistakes

❌ **Wrong:**
- `http://b56f76e59b50.ngrok-free.app/api/auth/google/callback` (missing 's' in https)
- `https://b56f76e59b50.ngrok-free.app/api/auth/google/callback/` (trailing slash)
- `https://b56f76e59b50.ngrok-free.app` (missing callback path)

✅ **Correct:**
- `https://b56f76e59b50.ngrok-free.app/api/auth/google/callback`

## About Email Selection

The "can't select email account" issue is likely because:
- Google is showing an error before you can select
- Once the redirect_uri_mismatch is fixed, you'll be able to select your account

## Verification

After updating Google Cloud Console:

1. Wait 2-3 minutes
2. Try OAuth again
3. You should now be able to:
   - Select your email account
   - Complete the OAuth flow
   - Get redirected back to the app

---

**Next Action:** Update Google Cloud Console with the EXACT URL above ⬆️




