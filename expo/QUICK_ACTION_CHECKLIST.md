# ✅ Quick Action Checklist - Make It 100% Production Ready

**Current: 60% → Target: 100%**

Follow these steps in order. Check off each item as you complete it.

---

## 🔴 CRITICAL (Do These First - 30 minutes)

### Step 1: Verify Backend .env Configuration
- [ ] Open `backend/.env` file
- [ ] Verify all these variables exist:
  - [ ] `OPENAI_API_KEY` (your OpenAI key)
  - [ ] `SUPABASE_URL` (https://ovdlfyrtrlallbwubxlt.supabase.co)
  - [ ] `SUPABASE_ANON_KEY` (your Supabase anon key)
  - [ ] `GOOGLE_CLIENT_ID` (11159124068-s4jsa5od1jf594llg6c751uuvp2nduif.apps.googleusercontent.com)
  - [ ] `GOOGLE_CLIENT_SECRET` (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)
  - [ ] `GOOGLE_REDIRECT_URI` (will set in Step 3)
  - [ ] `PORT=3001`
- [ ] **Action:** If any are missing, add them now

**Status:** ✅ All variables appear to be present

---

### Step 2: Fix Google Cloud Console iOS Client
- [ ] Go to: https://console.cloud.google.com
- [ ] Select your project
- [ ] Navigate: **APIs & Services → Credentials**
- [ ] Find your **iOS client** (Client ID: `11159124068-s4jsa5od1jf594llg6c751uuvp2nduif`)
- [ ] Click on it to edit
- [ ] In **Bundle ID** field, enter: `app.rork.executask-ai`
- [ ] Click **Save**
- [ ] Wait 5 minutes for changes to propagate

**Why:** The Bundle ID must match your app's bundle identifier for iOS OAuth to work.

---

### Step 3: Set Up ngrok for OAuth
- [ ] Install ngrok (if not installed):
  ```bash
  brew install ngrok
  # OR download from https://ngrok.com/download
  ```
- [ ] Authenticate ngrok:
  ```bash
  ngrok config add-authtoken YOUR_AUTHTOKEN
  ```
- [ ] Start ngrok in a terminal:
  ```bash
  ngrok http 3001
  ```
- [ ] Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)
- [ ] Update `backend/.env`:
  ```
  GOOGLE_REDIRECT_URI=https://YOUR_NGROK_URL.ngrok-free.app/api/auth/google/callback
  ```
- [ ] Update Google Cloud Console:
  - Go to **APIs & Services → Credentials**
  - Edit your **Web Client**
  - Under **Authorized redirect URIs**, add:
    ```
    https://YOUR_NGROK_URL.ngrok-free.app/api/auth/google/callback
    ```
  - Click **Save**

**⚠️ Important:** ngrok URLs change each restart. For production, use a fixed domain.

---

### Step 4: Set Up Supabase Database
- [ ] Go to: https://supabase.com/dashboard
- [ ] Select project: `ovdlfyrtrlallbwubxlt`
- [ ] Click **SQL Editor** in left sidebar
- [ ] Click **New Query**
- [ ] Open `backend/database/schema.sql` in your editor
- [ ] Copy ALL contents
- [ ] Paste into Supabase SQL Editor
- [ ] Click **Run** (or press Cmd/Ctrl + Enter)
- [ ] Verify tables created:
  - [ ] Go to **Table Editor**
  - [ ] Should see: `users`, `tasks`, `activity_log`, `user_settings`

---

## 🟡 IMPORTANT (Do These Next - 1 hour)

### Step 5: Test Backend Server
- [ ] Open terminal, navigate to backend:
  ```bash
  cd backend
  npm run dev
  ```
- [ ] Should see: `🚀 Steward backend running on port 3001`
- [ ] Test health endpoint (in another terminal):
  ```bash
  curl http://localhost:3001/health
  ```
- [ ] Should return: `{"status":"ok",...}`

---

### Step 6: Test OAuth Flow
- [ ] Start backend: `cd backend && npm run dev`
- [ ] Start ngrok: `ngrok http 3001` (in separate terminal)
- [ ] Start frontend: `bun run start` (in project root)
- [ ] Open app on your phone
- [ ] Click "Continue with Google"
- [ ] Complete OAuth flow
- [ ] Should redirect back to app successfully
- [ ] User should be logged in

