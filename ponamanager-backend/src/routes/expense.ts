// src/routes/expense.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { category, date, page = '1', limit = '20' } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (category) where.category = category;
    if (date)     where.date = date;
    const [data, total] = await Promise.all([
      prisma.expense.findMany({ where, skip, take: Number(limit), orderBy: { date: 'desc' } }),
      prisma.expense.count({ where }),
    ]);
    res.json({ success: true, data: { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const expense = await prisma.expense.findUnique({ where: { id: req.params.id } });
    if (!expense) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: expense });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

router.post('/', async (req, res) => {
  try {
    const expense = await prisma.expense.create({ data: req.body });
    res.status(201).json({ success: true, data: expense });
  } catch { res.status(500).json({ success: false, message: 'Failed to create' }); }
});

router.put('/:id', async (req, res) => {
  try {
    const expense = await prisma.expense.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: expense });
  } catch { res.status(500).json({ success: false, message: 'Failed to update' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch { res.status(500).json({ success: false, message: 'Failed to delete' }); }
});

export { router as expenseRoutes };

// ─────────────────────────────────────────────────────────
// src/routes/dailyClosing.ts
import { Router as Router2 } from 'express';
const router2 = Router2();
router2.use(authMiddleware);

router2.get('/', async (req, res) => {
  try {
    const { page = '1', limit = '20' } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      prisma.dailyClosing.findMany({ skip, take: Number(limit), orderBy: { date: 'desc' } }),
      prisma.dailyClosing.count(),
    ]);
    res.json({ success: true, data: { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

router2.get('/today/summary', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const closing = await prisma.dailyClosing.findUnique({ where: { date: today } });
    res.json({ success: true, data: closing });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

router2.get('/:date', async (req, res) => {
  try {
    const closing = await prisma.dailyClosing.findUnique({ where: { date: req.params.date } });
    res.json({ success: true, data: closing });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

router2.post('/', async (req, res) => {
  try {
    const closing = await prisma.dailyClosing.create({ data: req.body });
    res.status(201).json({ success: true, data: closing });
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(400).json({ success: false, message: 'Already closed today' });
    res.status(500).json({ success: false, message: 'Failed to close day' });
  }
});

export { router2 as dailyClosingRoutes };

// ─────────────────────────────────────────────────────────
// src/routes/notification.ts
import { Router as Router3 } from 'express';
const router3 = Router3();
router3.use(authMiddleware);

router3.get('/', async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
    res.json({ success: true, data: notifications });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

router3.patch('/read-all', async (req, res) => {
  try {
    await prisma.notification.updateMany({ data: { isRead: true } });
    res.json({ success: true });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

router3.patch('/:id/read', async (req, res) => {
  try {
    const n = await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
    res.json({ success: true, data: n });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

export { router3 as notificationRoutes };

// ─────────────────────────────────────────────────────────
// src/routes/dashboard.ts
import { Router as Router4 } from 'express';
const router4 = Router4();
router4.use(authMiddleware);

router4.get('/stats', async (req, res) => {
  try {
    const [orders, batches, expenses, customers] = await Promise.all([
      prisma.order.findMany(),
      prisma.batch.findMany({ include: { batchOrders: { include: { order: true } } } }),
      prisma.expense.findMany(),
      prisma.customer.count(),
    ]);

    const totalSales      = batches.reduce((s, b) => s + b.totalCollected, 0);
    const totalDue        = batches.reduce((s, b) => s + b.totalDue, 0);
    const totalExpenses   = expenses.reduce((s, e) => s + e.amount, 0);
    const totalPLDelivered = batches.reduce((s, b) => s + b.totalDeliveredGolda + b.totalDeliveredBagda + b.totalDeliveredVannamei, 0);
    const activeBatches   = batches.filter(b => b.status === 'pending' || b.status === 'in_progress').length;

    res.json({
      success: true,
      data: {
        totalOrders: orders.length,
        totalPLDelivered,
        totalSales,
        totalDue,
        totalCollections: totalSales,
        totalExpenses,
        totalProfitLoss: totalSales - totalExpenses,
        totalCompanyMir: 0,
        totalCountingMir: 0,
        activeBatches,
        totalCustomers: customers,
        dailySales: [],
        monthlySales: [],
        dueCollection: [],
      },
    });
  } catch { res.status(500).json({ success: false, message: 'Failed to fetch stats' }); }
});

export { router4 as dashboardRoutes };

// ─────────────────────────────────────────────────────────
// src/routes/report.ts
import { Router as Router5 } from 'express';
const router5 = Router5();
router5.use(authMiddleware);

router5.get('/daily', async (req, res) => {
  try {
    const { date } = req.query as any;
    const [orders, batchOrders, expenses] = await Promise.all([
      prisma.order.findMany({ where: { deliveryDate: date } }),
      prisma.batchOrder.findMany({ where: { deliveryStatus: 'delivered', batch: { batchDate: date } }, include: { order: true } }),
      prisma.expense.findMany({ where: { date } }),
    ]);
    const totalSales    = batchOrders.reduce((s, bo) => s + (bo.finalAmount || 0), 0);
    const totalCollected = batchOrders.reduce((s, bo) => s + (bo.order.advanceAmount || 0) + (bo.customerPayment || 0), 0);
    const totalDue      = batchOrders.reduce((s, bo) => s + (bo.dueAmount || 0), 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    res.json({ success: true, data: { totalOrders: orders.length, totalDeliveries: batchOrders.length, totalSales, totalCollected, totalDue, totalExpenses, totalProfit: totalCollected - totalExpenses } });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

router5.get('/monthly', async (req, res) => {
  try {
    const { month, year } = req.query as any;
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    const batches = await prisma.batch.findMany({
      where: { batchDate: { startsWith: monthStr } },
      include: { batchOrders: { include: { order: true } }, expenses: true },
    });
    const data = {
      month: monthStr,
      totalGoldaPL:       batches.reduce((s, b) => s + b.totalDeliveredGolda, 0),
      totalGoldaSales:    batches.reduce((s, b) => s + b.batchOrders.filter(bo => bo.order.ponaType === 'Golda PL').reduce((ss, bo) => ss + (bo.finalAmount || 0), 0), 0),
      totalBagdaPL:       batches.reduce((s, b) => s + b.totalDeliveredBagda, 0),
      totalBagdaSales:    batches.reduce((s, b) => s + b.batchOrders.filter(bo => bo.order.ponaType === 'Bagda PL').reduce((ss, bo) => ss + (bo.finalAmount || 0), 0), 0),
      totalVannameiPL:    batches.reduce((s, b) => s + b.totalDeliveredVannamei, 0),
      totalVannameiSales: batches.reduce((s, b) => s + b.batchOrders.filter(bo => bo.order.ponaType === 'Vannamei PL').reduce((ss, bo) => ss + (bo.finalAmount || 0), 0), 0),
      totalExpenses:      batches.reduce((s, b) => s + b.totalExpenses, 0),
      totalCompanyMir: 0, totalCountingMir: 0,
      totalCompanyCommission: 0, totalReceivedCommission: 0,
      totalSales:  batches.reduce((s, b) => s + b.totalCollected, 0),
      totalOrders: batches.reduce((s, b) => s + b.batchOrders.length, 0),
      totalProfit: batches.reduce((s, b) => s + b.totalProfit, 0),
    };
    res.json({ success: true, data });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

router5.get('/customer-due', async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({ where: { totalDue: { gt: 0 } }, orderBy: { totalDue: 'desc' } });
    res.json({ success: true, data: customers });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

router5.get('/expense', async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany();
    const cats = [...new Set(expenses.map(e => e.category))];
    const categories = cats.map(c => ({ category: c, total: expenses.filter(e => e.category === c).reduce((s, e) => s + e.amount, 0) }));
    res.json({ success: true, data: { total: expenses.reduce((s, e) => s + e.amount, 0), categories } });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

router5.get('/profit-loss', async (req, res) => {
  try {
    const [batches, expenses] = await Promise.all([
      prisma.batch.findMany(),
      prisma.expense.findMany(),
    ]);
    const totalSales    = batches.reduce((s, b) => s + b.totalCollected, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0) + batches.reduce((s, b) => s + b.totalExpenses, 0);
    res.json({ success: true, data: { totalSales, totalExpenses, netProfit: totalSales - totalExpenses } });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

export { router5 as reportRoutes };
