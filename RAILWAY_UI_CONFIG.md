# Railway UI Configuration Fix

## Problem
Railway is still running `npm ci` even though we set `installCommand` in `railway.json`. Railway's Nixpacks auto-detection might be overriding our config.

## Solution: Configure in Railway UI

Since `railway.json` isn't being respected, we need to configure the build commands directly in Railway's UI:

### Step 1: Go to Railway Settings
1. Open your Railway dashboard
2. Click on the **"steward"** service
3. Click the **"Settings"** tab

### Step 2: Configure Build Settings
1. Scroll down to **"Build"** section
2. Find **"Build Command"** field
3. Set it to: `npm install && npm run build`
4. Find **"Install Command"** field (if available)
5. Set it to: `npm install`
6. Click **"Update"** or **"Save"**

### Step 3: Verify Root Directory
1. Still in Settings, check **"Source"** section
2. Make sure **"Root Directory"** is set to: `backend`
3. If not, set it and save

### Step 4: Redeploy
1. Railway will auto-redeploy after saving
2. Go to **"Deployments"** tab
3. Watch the new build - it should now use `npm install` instead of `npm ci`

## Alternative: If Build Command Field Not Available

If Railway doesn't show separate "Install Command" and "Build Command" fields:

1. In **Settings** → **"Build"** section
2. Set **"Build Command"** to: `npm install && npm run build`
3. This will override the install phase as well

## What Should Happen

After configuring:
- ✅ Railway will use `npm install` (more forgiving than `npm ci`)
- ✅ Dependencies will install correctly
- ✅ TypeScript will compile
- ✅ Backend will start



