// src/routes/auth.ts
import { Router } from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, generateToken } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }
    const token = generateToken(user.id);
    const { password: _, ...userData } = user;
    res.json({ success: true, data: { token, user: userData } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

router.get("/profile", authMiddleware, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    res.json({ success: true, data: user });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch profile" });
  }
});

export { router as authRoutes };

// src/routes/customer.ts
import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const customerRouter = Router();
const customerPrisma = new PrismaClient();

customerRouter.get("/", async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit) || 0;
    const where: any = search
      ? {
          OR: [
            { name: { contains: String(search), mode: "insensitive" } },
            { mobile: { contains: String(search) } },
          ],
        }
      : {};
    const customers = await customerPrisma.customer.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { name: "asc" },
    });
    const total = await customerPrisma.customer.count({ where });
    res.json({
      success: true,
      data: {
        data: customers,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch customers" });
  }
});

customerRouter.get("/:id", async (req, res) => {
  try {
    const customer = await customerPrisma.customer.findUnique({
      where: { id: req.params.id },
    });
    res.json({ success: true, data: customer });
  } catch (err) {
    res.status(500).json({ success: false, message: "Customer not found" });
  }
});

customerRouter.get("/mobile/:mobile", async (req, res) => {
  try {
    const customer = await customerPrisma.customer.findUnique({
      where: { mobile: req.params.mobile },
    });
    if (!customer) throw new Error("Not found");
    res.json({ success: true, data: customer });
  } catch (err) {
    res.status(404).json({ success: false, message: "Customer not found" });
  }
});

customerRouter.post("/", async (req, res) => {
  try {
    const customer = await customerPrisma.customer.create({ data: req.body });
    res.json({ success: true, data: customer });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to create customer" });
  }
});

customerRouter.put("/:id", async (req, res) => {
  try {
    const customer = await customerPrisma.customer.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ success: true, data: customer });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update customer" });
  }
});

customerRouter.delete("/:id", async (req, res) => {
  try {
    await customerPrisma.customer.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to delete customer" });
  }
});

customerRouter.get("/:id/orders", async (req, res) => {
  try {
    const orders = await customerPrisma.order.findMany({
      where: { customerId: req.params.id },
    });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
});

customerRouter.get("/:id/payments", async (req, res) => {
  try {
    const payments = await customerPrisma.payment.findMany({
      where: { customerId: req.params.id },
    });
    res.json({ success: true, data: payments });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch payments" });
  }
});

export { customerRouter as customerRoutes };

// src/routes/order.ts
import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const orderRouter = Router();
const orderPrisma = new PrismaClient();

orderRouter.get("/", async (req, res) => {
  try {
    const { search, status, date, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit) || 0;
    const where: any = {};
    if (search)
      where.OR = [
        { customerName: { contains: String(search), mode: "insensitive" } },
        { customerMobile: String(search) },
      ];
    if (status) where.status = status;
    if (date) where.deliveryDate = date;
    const orders = await orderPrisma.order.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    });
    const total = await orderPrisma.order.count({ where });
    res.json({
      success: true,
      data: {
        data: orders,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
});

orderRouter.get("/:id", async (req, res) => {
  try {
    const order = await orderPrisma.order.findUnique({
      where: { id: req.params.id },
    });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: "Order not found" });
  }
});

orderRouter.post("/", async (req, res) => {
  try {
    const order = await orderPrisma.order.create({ data: req.body });
    if (req.body.customerId) {
      await orderPrisma.customer.update({
        where: { id: req.body.customerId },
        data: { hasRunningOrder: true, totalOrders: { increment: 1 } },
      });
    }
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to create order" });
  }
});

orderRouter.put("/:id", async (req, res) => {
  try {
    const order = await orderPrisma.order.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update order" });
  }
});

orderRouter.patch("/:id/cancel", async (req, res) => {
  try {
    const order = await orderPrisma.order.update({
      where: { id: req.params.id },
      data: { status: "cancelled" },
    });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to cancel order" });
  }
});

export { orderRouter as orderRoutes };

// src/routes/delivery.ts
import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const deliveryRouter = Router();
const deliveryPrisma = new PrismaClient();

deliveryRouter.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit) || 0;
    const deliveries = await deliveryPrisma.delivery.findMany({
      skip,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    });
    const total = await deliveryPrisma.delivery.count();
    res.json({
      success: true,
      data: {
        data: deliveries,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch deliveries" });
  }
});

