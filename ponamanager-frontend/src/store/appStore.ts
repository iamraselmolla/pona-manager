// src/store/appStore.ts
import { create } from 'zustand';
import { Customer, Order, Delivery, Expense, DashboardStats } from '../types';

interface AppState {
  customers: Customer[];
  orders: Order[];
  deliveries: Delivery[];
  expenses: Expense[];
  dashboardStats: DashboardStats | null;
  unreadNotifications: number;
  isDarkMode: boolean;
  isBengali: boolean;

  setCustomers: (customers: Customer[]) => void;
  setOrders: (orders: Order[]) => void;
  setDeliveries: (deliveries: Delivery[]) => void;
  setExpenses: (expenses: Expense[]) => void;
  setDashboardStats: (stats: DashboardStats) => void;
  setUnreadNotifications: (count: number) => void;
  toggleDarkMode: () => void;
  toggleBengali: () => void;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, data: Partial<Order>) => void;
  addExpense: (expense: Expense) => void;
  updateExpense: (id: string, data: Partial<Expense>) => void;
  removeExpense: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  customers: [],
  orders: [],
  deliveries: [],
  expenses: [],
  dashboardStats: null,
  unreadNotifications: 0,
  isDarkMode: false,
  isBengali: false,

  setCustomers: (customers) => set({ customers }),
  setOrders: (orders) => set({ orders }),
  setDeliveries: (deliveries) => set({ deliveries }),
  setExpenses: (expenses) => set({ expenses }),
  setDashboardStats: (dashboardStats) => set({ dashboardStats }),
  setUnreadNotifications: (count) => set({ unreadNotifications: count }),
  toggleDarkMode: () => set((s) => ({ isDarkMode: !s.isDarkMode })),
  toggleBengali: () => set((s) => ({ isBengali: !s.isBengali })),

  addCustomer: (customer) =>
    set((s) => ({ customers: [customer, ...s.customers] })),

  updateCustomer: (id, data) =>
    set((s) => ({
      customers: s.customers.map((c) => (c.id === id ? { ...c, ...data } : c)),
    })),

  addOrder: (order) =>
    set((s) => ({ orders: [order, ...s.orders] })),

  updateOrder: (id, data) =>
    set((s) => ({
      orders: s.orders.map((o) => (o.id === id ? { ...o, ...data } : o)),
    })),

  addExpense: (expense) =>
    set((s) => ({ expenses: [expense, ...s.expenses] })),

  updateExpense: (id, data) =>
    set((s) => ({
      expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...data } : e)),
    })),

  removeExpense: (id) =>
    set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),
}));
