# 🚀 Steward - Production Readiness Checklist

## Current Status: ~85% Complete

---

## 🔴 CRITICAL (Must Complete Before Launch)

### 1. Backend Deployment ✅/❌
- [ ] **Fix Railway deployment**
  - Current issue: Build failures with `npm ci` and dependency conflicts
  - Solution: Ensure `nixpacks.toml` uses `npm install --legacy-peer-deps`
  - Verify: Backend builds and deploys successfully
  - Test: Health endpoint responds at production URL

- [ ] **Set up production environment variables**
  ```
  NODE_ENV=production
  PORT=3001
  OPENAI_API_KEY=...
  SUPABASE_URL=...
  SUPABASE_ANON_KEY=...
  GOOGLE_CLIENT_ID=...
  GOOGLE_CLIENT_SECRET=...
  GOOGLE_REDIRECT_URI=https://your-app.up.railway.app/api/auth/google/callback
  ```

- [ ] **Update Google OAuth redirect URI**
  - Add production Railway URL to Google Cloud Console
  - Update `GOOGLE_REDIRECT_URI` in Railway after first deployment

### 2. Frontend Production Configuration
- [ ] **Update API URL for production**
  - Set `EXPO_PUBLIC_API_URL` environment variable
  - Or update hardcoded URL in `utils/api.ts` (line 22)
  - Test: Frontend connects to production backend

- [ ] **Configure deep linking for production**
  - Update `app.json` with production URL scheme
  - Test OAuth flow with production backend

### 3. Security & Reliability
- [x] ✅ API rate limiting (implemented)
- [x] ✅ Token refresh mechanism (implemented)
- [x] ✅ Input validation & sanitization (implemented)
- [ ] **Add HTTPS enforcement**
- [ ] **Set up error tracking (Sentry)**
  - Install Sentry SDK
  - Configure error reporting
- Set up alerts for critical errors

### 4. Database & Data
- [x] ✅ Supabase schema (created)
- [ ] **Verify production database connection**
- [ ] **Set up database backups**
- [ ] **Test data migration if needed**

---

## 🟡 HIGH PRIORITY (Should Complete Before Launch)

### 5. Comprehensive Testing
- [ ] **End-to-end testing checklist:**
  - [ ] Google OAuth login flow
  - [ ] Calendar: Create event
  - [ ] Calendar: Reschedule event
  - [ ] Calendar: Cancel event (with approval)
  - [ ] Calendar: Block focus time
  - [ ] Email: Summarize inbox
  - [ ] Email: Draft reply
  - [ ] Email: Send email (with approval)
  - [ ] Email: Select email from list
  - [ ] Email: Edit email before sending
  - [ ] Task approval flow
  - [ ] Task rejection flow
  - [ ] Task retry on failure
  - [ ] Offline mode handling

- [ ] **Error scenario testing:**
  - [ ] Network failures
  - [ ] Invalid commands
  - [ ] Expired tokens
  - [ ] API rate limits
  - [ ] Missing permissions

- [ ] **Performance testing:**
  - [ ] Response times < 2s for most operations
  - [ ] Handle 10+ concurrent users
  - [ ] Memory leaks check

### 6. Monitoring & Observability
- [ ] **Set up application monitoring**
  - Railway metrics dashboard
  - Response time tracking
  - Error rate monitoring
  - Uptime monitoring

- [ ] **Set up logging**
  - Structured logging (Winston/Pino)
  - Log levels (error, warn, info)
  - Log aggregation (if needed)

- [ ] **Set up alerts**
  - Critical error alerts
  - High error rate alerts
  - Service downtime alerts

### 7. Mobile App Build & Distribution
- [ ] **Build iOS app**
  - Set up EAS Build account
  - Configure `app.json` for iOS
  - Build production iOS app
  - Test on physical device

- [ ] **Build Android app**
  - Configure `app.json` for Android
  - Build production Android app
  - Test on physical device

- [ ] **App Store submission (iOS)**
  - Create App Store Connect account
  - Prepare screenshots and metadata
  - Submit for review
  - Handle review feedback

- [ ] **Play Store submission (Android)**
  - Create Google Play Console account
  - Prepare screenshots and metadata
  - Submit for review
  - Handle review feedback

---

## 🟢 NICE TO HAVE (Can Add Post-Launch)

### 8. Trust & Transparency Features
- [x] ✅ "Why approval required" explanations
- [x] ✅ "Why this was safe" explanations
- [x] ✅ Dry run / Preview mode
- [ ] **Weekly value summary**
  - Time saved metrics
  - Interruptions avoided count
  - Tasks completed summary

