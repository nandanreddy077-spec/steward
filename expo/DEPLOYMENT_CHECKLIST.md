# Deployment Checklist

## ✅ Pre-Deployment

- [x] Backend code is production-ready
- [x] Environment variables documented
- [x] Rate limiting implemented
- [x] Token refresh implemented
- [x] Input validation added
- [x] Error handling improved
- [x] Database schema set up
- [x] Security warnings fixed

## 🚀 Deployment Steps

### Step 1: Deploy Backend to Railway

1. [ ] Create Railway account at https://railway.app
2. [ ] Create new project from GitHub repo
3. [ ] Set root directory to `backend`
4. [ ] Add all environment variables:
   - [ ] `NODE_ENV=production`
   - [ ] `PORT=3001`
   - [ ] `OPENAI_API_KEY`
   - [ ] `SUPABASE_URL`
   - [ ] `SUPABASE_ANON_KEY`
   - [ ] `GOOGLE_CLIENT_ID`
   - [ ] `GOOGLE_CLIENT_SECRET`
   - [ ] `GOOGLE_REDIRECT_URI` (update after getting Railway URL)
5. [ ] Configure build settings:
   - [ ] Build Command: `npm install && npm run build`
   - [ ] Start Command: `npm start`
6. [ ] Deploy and get production URL
7. [ ] Test health endpoint: `https://your-app.up.railway.app/health`

### Step 2: Update Google OAuth

1. [ ] Go to Google Cloud Console
2. [ ] Update Web Client redirect URI:
   - [ ] Add: `https://your-app.up.railway.app/api/auth/google/callback`
3. [ ] Update Railway environment variable:
   - [ ] Set `GOOGLE_REDIRECT_URI` to production URL
4. [ ] Redeploy backend
5. [ ] Wait 5 minutes for Google changes to propagate

### Step 3: Update Frontend

1. [ ] Update `utils/api.ts`:
   - [ ] Set `EXPO_PUBLIC_API_URL` environment variable OR
   - [ ] Update fallback URL in `getApiBaseUrl()`
2. [ ] Test API connection from app
3. [ ] Verify OAuth flow works

### Step 4: Update CORS (if needed)

1. [ ] If using custom domain, add to `FRONTEND_URL` in Railway
2. [ ] Update CORS origins in `backend/src/server.ts` if needed

### Step 5: Test Production

1. [ ] Test health endpoint
2. [ ] Test OAuth login
3. [ ] Test task creation
4. [ ] Test calendar integration
5. [ ] Test email integration
6. [ ] Test rate limiting (try 11 requests quickly)
7. [ ] Test token refresh (wait for token expiry)

### Step 6: Build Mobile Apps (Optional)

1. [ ] Install EAS CLI: `npm install -g eas-cli`
2. [ ] Login: `eas login`
3. [ ] Configure: `eas build:configure`
4. [ ] Build iOS: `eas build --platform ios`
5. [ ] Build Android: `eas build --platform android`
6. [ ] Submit to app stores

## 🔍 Post-Deployment Verification

- [ ] Backend is accessible
- [ ] Health check returns OK
- [ ] OAuth login works
- [ ] Tasks can be created
- [ ] Calendar events are created
- [ ] Emails are sent
- [ ] Rate limiting works
- [ ] Token refresh works
- [ ] Error messages are user-friendly
- [ ] Logs are accessible in Railway

## 📝 Environment Variables Template

Copy this to Railway:

```
NODE_ENV=production
PORT=3001
OPENAI_API_KEY=your-key-here
SUPABASE_URL=https://ovdlfyrtrlallbwubxlt.supabase.co
SUPABASE_ANON_KEY=your-key-here
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://your-app.up.railway.app/api/auth/google/callback
```

## 🎉 You're Live!

Once all steps are complete, your app is production-ready!




