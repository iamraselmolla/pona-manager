// src/types/index.ts

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  address: string;
  area: string;
  totalOrders: number;
  totalPLPurchased: number;
  totalPaid: number;
  totalDue: number;
  hasRunningOrder: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PonaType = 'Golda PL' | 'Bagda PL' | 'Vannamei PL';
export type OrderStatus = 'pending' | 'in_batch' | 'delivered' | 'cancelled';
export type BatchStatus = 'pending' | 'in_progress' | 'completed' | 'has_due';

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  customerAddress: string;
  ponaType: PonaType;
  plQuantity: number;
  unitRate: number;
  totalPrice: number;
  advanceAmount: number;
  dueAmount: number;
  deliveryDate: string;
  status: OrderStatus;
  batchId?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface BatchOrder {
  id: string;
  batchId: string;
  orderId: string;
  order: Order;
  deliveryStatus: 'pending' | 'delivered';
  deliveredQuantity?: number;
  deliveryRate?: number;
  finalAmount?: number;
  customerPayment?: number;
  dueAmount?: number;
  duePaymentDate?: string;
  notes?: string;
  deliveredAt?: string;
}

export interface BatchExpense {
  id?: string;
  label: string;
  amount: number;
}

export interface Batch {
  id: string;
  batchDate: string;
  batchNumber: string;
  status: BatchStatus;
  batchOrders: BatchOrder[];
  expenses: BatchExpense[];
  totalOrderedGolda: number;
  totalDeliveredGolda: number;
  totalOrderedBagda: number;
  totalDeliveredBagda: number;
  totalOrderedVannamei: number;
  totalDeliveredVannamei: number;
  totalCollected: number;
  totalDue: number;
  totalExpenses: number;
  totalProfit: number;
  pendingDeliveries: number;
  duePendingCount: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Delivery {
  id: string;
  orderId: string;
  batchId?: string;
  customerId: string;
  customerName: string;
  orderedQuantity: number;
  deliveredQuantity: number;
  companyProvidedQuantity: number;
  countedQuantity: number;
  companyMir: number;
  countingMir: number;
  deliveryRate: number;
  discount: number;
  finalAmount: number;
  customerPayment: number;
  remainingDue: number;
  duePaymentDate?: string;
  profitLoss: number;
  mirPercentage: number;
  notes: string;
  deliveryDate: string;
  createdAt: string;
}

export type ExpenseCategory = 'Transport' | 'Labor' | 'Oxygen' | 'Packaging' | 'Food' | 'Others';

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  notes: string;
  createdAt: string;
}

export interface DailyClosing {
  id: string;
  date: string;
  totalOrders: number;
  totalDeliveries: number;
  totalSales: number;
  totalCollections: number;
  totalDue: number;
  totalExpenses: number;
  totalCompanyMir: number;
  totalCountingMir: number;
  transportExpense: number;
  laborExpense: number;
  otherExpenses: number;
  netProfitLoss: number;
  cashInHand: number;
  closedAt: string;
}

export interface Payment {
  id: string;
  customerId: string;
  orderId: string;
  amount: number;
  date: string;
  notes: string;
  createdAt: string;
}

export interface DashboardStats {
  totalOrders: number;
  totalPLDelivered: number;
  totalSales: number;
  totalDue: number;
  totalCollections: number;
  totalExpenses: number;
  totalProfitLoss: number;
  totalCompanyMir: number;
  totalCountingMir: number;
  activeBatches: number;
  dailySales: { date: string; amount: number }[];
  monthlySales: { month: string; amount: number }[];
  dueCollection: { date: string; due: number; collected: number }[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'due_reminder' | 'upcoming_delivery' | 'running_order' | 'daily_closing' | 'batch_reminder';
  isRead: boolean;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  ForgotPassword: undefined;
  Main: undefined;
  CustomerDetails: { customerId: string };
  AddEditCustomer: { customerId?: string };
  OrderDetails: { orderId: string };
  CreateOrder: { customerId?: string };
  BatchList: undefined;
  CreateBatch: undefined;
  BatchDetails: { batchId: string };
  BatchDeliveryModal: { batchId: string; batchOrderId: string };
  CompleteBatch: { batchId: string };
  MonthlyBatchReport: { month: string };
  DeliveryEntry: { orderId: string; deliveryId?: string };
  DeliveryDetails: { deliveryId: string };
  AddExpense: { expenseId?: string };
  DailyClosing: undefined;
  DailyClosingHistory: undefined;
  DailyReport: { date: string };
  MonthlyReport: { month: string };
  CustomerDueReport: undefined;
  ExpenseReport: undefined;
  ProfitLossReport: undefined;
  NotificationScreen: undefined;
  Profile: undefined;
  AppSettings: undefined;
};