- [ ] **User-defined rules**
  - Personal defaults (e.g., "always block 2pm-4pm")
  - Custom approval rules
  - Auto-approve patterns

- [ ] **Autonomy levels (Level 0/1/2)**
  - Level 0: Always ask (current default)
  - Level 1: Auto-approve low-risk actions
  - Level 2: Full autonomy (future)

- [ ] **Onboarding improvements**
  - Make human-in-loop visible
  - Explain approval process
  - Show safety features

### 9. Additional Features
- [ ] **Push notifications**
  - Task completion notifications
  - Approval requests
  - Error alerts

- [ ] **Analytics (optional)**
  - User behavior tracking
  - Feature usage metrics
  - Performance analytics

- [ ] **Advanced email features**
  - Email templates
  - Scheduled emails
  - Email rules/filters

- [ ] **Advanced calendar features**
  - Recurring events
  - Meeting conflict detection
  - Smart scheduling suggestions

---

## 📋 Pre-Launch Checklist

### Technical
- [ ] Backend deployed and accessible
- [ ] All environment variables configured
- [ ] OAuth working in production
- [ ] Database connected and tested
- [ ] Error tracking configured
- [ ] Monitoring set up
- [ ] API rate limits tested
- [ ] Security audit completed

### Testing
- [ ] All core features tested end-to-end
- [ ] Error scenarios tested
- [ ] Performance validated
- [ ] Mobile apps tested on real devices
- [ ] OAuth flow tested in production

### Documentation
- [ ] User documentation (if needed)
- [ ] API documentation (if public)
- [ ] Deployment runbook
- [ ] Troubleshooting guide

### Legal & Compliance
- [ ] Privacy policy
- [ ] Terms of service
- [ ] GDPR compliance (if applicable)
- [ ] Data retention policy

### Marketing (if applicable)
- [ ] App Store listing prepared
- [ ] Play Store listing prepared
- [ ] Screenshots and videos
- [ ] App description and keywords

---

## 🎯 Recommended Launch Sequence

### Phase 1: Core Production (Week 1)
1. Fix Railway deployment
2. Set up production environment
3. Configure OAuth for production
4. End-to-end testing
5. Error tracking setup

### Phase 2: Mobile Apps (Week 2)
1. Build iOS app
2. Build Android app
3. Test on devices
4. Submit to stores

### Phase 3: Polish & Monitor (Week 3-4)
1. Monitor production usage
2. Fix any critical bugs
3. Add monitoring alerts
4. Gather user feedback

### Phase 4: Enhancements (Post-Launch)
1. Weekly value summary
2. User-defined rules
3. Autonomy levels
4. Additional features

---

## 🐛 Known Issues to Fix

1. **Railway Build Failures**
   - Issue: `npm ci` strict dependency checking
   - Status: Partially addressed with `nixpacks.toml`
   - Action: Verify build succeeds

2. **OAuth Redirect URI**
   - Issue: Must match exactly between Google Console and Railway
   - Status: Needs production URL
   - Action: Update after first deployment

3. **Frontend API URL**
   - Issue: Hardcoded fallback URL
   - Status: Needs environment variable
   - Action: Set `EXPO_PUBLIC_API_URL`

---

## 📊 Progress Tracking

**Overall: ~85% Complete**

- ✅ Core Features: 95%
- ✅ Security: 90%
- ⏳ Deployment: 60%
- ⏳ Testing: 70%
- ⏳ Mobile Apps: 0%
- ⏳ Monitoring: 30%

---

## 🚀 Next Immediate Steps

1. **Fix Railway deployment** (1-2 hours)
   - Verify `nixpacks.toml` configuration
   - Test build locally
   - Deploy to Railway
   - Verify health endpoint

2. **Set up production environment** (30 min)
   - Add all environment variables
   - Update OAuth redirect URI
   - Test OAuth flow

3. **Update frontend for production** (15 min)
   - Set `EXPO_PUBLIC_API_URL`
   - Test API connection
   - Verify OAuth deep linking

4. **Comprehensive testing** (2-3 hours)
   - Test all features end-to-end
   - Test error scenarios
   - Document any bugs

5. **Set up error tracking** (1 hour)
   - Install Sentry
   - Configure error reporting
   - Test error capture

---

**Last Updated:** Now  
**Next Review:** After Railway deployment fix
