# Setup ngrok for OAuth (2 minutes)

## Step 1: Sign up for ngrok (Free)

1. Go to https://dashboard.ngrok.com/signup
2. Sign up with your email (free account works fine)
3. Verify your email

## Step 2: Get Your Authtoken

1. After signing up, go to: https://dashboard.ngrok.com/get-started/your-authtoken
2. Copy your authtoken (looks like: `2abc123def456ghi789jkl012mno345pq_6r7s8t9u0v1w2x3y4z5`)

## Step 3: Configure ngrok

Run this command (replace with your actual authtoken):

```bash
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

## Step 4: Start ngrok Tunnel

```bash
ngrok http 3001
```

You should now see:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3001
```

## Step 5: Continue with OAuth Setup

Follow the steps in `QUICK_FIX_OAUTH.md` to:
1. Update Google Cloud Console with ngrok URL
2. Update backend .env with ngrok URL
3. Restart backend
4. Test OAuth

---

**That's it!** ngrok is free and takes 2 minutes to set up.

