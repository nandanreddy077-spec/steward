# Quick Start Guide - Next Steps

## ✅ Backend is Running!

Your backend server is now running on `http://localhost:3001`

## Step 1: Set Up Database (5 minutes)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click on your project (or create one if you haven't)
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Open the file `backend/database/schema.sql` in your editor
6. Copy ALL the contents
7. Paste into the Supabase SQL Editor
8. Click **Run** (or press Cmd/Ctrl + Enter)
9. You should see "Success. No rows returned"
10. Verify tables were created:
    - Go to **Table Editor** in left sidebar
    - You should see: `users`, `tasks`, `activity_log`, `user_settings`

## Step 2: Test the Backend API (2 minutes)

Open a new terminal and test:

```bash
# Health check
curl http://localhost:3001/health

# Test AI parsing (this is the cool part!)
curl -X POST http://localhost:3001/api/tasks/parse \
  -H "Content-Type: application/json" \
  -d '{"command": "Move my 3pm meeting to tomorrow"}'
```

You should see a JSON response with the parsed intent!

## Step 3: Start the Frontend

In a new terminal:

```bash
cd /Users/nandanreddyavanaganti/steward
bun run start
```

This will start the Expo dev server.

## Step 4: Test in the App

1. Open the app on your phone/simulator
2. Go to the **Command** tab
3. Type: "Move my 3pm meeting to tomorrow"
4. Click **Execute**
5. You should see it parse via AI and show a preview!

## What's Working Now

✅ Backend API running
✅ AI-powered command parsing
✅ Database schema ready
✅ Frontend connected to backend
✅ Fallback to local parsing if backend unavailable

## Next: Test OAuth Flow

Once database is set up, we can test Google OAuth:
1. Get OAuth URL: `GET http://localhost:3001/api/auth/google`
2. Open the URL in browser
3. Authorize with Google
4. You'll be redirected back with tokens

---

**Current Status**: Backend ✅ | Database ⏳ | Frontend ⏳

