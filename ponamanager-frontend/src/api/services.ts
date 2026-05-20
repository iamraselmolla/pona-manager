// src/api/services.ts
import apiClient from "./client";
import {
  User,
  Customer,
  Order,
  Delivery,
  Expense,
  DailyClosing,
  Payment,
  DashboardStats,
  Notification,
  ApiResponse,
  PaginatedResponse,
} from "../types";

// Auth
export const authAPI = {
  login: (identifier: string, password: string) =>
    apiClient.post<ApiResponse<{ token: string; user: User }>>("/auth/login", {
      identifier,
      password,
    }),

  forgotPassword: (email: string) =>
    apiClient.post<ApiResponse<null>>("/auth/forgot-password", { email }),

  resetPassword: (token: string, password: string) =>
    apiClient.post<ApiResponse<null>>("/auth/reset-password", {
      token,
      password,
    }),

  getProfile: () => apiClient.get<ApiResponse<User>>("/auth/profile"),

  updateProfile: (data: Partial<User>) =>
    apiClient.put<ApiResponse<User>>("/auth/profile", data),
};

// Dashboard
export const dashboardAPI = {
  getStats: (period?: string) =>
    apiClient.get<ApiResponse<DashboardStats>>("/dashboard/stats", {
      params: { period },
    }),
};

// Customers
export const customerAPI = {
  getAll: (params?: { search?: string; page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<PaginatedResponse<Customer>>>("/customers", {
      params,
    }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Customer>>(`/customers/${id}`),

  getByMobile: (mobile: string) =>
    apiClient.get<ApiResponse<Customer>>(`/customers/mobile/${mobile}`),

  create: (data: Partial<Customer>) =>
    apiClient.post<ApiResponse<Customer>>("/customers", data),

  update: (id: string, data: Partial<Customer>) =>
    apiClient.put<ApiResponse<Customer>>(`/customers/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/customers/${id}`),

  getOrders: (id: string) =>
    apiClient.get<ApiResponse<Order[]>>(`/customers/${id}/orders`),

  getPayments: (id: string) =>
    apiClient.get<ApiResponse<Payment[]>>(`/customers/${id}/payments`),
};

// Orders
export const orderAPI = {
  getAll: (params?: {
    search?: string;
    status?: string;
    date?: string;
    page?: number;
    limit?: number;
  }) =>
    apiClient.get<ApiResponse<PaginatedResponse<Order>>>("/orders", { params }),

  getById: (id: string) => apiClient.get<ApiResponse<Order>>(`/orders/${id}`),
  delete: (id: string) =>
  apiClient.delete<ApiResponse<Order>>(`/orders/${id}`),

  getSchedule: (date: string) =>
    apiClient.get<ApiResponse<Order[]>>("/orders/schedule", {
      params: { date },
    }),

  create: (data: Partial<Order>) =>
    apiClient.post<ApiResponse<Order>>("/orders", data),

  update: (id: string, data: Partial<Order>) =>
    apiClient.put<ApiResponse<Order>>(`/orders/${id}`, data),

  cancel: (id: string) => console.log("Canceling order with id:", id) ||
    apiClient.patch<ApiResponse<Order>>(`/orders/${id}/cancel`),
};

// Deliveries
export const deliveryAPI = {
  getAll: (params?: { page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<PaginatedResponse<Delivery>>>("/deliveries", {
      params,
    }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Delivery>>(`/deliveries/${id}`),

  create: (data: Partial<Delivery>) =>
    apiClient.post<ApiResponse<Delivery>>("/deliveries", data),

  update: (id: string, data: Partial<Delivery>) =>
    apiClient.put<ApiResponse<Delivery>>(`/deliveries/${id}`, data),
};

// Expenses
export const expenseAPI = {
  getAll: (params?: {
    date?: string;
    category?: string;
    page?: number;
    limit?: number;
  }) =>
    apiClient.get<ApiResponse<PaginatedResponse<Expense>>>("/expenses", {
      params,
    }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Expense>>(`/expenses/${id}`),

  create: (data: Partial<Expense>) =>
    apiClient.post<ApiResponse<Expense>>("/expenses", data),

  update: (id: string, data: Partial<Expense>) =>
    apiClient.put<ApiResponse<Expense>>(`/expenses/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/expenses/${id}`),
};

// Daily Closing
export const dailyClosingAPI = {
  getAll: (params?: { page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<PaginatedResponse<DailyClosing>>>(
      "/daily-closing",
      { params },
    ),

  getByDate: (date: string) =>
    apiClient.get<ApiResponse<DailyClosing>>(`/daily-closing/${date}`),

  getTodaySummary: () =>
    apiClient.get<ApiResponse<DailyClosing>>("/daily-closing/today/summary"),

  close: (data: Partial<DailyClosing>) =>
    apiClient.post<ApiResponse<DailyClosing>>("/daily-closing", data),
};

// Reports
export const reportAPI = {
  getDaily: (date: string) =>
    apiClient.get<ApiResponse<any>>("/reports/daily", { params: { date } }),

  getMonthly: (month: string, year: string) =>
    apiClient.get<ApiResponse<any>>("/reports/monthly", {
      params: { month, year },
    }),

  getCustomerDue: () =>
    apiClient.get<ApiResponse<any>>("/reports/customer-due"),

  getExpense: (params?: { startDate?: string; endDate?: string }) =>
    apiClient.get<ApiResponse<any>>("/reports/expense", { params }),

  getProfitLoss: (params?: { startDate?: string; endDate?: string }) =>
    apiClient.get<ApiResponse<any>>("/reports/profit-loss", { params }),
};

// Notifications
export const notificationAPI = {
  getAll: () => apiClient.get<ApiResponse<Notification[]>>("/notifications"),

  markRead: (id: string) =>
    apiClient.patch<ApiResponse<null>>(`/notifications/${id}/read`),

  markAllRead: () =>
    apiClient.patch<ApiResponse<null>>("/notifications/read-all"),
};