deliveryRouter.get("/:id", async (req, res) => {
  try {
    const delivery = await deliveryPrisma.delivery.findUnique({
      where: { id: req.params.id },
    });
    res.json({ success: true, data: delivery });
  } catch (err) {
    res.status(500).json({ success: false, message: "Delivery not found" });
  }
});

deliveryRouter.post("/", async (req, res) => {
  try {
    const delivery = await deliveryPrisma.delivery.create({ data: req.body });
    const order = await deliveryPrisma.order.findUnique({
      where: { id: req.body.orderId },
    });
    if (order) {
      await deliveryPrisma.order.update({
        where: { id: order.id },
        data: { status: "delivered", dueAmount: req.body.remainingDue },
      });
    }
    res.json({ success: true, data: delivery });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to create delivery" });
  }
});

deliveryRouter.put("/:id", async (req, res) => {
  try {
    const delivery = await deliveryPrisma.delivery.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ success: true, data: delivery });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update delivery" });
  }
});

export { deliveryRouter as deliveryRoutes };

// src/routes/expense.ts
import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const expenseRouter = Router();
const expensePrisma = new PrismaClient();

expenseRouter.get("/", async (req, res) => {
  try {
    const { category, date, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit) || 0;
    const where: any = {};
    if (category) where.category = category;
    if (date) where.date = date;
    const expenses = await expensePrisma.expense.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    });
    const total = await expensePrisma.expense.count({ where });
    res.json({
      success: true,
      data: {
        data: expenses,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch expenses" });
  }
});

expenseRouter.get("/:id", async (req, res) => {
  try {
    const expense = await expensePrisma.expense.findUnique({
      where: { id: req.params.id },
    });
    res.json({ success: true, data: expense });
  } catch (err) {
    res.status(500).json({ success: false, message: "Expense not found" });
  }
});

expenseRouter.post("/", async (req, res) => {
  try {
    const expense = await expensePrisma.expense.create({ data: req.body });
    res.json({ success: true, data: expense });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to create expense" });
  }
});

expenseRouter.put("/:id", async (req, res) => {
  try {
    const expense = await expensePrisma.expense.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ success: true, data: expense });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update expense" });
  }
});

expenseRouter.delete("/:id", async (req, res) => {
  try {
    await expensePrisma.expense.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to delete expense" });
  }
});

export { expenseRouter as expenseRoutes };

// src/routes/dailyClosing.ts
import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const closingRouter = Router();
const closingPrisma = new PrismaClient();

closingRouter.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit) || 0;
    const closings = await closingPrisma.dailyClosing.findMany({
      skip,
      take: Number(limit),
      orderBy: { date: "desc" },
    });
    const total = await closingPrisma.dailyClosing.count();
    res.json({
      success: true,
      data: {
        data: closings,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch closings" });
  }
});

closingRouter.get("/:date", async (req, res) => {
  try {
    const closing = await closingPrisma.dailyClosing.findUnique({
      where: { date: req.params.date },
    });
    res.json({ success: true, data: closing });
  } catch (err) {
    res.status(404).json({ success: false, message: "Closing not found" });
  }
});

closingRouter.post("/", async (req, res) => {
  try {
    const closing = await closingPrisma.dailyClosing.create({ data: req.body });
    res.json({ success: true, data: closing });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to close day" });
  }
});

export { closingRouter as dailyClosingRoutes };

// src/routes/report.ts
import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const reportRouter = Router();
const reportPrisma = new PrismaClient();

