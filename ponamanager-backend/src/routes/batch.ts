// src/routes/batch.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import dayjs from 'dayjs';
import { appLogger, auditLogger } from '../../utils/logger';

const router = Router();
const prisma = new PrismaClient();
router.use(authMiddleware);

// ── Helper: recompute batch totals ───────────────────────
export async function recomputeBatch(batchId: string) {
  const batchOrders = await prisma.batchOrder.findMany({
    where: { batchId },
    include: { order: true },
  });

  let totalOrderedGolda = 0,
    totalDeliveredGolda = 0;
  let totalOrderedBagda = 0,
    totalDeliveredBagda = 0;
  let totalOrderedVannamei = 0,
    totalDeliveredVannamei = 0;
  let totalCollected = 0,
    totalDue = 0;
  let duePendingCount = 0,
    pendingDeliveries = 0;

  for (const bo of batchOrders) {
    const qty = bo.order.plQuantity;
    const pona = bo.order.ponaType;

    if (pona === 'Golda PL') {
      totalOrderedGolda += qty;
      if (bo.deliveryStatus === 'delivered' || bo.deliveryStatus === 'partial')
        totalDeliveredGolda += bo.deliveredQuantity || 0;
    }
    if (pona === 'Bagda PL') {
      totalOrderedBagda += qty;
      if (bo.deliveryStatus === 'delivered' || bo.deliveryStatus === 'partial')
        totalDeliveredBagda += bo.deliveredQuantity || 0;
    }
    if (pona === 'Vannamei PL') {
      totalOrderedVannamei += qty;
      if (bo.deliveryStatus === 'delivered' || bo.deliveryStatus === 'partial')
        totalDeliveredVannamei += bo.deliveredQuantity || 0;
    }

    if (bo.deliveryStatus === 'pending') {
      pendingDeliveries++;
    } else {
      totalCollected += (bo.order.advanceAmount || 0) + (bo.customerPayment || 0);
      const due = bo.dueAmount || 0;
      totalDue += due;
      if (due > 0) duePendingCount++;
    }
  }

  const expenses = await prisma.batchExpense.findMany({ where: { batchId } });
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalProfit = totalCollected - totalExpenses;

  let status: string;
  if (pendingDeliveries === batchOrders.length) status = 'pending';
  else if (pendingDeliveries > 0) status = 'in_progress';
  else if (totalDue > 0) status = 'has_due';
  else status = 'completed';

  return prisma.batch.update({
    where: { id: batchId },
    data: {
      totalOrderedGolda,
      totalDeliveredGolda,
      totalOrderedBagda,
      totalDeliveredBagda,
      totalOrderedVannamei,
      totalDeliveredVannamei,
      totalCollected,
      totalDue,
      totalExpenses,
      totalProfit,
      pendingDeliveries,
      duePendingCount,
      status,
    },
    include: { batchOrders: { include: { order: true } }, expenses: true },
  });
}

// ── GET /batches ─────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { month, status, page = '1', limit = '50' } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (status) where.status = status;
    if (month) where.batchDate = { startsWith: month };

    const [data, total] = await Promise.all([
      prisma.batch.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { batchDate: 'desc' },
        include: { batchOrders: { include: { order: true } }, expenses: true },
      }),
      prisma.batch.count({ where }),
    ]);
    res.json({
      success: true,
      data: {
        data,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch batches' });
  }
});

