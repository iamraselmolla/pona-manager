import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

export const initDatabase = () => {
  try {
    const db = SQLite.openDatabase("PonaManager.db");

    db.transaction((tx) => {
      tx.executeSql(`
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
      `);
      tx.executeSql(`
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
      `);
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS expenses (
          id TEXT PRIMARY KEY,
          amount REAL,
          category TEXT,
          date TEXT,
          notes TEXT,
          synced INTEGER DEFAULT 0,
          createdAt TEXT
        );
      `);
      tx.executeSql(`
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
    });
    console.log("Database initialized");
  } catch (error) {
    console.error("Database init error:", error);
  }
};

export const getDB = () => db;

// Customer queries
export const localCustomerDB = {
  getAll: (callback: (customers: any[]) => void) => {
    if (!db) return;
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM customers ORDER BY name ASC",
        [],
        (_, result) => callback(result.rows._array),
        (_, error) => {
          console.error(error);
          return false;
        },
      );
    });
  },

  getByMobile: (mobile: string, callback: (customer: any | null) => void) => {
    if (!db) return;
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM customers WHERE mobile = ? LIMIT 1",
        [mobile],
        (_, result) => callback(result.rows._array[0] || null),
        (_, error) => {
          console.error(error);
          return false;
        },
      );
    });
  },

  upsert: (customer: any) => {
    if (!db) return;
    db.transaction((tx) => {
      tx.executeSql(
        `INSERT OR REPLACE INTO customers
         (id, name, mobile, address, area, totalOrders, totalPLPurchased, totalPaid, totalDue, hasRunningOrder, synced, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          customer.id,
          customer.name,
          customer.mobile,
          customer.address || "",
          customer.area || "",
          customer.totalOrders || 0,
          customer.totalPLPurchased || 0,
          customer.totalPaid || 0,
          customer.totalDue || 0,
          customer.hasRunningOrder ? 1 : 0,
          0,
          customer.createdAt,
          customer.updatedAt,
        ],
      );
    });
  },
};

// Order queries
export const localOrderDB = {
  getAll: (callback: (orders: any[]) => void) => {
    if (!db) return;
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM orders ORDER BY createdAt DESC",
        [],
        (_, result) => callback(result.rows._array),
        (_, error) => {
          console.error(error);
          return false;
        },
      );
    });
  },

  upsert: (order: any) => {
    if (!db) return;
    db.transaction((tx) => {
      tx.executeSql(
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
          order.notes || "",
          0,
          order.createdAt,
          order.updatedAt,
        ],
      );
    });
  },
};

// Expense queries
export const localExpenseDB = {
  getAll: (callback: (expenses: any[]) => void) => {
    if (!db) return;
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM expenses ORDER BY date DESC",
        [],
        (_, result) => callback(result.rows._array),
        (_, error) => {
          console.error(error);
          return false;
        },
      );
    });
  },

  upsert: (expense: any) => {
    if (!db) return;
    db.transaction((tx) => {
      tx.executeSql(
        `INSERT OR REPLACE INTO expenses (id, amount, category, date, notes, synced, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          expense.id,
          expense.amount,
          expense.category,
          expense.date,
          expense.notes || "",
          0,
          expense.createdAt,
        ],
      );
    });
  },

  delete: (id: string) => {
    if (!db) return;
    db.transaction((tx) => {
      tx.executeSql("DELETE FROM expenses WHERE id = ?", [id]);
    });
  },
};
