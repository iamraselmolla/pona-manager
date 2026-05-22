// src/routes/collection.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { appLogger } from '../../utils/logger';

const prisma = new PrismaClient();

const router = Router();

// ── GET /collection/summary — all batches with mir comparison ─────────────────
router.get('/summary', async (req, res) => {
  try {
    const batches = await prisma.batch.findMany({
      orderBy: { batchDate: 'desc' },
      select: {
        id: true,
        batchNumber: true,
        batchDate: true,
        status: true,
        totalCollected: true,
        totalDue: true,
        totalCompanyMir: true,
        totalCountingMir: true,
        totalFishDelivered: true,
        duePendingCount: true,
        _count: {
          select: { batchOrders: true },
        },
        companyOrders: {
          select: {
            id: true,
            mirValue: true,
            totalPoly: true,
            totalPL: true,
            netDue: true,
            netAdvance: true,
            status: true,
            ponaType: true,
          },
        },
      },
    });

    // Compute totalOurMir from batchOrders for each batch
    const enriched = await Promise.all(
      batches.map(async (batch) => {
        const batchOrders = await prisma.batchOrder.findMany({
          where: { batchId: batch.id, deliveryStatus: { not: 'pending' } },
          select: { companyMir: true, ourMir: true, totalFish: true },
        });

        const totalOurMir = batchOrders.reduce((s, o) => s + (o.ourMir ?? 0), 0);
        const totalCompanyMir = batchOrders.reduce((s, o) => s + (o.companyMir ?? 0), 0);
        const totalFish = batchOrders.reduce((s, o) => s + (o.totalFish ?? 0), 0);

        return {
          ...batch,
          totalOurMir,
          totalCompanyMir,
          totalFishDelivered: totalFish,
        };
      }),
    );

    res.json({ success: true, data: enriched });
  } catch (e: any) {
    appLogger.error({ type: 'COLLECTION_SUMMARY_FAILED', error: e.message });
    res.status(500).json({ success: false, message: 'Failed to load collection summary' });
  }
});

// ── GET /collection/company — company order account summary ───────────────────
router.get('/company', async (req, res) => {
  try {
    const companyOrders = await prisma.companyOrder.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        batch: {
          select: {
            batchNumber: true,
            batchDate: true,
            status: true,
          },
        },
      },
    });

    // Overall company account totals
    const totalPaid = companyOrders.reduce((s, o) => s + (o.paymentAmount ?? 0), 0);
    const totalNetDue = companyOrders
      .filter((o) => o.status === 'delivered')
      .reduce((s, o) => s + (o.netDue ?? 0), 0);
    const totalNetAdv = companyOrders
      .filter((o) => o.status === 'delivered')
      .reduce((s, o) => s + (o.netAdvance ?? 0), 0);
    const totalPending = companyOrders.filter((o) => o.status === 'pending').length;
    const totalDelivered = companyOrders.filter((o) => o.status === 'delivered').length;

    res.json({
      success: true,
      data: {
        orders: companyOrders,
        summary: {
          totalOrders: companyOrders.length,
          totalPending,
          totalDelivered,
          totalPaid,
          totalNetDue,
          totalNetAdvance: totalNetAdv,
          // Net position: positive = we owe company, negative = company owes us
          netPosition: totalNetDue - totalNetAdv,
        },
      },
    });
  } catch (e: any) {
    appLogger.error({ type: 'COLLECTION_COMPANY_FAILED', error: e.message });
    res.status(500).json({ success: false, message: 'Failed' });
  }
});

