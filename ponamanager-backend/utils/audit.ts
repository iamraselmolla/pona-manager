// src/utils/audit.ts
import { auditLogger } from "./logger";
import { Request } from "express";

type AuditAction =
  | "ORDER_CREATED"
  | "ORDER_CANCELLED"
  | "ORDER_DELETED"
  | "ORDER_DELIVERED"
  | "BATCH_CREATED"
  | "BATCH_COMPLETED"
  | "BATCH_ORDER_REMOVED"
  | "PAYMENT_ADDED"
  | "CUSTOMER_CREATED"
  | "DAILY_CLOSING";

export const audit = ({
  action,
  entity,
  entityId,
  before,
  after,
  meta,
  req,
}: {
  action: AuditAction;
  entity: string;
  entityId: string;
  before?: object;
  after?: object;
  meta?: object;
  req?: Request;
}) => {
  try {
    auditLogger.info({
      action,
      entity,
      entityId,
      before: before ?? null,
      after: after ?? null,
      meta: meta ?? null,
      ip: req?.ip ?? null,
      method: req?.method ?? null,
      url: req?.originalUrl ?? null,
    });
  } catch (e) {
    // Never throw — audit must not break main flow
    console.error("Audit log failed:", e);
  }
};