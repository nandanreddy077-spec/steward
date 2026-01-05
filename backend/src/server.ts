import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import taskRoutes from './routes/tasks';
import authRoutes from './routes/auth';
import calendarRoutes from './routes/calendar';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.API_RATE_LIMIT || '100', 10),
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors({
  origin: [
    'http://localhost:8081', 
    'http://localhost:19006', 
    'exp://localhost:8081',
    /^http:\/\/192\.168\.\d+\.\d+:8081$/,
    /^http:\/\/192\.168\.\d+\.\d+:19006$/,
  ],
  credentials: true,
}));
app.use(express.json());
app.use('/api/', limiter);

// Health check
app.get('/health', (req: Request, res: Response) => {
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

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  const isDev = process.env.NODE_ENV === 'development';
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error',
    ...(isDev && { stack: err.stack, details: err })
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Steward backend running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base: http://localhost:${PORT}/api`);
  console.log(`🌐 Network: http://192.168.0.103:${PORT}/api`);
});

