# Quick Fix: OAuth "Safari can't open the page" Error

## The Problem

When you try to login with Google, Safari shows "can't open the page" because:
- Google redirects to `http://localhost:3001/api/auth/google/callback`
- On mobile, `localhost` refers to the phone itself, not your computer
- So Safari can't reach your backend server

## Solution: Use ngrok Tunnel (5 minutes)

### Step 1: Start Backend

```bash
cd backend
npm run dev
```

Keep this terminal open - backend should be running on port 3001.

### Step 2: Start ngrok (New Terminal)

Open a **new terminal window** and run:

```bash
ngrok http 3001
```

You'll see something like:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3001
```

**Copy the HTTPS URL** (the `https://abc123.ngrok-free.app` part)

### Step 3: Update Google Cloud Console

1. Go to https://console.cloud.google.com
2. Select project "Steward"
3. **APIs & Services** → **Credentials**
4. Click your **OAuth 2.0 Client ID**
5. Under **Authorized redirect URIs**, add:
   ```
   https://YOUR-NGROK-URL.ngrok-free.app/api/auth/google/callback
   ```
   (Replace `YOUR-NGROK-URL` with your actual ngrok URL)
6. Click **Save**

### Step 4: Update Backend .env

Edit `backend/.env` and add/update:

```env
GOOGLE_REDIRECT_URI=https://YOUR-NGROK-URL.ngrok-free.app/api/auth/google/callback
```

(Replace with your actual ngrok URL)

### Step 5: Restart Backend

Stop the backend (Ctrl+C) and restart:

```bash
npm run dev
```

### Step 6: Test OAuth

1. Open app on phone
2. Click "Continue with Google"
3. Complete OAuth
4. Should work now! ✅

## Important Notes

⚠️ **ngrok URL changes each time** you restart ngrok (free plan)

- Each time you restart ngrok, you get a new URL
- You'll need to update Google Cloud Console and .env each time
- For development, keep ngrok running and reuse the same URL

## Alternative: Use ngrok Fixed Domain (Paid)

If you have ngrok paid plan, you can use a fixed domain:
```bash
ngrok http 3001 --domain=your-fixed-domain.ngrok.app
```

Then you only need to update Google Cloud Console once.

---

**Quick Commands:**

```bash
# Terminal 1: Start backend
cd backend && npm run dev

# Terminal 2: Start ngrok
ngrok http 3001

# Then update Google Cloud Console with ngrok URL
# Update backend/.env with ngrok URL
# Restart backend
```

