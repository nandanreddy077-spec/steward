# Fix: Error 400: redirect_uri_mismatch

## The Problem

Google is rejecting the OAuth request because the redirect URI doesn't match what's configured in Google Cloud Console.

## Solution

### Step 1: Make Sure Backend is Using Correct Redirect URI

The backend should be using: `https://8fcba2112409.ngrok-free.app/api/auth/google/callback`

**Check if backend is running:**
```bash
curl http://localhost:3001/health
```

**If backend is not running or using old URL, restart it:**
```bash
cd /Users/nandanreddyavanaganti/steward/backend
npm run dev
```

### Step 2: Update Google Cloud Console (CRITICAL)

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com
   - Select project "Steward"

2. **Navigate to OAuth Credentials**
   - Go to **APIs & Services** → **Credentials**
   - Click your **OAuth 2.0 Client ID** (Web application)

3. **Update Authorized redirect URIs**
   - Under **Authorized redirect URIs**, you should see existing URIs
   - **Remove** any old ngrok URLs (like `98cf26f14db6.ngrok-free.app`)
   - **Add** this exact URL:
     ```
     https://8fcba2112409.ngrok-free.app/api/auth/google/callback
     ```
   - **Important:** Make sure there are NO trailing slashes or extra characters
   - The URL must match EXACTLY (case-sensitive)

4. **Save**
   - Click **Save** at the bottom
   - Wait a few seconds for changes to propagate

### Step 3: Verify Backend is Using Correct URI

Test the auth endpoint:
```bash
curl http://localhost:3001/api/auth/google
```

Check the `authUrl` in the response - it should contain:
```
redirect_uri=https://8fcba2112409.ngrok-free.app/api/auth/google/callback
```

### Step 4: Test OAuth Again

1. Open app on phone
2. Click "Continue with Google"
3. Should work now!

## Common Issues

### Issue: Still getting mismatch error
- **Check:** Did you save in Google Cloud Console?
- **Check:** Is the URL exactly the same (no typos)?
- **Check:** Did you wait a few seconds after saving?
- **Check:** Is backend using the correct .env value?

### Issue: Backend not picking up .env
- Restart backend: `Ctrl+C` then `npm run dev`
- Verify .env has: `GOOGLE_REDIRECT_URI=https://8fcba2112409.ngrok-free.app/api/auth/google/callback`

### Issue: ngrok URL changed
- If you restarted ngrok, you got a new URL
- Update both .env and Google Cloud Console with new URL

---

**Most likely fix:** Update Google Cloud Console with the exact ngrok URL and save!

