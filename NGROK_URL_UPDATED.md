# ✅ ngrok URL Updated

## New ngrok URL
**Forwarding:** `https://b56f76e59b50.ngrok-free.app`

## What Was Updated
- ✅ Backend `.env` file updated with new redirect URI

## What You Need to Do Next

### Step 1: Update Google Cloud Console (CRITICAL - 2 minutes)

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com
   - Select your project

2. **Navigate to OAuth Credentials:**
   - Click **APIs & Services** → **Credentials**
   - Find your **Web Client** (Client ID: `11159124068-s4jsa5od1jf594llg6c751uuvp2nduif.apps.googleusercontent.com`)
   - Click on it to edit

3. **Update the Redirect URI:**
   - Scroll to **Authorized redirect URIs**
   - **Remove** the old ngrok URL: `https://b0e5191bf88b.ngrok-free.app/api/auth/google/callback`
   - **Add** the new ngrok URL: `https://b56f76e59b50.ngrok-free.app/api/auth/google/callback`
   - Click **Save**

4. **Wait 2-3 minutes** for changes to propagate

---

### Step 2: Restart Backend Server

The backend needs to be restarted to pick up the new environment variable:

```bash
cd backend
npm run dev
```

You should see:
```
🚀 Steward backend running on port 3001
```

---

### Step 3: Test OAuth Flow

1. **Make sure ngrok is running:**
   ```bash
   ngrok http 3001
   ```
   Should show: `https://b56f76e59b50.ngrok-free.app`

2. **Start frontend (if not running):**
   ```bash
   bun run start
   ```

3. **Test in app:**
   - Open app on your phone
   - Click "Continue with Google"
   - Complete OAuth flow
   - Should redirect back to app successfully

---

## Quick Reference

**New ngrok URL:** `https://b56f76e59b50.ngrok-free.app`
**Redirect URI:** `https://b56f76e59b50.ngrok-free.app/api/auth/google/callback`
**Bundle ID:** `app.rork.executask-ai`

---

## ⚠️ Important Note

**ngrok URLs change each time you restart ngrok.** For production, you'll want to:
- Use a fixed domain (paid ngrok plan)
- Or deploy backend to a production server with a fixed domain
- Or use Expo's tunnel feature instead

For now, just update Google Console each time you restart ngrok.

---

**Next Action:** Update Google Cloud Console (Step 1 above) ⬆️




