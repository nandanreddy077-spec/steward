# Backend Setup Instructions

## Important: Backend is a Separate Node.js Project

This backend uses **Express**, not Hono. It has its own `package.json` and dependencies.

## Install Backend Dependencies

```bash
cd backend
npm install
```

This will install:
- express
- @types/express
- googleapis
- google-auth-library
- @supabase/supabase-js
- openai
- cors
- dotenv
- express-rate-limit
- TypeScript
- ts-node
- nodemon

## Start Backend (Development)

```bash
cd backend
npm run dev
```

Backend will run on http://localhost:3001

## Build for Production

```bash
cd backend
npm run build
npm start
```

## Environment Variables

Create `backend/.env` (see `backend/.env.example`):
```env
NODE_ENV=development
PORT=3001
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
API_RATE_LIMIT=100
RATE_LIMIT_WINDOW_MS=900000
```

## Verify Installation

1. Start backend: `cd backend && npm run dev`
2. Test health: `curl http://localhost:3001/health`
3. Should see: `{"status":"ok","timestamp":"...","environment":"development"}`

## Common Issues

### "Cannot find module 'express'"
- Run `cd backend && npm install`

### "Module not found: googleapis"
- Run `cd backend && npm install`

### Port already in use
- Kill process: `lsof -ti:3001 | xargs kill -9`
- Or use different port in `.env`

## Production Deployment

See `QUICK_DEPLOYMENT.md` for Railway/Render/Vercel deployment instructions.
