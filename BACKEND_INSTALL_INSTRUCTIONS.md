# Backend Installation Instructions

The backend is a separate Node.js project with its own dependencies.

## Quick Install

Run this command from the project root:

```bash
cd backend && chmod +x install-deps.sh && ./install-deps.sh
```

Or manually:

```bash
cd backend
npm install @hono/node-server @supabase/supabase-js cors dotenv express express-rate-limit google-auth-library googleapis hono openai
npm install --save-dev @types/cors @types/express @types/node nodemon ts-node typescript
```

## What Gets Installed

### Production Dependencies
- `hono` - Modern web framework
- `@hono/node-server` - Node.js server for Hono
- `express` - Web framework (legacy routes)
- `express-rate-limit` - Rate limiting middleware
- `cors` - CORS middleware
- `googleapis` - Google API client
- `google-auth-library` - Google OAuth
- `openai` - OpenAI API client
- `@supabase/supabase-js` - Supabase client
- `dotenv` - Environment variables

### Dev Dependencies
- `typescript` - TypeScript compiler
- `@types/express` - Express type definitions
- `@types/cors` - CORS type definitions
- `@types/node` - Node.js type definitions
- `ts-node` - TypeScript execution
- `nodemon` - Auto-restart on file changes

## After Installation

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your environment variables

3. Start the dev server:
   ```bash
   npm run dev
   ```

## TypeScript Compilation

The backend includes `backend/hono.ts` as the main entry point for deployment, which wraps the Express app for compatibility with serverless platforms.

Build for production:
```bash
npm run build
```

Start production server:
```bash
npm start
```
