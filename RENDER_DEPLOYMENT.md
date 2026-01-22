# 🚀 Deploy Steward Backend to Render

## Why Render?
- ✅ **Easier setup** than Railway
- ✅ **Free tier** available
- ✅ **Automatic deployments** from GitHub
- ✅ **Better Docker support**
- ✅ **Simple configuration**

---

## Quick Setup (5 minutes)

### Step 1: Sign Up
1. Go to: https://render.com
2. Click **"Get Started for Free"**
3. Sign up with **GitHub** (recommended)

### Step 2: Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `nandanreddy077-spec/steward`
3. Click **"Connect"**

### Step 3: Configure Service
Fill in the following:

**Basic Settings:**
- **Name:** `steward-backend`
- **Region:** Choose closest to you (e.g., `Oregon (US West)`)
- **Branch:** `main`
- **Root Directory:** `backend`

**Build & Deploy:**
- **Environment:** `Docker`
- **Dockerfile Path:** `backend/Dockerfile` (or leave empty if Dockerfile is in root)
- **Docker Context:** `backend` (or leave empty)

**OR use Build Command (Alternative):**
- **Build Command:** `npm install --legacy-peer-deps --include=dev && npm run build`
- **Start Command:** `node dist/server.js`

### Step 4: Add Environment Variables
Click **"Advanced"** → **"Environment Variables"**, then add:

```
NODE_ENV=production
PORT=10000
OPENAI_API_KEY=your-openai-api-key-here
SUPABASE_URL=your-supabase-url-here
SUPABASE_ANON_KEY=your-supabase-anon-key-here
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_REDIRECT_URI=https://steward-backend.onrender.com/api/auth/google/callback
```

**⚠️ Important:** 
- Replace `your-*-here` with your actual values
- The `GOOGLE_REDIRECT_URI` will be your Render URL + `/api/auth/google/callback`
- You'll get the URL after first deployment (e.g., `https://steward-backend.onrender.com`)

### Step 5: Deploy
1. Click **"Create Web Service"**
2. Render will automatically:
   - Clone your repo
   - Build using Dockerfile
   - Deploy your service
3. Wait 5-10 minutes for first deployment

### Step 6: Get Your URL
1. Once deployed, you'll see your service URL
2. It will be: `https://steward-backend.onrender.com` (or similar)
3. Test it: `https://steward-backend.onrender.com/health`

### Step 7: Update Google OAuth
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click your **Web Client** OAuth 2.0 Client ID
3. Under **"Authorized redirect URIs"**, add:
   ```
   https://steward-backend.onrender.com/api/auth/google/callback
   ```
4. Click **"Save"**
5. Wait 5 minutes for changes to propagate

### Step 8: Update Render Environment Variable
1. Go back to Render dashboard
2. Click **"Environment"** tab
3. Update `GOOGLE_REDIRECT_URI` with your actual Render URL
4. Render will auto-redeploy

---

## Alternative: Use Build Commands (No Dockerfile)

If Dockerfile doesn't work, use these settings:

**Build Command:**
```bash
cd backend && npm install --legacy-peer-deps --include=dev && npm run build
```

**Start Command:**
```bash
cd backend && node dist/server.js
```

**Root Directory:** Leave empty (or set to `backend`)

---

## Update Frontend

Once backend is deployed, update `utils/api.ts`:

```typescript
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://steward-backend.onrender.com/api';
```

Or set environment variable:
```
EXPO_PUBLIC_API_URL=https://steward-backend.onrender.com/api
```

---

## Troubleshooting

### Build Fails
- Check **"Logs"** tab in Render dashboard
- Verify all environment variables are set
- Make sure `Root Directory` is set to `backend`

### Service Crashes
- Check **"Logs"** tab for error messages
- Verify `PORT` is set (Render uses `PORT` env var automatically)
- Check if `dist/server.js` exists after build

### OAuth Not Working
- Verify redirect URI matches exactly in Google Console
- Wait 5 minutes after updating Google Console
- Check Render logs for OAuth errors

---

## Render vs Railway

| Feature | Render | Railway |
|---------|--------|---------|
| Setup Difficulty | ⭐ Easy | ⭐⭐ Medium |
| Free Tier | ✅ Yes | ✅ Yes |
| Docker Support | ✅ Excellent | ✅ Good |
| Auto Deploy | ✅ Yes | ✅ Yes |
| Build Logs | ✅ Clear | ✅ Clear |
| Configuration | Simple | More complex |

---

## ✅ Success Checklist

- [ ] Render account created
- [ ] Web service created
- [ ] Environment variables added
- [ ] Service deployed successfully
- [ ] Health endpoint works (`/health`)
- [ ] Google OAuth redirect URI updated
- [ ] OAuth login works
- [ ] Frontend updated with production URL

---

## 🎉 You're Live!

Your backend is now running on Render! 🚀

**Next Steps:**
1. Test all API endpoints
2. Update frontend API URL
3. Test OAuth flow
4. Monitor logs for any issues

