// src/index.ts

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { authRoutes } from './routes/auth';
import { customerRoutes } from './routes/customer';
import { orderRoutes } from './routes/order';
import { batchRoutes } from './routes/batch';
import { companyOrderRouter } from './routes/companyOrder';

import {
  expenseRoutes,
  dailyClosingRoutes,
  notificationRoutes,
  dashboardRoutes,
  reportRoutes,
} from './routes/expense';

import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/**
 * Trust proxy
 * Required for Render / Railway / Vercel / Nginx
 */
app.set('trust proxy', 1);

/**
 * Security middleware
 */
app.use(helmet());

/**
 * CORS
 */
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  })
);

/**
 * Compression
 */
// app.use(compression());

/**
 * Logging
 */
app.use(
  morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev')
);

app.use(requestLogger);

/**
 * Body parser
 */
app.use(
  express.json({
    limit: '10mb',
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  })
);

/**
 * Global rate limiter
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});

app.use(globalLimiter);

/**
 * Auth rate limiter
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again later.',
  },
});

/**
 * Routes
 */

app.use('/api/auth', authLimiter, authRoutes);

app.use('/api/customers', customerRoutes);

app.use('/api/orders', orderRoutes);

app.use('/api/batches', batchRoutes);

app.use('/api/expenses', expenseRoutes);

app.use('/api/daily-closing', dailyClosingRoutes);

app.use('/api/notifications', notificationRoutes);

app.use('/api/dashboard', dashboardRoutes);

app.use('/api/reports', reportRoutes);

 app.use("/api/company-orders", companyOrderRouter);


/**
 * Health Check
 */
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * 404 Handler
 */
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

/**
 * Global Error Handler
 * MUST be last middleware
 */
app.use(errorHandler);

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`
🚀 ====================================
   PonaTrack API Server Running
🌐 URL  : http://localhost:${PORT}
🛠 Env  : ${process.env.NODE_ENV || 'development'}
====================================
  `);
});

export default app;