// src/utils/database.ts
import * as SQLite from "expo-sqlite/legacy";

let db: any;

export const initDatabase = async () => {
  db = await SQLite.openDatabaseAsync("ponatrack.db");

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      mobile TEXT UNIQUE NOT NULL,
      address TEXT,
      area TEXT,
      totalOrders INTEGER DEFAULT 0,
      totalPLPurchased REAL DEFAULT 0,
      totalPaid REAL DEFAULT 0,
      totalDue REAL DEFAULT 0,
      hasRunningOrder INTEGER DEFAULT 0,
      synced INTEGER DEFAULT 0,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customerId TEXT,
      customerName TEXT,
      customerMobile TEXT,
      customerAddress TEXT,
      ponaType TEXT,
      plQuantity REAL,
      unitRate REAL,
      totalPrice REAL,
      advanceAmount REAL DEFAULT 0,
      dueAmount REAL DEFAULT 0,
      deliveryDate TEXT,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      synced INTEGER DEFAULT 0,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS deliveries (
      id TEXT PRIMARY KEY,
      orderId TEXT,
      customerId TEXT,
      customerName TEXT,
      orderedQuantity REAL,
      deliveredQuantity REAL,
      companyProvidedQuantity REAL,
      countedQuantity REAL,
      companyMir REAL DEFAULT 0,
      countingMir REAL DEFAULT 0,
      deliveryRate REAL,
      discount REAL DEFAULT 0,
      finalAmount REAL,
      customerPayment REAL DEFAULT 0,
      remainingDue REAL DEFAULT 0,
      profitLoss REAL DEFAULT 0,
      mirPercentage REAL DEFAULT 0,
      notes TEXT,
      deliveryDate TEXT,
      synced INTEGER DEFAULT 0,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      amount REAL,
      category TEXT,
      date TEXT,
      notes TEXT,
      synced INTEGER DEFAULT 0,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS daily_closings (
      id TEXT PRIMARY KEY,
      date TEXT UNIQUE,
      totalOrders INTEGER,
      totalDeliveries INTEGER,
      totalSales REAL,
      totalCollections REAL,
      totalDue REAL,
      totalExpenses REAL,
      totalCompanyMir REAL,
      totalCountingMir REAL,
      transportExpense REAL,
      laborExpense REAL,
      otherExpenses REAL,
      netProfitLoss REAL,
      cashInHand REAL,
      synced INTEGER DEFAULT 0,
      closedAt TEXT
    );
  `);
};

export const getDB = () => db;

// Customer queries
export const localCustomerDB = {
  getAll: async (): Promise<any[]> => {
    return await db.getAllAsync("SELECT * FROM customers ORDER BY name ASC");
  },

  getByMobile: async (mobile: string): Promise<any | null> => {
    return await db.getFirstAsync("SELECT * FROM customers WHERE mobile = ?", [
      mobile,
    ]);
  },

  upsert: async (customer: any) => {
    await db.runAsync(
      `INSERT OR REPLACE INTO customers 
       (id, name, mobile, address, area, totalOrders, totalPLPurchased, totalPaid, totalDue, hasRunningOrder, synced, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customer.id,
        customer.name,
        customer.mobile,
        customer.address,
        customer.area,
        customer.totalOrders,
        customer.totalPLPurchased,
        customer.totalPaid,
        customer.totalDue,
        customer.hasRunningOrder ? 1 : 0,
        customer.synced ? 1 : 0,
        customer.createdAt,
        customer.updatedAt,
      ],
    );
  },
};

// Order queries
export const localOrderDB = {
  getAll: async (): Promise<any[]> => {
    return await db.getAllAsync("SELECT * FROM orders ORDER BY createdAt DESC");
  },

  getById: async (id: string): Promise<any | null> => {
    return await db.getFirstAsync("SELECT * FROM orders WHERE id = ?", [id]);
  },

  upsert: async (order: any) => {
    await db.runAsync(
      `INSERT OR REPLACE INTO orders 
       (id, customerId, customerName, customerMobile, customerAddress, ponaType, plQuantity, unitRate, totalPrice, advanceAmount, dueAmount, deliveryDate, status, notes, synced, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order.id,
        order.customerId,
        order.customerName,
        order.customerMobile,
        order.customerAddress,
        order.ponaType,
        order.plQuantity,
        order.unitRate,
        order.totalPrice,
        order.advanceAmount,
        order.dueAmount,
        order.deliveryDate,
        order.status,
        order.notes,
        order.synced ? 1 : 0,
        order.createdAt,
        order.updatedAt,
      ],
    );
  },
};

// Expense queries
export const localExpenseDB = {
  getAll: async (): Promise<any[]> => {
    return await db.getAllAsync("SELECT * FROM expenses ORDER BY date DESC");
  },

  upsert: async (expense: any) => {
    await db.runAsync(
      `INSERT OR REPLACE INTO expenses (id, amount, category, date, notes, synced, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        expense.id,
        expense.amount,
        expense.category,
        expense.date,
        expense.notes,
        expense.synced ? 1 : 0,
        expense.createdAt,
      ],
    );
  },

  delete: async (id: string) => {
    await db.runAsync("DELETE FROM expenses WHERE id = ?", [id]);
  },
};

export const syncPendingData = async () => {
  // Sync logic - push unsynced records to server
  const unsyncedOrders = await db.getAllAsync(
    "SELECT * FROM orders WHERE synced = 0",
  );
  const unsyncedExpenses = await db.getAllAsync(
    "SELECT * FROM expenses WHERE synced = 0",
  );
  return { orders: unsyncedOrders, expenses: unsyncedExpenses };
};
