// src/api/batchServices.ts — FULL FILE
import apiClient from './client';

export const batchAPI = {
  // ── Batch CRUD ──────────────────────────────────────────────────────────────
  getAll: (params?: { month?: string; status?: string; limit?: number }) =>
    apiClient.get('/batches', { params }),

  getById: (id: string) => apiClient.get(`/batches/${id}`),

  create: (data: { batchDate: string; orderIds: string[] }) => apiClient.post('/batches', data),

  // Add orders to existing batch
  addOrders: (batchId: string, orderIds: string[]) =>
    apiClient.patch(`/batches/${batchId}/add-orders`, { orderIds }),

  update: (id: string, data: any) => apiClient.patch(`/batches/${id}`, data),

  delete: (id: string) => apiClient.delete(`/batches/${id}`),

  // ── Batch order management ───────────────────────────────────────────────────
  // Add order to existing batch
  addOrderToBatch: (batchId: string, orderId: string) =>
    apiClient.post(`/batches/${batchId}/orders`, { orderId }),

  // Remove order from batch (unbatch)
  removeOrder: (batchId: string, batchOrderId: string) =>
    apiClient.delete(`/batches/${batchId}/orders/${batchOrderId}`),

  // Link batch order to company order
  linkCompanyOrder: (batchId: string, companyOrderId: string) =>
    apiClient.patch(`/batches/${batchId}/company-order`, { companyOrderId }),

  unlinkCompanyOrder: (batchId: string) => apiClient.delete(`/batches/${batchId}/company-order`),

  // ── Delivery ─────────────────────────────────────────────────────────────────
  recordDelivery: (
    batchId: string,
    batchOrderId: string,
    data: {
      // Quantity
      deliveredQuantity: number;
      // Mir data (new)
      companyMir?: number;
      ourMir?: number;
      totalPoly?: number;
      mirDiff?: number;
      totalFish?: number;
      deliveredPL?: number;
      // Payment
      deliveryRate: number;
      discount?: number;
      customerPayment: number;
      dueAmount: number;
      duePaymentDate?: string;
      finalAmount?: number;
      // Partial
      isPartial: boolean;
      remainingQuantity: number;
      notes?: string;
    },
  ) => apiClient.patch(`/batches/${batchId}/orders/${batchOrderId}/deliver`, data),

  getCollection: (batchId: string) => apiClient.get(`/batches/${batchId}/collection`),

  getExpenses: (batchId: string) => apiClient.get(`/batches/${batchId}/expenses`),

  addExpense: (
    batchId: string,
    data: {
      label: string;
      amount: number;
      category?: string;
      notes?: string;
    },
  ) => apiClient.post(`/batches/${batchId}/expenses`, data),

  // ── Complete batch ────────────────────────────────────────────────────────────
  complete: (batchId: string) => apiClient.patch(`/batches/${batchId}/complete`),

  deleteExpense: (batchId: string, expenseId: string) =>
    apiClient.delete(`/batches/${batchId}/expenses/${expenseId}`),
  closeBatch: (batchId: string) => apiClient.patch(`/batches/${batchId}/close`),
  recordDuePayment: (batchOrderId: string, amount: number) =>
    apiClient.patch(`/batches/${batchOrderId}/pay-due`, { amount }),
  recordAdvanceRefund: (orderId: string, amount: number) =>
    apiClient.patch(`/batches/${orderId}/refund-advance`, { amount }),
};