// ── GET /batches/monthly/:month ──────────────────────────
router.get('/monthly/:month', async (req, res) => {
  try {
    const batches = await prisma.batch.findMany({
      where: { batchDate: { startsWith: req.params.month } },
      include: { batchOrders: { include: { order: true } }, expenses: true },
      orderBy: { batchDate: 'asc' },
    });

    const summary = {
      month: req.params.month,
      totalBatches: batches.length,
      completedBatches: batches.filter((b) => b.status === 'completed' || b.status === 'has_due')
        .length,
      totalGoldaOrdered: batches.reduce((s, b) => s + b.totalOrderedGolda, 0),
      totalGoldaDelivered: batches.reduce((s, b) => s + b.totalDeliveredGolda, 0),
      totalBagdaOrdered: batches.reduce((s, b) => s + b.totalOrderedBagda, 0),
      totalBagdaDelivered: batches.reduce((s, b) => s + b.totalDeliveredBagda, 0),
      totalVannameiOrdered: batches.reduce((s, b) => s + b.totalOrderedVannamei, 0),
      totalVannameiDelivered: batches.reduce((s, b) => s + b.totalDeliveredVannamei, 0),
      totalCollected: batches.reduce((s, b) => s + b.totalCollected, 0),
      totalDue: batches.reduce((s, b) => s + b.totalDue, 0),
      totalExpenses: batches.reduce((s, b) => s + b.totalExpenses, 0),
      totalProfit: batches.reduce((s, b) => s + b.totalProfit, 0),
      batches,
    };
    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed' });
  }
});

// ── GET /batches/:id ─────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const batch = await prisma.batch.findUnique({
      where: { id: req.params.id },
      include: {
        batchOrders: {
          include: { order: true },
          orderBy: { createdAt: 'asc' },
        },
        companyOrders: true, // ← এই লাইন যোগ করো
        expenses: true,
      },
    });
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    res.json({ success: true, data: batch });
  } catch {
    res.status(500).json({ success: false, message: 'Failed' });
  }
});

// ── POST /batches — create batch ─────────────────────────
router.post('/', async (req, res) => {
  try {
    const { batchDate, orderIds } = req.body as {
      batchDate: string;
      orderIds: string[];
    };
    if (!orderIds?.length)
      return res.status(400).json({ success: false, message: 'No orders selected' });

    // Generate batch number
    const count = await prisma.batch.count();
    const batchNumber = `BATCH-${dayjs(batchDate).format('YYYY-MM')}-${String(count + 1).padStart(3, '0')}`;

    // Create batch + batchOrders in transaction
    const batch = await prisma.$transaction(async (tx) => {
      const newBatch = await tx.batch.create({
        data: {
          batchNumber,
          batchDate,
          status: 'pending',
          pendingDeliveries: orderIds.length,
        },
      });

      // Create batch orders
      await tx.batchOrder.createMany({
        data: orderIds.map((orderId) => ({
          batchId: newBatch.id,
          orderId,
          deliveryStatus: 'pending',
        })),
      });

      // Mark orders as in_batch
      await tx.order.updateMany({
        where: { id: { in: orderIds } },
        data: { status: 'in_batch', batchId: newBatch.id },
      });

      return newBatch;
    });

    const result = await recomputeBatch(batch.id);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create batch' });
  }
});

// ── PATCH /batches/:id/add-orders ────────────────────────
router.patch('/:id/add-orders', async (req, res) => {
  try {
    const { orderIds } = req.body as { orderIds: string[] };
    await prisma.$transaction(async (tx) => {
      await tx.batchOrder.createMany({
        data: orderIds.map((orderId) => ({
          batchId: req.params.id,
          orderId,
          deliveryStatus: 'pending',
        })),
      });
      await tx.order.updateMany({
        where: { id: { in: orderIds } },
        data: { status: 'in_batch', batchId: req.params.id },
      });
    });
    const result = await recomputeBatch(req.params.id);
    res.json({ success: true, data: result });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to add orders' });
  }
});

