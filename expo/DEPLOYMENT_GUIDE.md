# Deployment Guide - Steward AI

## 🚀 Production Deployment Steps

### Phase 1: Backend Deployment (Railway)

#### Step 1: Create Railway Account
1. Go to: https://railway.app
2. Sign up with GitHub
3. Authorize Railway to access your repositories

#### Step 2: Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository: `steward`
4. Select **"Root Directory"** → Choose `backend` folder
5. Railway will detect Node.js automatically

#### Step 3: Set Environment Variables
In Railway dashboard, go to your service → **Variables** tab, add:

```
NODE_ENV=production
PORT=3001

# OpenAI
OPENAI_API_KEY=your-openai-api-key-here

# Supabase
SUPABASE_URL=your-supabase-url-here
SUPABASE_ANON_KEY=your-supabase-anon-key-here

# Google OAuth (Web Client)
GOOGLE_CLIENT_ID=11159124068-s4jsa5od1jf594llg6c751uuvp2nduif.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Google OAuth Redirect URI (Update after getting Railway URL)
GOOGLE_REDIRECT_URI=https://your-app-name.up.railway.app/api/auth/google/callback
```

**Important:** You'll need to update `GOOGLE_REDIRECT_URI` after Railway gives you the production URL.

#### Step 4: Configure Build Settings
1. Go to **Settings** → **Build & Deploy**
2. **Build Command:** `npm install && npm run build`
3. **Start Command:** `npm start`
4. **Root Directory:** `backend`

#### Step 5: Deploy
1. Railway will auto-deploy on push to main branch
2. Or click **"Deploy"** button
3. Wait for deployment (2-3 minutes)
4. Get your production URL: `https://your-app-name.up.railway.app`

#### Step 6: Update Google OAuth Redirect URI
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your **Web Client** OAuth 2.0 Client ID
3. Add **Authorized redirect URIs:**
   - `https://your-app-name.up.railway.app/api/auth/google/callback`
4. **Save**
5. Update `GOOGLE_REDIRECT_URI` in Railway environment variables
6. Redeploy (Railway will auto-redeploy)

---

### Phase 2: Update Frontend for Production

#### Step 1: Update API Base URL
1. Open `utils/api.ts`
2. Update `API_BASE_URL` to your Railway URL:
   ```typescript
   const getApiBaseUrl = () => {
     if (__DEV__) {
       return Platform.OS === 'web' 
         ? 'http://localhost:3001/api'
         : 'http://192.168.0.103:3001/api';
     }
     return 'https://your-app-name.up.railway.app/api'; // Update this
   };
   ```

#### Step 2: Test Production API
1. Test health endpoint: `https://your-app-name.up.railway.app/health`
2. Should return: `{"status":"ok",...}`

---

### Phase 3: Update OAuth Configuration

#### Step 1: Update Google Console
1. Go to: https://console.cloud.google.com/apis/credentials
2. **Web Client:**
   - Add redirect URI: `https://your-app-name.up.railway.app/api/auth/google/callback`
3. **iOS Client:**
   - Bundle ID: `app.rork.executask-ai`
   - Add redirect URI: `rork-app://auth/callback`

#### Step 2: Test OAuth Flow
1. Open app
2. Try logging in with Google
3. Should redirect to production backend
4. Should complete authentication

---

### Phase 4: Build Mobile Apps (EAS)

#### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
eas login
```

#### Step 2: Configure EAS
```bash
cd /path/to/steward
eas build:configure
```

#### Step 3: Update app.json
Make sure `app.json` has:
```json
{
  "expo": {
    "scheme": "rork-app",
    "ios": {
      "bundleIdentifier": "app.rork.executask-ai"
    }
  }
}
```

#### Step 4: Build iOS
```bash
eas build --platform ios
```

#### Step 5: Build Android
```bash
eas build --platform android
```

#### Step 6: Submit to Stores
- **iOS:** Use App Store Connect
- **Android:** Use Google Play Console

---

## 🔍 Verification Checklist

After deployment, verify:

- [ ] Backend health check works: `https://your-app.up.railway.app/health`
- [ ] API endpoints respond correctly
- [ ] Google OAuth login works
- [ ] Tasks can be created
- [ ] Calendar integration works
- [ ] Email integration works
- [ ] Rate limiting is active
- [ ] Token refresh works
- [ ] Frontend connects to production API
- [ ] Mobile app can authenticate

---

## 🐛 Troubleshooting

### Backend not starting
- Check Railway logs
- Verify all environment variables are set
- Check build command is correct

### OAuth redirect errors
- Verify redirect URI matches exactly in Google Console
- Check Railway URL is correct
- Wait 5 minutes after updating Google Console

### API connection errors
- Verify `API_BASE_URL` in frontend
- Check CORS settings in backend
- Verify Railway service is running

### Token refresh errors
- Check refresh_token exists in database
- Verify Google OAuth scopes include offline access
- Check token expiry dates

---

## 📝 Environment Variables Reference

### Required for Production
- `NODE_ENV=production`
- `PORT=3001`
- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

### Optional
- `LOG_LEVEL=info` (for logging)

---

## 🎉 You're Live!

Once deployed, your app will be:
- ✅ Accessible from anywhere
- ✅ Using production database
- ✅ Secured with rate limiting
- ✅ Auto-refreshing tokens
- ✅ Ready for users

---

## 📚 Additional Resources

- Railway Docs: https://docs.railway.app
- EAS Build Docs: https://docs.expo.dev/build/introduction/
- Google OAuth: https://developers.google.com/identity/protocols/oauth2


