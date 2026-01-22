# 🚀 Production Ready: Step-by-Step Guide

**Current Status: 60% → Target: 100%**

This guide will take you through every step needed to make Steward production-ready.

---

## 📋 Pre-Flight Checklist

Before starting, verify you have:
- ✅ Node.js 18+ installed
- ✅ Google Cloud Console access
- ✅ Supabase account
- ✅ OpenAI API key
- ✅ ngrok account (for OAuth testing)

---

## Phase 1: Fix Critical Issues (Priority 1)

### Step 1: Verify Backend Dependencies ✅

**Status:** Already installed (node_modules exists)

**Verify:**
```bash
cd backend
npm list --depth=0
```

If you see errors, reinstall:
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

---

### Step 2: Configure Backend Environment Variables

**Current Status:** `.env` file exists, but needs verification

**Action Required:**

1. **Check if .env has all required variables:**
```bash
cd backend
cat .env
```

2. **Required variables (copy from your credentials):**
```env
# OpenAI
OPENAI_API_KEY=your-openai-api-key-here

# Supabase
SUPABASE_URL=https://ovdlfyrtrlallbwubxlt.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92ZGxmeXJ0cmxhbGxid3VieGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NTU0MDEsImV4cCI6MjA4MzAzMTQwMX0.lnUICImJMKt2MxZdExSHYaZZqMQx4Fle7WFzUsuFm8w

# Google OAuth (Web Client)
GOOGLE_CLIENT_ID=11159124068-s4jsa5od1jf594llg6c751uuvp2nduif.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Google OAuth Redirect URI (use ngrok for mobile)
GOOGLE_REDIRECT_URI=https://YOUR_NGROK_URL.ngrok-free.app/api/auth/google/callback

# Server
PORT=3001
NODE_ENV=development
```

3. **If .env is missing variables, add them:**
```bash
cd backend
# Edit .env file and add missing variables
```

**⚠️ Important:** 
- Replace `YOUR_NGROK_URL` with your actual ngrok URL
- Keep `.env` file secure (never commit to git)

---

### Step 3: Fix Google Cloud Console iOS Client

**Issue:** Bundle ID field is empty in iOS OAuth client

**Action Required:**

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com
   - Select your project

2. **Navigate to OAuth Credentials:**
   - APIs & Services → Credentials
   - Find your **iOS client** (Client ID: `11159124068-s4jsa5od1jf594llg6c751uuvp2nduif.apps.googleusercontent.com`)

3. **Add Bundle ID:**
   - Click on the iOS client
   - In the **Bundle ID** field, enter: `app.rork.executask-ai`
   - Click **Save**

4. **Wait 5 minutes** for changes to propagate

**✅ Verification:**
- Bundle ID should match `app.json` → `ios.bundleIdentifier`

---

### Step 4: Verify Mobile Network Configuration

**Current Status:** API endpoint is set to `192.168.0.103:3001` ✅

**Action Required:**

1. **Verify your local IP matches:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

2. **If IP is different, update `utils/api.ts`:**
   - Current: `192.168.0.103:3001`
   - If your IP is different, update line 12 in `utils/api.ts`

3. **Ensure backend listens on all interfaces:**
   - Backend should listen on `0.0.0.0` (already configured ✅)

---

## Phase 2: Database Setup (Priority 2)

### Step 5: Set Up Supabase Database

**Action Required:**

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project: `ovdlfyrtrlallbwubxlt`

2. **Run Database Schema:**
   - Click **SQL Editor** in left sidebar
   - Click **New Query**
   - Open `backend/database/schema.sql` in your editor
   - Copy ALL contents
   - Paste into Supabase SQL Editor
   - Click **Run** (or Cmd/Ctrl + Enter)

3. **Verify Tables Created:**
   - Go to **Table Editor** in left sidebar
   - You should see:
     - ✅ `users`
     - ✅ `tasks`
     - ✅ `activity_log`
     - ✅ `user_settings`