reportRouter.get("/daily", async (req, res) => {
  try {
    const { date } = req.query;
    const orders = await reportPrisma.order.findMany({
      where: { deliveryDate: String(date) },
    });
    const deliveries = await reportPrisma.delivery.findMany({
      where: { deliveryDate: String(date) },
    });
    const expenses = await reportPrisma.expense.findMany({
      where: { date: String(date) },
    });
    const totalSales = deliveries.reduce((sum, d) => sum + d.finalAmount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    res.json({
      success: true,
      data: {
        totalOrders: orders.length,
        totalDeliveries: deliveries.length,
        totalSales,
        totalExpenses,
        totalProfit: totalSales - totalExpenses,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch report" });
  }
});

reportRouter.get("/monthly", async (req, res) => {
  try {
    const { month, year } = req.query;
    const monthStr = `${year}-${String(month).padStart(2, "0")}`;
    const report = await reportPrisma.monthlyReport.findUnique({
      where: { month: monthStr },
    });
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch report" });
  }
});

reportRouter.get("/customer-due", async (req, res) => {
  try {
    const customers = await reportPrisma.customer.findMany({
      where: { totalDue: { gt: 0 } },
      orderBy: { totalDue: "desc" },
    });
    res.json({ success: true, data: customers });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch report" });
  }
});

reportRouter.get("/expense", async (req, res) => {
  try {
    const expenses = await reportPrisma.expense.findMany();
    const categories = [...new Set(expenses.map((e) => e.category))];
    const categoryData = categories.map((cat) => ({
      category: cat,
      total: expenses
        .filter((e) => e.category === cat)
        .reduce((sum, e) => sum + e.amount, 0),
    }));
    res.json({
      success: true,
      data: {
        total: expenses.reduce((sum, e) => sum + e.amount, 0),
        categories: categoryData,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch report" });
  }
});

reportRouter.get("/profit-loss", async (req, res) => {
  try {
    const deliveries = await reportPrisma.delivery.findMany();
    const expenses = await reportPrisma.expense.findMany();
    const totalSales = deliveries.reduce((sum, d) => sum + d.finalAmount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    res.json({
      success: true,
      data: {
        totalSales,
        totalExpenses,
        netProfit: totalSales - totalExpenses,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch report" });
  }
});

export { reportRouter as reportRoutes };

// src/routes/notification.ts
import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const notificationRouter = Router();
const notificationPrisma = new PrismaClient();

notificationRouter.get("/", async (req, res) => {
  try {
    const notifications = await notificationPrisma.notification.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: notifications });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch notifications" });
  }
});

notificationRouter.patch("/:id/read", async (req, res) => {
  try {
    const notification = await notificationPrisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    res.json({ success: true, data: notification });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update notification" });
  }
});

notificationRouter.patch("/read-all", async (req, res) => {
  try {
    await notificationPrisma.notification.updateMany({
      data: { isRead: true },
    });
    res.json({ success: true });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update notifications" });
  }
});

export { notificationRouter as notificationRoutes };

// src/routes/dashboard.ts
import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const dashboardRouter = Router();
const dashboardPrisma = new PrismaClient();

dashboardRouter.get("/stats", async (req, res) => {
  try {
    const orders = await dashboardPrisma.order.findMany();
    const deliveries = await dashboardPrisma.delivery.findMany();
    const expenses = await dashboardPrisma.expense.findMany();
    const totalSales = deliveries.reduce((sum, d) => sum + d.finalAmount, 0);
    const totalCollections = deliveries.reduce(
      (sum, d) => sum + d.customerPayment,
      0,
    );
    const totalDue = orders.reduce((sum, o) => sum + o.dueAmount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    res.json({
      success: true,
      data: {
        totalOrders: orders.length,
        totalPLDelivered: deliveries.reduce(
          (sum, d) => sum + d.deliveredQuantity,
          0,
        ),
        totalSales,
        totalCollections,
        totalDue,
        totalExpenses,
        totalProfitLoss: totalSales - totalExpenses,
        totalCompanyMir: deliveries.reduce((sum, d) => sum + d.companyMir, 0),
        totalCountingMir: deliveries.reduce((sum, d) => sum + d.countingMir, 0),
        dailySales: [],
        monthlySales: [],
        dueCollection: [],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
});

export { dashboardRouter as dashboardRoutes };
