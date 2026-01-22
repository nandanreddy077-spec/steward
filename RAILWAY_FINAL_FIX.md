# Final Railway Fix - Manual UI Configuration Required

## Problem
Railway is still running `npm ci` in the install phase, even though we've configured `nixpacks.toml` and `railway.json`. Railway's Nixpacks auto-detection is overriding our configuration.

## Solution: Configure in Railway UI (REQUIRED)

Since Railway is not respecting the config files, you MUST configure it in the UI:

### Step 1: Open Railway Settings
1. Go to your `steward` service in Railway
2. Click **"Settings"** tab
3. Scroll down to **"Build"** section

### Step 2: Clear Build Command (if set)
1. In **"Custom Build Command"** field
2. **DELETE** any existing command (clear it completely)
3. Leave it **EMPTY**
4. Click **"Update"** or **"Save"**

### Step 3: Verify nixpacks.toml is Being Read
1. Still in Settings → Build section
2. Look at **"Providers"** - it should show "Node" and say "Edit providers in backend/nixpacks.toml"
3. This confirms Railway is reading `nixpacks.toml`

### Step 4: Force Redeploy
1. Go to **"Deployments"** tab
2. Click the three dots (⋯) on the latest deployment
3. Select **"Redeploy"** or **"Deploy Latest"**
4. This forces Railway to rebuild with the latest config

## Alternative: If nixpacks.toml Still Not Working

If Railway still runs `npm ci`, try this:

### Option A: Delete nixpacks.toml and Use UI Only
1. Delete `backend/nixpacks.toml` from your repo
2. In Railway Settings → Build
3. Set **"Custom Build Command"** to: `npm install && npm run build`
4. Save and redeploy

### Option B: Use Railway's Metal Build Environment
1. In Railway Settings → Build
2. Enable **"Use Metal Build Environment"** toggle
3. This uses a newer build system that might respect configs better
4. Save and redeploy

## What Should Happen

After fixing:
- ✅ Railway will use `npm install` (not `npm ci`)
- ✅ Dependencies will install correctly
- ✅ TypeScript will compile
- ✅ Backend will start

## Current Status

- ✅ `nixpacks.toml` is configured correctly
- ✅ `railway.json` is configured correctly  
- ✅ Build command in UI is set to `npm install && npm run build`
- ❌ Railway is still running `npm ci` in install phase (caching issue?)

## Next Steps

1. **Clear the build command in UI** (leave empty to use nixpacks.toml)
2. **Redeploy manually** to clear cache
3. If still failing, **enable Metal Build Environment**