**✅ Verification:**
```bash
# Test database connection
curl http://localhost:3001/health
```

---

## Phase 3: OAuth Flow Testing (Priority 3)

### Step 6: Set Up ngrok for OAuth

**Why:** Mobile devices need a public HTTPS URL for OAuth callbacks

**Action Required:**

1. **Install ngrok (if not installed):**
```bash
# macOS
brew install ngrok

# Or download from: https://ngrok.com/download
```

2. **Authenticate ngrok:**
```bash
ngrok config add-authtoken YOUR_NGROK_AUTHTOKEN
```

3. **Start ngrok tunnel:**
```bash
ngrok http 3001
```

4. **Copy the HTTPS URL:**
   - Example: `https://8fcba2112409.ngrok-free.app`
   - Update `GOOGLE_REDIRECT_URI` in `backend/.env`:
     ```
     GOOGLE_REDIRECT_URI=https://8fcba2112409.ngrok-free.app/api/auth/google/callback
     ```

5. **Update Google Cloud Console:**
   - Go to Google Cloud Console → Credentials
   - Edit your **Web Client**
   - Under **Authorized redirect URIs**, add:
     ```
     https://YOUR_NGROK_URL.ngrok-free.app/api/auth/google/callback
     ```
   - Click **Save**

**⚠️ Note:** ngrok URLs change each time you restart. For production, use a fixed domain.

---

### Step 7: Test OAuth Flow End-to-End

**Action Required:**

1. **Start Backend:**
```bash
cd backend
npm run dev
```

2. **Start ngrok (in separate terminal):**
```bash
ngrok http 3001
```

3. **Start Frontend:**
```bash
# In project root
bun run start
```

4. **Test OAuth:**
   - Open app on your phone
   - Click "Continue with Google"
   - Complete OAuth flow
   - Should redirect back to app successfully

**✅ Success Indicators:**
- OAuth completes without errors
- User is logged in
- Tokens are stored in database

---

## Phase 4: Real Integrations Testing (Priority 4)

### Step 8: Test Calendar Integration

**Action Required:**

1. **Create a test task:**
   - In app, type: "Block focus time tomorrow from 2pm to 4pm"
   - Execute the task

2. **Verify:**
   - Check Google Calendar for the new event
   - Event should appear with correct time

3. **Test other operations:**
   - "Move my 3pm meeting to tomorrow"
   - "Cancel my meeting at 2pm"
   - "What's on my calendar today?"

**✅ Success Indicators:**
- Events created in Google Calendar
- Events rescheduled correctly
- Events deleted when requested

---

### Step 9: Test Email Integration

**Action Required:**

1. **Create a test task:**
   - In app, type: "Summarize my inbox"
   - Execute the task

2. **Verify:**
   - Should read emails from Gmail
   - Should provide summary

3. **Test other operations:**
   - "Draft an email to john@example.com about the meeting"
   - "Send an email to team@example.com"

**✅ Success Indicators:**
- Emails read from Gmail
- Summaries generated
- Drafts created
- Emails sent successfully

---

## Phase 5: Production Hardening (Priority 5)

### Step 10: Error Handling & Validation

**Action Required:**

1. **Add input validation:**
   - Validate all API inputs
   - Sanitize user commands
   - Handle edge cases

2. **Improve error messages:**
   - User-friendly error messages
   - Clear error states in UI
   - Retry mechanisms

3. **Add logging:**
   - Error logging
   - Activity logging
   - Debug logging (dev only)

---

### Step 11: Security Enhancements

**Action Required:**

1. **API Rate Limiting:**
   - Add rate limiting middleware
   - Prevent abuse

2. **Token Security:**
   - Verify tokens are stored securely
   - Implement token refresh
   - Handle token expiration

3. **CORS Configuration:**
   - Update CORS for production domain
   - Remove localhost from production

4. **Environment Variables:**
   - Use different keys for production
   - Never commit .env to git

---

