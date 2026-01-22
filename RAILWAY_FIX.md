# Fix Railway Configuration

## Problem
Railway is running the Expo frontend instead of the Node.js backend. The logs show it's trying to run `bunx rork start` (Expo) instead of `node dist/server.js` (backend).

## Solution: Update Railway Settings

### Step 1: Set Root Directory
1. In Railway, go to your `steward` service
2. Click **Settings** tab
3. Scroll down to **"Source"** section
4. Find **"Root Directory"** setting
5. Set it to: `backend`
6. Click **"Update"** or **"Save"**

### Step 2: Verify Build Settings
1. Still in Settings tab
2. Scroll to **"Build"** section
3. Make sure:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. If different, update them

### Step 3: Redeploy
1. Railway will auto-redeploy after saving
2. Go to **Deployments** tab
3. Wait for new deployment to complete
4. Check **Deploy Logs** to verify it's running the backend

### Step 4: Test
1. After deployment completes, test:
   ```
   https://steward-production.up.railway.app/health
   ```
2. Should return: `{"status":"ok",...}`

## Alternative: If Root Directory Setting Doesn't Work

If Railway doesn't have a Root Directory setting, you can:

1. **Move railway.json to root:**
   - The `backend/railway.json` should work, but Railway might not be reading it
   - Try moving it to the root of the repo

2. **Use railway.toml:**
   - I've created `railway.toml` in the root
   - Railway should detect this automatically

3. **Manual Build/Start Commands:**
   - In Railway Settings → Build section
   - Set Build Command: `cd backend && npm install && npm run build`
   - Set Start Command: `cd backend && npm start`

## What Should Happen

After fixing, the deploy logs should show:
- ✅ `npm install` (installing backend dependencies)
- ✅ `npm run build` (building TypeScript)
- ✅ `node dist/server.js` (starting backend server)
- ✅ `🚀 Steward backend running on port 3001`

NOT:
- ❌ `bunx rork start` (Expo command)
- ❌ Metro Bundler starting
- ❌ Expo-related messages