// ── GET /batches/:id/collection — single batch full collection detail ─────────
// (Add this in batch.ts router or handle here via express.Router merge)
router.get('/batch/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    const batchOrders = await prisma.batchOrder.findMany({
      where: { batchId },
      include: {
        order: {
          select: {
            id: true,
            customerName: true,
            customerMobile: true,
            ponaType: true,
            plQuantity: true,
            unitRate: true,
            totalPrice: true,
            advanceAmount: true,
            dueAmount: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Company order linked to this batch
    const companyOrder = await prisma.companyOrder.findFirst({
      where: { batchId },
    });

    // Mir comparison per delivery
    const delivered = batchOrders.filter((o) => o.deliveryStatus !== 'pending');

    const mirComparison = delivered.map((o) => ({
      id: o.id,
      orderId: o.orderId,
      deliveryStatus: o.deliveryStatus,
      customerName: o.order.customerName,
      customerMobile: o.order.customerMobile,
      ponaType: o.order.ponaType,
      // Company side
      companyMir: o.companyMir,
      // Our side
      ourMir: o.ourMir,
      mirDiff: (o.companyMir ?? 0) - (o.ourMir ?? 0),
      totalPoly: (o as any).deliveredPL ?? o.deliveredQuantity,
      totalFish: o.totalFish,
      // Financial
      deliveryRate: o.deliveryRate,
      customerPayment: o.customerPayment,
      dueAmount: o.dueAmount,
      duePaymentDate: o.duePaymentDate,
      order: o.order,
    }));

    // Batch-level mir totals
    const totalCompanyMir = delivered.reduce((s, o) => s + (o.companyMir ?? 0), 0);
    const totalOurMir = delivered.reduce((s, o) => s + (o.ourMir ?? 0), 0);
    const totalMirDiff = totalCompanyMir - totalOurMir;
    const totalFish = delivered.reduce((s, o) => s + (o.totalFish ?? 0), 0);

    res.json({
      success: true,
      data: {
        batch: {
          ...batch,
          totalCompanyMir,
          totalOurMir,
          totalMirDiff,
          totalFishDelivered: totalFish,
        },
        batchOrders,
        mirComparison,
        companyOrder: companyOrder ?? null,
        stats: {
          totalOrders: batchOrders.length,
          deliveredCount: delivered.length,
          pendingCount: batchOrders.length - delivered.length,
          totalCompanyMir,
          totalOurMir,
          totalMirDiff,
          totalFish,
          mirMatchPercent:
            totalCompanyMir > 0 ? ((totalOurMir / totalCompanyMir) * 100).toFixed(2) : '0',
        },
      },
    });
  } catch (e: any) {
    appLogger.error({
      type: 'BATCH_COLLECTION_FAILED',
      batchId: req.params.batchId,
      error: e.message,
    });
    res.status(500).json({ success: false, message: 'Failed to load batch collection' });
  }
});

// ── GET /collection/due-report — all customers with due ──────────────────────
router.get('/due-report', async (req, res) => {
  try {
    const customersWithDue = await prisma.customer.findMany({
      where: { totalDue: { gt: 0 } },
      orderBy: { totalDue: 'desc' },
      select: {
        id: true,
        name: true,
        mobile: true,
        area: true,
        totalDue: true,
        totalPaid: true,
        totalOrders: true,
        hasRunningOrder: true,
        orders: {
          where: { dueAmount: { gt: 0 } },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            ponaType: true,
            plQuantity: true,
            dueAmount: true,
            status: true,
            deliveryDate: true,
          },
        },
      },
    });

    const totalDue = customersWithDue.reduce((s, c) => s + c.totalDue, 0);

    res.json({
      success: true,
      data: {
        customers: customersWithDue,
        totalDue,
        totalCustomers: customersWithDue.length,
      },
    });
  } catch (e: any) {
    appLogger.error({ type: 'DUE_REPORT_FAILED', error: e.message });
    res.status(500).json({ success: false, message: 'Failed' });
  }
});

// ── GET /collection/mir-report — overall mir difference report ────────────────
router.get('/mir-report', async (req, res) => {
  try {
    const allDelivered = await prisma.batchOrder.findMany({
      where: { deliveryStatus: { not: 'pending' } },
      include: {
        order: { select: { customerName: true, ponaType: true } },
        batch: { select: { batchNumber: true, batchDate: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalCompanyMir = allDelivered.reduce((s, o) => s + (o.companyMir ?? 0), 0);
    const totalOurMir = allDelivered.reduce((s, o) => s + (o.ourMir ?? 0), 0);
    const totalMirDiff = totalCompanyMir - totalOurMir;
    const totalFish = allDelivered.reduce((s, o) => s + (o.totalFish ?? 0), 0);

    // Per pona type breakdown
    const ponaTypes = ['Golda', 'Bagda', 'Vannamei'];
    const byPonaType = ponaTypes.map((pt) => {
      const orders = allDelivered.filter((o) => o.order.ponaType === pt);
      const cMir = orders.reduce((s, o) => s + (o.companyMir ?? 0), 0);
      const oMir = orders.reduce((s, o) => s + (o.ourMir ?? 0), 0);
      const fish = orders.reduce((s, o) => s + (o.totalFish ?? 0), 0);
      return {
        ponaType: pt,
        companyMir: cMir,
        ourMir: oMir,
        mirDiff: cMir - oMir,
        totalFish: fish,
        count: orders.length,
      };
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalCompanyMir,
          totalOurMir,
          totalMirDiff,
          totalFish,
          totalDeliveries: allDelivered.length,
          mirMatchPercent:
            totalCompanyMir > 0 ? ((totalOurMir / totalCompanyMir) * 100).toFixed(2) : '0',
        },
        byPonaType,
        deliveries: allDelivered.map((o) => ({
          id: o.id,
          batchNumber: o.batch?.batchNumber,
          batchDate: o.batch?.batchDate,
          customerName: o.order.customerName,
          ponaType: o.order.ponaType,
          companyMir: o.companyMir,
          ourMir: o.ourMir,
          mirDiff: (o.companyMir ?? 0) - (o.ourMir ?? 0),
          totalFish: o.totalFish,
        })),
      },
    });
  } catch (e: any) {
    appLogger.error({ type: 'MIR_REPORT_FAILED', error: e.message });
    res.status(500).json({ success: false, message: 'Failed' });
  }
});

export { router as collectionRouter };
