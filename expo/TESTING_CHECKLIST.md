# Production Testing Checklist

## 🔐 Authentication Flow

### OAuth Login
- [ ] Click "Continue with Google"
- [ ] Redirected to Google login page
- [ ] Complete Google authentication
- [ ] Redirected back to app
- [ ] User logged in successfully
- [ ] User data saved to database
- [ ] Google tokens stored securely

### Token Management
- [ ] Access token refreshes automatically
- [ ] Expired token handled gracefully
- [ ] Re-authentication prompt works
- [ ] Logout clears all data

---

## 📋 Task Creation

### Command Parsing
- [ ] "Block 2 hours tomorrow at 9am" → Parsed correctly
- [ ] "Cancel my 3pm meeting" → Requires approval
- [ ] "Summarize my inbox" → No approval needed
- [ ] "Move my 2pm to tomorrow" → Parsed correctly
- [ ] Invalid command → Shows error

### Task Flow
- [ ] Task appears in Tasks screen immediately
- [ ] Status shows "Parsing..."
- [ ] Status updates to "Pending Approval" or "Executing"
- [ ] Activity log shows task creation

---

## ✅ Approval Workflow

### Approval Required Tasks
- [ ] "Cancel meeting" → Shows approval screen
- [ ] Preview shows what will happen
- [ ] Approve button works
- [ ] Task executes after approval
- [ ] Reject button works
- [ ] Rejected task marked as cancelled

### Auto-Execute Tasks
- [ ] "Summarize inbox" → Executes without approval
- [ ] "Block time" → Executes without approval
- [ ] Status updates in real-time

---

## 📅 Calendar Integration

### Create Events
- [ ] "Block 2 hours at 9am tomorrow"
- [ ] Event appears in Google Calendar
- [ ] Correct time and duration
- [ ] Correct timezone

### Reschedule Events
- [ ] "Move my 3pm meeting to tomorrow"
- [ ] Finds correct meeting
- [ ] Updates time in Google Calendar
- [ ] Sends notifications to attendees

### Cancel Events
- [ ] "Cancel my 3pm meeting"
- [ ] Requires approval
- [ ] Deletes from Google Calendar
- [ ] Notifies attendees

---

## 📧 Email Integration

### Read Emails
- [ ] "Summarize my inbox"
- [ ] Fetches recent emails
- [ ] Shows count

### Draft Emails
- [ ] "Draft email to john@example.com"
- [ ] Creates draft in Gmail
- [ ] Requires approval before sending

---

## 🔄 Error Handling

### Network Errors
- [ ] Airplane mode → Shows error message
- [ ] Slow network → Shows loading state
- [ ] Timeout → Retries automatically
- [ ] Failed after retries → Clear error message

### API Errors
- [ ] Invalid token → Prompts re-authentication
- [ ] Rate limit → Shows "Too many requests"
- [ ] Server error → Retries automatically
- [ ] 404 → Clear error message

### OAuth Errors
- [ ] Token expired → Refreshes automatically
- [ ] Refresh failed → Prompts re-login
- [ ] No internet → Waits and retries

---

## 💾 Data Persistence

### App Restart
- [ ] Close app completely
- [ ] Reopen app
- [ ] User still logged in
- [ ] Tasks still visible
- [ ] Settings preserved

### Background Mode
- [ ] Minimize app
- [ ] Wait 5 minutes
- [ ] Reopen app
- [ ] Data still intact

---

## 🎨 UI/UX

### Loading States
- [ ] OAuth shows "Connecting..."
- [ ] Task parsing shows spinner
- [ ] Task execution shows progress
- [ ] List refresh shows indicator

### Error States
- [ ] Network error shows message + retry button
- [ ] Auth error shows re-login prompt
- [ ] Task failure shows clear reason

### Empty States
- [ ] No tasks → Shows helpful message
- [ ] No activity → Shows empty state
- [ ] Not logged in → Shows login screen

---

## 📱 Platform Testing

### iOS
- [ ] Login works
- [ ] Deep linking works
- [ ] Push notifications work (if enabled)
- [ ] Haptics work
- [ ] Animations smooth

### Android
- [ ] Login works
- [ ] Deep linking works
- [ ] Push notifications work (if enabled)
- [ ] Haptics work
- [ ] Animations smooth

### Web
- [ ] Login works (browser popup)
- [ ] All features work
- [ ] Responsive design
- [ ] No console errors

---

## 🔒 Security

### Data Protection
- [ ] Tokens not visible in UI
- [ ] Tokens not logged to console
- [ ] Sensitive data encrypted
- [ ] No XSS vulnerabilities

### API Security
- [ ] Rate limiting works (100 req/15min)
- [ ] CORS properly configured
- [ ] Invalid requests rejected
- [ ] SQL injection prevented

---

## ⚡ Performance

### Load Times
- [ ] App launches < 2 seconds
- [ ] Login completes < 5 seconds
- [ ] Task creation < 1 second
- [ ] Task execution < 5 seconds

### Responsiveness
- [ ] UI never freezes
- [ ] Scrolling smooth
- [ ] Animations 60fps
- [ ] No memory leaks

---

## 🎯 Critical User Flows

### First-Time User
1. [ ] Open app
2. [ ] See welcome screen
3. [ ] Click "Continue with Google"
4. [ ] Complete OAuth
5. [ ] See daily brief (empty)
6. [ ] Create first task
7. [ ] See task execute
8. [ ] Check Google Calendar

### Returning User
1. [ ] Open app
2. [ ] Already logged in
3. [ ] See daily brief with data
4. [ ] Create new task
5. [ ] Approve/reject pending tasks
6. [ ] Check activity log

### Power User
1. [ ] Create 10 tasks in a row
2. [ ] Approve all at once
3. [ ] All execute successfully
4. [ ] No performance degradation

---

## 🐛 Edge Cases

### Unusual Commands
- [ ] Empty command → Shows error
- [ ] Very long command → Handles gracefully
- [ ] Special characters → Parsed correctly
- [ ] Emoji in command → Works

### Timing Issues
- [ ] Schedule event in the past → Shows error
- [ ] Schedule event far in future → Works
- [ ] Reschedule non-existent event → Shows error
- [ ] Concurrent requests → Handles correctly

### Data Issues
- [ ] User has no calendar → Shows error
- [ ] User has no emails → Shows empty
- [ ] Invalid email address → Shows error
- [ ] Calendar full → Still works

---

## ✅ Sign-Off

Before launching to production, ALL items above must be checked and working.

**Tested by:** _________________
**Date:** _________________
**Ready for production:** [ ] YES [ ] NO
