# Debug: OAuth "Failed to authenticate" Error

## The Problem

After clicking "Visit Site" on the ngrok warning page, you're seeing:
```json
{"error":"Failed to authenticate"}
```

This means the request reached the backend, but something failed during OAuth processing.

## What to Check

### Step 1: Check Backend Terminal Logs

**Look at the terminal where `npm run dev` is running.** You should see error logs like:
```
OAuth error: [error details]
Error details: { message: ..., code: ..., ... }
```

**Common errors you might see:**

1. **"invalid_grant" or "invalid_code"**
   - The OAuth code expired or was already used
   - Solution: Try OAuth again (codes are single-use)

2. **"redirect_uri_mismatch"**
   - The redirect URI in the token exchange doesn't match
   - Solution: Make sure backend .env has correct ngrok URL

3. **Database connection error**
   - Supabase connection failed
   - Solution: Check SUPABASE_URL and SUPABASE_ANON_KEY in .env

4. **"Missing credentials"**
   - Google Client ID or Secret missing
   - Solution: Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env

### Step 2: Check Backend .env File

Make sure these are set correctly:
```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://8fcba2112409.ngrok-free.app/api/auth/google/callback
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

### Step 3: Check if Code Parameter is Present

The error might be "No code provided" if Google didn't send the code. This would show a different error, but check the backend logs.

## Quick Fixes to Try

### Fix 1: Restart Backend
```bash
# Stop backend (Ctrl+C)
cd backend
npm run dev
```

### Fix 2: Try OAuth Again
- OAuth codes are single-use
- If you tried multiple times, the code might be expired
- Start fresh: close browser, open app, try OAuth again

### Fix 3: Check ngrok is Still Running
```bash
# Check if ngrok is running
curl http://localhost:4040/api/tunnels
```

If ngrok restarted, you got a new URL. Update:
- Backend .env
- Google Cloud Console

## What to Share

When asking for help, share:
1. **Backend terminal output** - the actual error message
2. **The exact error** you see in the browser
3. **Backend .env** (without secrets) - to verify configuration

---

**Next Step:** Check the backend terminal where `npm run dev` is running and look for the error logs!

