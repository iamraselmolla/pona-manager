// src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { authRoutes }     from './routes/auth';
import { customerRoutes } from './routes/customer';
import { orderRoutes }    from './routes/order';
import { batchRoutes }    from './routes/batch';
import {
  expenseRoutes, dailyClosingRoutes, notificationRoutes,
  dashboardRoutes, reportRoutes,
} from './routes/expense';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', methods: ['GET','POST','PUT','PATCH','DELETE'] }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true }));

app.use('/api/auth',          authRoutes);
app.use('/api/customers',     customerRoutes);
app.use('/api/orders',        orderRoutes);
app.use('/api/batches',       batchRoutes);
app.use('/api/expenses',      expenseRoutes);
app.use('/api/daily-closing', dailyClosingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard',     dashboardRoutes);
app.use('/api/reports',       reportRoutes);

app.get('/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

app.listen(PORT, () => console.log(`🚀  PonaTrack API → http://localhost:${PORT}`));

export default app;
