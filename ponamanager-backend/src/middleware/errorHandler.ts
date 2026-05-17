// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";
import { appLogger } from "././../../utils/logger";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  appLogger.error({
    type: "UNHANDLED_ERROR",
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    ip: req.ip,
  });

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};