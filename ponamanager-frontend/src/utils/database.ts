// src/utils/database.ts
// expo-sqlite v13+ compatible (openDatabaseSync API)
import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export const initDatabase = () => {
  try {
    db = SQLite.openDatabaseSync('PonaManager.db');

    db.execSync(`
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
        netProfitLoss REAL,
        cashInHand REAL,
        synced INTEGER DEFAULT 0,
        closedAt TEXT
      );
    `);

    console.log('✅ Database initialized');
  } catch (error) {
    console.error('❌ Database init error:', error);
  }
};

export const getDB = () => db;

// ── Customer queries ──────────────────────────────────────
export const localCustomerDB = {
  getAll: (): any[] => {
    if (!db) return [];
    try {
      return db.getAllSync('SELECT * FROM customers ORDER BY name ASC');
    } catch {
      return [];
    }
  },

  getByMobile: (mobile: string): any | null => {
    if (!db) return null;
    try {
      return db.getFirstSync('SELECT * FROM customers WHERE mobile = ? LIMIT 1', [mobile]);
    } catch {
      return null;
    }
  },

  upsert: (customer: any) => {
    if (!db) return;
    try {
      db.runSync(
        `INSERT OR REPLACE INTO customers
         (id, name, mobile, address, area, totalOrders, totalPLPurchased,
          totalPaid, totalDue, hasRunningOrder, synced, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          customer.id, customer.name, customer.mobile,
          customer.address || '', customer.area || '',
          customer.totalOrders || 0, customer.totalPLPurchased || 0,
          customer.totalPaid || 0, customer.totalDue || 0,
          customer.hasRunningOrder ? 1 : 0, 0,
          customer.createdAt, customer.updatedAt,
        ]
      );
    } catch (e) { console.error('customer upsert error:', e); }
  },
};

// ── Order queries ─────────────────────────────────────────
export const localOrderDB = {
  getAll: (): any[] => {
    if (!db) return [];
    try {
      return db.getAllSync('SELECT * FROM orders ORDER BY createdAt DESC');
    } catch {
      return [];
    }
  },

  upsert: (order: any) => {
    if (!db) return;
    try {
      db.runSync(
        `INSERT OR REPLACE INTO orders
         (id, customerId, customerName, customerMobile, customerAddress,
          ponaType, plQuantity, unitRate, totalPrice, advanceAmount,
          dueAmount, deliveryDate, status, notes, synced, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order.id, order.customerId, order.customerName,
          order.customerMobile, order.customerAddress, order.ponaType,
          order.plQuantity, order.unitRate, order.totalPrice,
          order.advanceAmount, order.dueAmount, order.deliveryDate,
          order.status, order.notes || '', 0,
          order.createdAt, order.updatedAt,
        ]
      );
    } catch (e) { console.error('order upsert error:', e); }
  },
};

// ── Expense queries ───────────────────────────────────────
export const localExpenseDB = {
  getAll: (): any[] => {
    if (!db) return [];
    try {
      return db.getAllSync('SELECT * FROM expenses ORDER BY date DESC');
    } catch {
      return [];
    }
  },

  upsert: (expense: any) => {
    if (!db) return;
    try {
      db.runSync(
        `INSERT OR REPLACE INTO expenses
         (id, amount, category, date, notes, synced, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          expense.id, expense.amount, expense.category,
          expense.date, expense.notes || '', 0, expense.createdAt,
        ]
      );
    } catch (e) { console.error('expense upsert error:', e); }
  },

  delete: (id: string) => {
    if (!db) return;
    try {
      db.runSync('DELETE FROM expenses WHERE id = ?', [id]);
    } catch (e) { console.error('expense delete error:', e); }
  },
};