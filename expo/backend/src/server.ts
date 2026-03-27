// Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import taskRoutes from './routes/tasks';
import authRoutes from './routes/auth';
import calendarRoutes from './routes/calendar';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Rate limiting middleware
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs for sensitive operations
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      // Production origins - add your production frontend URLs here
      process.env.FRONTEND_URL || 'https://your-frontend-domain.com',
      /^https:\/\/.*\.expo\.dev$/, // Expo production URLs
      /^exp:\/\/.*$/, // Expo deep links
    ]
  : [
      // Development origins
      'http://localhost:8081', 
      'http://localhost:19006', 
      'exp://localhost:8081',
      /^http:\/\/192\.168\.\d+\.\d+:8081$/, // Allow local network IPs for Expo
      /^http:\/\/192\.168\.\d+\.\d+:19006$/,
    ];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());

// Apply general rate limiting to all routes
app.use('/api', generalLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/calendar', calendarRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Steward backend running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base: http://localhost:${PORT}/api`);
  console.log(`🌐 Network: http://192.168.0.103:${PORT}/api`);
});

