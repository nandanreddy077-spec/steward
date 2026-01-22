# Quick Fix: Network Error

## The Problem
"Network request failed" - App can't connect to backend

## Quick Solutions

### Solution 1: Check Phone and Computer on Same WiFi (Most Common)

1. **Check your phone WiFi:**
   - Settings → WiFi
   - Note the network name

2. **Check your computer WiFi:**
   - System Preferences → Network
   - Note the network name

3. **They must match!**
   - If different, connect phone to same network as computer

### Solution 2: Test Backend from Network

Open a new terminal and test:

```bash
# From your computer, test if backend is accessible
curl http://192.168.0.103:3001/health
```

**If this fails**: Backend isn't accessible from network

**If this works**: Problem is in the app configuration

### Solution 3: Check Firewall (macOS)

1. **System Preferences → Security & Privacy → Firewall**
2. **If firewall is ON:**
   - Click "Firewall Options"
   - Make sure "Block all incoming connections" is OFF
   - Or temporarily disable firewall to test

### Solution 4: Use Simulator Instead (Quick Test)

If you're testing on iOS Simulator:
- Simulator can use `localhost`
- Update `utils/api.ts` to use `localhost` temporarily
- This only works on simulator, not real device

### Solution 5: Use ngrok (Alternative)

If network doesn't work, use ngrok tunnel:

```bash
# Install ngrok (if not installed)
brew install ngrok

# Start ngrok tunnel
ngrok http 3001

# Copy the URL (e.g., https://abc123.ngrok.io)
# Update utils/api.ts to use this URL
```

## What to Try First

1. ✅ Make sure phone and computer on same WiFi
2. ✅ Test backend from network: `curl http://192.168.0.103:3001/health`
3. ✅ Check firewall settings
4. ✅ Try using simulator with localhost

## Expected Behavior

**If everything works:**
- Backend accessible: `curl http://192.168.0.103:3001/health` returns JSON
- Phone and computer on same WiFi
- No firewall blocking
- App can connect to backend

Let me know which solution works!





