# OAuth Tunnel Solution

## The Problem

When OAuth redirects to `http://localhost:3001/api/auth/google/callback`, the mobile browser can't access it because `localhost` on the phone refers to the device itself, not your development machine.

## Solution: Use ngrok Tunnel

We'll use ngrok to create a public URL that tunnels to your local backend.

### Step 1: Install ngrok

**Option A: Using Homebrew (macOS)**
```bash
brew install ngrok/ngrok/ngrok
```

**Option B: Download from website**
1. Go to https://ngrok.com/download
2. Download for macOS
3. Extract and add to PATH, or use directly

**Option C: Using npm (if you prefer)**
```bash
npm install -g ngrok
```

### Step 2: Start Backend

```bash
cd backend
npm run dev
```

Backend should be running on port 3001.

### Step 3: Start ngrok Tunnel

In a **new terminal window**:

```bash
ngrok http 3001
```

You'll see output like:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3001
```

**Copy the HTTPS URL** (e.g., `https://abc123.ngrok-free.app`)

### Step 4: Update Google Cloud Console

1. Go to https://console.cloud.google.com
2. Select your project "Steward"
3. Go to **APIs & Services** → **Credentials**
4. Click your **OAuth 2.0 Client ID**
5. Under **Authorized redirect URIs**, add:
   ```
   https://abc123.ngrok-free.app/api/auth/google/callback
   ```
   (Replace `abc123.ngrok-free.app` with your actual ngrok URL)
6. Click **Save**

### Step 5: Update Backend .env

Update `backend/.env`:

```env
GOOGLE_REDIRECT_URI=https://abc123.ngrok-free.app/api/auth/google/callback
```

(Replace with your actual ngrok URL)

### Step 6: Restart Backend

The backend should pick up the new redirect URI from the .env file.

### Step 7: Test OAuth

1. Open app on phone
2. Click "Continue with Google"
3. Complete OAuth
4. Should redirect successfully!

## Important Notes

⚠️ **ngrok URL changes each time** (unless you have a paid plan with fixed domain)

- Free ngrok URLs change every time you restart ngrok
- You'll need to update Google Cloud Console redirect URI each time
- Or use ngrok's fixed domain feature (paid)

## Alternative: Use Expo Tunnel

Expo also has a tunnel feature:

```bash
expo start --tunnel
```

But this tunnels the Expo dev server, not your backend. You'd still need ngrok for the backend.

## Production Solution

For production, deploy your backend to:
- Railway
- Render
- Vercel
- AWS
- Any cloud provider

Then use the production URL in Google Cloud Console.

---

**Quick Start:**
1. Install ngrok: `brew install ngrok/ngrok/ngrok`
2. Start backend: `cd backend && npm run dev`
3. Start ngrok: `ngrok http 3001` (in new terminal)
4. Copy ngrok URL
5. Update Google Cloud Console redirect URI
6. Update backend .env
7. Restart backend
8. Test!





