// src/utils/logger.ts
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const logDir = path.join(process.cwd(), 'logs');

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json(),
);

// ── General app logs (info, warn, error) ──────────────────────────────────────
const appTransport = new DailyRotateFile({
  dirname: path.join(logDir, 'app'),
  filename: 'app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '30d',
  level: 'info',
});

// ── Error only logs ───────────────────────────────────────────────────────────
const errorTransport = new DailyRotateFile({
  dirname: path.join(logDir, 'errors'),
  filename: 'error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '90d',
  level: 'error',
});

// ── Audit logs (business actions) ─────────────────────────────────────────────
const auditTransport = new DailyRotateFile({
  dirname: path.join(logDir, 'audit'),
  filename: 'audit-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '365d',
});

export const appLogger = winston.createLogger({
  format,
  transports: [
    appTransport,
    errorTransport,
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
});

export const auditLogger = winston.createLogger({
  format,
  transports: [auditTransport],
});
