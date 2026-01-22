# 🚀 Render Quick Setup - Step by Step

## ⚡ Fast Setup (10 minutes)

### Step 1: Sign Up (2 min)
1. Go to: **https://render.com**
2. Click **"Get Started for Free"**
3. Sign up with **GitHub** (recommended - one click)
4. Authorize Render to access your repositories

### Step 2: Create Web Service (3 min)
1. Click **"New +"** button (top right)
2. Select **"Web Service"**
3. Find and click **"Connect"** next to your `steward` repository
4. If not listed, click **"Configure account"** and grant access

### Step 3: Configure Service (3 min)

Fill in these settings:

**Basic:**
- **Name:** `steward-backend` (or any name you like)
- **Region:** Choose closest (e.g., `Oregon (US West)`)
- **Branch:** `main`
- **Root Directory:** `backend` ⚠️ **IMPORTANT**

**Build & Deploy:**
- **Environment:** Select **"Docker"**
- **Dockerfile Path:** Leave empty (Render will auto-detect `backend/Dockerfile`)

**OR if Docker doesn't work, use Build Commands:**
- **Build Command:** `npm install --legacy-peer-deps --include=dev && npm run build`
- **Start Command:** `node dist/server.js`

### Step 4: Add Environment Variables (2 min)

Click **"Advanced"** → Scroll to **"Environment Variables"**

Click **"Add Environment Variable"** for each:

```
NODE_ENV = production
PORT = 10000
OPENAI_API_KEY = (your OpenAI API key)
SUPABASE_URL = (your Supabase URL)
SUPABASE_ANON_KEY = (your Supabase anon key)
GOOGLE_CLIENT_ID = (your Google Client ID)
GOOGLE_CLIENT_SECRET = (your Google Client Secret)
GOOGLE_REDIRECT_URI = (we'll update this after deployment)
```

**⚠️ Note:** Leave `GOOGLE_REDIRECT_URI` empty for now - we'll add it after we get the URL.

### Step 5: Deploy! (2 min)
1. Scroll down and click **"Create Web Service"**
2. Render will start building (takes 5-10 minutes first time)
3. Watch the build logs - you'll see:
   - ✅ Installing dependencies
   - ✅ Building TypeScript
   - ✅ Starting service

### Step 6: Get Your URL
1. Once deployed, you'll see a green "Live" status
2. Your URL will be: `https://steward-backend.onrender.com` (or similar)
3. Click the URL to test, or visit: `https://your-url.onrender.com/health`
4. Should see: `{"status":"ok",...}`

### Step 7: Update Google OAuth
1. Copy your Render URL (e.g., `https://steward-backend.onrender.com`)
2. Go to: **https://console.cloud.google.com/apis/credentials**
3. Click your **OAuth 2.0 Client ID**
4. Under **"Authorized redirect URIs"**, click **"Add URI"**
5. Add: `https://steward-backend.onrender.com/api/auth/google/callback`
6. Click **"Save"**
7. Wait 5 minutes for changes to propagate

### Step 8: Update Render Environment Variable
1. Go back to Render dashboard
2. Click your service → **"Environment"** tab
3. Find `GOOGLE_REDIRECT_URI`
4. Update value to: `https://steward-backend.onrender.com/api/auth/google/callback`
5. Render will auto-redeploy

### Step 9: Update Frontend
1. Open `utils/api.ts` in your project
2. Update the production URL:
   ```typescript
   return 'https://steward-backend.onrender.com/api';
   ```
3. Or set environment variable: `EXPO_PUBLIC_API_URL=https://steward-backend.onrender.com/api`

---

## ✅ Verification Checklist

- [ ] Service shows "Live" status
- [ ] Health endpoint works: `/health`
- [ ] Build logs show successful build
- [ ] `dist/server.js` was created (check logs)
- [ ] Google OAuth redirect URI updated
- [ ] Frontend API URL updated
- [ ] Test OAuth login works

---

## 🐛 Troubleshooting

### Build Fails
**Problem:** Build fails with errors
**Solution:**
- Check **"Logs"** tab for specific error
- Verify `Root Directory` is set to `backend`
- Make sure all environment variables are set
- Try using Build Commands instead of Docker

### Service Crashes
**Problem:** Service starts then crashes
**Solution:**
- Check **"Logs"** tab for runtime errors
- Verify `PORT` environment variable is set (Render sets this automatically)
- Check if `dist/server.js` exists (should be in build logs)
- Verify all required env vars are set

### OAuth Not Working
**Problem:** OAuth redirect fails
**Solution:**
- Verify redirect URI matches exactly in Google Console
- Wait 5 minutes after updating Google Console
- Check Render logs for OAuth errors
- Make sure `GOOGLE_REDIRECT_URI` in Render matches Google Console

### Can't Find Dockerfile
**Problem:** "Dockerfile not found" error
**Solution:**
- Make sure `Root Directory` is set to `backend`
- Or use Build Commands instead of Docker
- Check that `backend/Dockerfile` exists in your repo

---

## 📊 What to Expect

**First Deployment:**
- Build time: 5-10 minutes
- Deploy time: 1-2 minutes
- Total: ~10-12 minutes

**Subsequent Deployments:**
- Build time: 2-3 minutes
- Deploy time: 30 seconds
- Total: ~3-4 minutes

**Free Tier Notes:**
- Services spin down after 15 min of inactivity
- First request after spin-down takes ~30 seconds (cold start)
- Perfect for development and testing

---

## 🎉 Success!

Once you see "Live" status and `/health` works, you're done! 🚀

Your backend is now running on Render and ready to use.