// ── DELETE /batches/:id/orders/:batchOrderId ─────────────
router.delete('/:id/orders/:batchOrderId', async (req, res) => {
  try {
    const bo = await prisma.batchOrder.findUnique({
      where: { id: req.params.batchOrderId },
    });
    console.log(bo, 'bo');
    if (!bo) return res.status(404).json({ success: false, message: 'Not found' });

    await prisma.$transaction(async (tx) => {
      await tx.batchOrder.delete({ where: { id: req.params.batchOrderId } });
      await tx.order.update({
        where: { id: bo.orderId },
        data: { status: 'pending', batchId: null },
      });
    });
    await recomputeBatch(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to remove order' });
  }
});

// ── PATCH /batches/:id/orders/:batchOrderId/deliver ──────
router.patch('/:id/orders/:batchOrderId/deliver', async (req, res) => {
  try {
    const {
      deliveredQuantity,
      deliveryRate,
      customerPayment,
      dueAmount,
      duePaymentDate,
      notes,
      isPartial,
      remainingQuantity,
      // mir fields
      companyMir,
      ourMir,
      totalPoly,
      mirDiff,
      totalFish,
      deliveredPL,
      discount,
      finalAmount: clientFinalAmount,
    } = req.body;

    const bo = await prisma.batchOrder.findUnique({
      where: { id: req.params.batchOrderId },
      include: { order: true },
    });
    if (!bo) return res.status(404).json({ success: false, message: 'BatchOrder not found' });

    const finalAmount = clientFinalAmount ?? deliveredQuantity * deliveryRate - (discount || 0);

    // Advance carry: if paid more than finalAmount on partial, carry rest to new order
    const totalPaid = (bo.order.advanceAmount || 0) + (customerPayment || 0);
    const advanceCarry = isPartial && totalPaid > finalAmount ? totalPaid - finalAmount : 0;

    await prisma.$transaction(async (tx) => {
      // ── Update batchOrder ──────────────────────────────────────────────────
      await tx.batchOrder.update({
        where: { id: req.params.batchOrderId },
        data: {
          deliveryStatus: isPartial ? 'partial' : 'delivered',
          deliveredQuantity,
          deliveryRate,
          finalAmount,
          discount: discount || 0,
          customerPayment: customerPayment || 0,
          dueAmount: dueAmount || 0,
          duePaymentDate: dueAmount > 0 && duePaymentDate ? new Date(duePaymentDate) : null,
          notes,
          deliveredAt: new Date(),
          // mir fields
          companyMir: companyMir ?? null,
          ourMir: ourMir ?? null,
          mirDiff: mirDiff ?? null,
          totalPoly: totalPoly ?? null,
          totalFish: totalFish ?? null,
          deliveredPL: deliveredPL ?? null,
        },
      });

      // ── Update order status ────────────────────────────────────────────────
      await tx.order.update({
        where: { id: bo.orderId },
        data: {
          status: isPartial ? 'partial' : 'delivered',
          dueAmount: dueAmount || 0,
        },
      });

      // ── Create new pending order for remaining qty (partial) ──────────────
      if (isPartial && remainingQuantity > 0) {
        const orig = bo.order;

        const newOrder = await tx.order.create({
          data: {
            customerId: orig.customerId || undefined,
            customerName: orig.customerName,
            customerMobile: orig.customerMobile,
            customerAddress: orig.customerAddress,
            ponaType: orig.ponaType,
            plQuantity: remainingQuantity,
            unitRate: orig.unitRate,
            totalPrice: remainingQuantity * orig.unitRate,
            advanceAmount: advanceCarry, // ← carry forward overpaid amount
            dueAmount: Math.max(0, remainingQuantity * orig.unitRate - advanceCarry),
            deliveryDate: orig.deliveryDate,
            status: 'pending',
            notes: orig.notes,
          },
        });

        if (orig.customerId) {
          await tx.customer.update({
            where: { id: orig.customerId },
            data: {
              hasRunningOrder: true,
              totalOrders: { increment: 1 },
            },
          });
        }
      }

      // ── Update customer stats ─────────────────────────────────────────────
      if (bo.order.customerId) {
        await tx.customer.update({
          where: { id: bo.order.customerId },
          data: {
            totalPLPurchased: { increment: deliveredQuantity },
            totalPaid: { increment: (bo.order.advanceAmount || 0) + (customerPayment || 0) },
            totalDue: { increment: dueAmount || 0 },
          },
        });
      }

      // ── Payment record ────────────────────────────────────────────────────
      const payTotal = (customerPayment || 0) + (bo.order.advanceAmount || 0);
      if (payTotal > 0 && bo.order.customerId) {
        await tx.payment.create({
          data: {
            customerId: bo.order.customerId,
            orderId: bo.orderId,
            amount: payTotal,
            date: new Date().toISOString().split('T')[0],
            notes: `Batch delivery: ${req.params.id}`,
          },
        });
      }
    });

    await recomputeBatch(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to record delivery' });
  }
});

// ── PATCH /batches/:id/complete ──────────────────────────
router.patch('/:id/complete', async (req, res) => {
  try {
    const { expenses } = req.body as {
      expenses: { label: string; amount: number }[];
    };

    // Validate all delivered
    const pending = await prisma.batchOrder.count({
      where: { batchId: req.params.id, deliveryStatus: 'pending' },
    });
    if (pending > 0)
      return res.status(400).json({
        success: false,
        message: `${pending} deliveries still pending`,
      });

    await prisma.$transaction(async (tx) => {
      // Save expenses
      if (expenses?.length) {
        await tx.batchExpense.createMany({
          data: expenses.map((e) => ({
            batchId: req.params.id,
            label: e.label,
            amount: e.amount,
          })),
        });
      }
    });

    const result = await recomputeBatch(req.params.id);

    // Mark completedAt if all done
    const finalStatus = result.totalDue > 0 ? 'has_due' : 'completed';
    const updated = await prisma.batch.update({
      where: { id: req.params.id },
      data: { status: finalStatus, completedAt: new Date() },
      include: { batchOrders: { include: { order: true } }, expenses: true },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to complete batch' });
  }
});

// ── PATCH /batches/:id/orders/:batchOrderId/company-order ────────────────
router.patch('/:id/orders/:batchOrderId/company-order', async (req, res) => {
  try {
    const { companyOrderId } = req.body;

    if (!companyOrderId) {
      return res.status(400).json({ success: false, message: 'companyOrderId required' });
    }

    // Verify batch order exists
    const batchOrder = await prisma.batchOrder.findUnique({
      where: { id: req.params.batchOrderId },
    });
    if (!batchOrder) {
      return res.status(404).json({ success: false, message: 'Batch order not found' });
    }

    // Verify company order exists
    const companyOrder = await prisma.companyOrder.findUnique({
      where: { id: companyOrderId },
    });
    if (!companyOrder) {
      return res.status(404).json({ success: false, message: 'Company order not found' });
    }

    // Link batch order to company order
    const updated = await prisma.batchOrder.update({
      where: { id: req.params.batchOrderId },
      data: { companyOrderId },
      include: { order: true },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to link company order' });
  }
});

// All orders in batch → released back to pending
router.delete('/:id', async (req, res) => {
  try {
    const batch = await prisma.batch.findUnique({
      where: { id: req.params.id },
      include: { batchOrders: true },
    });
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    // Cannot delete completed batch
    if (batch.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'সম্পন্ন ব্যাচ মুছে ফেলা যাবে না',
      });
    }

    await prisma.$transaction(async (tx) => {
      // Release all orders back to pending
      const orderIds = batch.batchOrders.map((bo) => bo.orderId);
      if (orderIds.length > 0) {
        await tx.order.updateMany({
          where: { id: { in: orderIds } },
          data: { status: 'pending', batchId: null },
        });
      }
      // Delete batch (cascade deletes batchOrders + batchExpenses)
      await tx.batch.delete({ where: { id: req.params.id } });
    });

    res.json({ success: true, message: 'Batch deleted. All orders released.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete batch' });
  }
});

// PATCH /batches/:id/company-order — link or replace company order
router.patch('/:id/company-order', async (req, res) => {
  try {
    const { companyOrderId } = req.body;
    const batchId = req.params.id;

    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    await prisma.$transaction(async (tx) => {
      // Remove old link if exists
      await tx.companyOrder.updateMany({
        where: { batchId },
        data: { batchId: null },
      });

      // Set new link
      if (companyOrderId) {
        await tx.companyOrder.update({
          where: { id: companyOrderId },
          data: { batchId },
        });
      }
    });

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ success: false, message: 'Failed to update company order link' });
  }
});

// DELETE /batches/:id/company-order — remove link
router.delete('/:id/company-order', async (req, res) => {
  try {
    await prisma.companyOrder.updateMany({
      where: { batchId: req.params.id },
      data: { batchId: null },
    });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ success: false, message: 'Failed to remove company order link' });
  }
});
// ADD to src/routes/batch.ts