**If OAuth fails:**
- Check backend terminal for errors
- Verify ngrok URL matches Google Console
- Check Bundle ID is set correctly

---

### Step 7: Test Calendar Integration
- [ ] In app, type: "Block focus time tomorrow from 2pm to 4pm"
- [ ] Execute the task
- [ ] Check Google Calendar for the new event
- [ ] Event should appear with correct time

**Test more operations:**
- [ ] "Move my 3pm meeting to tomorrow"
- [ ] "Cancel my meeting at 2pm"
- [ ] "What's on my calendar today?"

---

### Step 8: Test Email Integration
- [ ] In app, type: "Summarize my inbox"
- [ ] Execute the task
- [ ] Should read emails from Gmail
- [ ] Should provide summary

**Test more operations:**
- [ ] "Draft an email to john@example.com about the meeting"
- [ ] "Send an email to team@example.com"

---

## 🟢 POLISH (Do These for Production - 2-3 hours)

### Step 9: Error Handling & Validation
- [ ] Add input validation to all API endpoints
- [ ] Improve error messages (user-friendly)
- [ ] Add retry logic for failed operations
- [ ] Handle offline mode gracefully

---

### Step 10: Security Enhancements
- [ ] Add API rate limiting
- [ ] Implement token refresh mechanism
- [ ] Handle token expiration gracefully
- [ ] Update CORS for production domain
- [ ] Verify tokens stored securely

---

### Step 11: Production Environment Setup
- [ ] Choose deployment platform (Railway/Render/Vercel)
- [ ] Deploy backend to production
- [ ] Set production environment variables
- [ ] Update frontend API URL for production
- [ ] Update OAuth redirect URIs in Google Console
- [ ] Set up production database (or use existing)

---

### Step 12: Testing & QA
- [ ] Write unit tests for critical functions
- [ ] Test all user flows end-to-end
- [ ] Test error scenarios
- [ ] Test edge cases
- [ ] Manual testing checklist:
  - [ ] OAuth login works
  - [ ] Tasks can be created
  - [ ] Calendar events created
  - [ ] Emails read/sent
  - [ ] Error handling works
  - [ ] Offline mode works
  - [ ] Token refresh works

---

### Step 13: Deployment
- [ ] Build iOS app: `eas build --platform ios`
- [ ] Build Android app: `eas build --platform android`
- [ ] Submit to App Store: `eas submit --platform ios`
- [ ] Submit to Google Play: `eas submit --platform android`

---

### Step 14: Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure performance monitoring
- [ ] Set up analytics
- [ ] Configure alerts

---

## 📊 Progress Tracker

**Phase 1: Critical Issues (Steps 1-4)**
- [ ] Step 1: Backend .env ✅ (already done)
- [ ] Step 2: Google Console iOS Bundle ID
- [ ] Step 3: ngrok setup
- [ ] Step 4: Supabase database

**Phase 2: Testing (Steps 5-8)**
- [ ] Step 5: Backend server test
- [ ] Step 6: OAuth flow test
- [ ] Step 7: Calendar integration test
- [ ] Step 8: Email integration test

**Phase 3: Production (Steps 9-14)**
- [ ] Step 9: Error handling
- [ ] Step 10: Security
- [ ] Step 11: Production environment
- [ ] Step 12: Testing & QA
- [ ] Step 13: Deployment
- [ ] Step 14: Monitoring

---

## 🎯 Quick Win Path

**To get to 80% quickly, do these 5 steps:**

1. ✅ Step 1: Backend .env (already done)
2. ⏳ Step 2: Fix Google Console iOS Bundle ID (5 min)
3. ⏳ Step 3: Set up ngrok (10 min)
4. ⏳ Step 4: Set up Supabase database (5 min)
5. ⏳ Step 6: Test OAuth flow (10 min)

**Total time: ~30 minutes to get to 80%**

---

## 🆘 Need Help?

**Common Issues:**

1. **OAuth not working?**
   - Check ngrok URL matches Google Console
   - Verify Bundle ID is set
   - Check backend logs

2. **Database connection failed?**
   - Verify Supabase URL and key
   - Check if schema was run
   - Verify network connectivity

3. **Mobile app can't connect?**
   - Check local IP is correct (192.168.0.103)
   - Verify backend is running
   - Check firewall settings

---

**Last Updated:** Now
**Start with Step 2** (Google Console iOS Bundle ID)




