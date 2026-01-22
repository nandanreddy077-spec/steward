# 🔴 CRITICAL: redirect_uri_mismatch - Final Fix

## Current Status
You're still seeing `redirect_uri_mismatch` error. This means Google Cloud Console doesn't have the correct redirect URI.

## What Backend Has

**Backend .env should have:**
```
GOOGLE_REDIRECT_URI=https://5f8edd5ef86a.ngrok-free.app/api/auth/google/callback
```

## What Google Cloud Console MUST Have

**EXACT URL to add in Google Cloud Console:**
```
https://5f8edd5ef86a.ngrok-free.app/api/auth/google/callback
```

## Step-by-Step Fix (DO THIS NOW)

### Step 1: Verify Backend Configuration

```bash
cd backend
cat .env | grep GOOGLE_REDIRECT_URI
```

Should show: `GOOGLE_REDIRECT_URI=https://5f8edd5ef86a.ngrok-free.app/api/auth/google/callback`

### Step 2: Go to Google Cloud Console

1. **Visit:** https://console.cloud.google.com
2. **Select your project**
3. **Navigate:** APIs & Services → Credentials
4. **Find:** Web Client (Client ID: `11159124068-s4jsa5od1jf594llg6c751uuvp2nduif.apps.googleusercontent.com`)
5. **Click to edit**

### Step 3: CLEAR ALL OLD URLs

**IMPORTANT:** Remove ALL existing redirect URIs first!

1. Scroll to **Authorized redirect URIs**
2. **DELETE ALL URLs** in the list (click the X next to each one)
3. Make sure the list is **completely empty**

### Step 4: Add ONLY This URL

1. Click **+ ADD URI**
2. **Copy and paste this EXACT URL:**
   ```
   https://5f8edd5ef86a.ngrok-free.app/api/auth/google/callback
   ```
3. **Verify it's EXACTLY:**
   - ✅ Starts with `https://`
   - ✅ No `http://` version
   - ✅ Ends with `/api/auth/google/callback`
   - ✅ No trailing slash
   - ✅ No spaces before or after

### Step 5: Save and Wait

1. Click **Save**
2. **Wait 5 minutes** (Google can take up to 10 minutes to propagate)

### Step 6: Verify Backend is Running

```bash
cd backend
npm run dev
```

Should see: `🚀 Steward backend running on port 3001`

### Step 7: Test Again

1. Make sure ngrok is running: `ngrok http 3001`
2. Try OAuth in app again

## Common Mistakes

❌ **WRONG:**
- `http://5f8edd5ef86a.ngrok-free.app/api/auth/google/callback` (http instead of https)
- `https://5f8edd5ef86a.ngrok-free.app/api/auth/google/callback/` (trailing slash)
- `https://5f8edd5ef86a.ngrok-free.app` (missing callback path)
- Multiple URLs in the list (should be ONLY one)

✅ **CORRECT:**
- `https://5f8edd5ef86a.ngrok-free.app/api/auth/google/callback` (exactly this, nothing else)

## If Still Not Working

1. **Double-check Google Console:**
   - Is there ONLY one redirect URI?
   - Does it match EXACTLY: `https://5f8edd5ef86a.ngrok-free.app/api/auth/google/callback`?

2. **Check backend .env:**
   ```bash
   cd backend
   cat .env | grep GOOGLE_REDIRECT_URI
   ```

3. **Restart backend:**
   ```bash
   cd backend
   npm run dev
   ```

4. **Wait longer:**
   - Sometimes Google takes 10+ minutes
   - Try again after waiting

---

## Quick Checklist

- [ ] Backend .env has: `GOOGLE_REDIRECT_URI=https://5f8edd5ef86a.ngrok-free.app/api/auth/google/callback`
- [ ] Google Cloud Console has ONLY: `https://5f8edd5ef86a.ngrok-free.app/api/auth/google/callback`
- [ ] No other redirect URIs in Google Console
- [ ] Waited 5+ minutes after saving
- [ ] Backend is restarted and running
- [ ] ngrok is running with URL: `https://5f8edd5ef86a.ngrok-free.app`

---

**CRITICAL:** Make sure Google Cloud Console has ONLY the one URL above, and it matches EXACTLY!




