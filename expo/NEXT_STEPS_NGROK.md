# Next Steps: Complete OAuth Setup with ngrok

## ✅ Step 1: ngrok Configured
Your ngrok authtoken has been configured!

## Step 2: Start ngrok Tunnel

Open a **new terminal window** and run:

```bash
ngrok http 3001
```

You'll see output like:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3001
```

**Copy the HTTPS URL** (e.g., `https://abc123.ngrok-free.app`)

## Step 3: Update Google Cloud Console

1. Go to https://console.cloud.google.com
2. Select project "Steward"
3. **APIs & Services** → **Credentials**
4. Click your **OAuth 2.0 Client ID** (Web application)
5. Under **Authorized redirect URIs**, add:
   ```
   https://YOUR-NGROK-URL.ngrok-free.app/api/auth/google/callback
   ```
   (Replace `YOUR-NGROK-URL` with your actual ngrok URL from Step 2)
6. Click **Save**

## Step 4: Update Backend .env

Edit `backend/.env` and add/update:

```env
GOOGLE_REDIRECT_URI=https://YOUR-NGROK-URL.ngrok-free.app/api/auth/google/callback
```

(Replace with your actual ngrok URL)

## Step 5: Restart Backend

If backend is running, stop it (Ctrl+C) and restart:

```bash
cd backend
npm run dev
```

## Step 6: Test OAuth

1. Make sure backend is running (`npm run dev`)
2. Make sure ngrok is running (`ngrok http 3001`)
3. Open app on your phone
4. Click "Continue with Google"
5. Complete OAuth
6. Should work now! ✅

---

**Important Notes:**
- Keep both terminals open: one for backend, one for ngrok
- ngrok URL changes each time you restart ngrok (free plan)
- If you restart ngrok, update Google Cloud Console and .env with new URL





