# Testing Guide - Verify Everything is Working

## ✅ Verified Setup

Based on tests, the following are working:
- ✅ Database connection (Supabase)
- ✅ Backend server (running on port 3001)
- ✅ API parsing (AI intent parsing works)

## Quick Test Steps

### 1. Verify Backend is Running

Open a new terminal and run:
```bash
curl http://localhost:3001/health
```

**Expected**: `{"status":"ok","timestamp":"...","environment":"development"}`

### 2. Test API Parsing

```bash
curl -X POST http://localhost:3001/api/tasks/parse \
  -H "Content-Type: application/json" \
  -d '{"command": "Block focus time tomorrow"}'
```

**Expected**: JSON with parsed intent

### 3. Test in the App

1. **Make sure Expo is running**:
   ```bash
   cd /Users/nandanreddyavanaganti/steward
   bun run start
   ```

2. **Open the app** (on your phone/simulator)

3. **Create a task**:
   - Go to **Command** tab
   - Type: "Block focus time tomorrow morning"
   - Click **Execute**

4. **Check Tasks tab**:
   - Should see the task
   - Status should be "Executing" then "Completed"
   - Result message should appear

5. **Check Activity Log**:
   - Should see "Task created"
   - Should see "Task completed"

## Common Issues & Solutions

### Issue 1: Tasks Not Executing

**Symptoms**: Task is created but stays in "pending_approval" or "executing" state

**Solution**: 
- Tasks execute automatically if `requiresApproval: false`
- Tasks with `requiresApproval: true` need to be approved first
- Check the console/logs for errors

### Issue 2: Network Error

**Symptoms**: "Network request failed" in the app

**Solution**:
- Make sure backend is running: `cd backend && npm run dev`
- Check the IP address in `utils/api.ts` matches your computer's IP
- Make sure phone and computer are on the same WiFi

### Issue 3: Tasks Not Appearing

**Symptoms**: Task created but not visible in Tasks tab

**Solution**:
- Reload the app (shake device → Reload)
- Check if task appears in Activity Log
- Check AsyncStorage (tasks might be stored locally)

### Issue 4: Backend Not Connecting

**Symptoms**: All requests fail, backend errors

**Solution**:
- Check backend is running: `curl http://localhost:3001/health`
- Check database connection (we verified it works)
- Check `.env` file has correct credentials

## Testing Checklist

Use this checklist to verify everything:

### Backend
- [ ] Backend server running (`npm run dev` in backend folder)
- [ ] Health endpoint works: `curl http://localhost:3001/health`
- [ ] API parsing works: Test with curl command above
- [ ] Database connection works (verified ✅)

### Frontend
- [ ] Expo dev server running (`bun run start`)
- [ ] App opens on phone/simulator
- [ ] Command tab works
- [ ] Can create tasks
- [ ] Tasks appear in Tasks tab
- [ ] Tasks execute (status changes)
- [ ] Activity Log shows entries

### Database
- [ ] Supabase tables created (verified ✅)
- [ ] Can query tables (verified ✅)
- [ ] Can insert data (verified ✅)

## Test Commands

### Easy Tests (No Approval Needed)
1. "Block focus time tomorrow" → Should execute immediately
2. "Summarize my inbox" → Should execute immediately
3. "Schedule a meeting tomorrow at 2pm" → Should execute immediately

### Approval Required Tests
1. "Move my 3pm meeting to tomorrow" → Needs approval
2. "Cancel my 3pm meeting" → Needs approval
3. "Send email to john@example.com" → Needs approval

## Expected Behavior

### Task Creation Flow:
1. User types command
2. AI parses intent (via backend)
3. Task created with status `pending_approval` or `executing`
4. If `executing`, task executes automatically after 1.5 seconds
5. Status updates: `executing` → `completed`/`failed`
6. Result message shown
7. Activity log updated

### Task Execution Flow:
1. Task status: `executing`
2. Backend tries to execute (or uses mock if no OAuth)
3. Status updates: `completed` or `failed`
4. Result saved to task
5. Activity log updated

## Debug Steps

If something isn't working:

1. **Check backend logs** (terminal where `npm run dev` is running)
   - Look for errors
   - Check API requests are coming through

2. **Check app logs** (Expo console)
   - Look for errors
   - Check network requests

3. **Test individual components**:
   - Test API parsing (curl command)
   - Test database (we verified ✅)
   - Test frontend (create task manually)

4. **Check configuration**:
   - `.env` file has correct values
   - API base URL in `utils/api.ts` is correct
   - Network connectivity (phone and computer on same WiFi)

## What "Nothing is Working" Might Mean

If you say "nothing is working", please specify:

1. **Backend not starting?** → Check port 3001 is free, check .env file
2. **Tasks not creating?** → Check app logs, check network connection
3. **Tasks not executing?** → Check execution logic, check logs
4. **Tasks not appearing?** → Check AsyncStorage, reload app
5. **Network errors?** → Check IP address, check WiFi
6. **Database errors?** → Check Supabase credentials, check tables exist

Let me know specifically what's not working, and I can help debug!





