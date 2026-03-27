# Testing Real Integrations Guide

## ✅ Database Setup Complete
Your database schema is set up and security warnings are fixed!

---

## 🧪 Test Calendar Integration

### Test 1: Create a Calendar Event
**Command to type in app:**
```
Block focus time tomorrow from 2pm to 4pm
```

**What should happen:**
1. Task appears in your task list
2. Task executes automatically (no approval needed)
3. Status changes to "completed"
4. **Check Google Calendar:** Open https://calendar.google.com
5. **Verify:** You should see a new event "Focus time" tomorrow from 2pm-4pm

**Expected result:**
- ✅ Event appears in Google Calendar
- ✅ Task shows "completed" status
- ✅ No errors in app

---

### Test 2: Reschedule a Meeting
**Command to type in app:**
```
Move my 3pm meeting to tomorrow at 2pm
```

**What should happen:**
1. AI parses the command
2. Finds the 3pm meeting in your calendar
3. Reschedules it to tomorrow at 2pm
4. **Check Google Calendar:** Verify the meeting time changed

**Expected result:**
- ✅ Meeting time updated in Google Calendar
- ✅ Task shows "completed" status

---

### Test 3: Cancel a Meeting
**Command to type in app:**
```
Cancel my 3pm meeting today
```

**What should happen:**
1. Finds the 3pm meeting
2. Deletes it from calendar
3. **Check Google Calendar:** Meeting should be removed

**Expected result:**
- ✅ Meeting removed from Google Calendar
- ✅ Task shows "completed" status

---

## 📧 Test Email Integration

### Test 4: Summarize Inbox
**Command to type in app:**
```
Summarize my inbox
```

**What should happen:**
1. Fetches recent emails (last 10)
2. Uses AI to summarize them
3. Shows summary in task result

**Expected result:**
- ✅ Task shows email summary
- ✅ Includes sender names and subjects
- ✅ Task shows "completed" status

---

### Test 5: Send an Email
**Command to type in app:**
```
Send an email to test@example.com with subject "Test" and body "This is a test email"
```

**What should happen:**
1. Creates email draft
2. Sends email immediately
3. **Check Gmail:** Open https://mail.google.com → Sent folder
4. **Verify:** Email should appear in sent folder

**Expected result:**
- ✅ Email appears in Gmail sent folder
- ✅ Task shows "completed" status
- ✅ Recipient receives email

---

### Test 6: Draft an Email
**Command to type in app:**
```
Draft an email to colleague@example.com about the project update
```

**What should happen:**
1. Creates email draft
2. Saves to Gmail drafts
3. **Check Gmail:** Open https://mail.google.com → Drafts folder
4. **Verify:** Draft should appear

**Expected result:**
- ✅ Draft appears in Gmail drafts
- ✅ Task shows "completed" status

---

## 🐛 Troubleshooting

### If tasks show "failed" status:

1. **Check backend logs:**
   ```bash
   cd backend
   npm run dev
   ```
   Look for error messages in terminal

2. **Check Google OAuth:**
   - Go to Settings in app
   - Verify Google account is connected
   - If not, tap to reconnect

3. **Check database:**
   - Go to Supabase → Table Editor
   - Check `tasks` table for error messages in `result` column

4. **Common errors:**
   - "Google OAuth tokens not found" → Reconnect Google account
   - "Task not found" → Database issue, check Supabase
   - "Invalid token" → Token expired, reconnect account

---

## ✅ Success Checklist

After testing, you should have:
- [ ] Created at least 1 calendar event
- [ ] Rescheduled at least 1 meeting
- [ ] Summarized inbox successfully
- [ ] Sent at least 1 email
- [ ] All tasks showing "completed" status
- [ ] No errors in backend logs
- [ ] Events visible in Google Calendar
- [ ] Emails visible in Gmail

---

## 🚀 Next Steps After Testing

Once all tests pass:
1. ✅ **Real execution is working!**
2. Move to **Phase 2:** Improve error handling
3. Move to **Phase 3:** Add security features
4. Move to **Phase 4:** Comprehensive testing
5. Move to **Phase 5:** Deploy to production

---

## 📝 Notes

- **First time:** Some commands may take 5-10 seconds to execute
- **Calendar events:** May take 1-2 minutes to appear in Google Calendar
- **Emails:** Should appear immediately in Gmail
- **Rate limits:** Google APIs have rate limits, don't test too quickly




