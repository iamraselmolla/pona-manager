// src/middleware/requestLogger.ts
import { Request, Response, NextFunction } from "express";
import { appLogger } from "././../../utils/logger";
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on("finish", () => {
    appLogger.info({
      type: "REQUEST",
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${Date.now() - start}ms`,
      ip: req.ip,
    });
  });

  next();
};