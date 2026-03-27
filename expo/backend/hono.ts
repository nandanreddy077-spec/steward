import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import expressRateLimit from 'express-rate-limit';
import taskRoutes from './src/routes/tasks';
import authRoutes from './src/routes/auth';
import calendarRoutes from './src/routes/calendar';

dotenv.config();

const expressApp = express();

const limiter = expressRateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.API_RATE_LIMIT || '100', 10),
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

expressApp.use(cors({
  origin: [
    'http://localhost:8081', 
    'http://localhost:19006', 
    'exp://localhost:8081',
    /^http:\/\/192\.168\.\d+\.\d+:8081$/,
    /^http:\/\/192\.168\.\d+\.\d+:19006$/,
  ],
  credentials: true,
}));
expressApp.use(express.json());
expressApp.use('/api/', limiter);

expressApp.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

expressApp.use('/api/tasks', taskRoutes);
expressApp.use('/api/auth', authRoutes);
expressApp.use('/api/calendar', calendarRoutes);

expressApp.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  const isDev = process.env.NODE_ENV === 'development';
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error',
    ...(isDev && { stack: err.stack, details: err })
  });
});

const app = new Hono();

app.all('*', async (c) => {
  return new Promise<any>((resolve, reject) => {
    const req = c.req.raw;
    let resolved = false;

    const mockRes: any = {
      statusCode: 200,
      _headers: {} as Record<string, string>,
      _body: null as any,
      
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      
      json(data: any) {
        if (!resolved) {
          resolved = true;
          resolve(c.json(data, this.statusCode));
        }
        return this;
      },
      
      send(data: any) {
        if (!resolved) {
          resolved = true;
          resolve(c.text(data, this.statusCode));
        }
        return this;
      },
      
      setHeader(key: string, value: string) {
        this._headers[key] = value;
        return this;
      },
      
      getHeader(key: string) {
        return this._headers[key];
      },
    };

    expressApp(req as any, mockRes, (err?: any) => {
      if (err) {
        reject(err);
      } else if (!resolved) {
        resolved = true;
        resolve(c.text('Not Found', 404));
      }
    });
  });
});

export default app;

if (require.main === module) {
  const PORT = parseInt(process.env.PORT || '3001', 10);
  console.log(`🚀 Steward backend starting on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base: http://localhost:${PORT}/api`);
  serve({
    fetch: app.fetch,
    port: PORT,
  });
}
