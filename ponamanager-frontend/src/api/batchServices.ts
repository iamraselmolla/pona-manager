// src/api/batchServices.ts
import apiClient from "./client";
import { Batch, BatchOrder, ApiResponse, PaginatedResponse } from "../types";

export const batchAPI = {
  // Get all batches (paginated, filter by month)
  getAll: (params?: {
    month?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) =>
    apiClient.get<ApiResponse<PaginatedResponse<Batch>>>("/batches", {
      params,
    }),

  // Get single batch with all batchOrders populated
  getById: (id: string) => apiClient.get<ApiResponse<Batch>>(`/batches/${id}`),

  // Create new batch with selected order IDs
  create: (data: { batchDate: string; orderIds: string[] }) =>
    apiClient.post<ApiResponse<Batch>>("/batches", data),

  // Add more orders to existing pending batch
  addOrders: (batchId: string, orderIds: string[]) =>
    apiClient.patch<ApiResponse<Batch>>(`/batches/${batchId}/add-orders`, {
      orderIds,
    }),

  // Remove order from pending batch
  removeOrder: (batchId: string, batchOrderId: string) =>
    apiClient.delete<ApiResponse<null>>(
      `/batches/${batchId}/orders/${batchOrderId}`,
    ),

  // Record delivery for a single batchOrder (opens modal)
  recordDelivery: (
    batchId: string,
    batchOrderId: string,
    data: {
      deliveredQuantity: number;
      deliveryRate: number;
      customerPayment: number;
      dueAmount: number;
      duePaymentDate?: string;
      notes?: string;
    },
  ) =>
    apiClient.patch<ApiResponse<BatchOrder>>(
      `/batches/${batchId}/orders/${batchOrderId}/deliver`,
      data,
    ),

  // Complete batch - requires expenses
  completeBatch: (
    batchId: string,
    expenses: { label: string; amount: number }[],
  ) =>
    apiClient.patch<ApiResponse<Batch>>(`/batches/${batchId}/complete`, {
      expenses,
    }),

  // Monthly batch report
  getMonthlyReport: (month: string) =>
    apiClient.get<ApiResponse<any>>(`/batches/monthly/${month}`),
};
