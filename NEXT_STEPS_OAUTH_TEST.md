# Next Steps: Test OAuth Flow

## ✅ Current Status

- ✅ Backend running on port 3001
- ✅ Backend accessible from network (0.0.0.0)
- ✅ Database connected (Supabase)
- ✅ OAuth endpoints ready
- ✅ OAuth implementation in mobile app

## Step 1: Test OAuth Flow (10 minutes)

### 1. Make sure frontend is running

Open a new terminal and run:

```bash
cd /Users/nandanreddyavanaganti/steward
bun run start
```

### 2. Open the app

- Open on your phone/simulator (Expo Go or dev build)
- You should see the auth screen with "Continue with Google" button

### 3. Test OAuth

1. **Click "Continue with Google"**
   - Browser should open
   - Should see Google login page

2. **Login with your Google account**
   - Enter your Google email/password
   - Complete 2FA if needed

3. **Allow permissions**
   - Google will ask for Calendar and Gmail permissions
   - Click "Allow"

4. **Complete OAuth**
   - Browser redirects to callback URL
   - Backend processes OAuth
   - Should see success or redirect

### 4. Check results

**Backend Console** (where `npm run dev` is running):
- Should see logs: "OAuth callback received"
- Should see user data logged
- Should see database insert/update

**Supabase Database:**
- Go to https://supabase.com/dashboard
- Open your project
- Go to **Table Editor** → **users** table
- Should see your user with:
  - ✅ Your email
  - ✅ Your name
  - ✅ `google_tokens` JSON with access_token, refresh_token

**App:**
- Should redirect back to app (or show success)
- May need to handle callback (we'll improve this)

## Step 2: Verify OAuth Worked

### Check Database

1. **Go to Supabase Dashboard**
2. **Table Editor** → **users**
3. **Look for your user:**
   - Email: your Google email
   - Name: your Google name
   - `google_tokens`: Should have access_token, refresh_token, etc.

### Check Backend Logs

Backend terminal should show:
- OAuth callback received
- User data
- Database operation (insert or update)

## Step 3: Test Real Integrations (After OAuth Works)

Once OAuth is working and tokens are stored:

### Test Calendar Operation

1. **Create task**: "Block focus time tomorrow morning"
2. **Approve** (if needed)
3. **Check Google Calendar** - should see the event created!

### Test Email Operation

1. **Create task**: "Summarize my inbox"
2. **Approve** (if needed)
3. **Check result** - should show inbox summary

## What to Expect

### If OAuth Works:

✅ Browser opens with Google login
✅ You can login with Google
✅ Permissions granted
✅ Backend receives callback
✅ User stored in database
✅ Tokens stored securely
✅ Can now use real calendar/email operations

### If OAuth Doesn't Work:

❌ Browser doesn't open → Check API URL
❌ Can't login → Check Google account
❌ No callback → Check redirect URI
❌ No user in database → Check backend logs
❌ Error in backend → Check console for errors

## Troubleshooting

### "Network error" when clicking "Continue with Google"
- Check backend is running
- Check phone and computer on same WiFi
- Check IP address in `utils/api.ts`

### "Redirect URI mismatch"
- Check Google Cloud Console
- Make sure redirect URI matches: `http://localhost:3001/api/auth/google/callback`

### "No user in database"
- Check backend console for errors
- Check Supabase connection
- Check backend logs

### Browser opens but doesn't redirect
- This is expected for now (we'll improve callback handling)
- Check backend console - should still process OAuth
- Check database - user should still be stored

## Quick Test Checklist

- [ ] Frontend running (`bun run start`)
- [ ] Backend running (`npm run dev`)
- [ ] App open on phone/simulator
- [ ] Click "Continue with Google"
- [ ] Browser opens
- [ ] Login with Google
- [ ] Allow permissions
- [ ] Check backend console - OAuth received
- [ ] Check database - user stored
- [ ] Check tokens stored in database

## Next Steps After OAuth Works

1. **Test Calendar Integration**
   - Create calendar event
   - Reschedule event
   - Cancel event

2. **Test Email Integration**
   - Read inbox
   - Summarize emails
   - Draft emails

3. **Improve OAuth Flow**
   - Add deep linking for better callback handling
   - Store tokens in app securely
   - Handle token refresh

4. **Production Hardening**
   - Error handling
   - Security improvements
   - Testing

---

**Ready to test?** Try clicking "Continue with Google" and see what happens!

Let me know:
1. Does the browser open?
2. Can you login with Google?
3. What happens after you allow permissions?
4. Do you see user data in the database?