### Step 12: Production Environment Setup

**Action Required:**

1. **Deploy Backend:**
   - Choose platform: Railway, Render, or Vercel
   - Set environment variables
   - Deploy backend code

2. **Update Frontend API URL:**
   - Update `utils/api.ts` production URL
   - Remove local IP references

3. **Update OAuth Redirect URIs:**
   - Update Google Console with production URL
   - Update backend .env with production URL

4. **Set Up Production Database:**
   - Create production Supabase project (or use existing)
   - Run schema on production database
   - Update connection strings

---

## Phase 6: Testing & QA (Priority 6)

### Step 13: Comprehensive Testing

**Action Required:**

1. **Unit Tests:**
   - Test AI parsing
   - Test API endpoints
   - Test utility functions

2. **Integration Tests:**
   - Test OAuth flow
   - Test calendar operations
   - Test email operations

3. **E2E Tests:**
   - Test complete user flows
   - Test error scenarios
   - Test edge cases

4. **Manual Testing Checklist:**
   - [ ] OAuth login works
   - [ ] Tasks can be created
   - [ ] Calendar events created
   - [ ] Emails read/sent
   - [ ] Error handling works
   - [ ] Offline mode works
   - [ ] Token refresh works

---

## Phase 7: Deployment (Priority 7)

### Step 14: Deploy to Production

**Action Required:**

1. **Backend Deployment:**
   ```bash
   # Example with Railway
   railway login
   railway init
   railway up
   ```

2. **Frontend Build:**
   ```bash
   # Build for iOS
   eas build --platform ios
   
   # Build for Android
   eas build --platform android
   ```

3. **Update Configuration:**
   - Update production API URL
   - Update OAuth redirect URIs
   - Update environment variables

4. **Submit to App Stores:**
   ```bash
   # iOS
   eas submit --platform ios
   
   # Android
   eas submit --platform android
   ```

---

## Phase 8: Monitoring & Maintenance (Priority 8)

### Step 15: Set Up Monitoring

**Action Required:**

1. **Error Tracking:**
   - Set up Sentry
   - Configure error alerts
   - Monitor error rates

2. **Performance Monitoring:**
   - Monitor API response times
   - Track database performance
   - Monitor user activity

3. **Analytics:**
   - Track user engagement
   - Monitor feature usage
   - Track conversion rates

---

## 📊 Progress Tracking

### Current Status: 60%

**Completed:**
- ✅ Backend infrastructure
- ✅ Frontend app
- ✅ AI integration
- ✅ OAuth setup (needs testing)
- ✅ Database schema

**In Progress:**
- ⚠️ OAuth flow testing
- ⚠️ Real integrations testing

**Remaining:**
- ❌ Production deployment
- ❌ Comprehensive testing
- ❌ Monitoring setup

---

## 🎯 Quick Start (Do These First)

If you want to get it working quickly, focus on these steps:

1. **Step 2:** Configure backend .env ✅
2. **Step 3:** Fix Google Console iOS Bundle ID
3. **Step 5:** Set up Supabase database
4. **Step 6:** Set up ngrok
5. **Step 7:** Test OAuth flow

Once these work, you're at **80%** completion!

---

## 📝 Notes

- **ngrok URLs change:** Each time you restart ngrok, the URL changes. For production, use a fixed domain.
- **Bundle ID must match:** iOS Bundle ID in Google Console must match `app.json`
- **Environment variables:** Never commit `.env` files to git
- **Test thoroughly:** Test each integration before moving to production

---

## 🆘 Troubleshooting

### OAuth not working?
- Check ngrok URL matches Google Console
- Verify Bundle ID is set
- Check backend logs for errors

### Database connection failed?
- Verify Supabase URL and key
- Check if schema was run
- Verify network connectivity

### Mobile app can't connect?
- Check local IP is correct
- Verify backend is running
- Check firewall settings

---

**Last Updated:** Now
**Next Review:** After completing Phase 1-3


