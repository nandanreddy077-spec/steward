# Steward Backend API

Backend API for Steward AI Personal Chief of Staff.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example` and fill in your credentials)

3. Set up Supabase database:
   - Go to your Supabase project
   - Navigate to SQL Editor
   - Run the SQL from `database/schema.sql`

4. Start development server:
```bash
npm run dev
```

The server will run on `http://localhost:3001`

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication
- `GET /api/auth/google` - Get Google OAuth URL
- `GET /api/auth/google/callback` - OAuth callback handler
- `GET /api/auth/tokens/:userId` - Get user tokens

### Tasks
- `POST /api/tasks/parse` - Parse command into intent
- `POST /api/tasks/create` - Create new task
- `POST /api/tasks/execute` - Execute a task
- `GET /api/tasks/user/:userId` - Get user's tasks
- `POST /api/tasks/approve` - Approve a task
- `POST /api/tasks/reject` - Reject a task

### Calendar
- `GET /api/calendar/events?userId=xxx` - List calendar events
- `POST /api/calendar/events` - Create calendar event
- `PUT /api/calendar/events/:eventId` - Update calendar event
- `DELETE /api/calendar/events/:eventId?userId=xxx` - Delete calendar event

## Environment Variables

See `.env.example` for required variables.

## Database Setup

1. Go to Supabase Dashboard
2. SQL Editor
3. Run `database/schema.sql`

## Development

```bash
npm run dev    # Start with hot reload
npm run build  # Build for production
npm start      # Run production build
```





