# Network Error Fix Guide

## Issue: "Network request failed"

The mobile app can't connect to the backend. This is a common issue with Expo development.

## Solution Options

### Option 1: Use Expo Tunnel (Recommended - Easiest)

Expo's tunnel feature makes your backend accessible even if devices aren't on the same network.

**Steps:**

1. **Start Expo with tunnel:**
   ```bash
   bun run start --tunnel
   ```
   
2. **Update API URL to use tunnel URL**
   - Expo will show a URL like: `exp://abc-123.tunnel.exp.direct:8081`
   - But for backend, we need to keep using local IP or use ngrok

**Actually, tunnel is for Expo, not backend. Let me provide better solutions:**

### Option 2: Check Network Connection (Most Likely Issue)

1. **Make sure phone and computer are on the SAME WiFi network**
   - Phone: Check WiFi settings
   - Computer: Check WiFi settings
   - They must be on the same network

2. **Check firewall settings**
   - macOS: System Preferences → Security → Firewall
   - Make sure Node.js/terminal is allowed
   - Or temporarily disable firewall to test

3. **Verify backend is accessible**
   ```bash
   curl http://192.168.0.103:3001/health
   ```
   
   **Expected**: `{"status":"ok",...}`
   
   **If this fails**: Backend isn't accessible from network

### Option 3: Update IP Address

Your IP might have changed. Check your current IP:

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Then update `utils/api.ts` with the correct IP.

### Option 4: Use ngrok (Alternative)

If network connection doesn't work, use ngrok to tunnel:

1. **Install ngrok** (if not installed):
   ```bash
   brew install ngrok
   ```

2. **Start ngrok:**
   ```bash
   ngrok http 3001
   ```

3. **Get the URL** (e.g., `https://abc123.ngrok.io`)

4. **Update API URL** in `utils/api.ts`:
   ```typescript
   return 'https://abc123.ngrok.io/api'; // Use your ngrok URL
   ```

## Quick Debug Steps

1. **Check backend is running:**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Check network IP is accessible:**
   ```bash
   curl http://192.168.0.103:3001/health
   ```

3. **Check phone and computer on same WiFi**

4. **Try using localhost for testing** (if on simulator):
   - Update `utils/api.ts` to use `localhost` temporarily
   - Only works on iOS Simulator, not physical devices

## Most Common Fix

**99% of the time, it's:**
- Phone and computer not on same WiFi network
- Firewall blocking the connection
- Backend not accessible from network

**Try this first:**
1. Make sure phone and computer on same WiFi
2. Check firewall settings
3. Test with: `curl http://192.168.0.103:3001/health`





