# ✅ Updated: New ngrok URL

## New ngrok URL
**Forwarding:** `https://5f8edd5ef86a.ngrok-free.app`

## What Was Updated
- ✅ Backend `.env` file updated

---

## 📋 What to Paste in Google Cloud Console

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com
2. Select your project

### Step 2: Navigate to OAuth Credentials
1. Click **APIs & Services** → **Credentials**
2. Find your **Web Client** (Client ID: `11159124068-s4jsa5od1jf594llg6c751uuvp2nduif.apps.googleusercontent.com`)
3. Click on it to edit

### Step 3: Update Authorized redirect URIs
1. Scroll to **Authorized redirect URIs** section
2. **Remove ALL old ngrok URLs** (if any exist)
3. Click **+ ADD URI**
4. **Paste this EXACT URL:**

```
https://5f8edd5ef86a.ngrok-free.app/api/auth/google/callback
```

5. Click **Save**

### Step 4: Wait
Wait **2-3 minutes** for changes to propagate

---

## ⚠️ Important: Copy This Exact URL

**Copy and paste this entire line:**

```
https://5f8edd5ef86a.ngrok-free.app/api/auth/google/callback
```

**Must be EXACTLY:**
- ✅ Starts with `https://`
- ✅ Includes `/api/auth/google/callback` at the end
- ✅ No trailing slash
- ✅ No extra spaces

---

## After Updating Google Console

1. **Wait 2-3 minutes** for changes to propagate
2. **Restart backend** (if it's running):
   ```bash
   cd backend
   npm run dev
   ```
3. **Test OAuth** in the app

---

## Quick Reference

**New ngrok URL:** `https://5f8edd5ef86a.ngrok-free.app`
**Redirect URI to add:** `https://5f8edd5ef86a.ngrok-free.app/api/auth/google/callback`
**Bundle ID:** `app.rork.executask-ai` (should already be set)

---

**Next Action:** Paste the URL above into Google Cloud Console ⬆️




