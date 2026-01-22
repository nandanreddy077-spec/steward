# Railway Dockerfile Setup Guide

## Problem
Railway is detecting `bun` from the root `package.json` and using it instead of `npm`, which causes the TypeScript build to never run, resulting in `dist/server.js` not being created.

## Solution: Switch to Dockerfile

### Step 1: Go to Railway Dashboard
1. Navigate to https://railway.app
2. Select your project
3. Click on the **"steward"** service

### Step 2: Open Settings
1. Click on the **"Settings"** tab at the top
2. Scroll down to the **"Build"** section

### Step 3: Change Builder
1. Find **"Builder"** dropdown (currently shows "Nixpacks")
2. Change it to **"Dockerfile"**
3. Railway will automatically save and redeploy

### Step 4: Verify Deployment
1. Go to **"Deploy Logs"** tab
2. You should see Docker build steps:
   - `FROM node:20-alpine`
   - `RUN npm install --legacy-peer-deps --include=dev`
   - `RUN npm run build`
   - `RUN ls -la dist/ && test -f dist/server.js`
3. The deployment should succeed with `dist/server.js` created

## Why Dockerfile Works
- Uses `npm` explicitly (not `bun`)
- Installs devDependencies (TypeScript)
- Runs `npm run build` to compile TypeScript
- Verifies `dist/server.js` exists before starting
- Full control over the build process

## Alternative: If Dockerfile Doesn't Work
If you can't switch to Dockerfile, the `nixpacks.toml` has been updated to:
- Force npm usage
- Run build in both install and build phases
- Verify build output exists

But **Dockerfile is the recommended solution** for reliability.