// ── GET /:id/expenses — list expenses for a batch ──────────────────────────────
router.get('/:id/expenses', async (req, res) => {
  try {
    const expenses = await prisma.batchExpense.findMany({
      where: { batchId: req.params.id },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: expenses });
  } catch (e: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch expenses' });
  }
});

// ── POST /:id/expenses — add expense to batch ──────────────────────────────────
router.post('/:id/expenses', async (req, res) => {
  try {
    const { label, amount, category = 'General', notes } = req.body;

    if (!label || !amount) {
      return res.status(400).json({ success: false, message: 'label and amount required' });
    }

    const batch = await prisma.batch.findUnique({ where: { id: req.params.id } });
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    if (batch.status === 'completed') {
      return res
        .status(400)
        .json({ success: false, message: 'Cannot add expense to completed batch' });
    }

    const expense = await prisma.$transaction(async (tx) => {
      const exp = await tx.batchExpense.create({
        data: { batchId: req.params.id, label, amount, category, notes },
      });
      // Update batch totalExpenses
      await tx.batch.update({
        where: { id: req.params.id },
        data: { totalExpenses: { increment: amount } },
      });
      return exp;
    });

    res.status(201).json({ success: true, data: expense });
  } catch (e: any) {
    appLogger.error({ type: 'BATCH_EXPENSE_CREATE_FAILED', error: e.message });
    res.status(500).json({ success: false, message: 'Failed to add expense' });
  }
});

