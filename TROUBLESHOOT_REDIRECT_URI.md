# 🔴 Troubleshooting: redirect_uri_mismatch Still Appearing

## Current Status
- Backend .env: `https://5f8edd5ef86a.ngrok-free.app/api/auth/google/callback`
- Error: Still seeing `redirect_uri_mismatch`

## Possible Causes

### 1. Google Cloud Console Not Updated Yet
- Did you add the new URL to Google Cloud Console?
- Did you wait 2-3 minutes after saving?

### 2. Multiple Redirect URIs in Google Console
- There might be old URLs still in the list
- Google checks ALL URLs - if one doesn't match, it fails

### 3. Backend Not Restarted
- Backend might be using old environment variable
- Need to restart to pick up new .env value

### 4. URL Mismatch (Spaces, Slashes, etc.)
- Extra spaces before/after URL
- Trailing slash
- Missing `/api/auth/google/callback` part

## Step-by-Step Fix

### Step 1: Verify Backend Configuration

Check what the backend actually has:

```bash
cd backend
cat .env | grep GOOGLE_REDIRECT_URI
```

Should show: `GOOGLE_REDIRECT_URI=https://5f8edd5ef86a.ngrok-free.app/api/auth/google/callback`

### Step 2: Restart Backend (IMPORTANT)

Even if backend is running, restart it to pick up the new .env:

```bash
cd backend
# Stop current backend (Ctrl+C)
# Then restart:
npm run dev
```

### Step 3: Double-Check Google Cloud Console

1. **Go to:** https://console.cloud.google.com
2. **Navigate:** APIs & Services → Credentials
3. **Find Web Client** and click to edit
4. **Check Authorized redirect URIs:**
   - **Remove ALL URLs** (temporarily)
   - **Add ONLY this one:**
     ```
     https://5f8edd5ef86a.ngrok-free.app/api/auth/google/callback
     ```
   - **Verify:**
     - No trailing slash
     - No spaces
     - Starts with `https://`
     - Ends with `/api/auth/google/callback`
5. **Click Save**
6. **Wait 3-5 minutes** (sometimes takes longer)

### Step 4: Verify Backend is Using Correct URL

Test the backend endpoint:

```bash
curl http://localhost:3001/api/auth/google
```

This should return a JSON with `authUrl`. Check if the redirect_uri in that URL matches.

### Step 5: Clear Browser Cache

Sometimes browsers cache OAuth errors:
- Close Safari completely
- Reopen and try again

## Common Mistakes

❌ **Wrong:**
- `http://5f8edd5ef86a.ngrok-free.app/api/auth/google/callback` (http instead of https)
- `https://5f8edd5ef86a.ngrok-free.app/api/auth/google/callback/` (trailing slash)
- `https://5f8edd5ef86a.ngrok-free.app` (missing callback path)
- ` https://5f8edd5ef86a.ngrok-free.app/api/auth/google/callback` (leading space)

✅ **Correct:**
- `https://5f8edd5ef86a.ngrok-free.app/api/auth/google/callback`

## Debug: Check What Backend is Sending

You can check what redirect URI the backend is actually using:

```bash
# Get the OAuth URL from backend
curl http://localhost:3001/api/auth/google

# Look at the "redirect_uri" parameter in the response
# It should match: https://5f8edd5ef86a.ngrok-free.app/api/auth/google/callback
```

## If Still Not Working

1. **Check ngrok is still running:**
   ```bash
   # Should show: https://5f8edd5ef86a.ngrok-free.app
   ```

2. **Verify backend .env:**
   ```bash
   cd backend
   cat .env | grep GOOGLE_REDIRECT_URI
   ```

3. **Check Google Console one more time:**
   - Make sure there's ONLY one redirect URI
   - Make sure it matches EXACTLY

4. **Wait longer:**
   - Sometimes Google takes 5-10 minutes to propagate changes
   - Try again after waiting

---

**Next Action:** 
1. Restart backend
2. Double-check Google Console (remove all old URLs, add only the new one)
3. Wait 3-5 minutes
4. Try again




