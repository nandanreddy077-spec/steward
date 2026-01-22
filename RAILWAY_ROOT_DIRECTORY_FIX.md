# Fix Railway Root Directory Issue

## Problem
Railway is building from the root directory instead of the `backend` directory, causing:
- ❌ TypeScript can't find `express-rate-limit` module
- ❌ Wrong `package.json` being used (Expo app instead of backend)
- ❌ Build fails with `TS2307: Cannot find module 'express-rate-limit'`

## Solution: Set Root Directory in Railway

### Step 1: Go to Railway Settings
1. Open your Railway dashboard
2. Click on the **"steward"** service
3. Click the **"Settings"** tab (top right)

### Step 2: Find Root Directory Setting
1. Scroll down to find **"Source"** section
2. Look for **"Root Directory"** field
3. If you don't see it, look for **"Service Source"** or **"Build Settings"**

### Step 3: Set Root Directory
1. In the **"Root Directory"** field, enter: `backend`
2. Click **"Update"** or **"Save"**

### Step 4: Alternative - If Root Directory Setting Not Available

If Railway doesn't show a Root Directory setting, update the build commands manually:

1. In **Settings** → **"Build"** section
2. Update **"Build Command"** to:
   ```
   cd backend && npm install && npm run build
   ```
3. Update **"Start Command"** to:
   ```
   cd backend && npm start
   ```
4. Click **"Update"** or **"Save"**

### Step 5: Redeploy
1. Railway will automatically trigger a new deployment
2. Go to **"Deployments"** tab
3. Wait for the build to complete (2-3 minutes)
4. Check the **"Deploy Logs"** - you should now see:
   - ✅ Installing backend dependencies
   - ✅ TypeScript compilation succeeds
   - ✅ Backend server starts

### Step 6: Verify
After deployment, test:
```
https://steward-production.up.railway.app/health
```

Should return:
```json
{"status":"ok","timestamp":"...","environment":"production"}
```

## What Should Happen

**Before Fix:**
- ❌ Building from root directory
- ❌ Using root `package.json` (Expo app)
- ❌ Error: `Cannot find module 'express-rate-limit'`

**After Fix:**
- ✅ Building from `backend` directory
- ✅ Using `backend/package.json`
- ✅ All dependencies installed correctly
- ✅ TypeScript compiles successfully
- ✅ Backend server starts

## Commit Changes

After fixing in Railway, commit the updated `railway.json`:
```bash
git add backend/railway.json
git commit -m "Fix Railway root directory configuration"
git push
```



