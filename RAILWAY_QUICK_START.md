# Railway Deployment - Quick Start

## 🚀 Deploy in 5 Minutes

### Step 1: Sign Up (1 min)
1. Go to: https://railway.app
2. Click **"Start a New Project"**
3. Sign up with **GitHub**
4. Authorize Railway

### Step 2: Create Project (1 min)
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Find and select: `steward` repository
4. Railway will auto-detect it's a Node.js project

### Step 3: Configure (1 min)
1. Click on your service
2. Go to **Settings** tab
3. Set **Root Directory:** `backend`
4. Railway will auto-detect build settings

### Step 4: Add Environment Variables (2 min)
Go to **Variables** tab, click **"New Variable"** for each:

```
NODE_ENV=production
PORT=3001
OPENAI_API_KEY=your-openai-api-key-here
SUPABASE_URL=your-supabase-url-here
SUPABASE_ANON_KEY=your-supabase-anon-key-here
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_REDIRECT_URI=https://your-app-name.up.railway.app/api/auth/google/callback
```

**⚠️ Important:** 
- Replace `your-app-name` in `GOOGLE_REDIRECT_URI` with your actual Railway URL
- You'll get the URL after first deployment (e.g., `https://steward-production.up.railway.app`)

### Step 5: Deploy (1 min)
1. Railway will auto-deploy when you push to main
2. Or click **"Deploy"** button
3. Wait 2-3 minutes
4. Check **Logs** tab to see deployment progress

### Step 6: Get Your URL
1. Go to **Settings** tab
2. Scroll to **"Domains"** section
3. Copy your Railway URL (e.g., `https://steward-production.up.railway.app`)

### Step 7: Update Google OAuth
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click your **Web Client** OAuth 2.0 Client ID
3. Under **"Authorized redirect URIs"**, click **"Add URI"**
4. Add: `https://your-railway-url.up.railway.app/api/auth/google/callback`
5. Click **"Save"**
6. Wait 5 minutes for changes to propagate

### Step 8: Update Railway Environment Variable
1. Go back to Railway
2. Update `GOOGLE_REDIRECT_URI` with your actual Railway URL
3. Railway will auto-redeploy

### Step 9: Test
1. Open: `https://your-railway-url.up.railway.app/health`
2. Should see: `{"status":"ok",...}`
3. ✅ Backend is live!

---

## 📝 Next Steps

1. **Update Frontend:**
   - Open `utils/api.ts`
   - Update production URL: `https://your-railway-url.up.railway.app/api`

2. **Test OAuth:**
   - Open your app
   - Try logging in with Google
   - Should work with production backend

3. **Monitor:**
   - Check Railway **Logs** tab for errors
   - Check **Metrics** tab for usage

---

## 🐛 Troubleshooting

### Build Fails
- Check **Logs** tab for error messages
- Verify all environment variables are set
- Make sure `backend` folder is correct

### OAuth Not Working
- Verify redirect URI matches exactly in Google Console
- Wait 5 minutes after updating Google Console
- Check Railway logs for OAuth errors

### API Not Responding
- Check Railway service is running (green status)
- Verify PORT is set to 3001
- Check health endpoint first

---

## ✅ Success Checklist

- [ ] Railway project created
- [ ] Environment variables added
- [ ] Backend deployed successfully
- [ ] Health endpoint works
- [ ] Google OAuth redirect URI updated
- [ ] OAuth login works
- [ ] Frontend updated with production URL

---

## 🎉 You're Live!

Your backend is now running in production! 🚀