// ── DELETE /:id/expenses/:expenseId — remove expense ──────────────────────────
router.delete('/:id/expenses/:expenseId', async (req, res) => {
  try {
    const expense = await prisma.batchExpense.findUnique({
      where: { id: req.params.expenseId },
    });
    if (!expense) return res.status(404).json({ success: false, message: 'Not found' });

    await prisma.$transaction(async (tx) => {
      await tx.batchExpense.delete({ where: { id: req.params.expenseId } });
      await tx.batch.update({
        where: { id: req.params.id },
        data: { totalExpenses: { decrement: expense.amount } },
      });
    });

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ success: false, message: 'Failed to delete expense' });
  }
});

// ── PATCH /:id/complete — close/complete a batch ───────────────────────────────
router.patch('/:id/complete', async (req, res) => {
  try {
    const batch = await prisma.batch.findUnique({
      where: { id: req.params.id },
      include: { batchOrders: true, expenses: true },
    });

    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    if (batch.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Batch already completed' });
    }

    // Check all orders are delivered
    const pendingOrders = batch.batchOrders.filter((o) => o.deliveryStatus === 'pending');
    if (pendingOrders.length > 0) {
      return res.status(400).json({
        success: false,
        message: `${pendingOrders.length}টি ডেলিভারি বাকি আছে`,
      });
    }

    const totalExpenses = batch.expenses.reduce((s, e) => s + e.amount, 0);
    const totalCollected = batch.totalCollected;
    const totalDue = batch.totalDue;
    const totalProfit = totalCollected - totalExpenses;

    await prisma.batch.update({
      where: { id: req.params.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        totalExpenses,
        totalProfit,
      },
    });

    auditLogger.info({
      action: 'BATCH_COMPLETED',
      entity: 'Batch',
      entityId: req.params.id,
      after: { totalCollected, totalExpenses, totalProfit, totalDue },
      req,
    });

    res.json({
      success: true,
      data: { totalCollected, totalExpenses, totalProfit, totalDue },
    });
  } catch (e: any) {
    appLogger.error({ type: 'BATCH_COMPLETE_FAILED', error: e.message });
    res.status(500).json({ success: false, message: 'Failed to complete batch' });
  }
});

export { router as batchRoutes };
