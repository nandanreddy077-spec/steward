# Fix ngrok "1 Simultaneous Session" Error

## Problem
You're getting: `ERR_NGROK_108: Your account is limited to 1 simultaneous ngrok agent sessions`

This means there's already an ngrok session running somewhere.

## Solution Options

### Option 1: Check ngrok Dashboard (Recommended)
1. Go to: https://dashboard.ngrok.com/agents
2. Look for active sessions
3. Click "Stop" on any active sessions
4. Then try `ngrok http 3001` again

### Option 2: Kill All ngrok Processes
```bash
# Kill all ngrok processes
pkill -f ngrok

# Wait a moment
sleep 2

# Try starting ngrok again
ngrok http 3001
```

### Option 3: Use a Different Port (If you have another service)
If you have another ngrok session running for a different service, you can:
1. Keep that one running
2. Use a different approach for OAuth (see Alternative Solutions below)

### Option 4: Upgrade ngrok Plan
- Free tier: 1 simultaneous session
- Paid plans: Multiple sessions
- Upgrade at: https://dashboard.ngrok.com/billing/choose-a-plan

## Alternative Solutions (If ngrok doesn't work)

### Option A: Use Expo Tunnel
Instead of ngrok, you can use Expo's built-in tunnel:
```bash
bun run start -- --tunnel
```
This creates a tunnel automatically, but you'll need to update the redirect URI.

### Option B: Use Localhost with Simulator
If testing on iOS Simulator or Android Emulator:
- Use `http://localhost:3001` directly
- Update `GOOGLE_REDIRECT_URI` to `http://localhost:3001/api/auth/google/callback`
- Add this to Google Console redirect URIs

### Option C: Use Your Public IP (Not Recommended for Production)
Only works if your phone and computer are on the same network:
- Use your local IP: `http://192.168.0.103:3001`
- Not secure for production, but works for testing

## Quick Fix Steps

1. **Check Dashboard:**
   - Visit: https://dashboard.ngrok.com/agents
   - Stop any active sessions

2. **Kill Local Processes:**
   ```bash
   pkill -f ngrok
   ```

3. **Start Fresh:**
   ```bash
   ngrok http 3001
   ```

4. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok-free.app`)

5. **Update backend/.env:**
   ```
   GOOGLE_REDIRECT_URI=https://YOUR_NGROK_URL.ngrok-free.app/api/auth/google/callback
   ```

6. **Update Google Console:**
   - Go to Google Cloud Console → Credentials
   - Edit Web Client
   - Add redirect URI: `https://YOUR_NGROK_URL.ngrok-free.app/api/auth/google/callback`
   - Save

## Verify It's Working

After starting ngrok, you should see:
```
ngrok

Session Status                online
Account                       Your Name
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:3001
```

The `Forwarding` line shows your public URL.




