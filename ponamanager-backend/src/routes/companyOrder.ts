import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { appLogger, auditLogger } from '../../utils/logger';

const prisma = new PrismaClient();

const router = Router();

// ── Carry forward helper ───────────────────────────────────────────────────
const getCarryForward = async (excludeId?: string) => {
  const last = await prisma.companyOrder.findFirst({
    where: {
      status: 'delivered',
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
  if (!last) return { prevDue: 0, prevAdvance: 0 };
  return {
    prevDue: last.netDue > 0 ? last.netDue : 0,
    prevAdvance: last.netAdvance > 0 ? last.netAdvance : 0,
  };
};

// ── Net position calculator ────────────────────────────────────────────────
const computeNet = (
  actualAmount: number,
  totalPaid: number,
  prevDue: number,
  prevAdvance: number,
) => {
  const totalOwed = prevDue + actualAmount;
  const totalPaidAll = prevAdvance + totalPaid;
  const net = totalOwed - totalPaidAll;
  return {
    netDue: net > 0 ? net : 0,
    netAdvance: net < 0 ? Math.abs(net) : 0,
  };
};

// ── GET all ────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { status, ponaType } = req.query;
    const orders = await prisma.companyOrder.findMany({
      where: {
        ...(status ? { status: status as string } : {}),
        ...(ponaType ? { ponaType: ponaType as string } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        batch: { select: { batchNumber: true, status: true, batchDate: true } },
      },
    });
    res.json({ success: true, data: orders });
  } catch (e: any) {
    appLogger.error({ type: 'COMPANY_ORDER_GET_FAILED', error: e.message });
    res.status(500).json({ success: false, message: 'Failed' });
  }
});

// ── GET by id ──────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const order = await prisma.companyOrder.findUnique({
      where: { id: req.params.id },
      include: {
        batch: { select: { batchNumber: true, status: true, batchDate: true } },
      },
    });
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: order });
  } catch (e: any) {
    res.status(500).json({ success: false, message: 'Failed' });
  }
});

// ── POST — create (payment made, waiting for pona) ─────────────────────────
router.post('/', async (req, res) => {
  try {
    const { ponaType, paymentAmount, ratePerPL, expectedDate, notes } = req.body;

    if (!ponaType || !paymentAmount || !ratePerPL || !expectedDate) {
      return res.status(400).json({
        success: false,
        message: 'ponaType, paymentAmount, ratePerPL, expectedDate required',
      });
    }

    const expectedPL = paymentAmount / ratePerPL;

    const order = await prisma.companyOrder.create({
      data: {
        ponaType,
        paymentAmount,
        ratePerPL,
        expectedPL,
        expectedDate: new Date(expectedDate),
        status: 'pending',
        notes,
      },
    });

    auditLogger.info('ORDER_CREATED', { entity: 'CompanyOrder', entityId: order.id, after: order });

    res.status(201).json({ success: true, data: order });
  } catch (e: any) {
    appLogger.error({ type: 'COMPANY_ORDER_CREATE_FAILED', error: e.message });
    res.status(500).json({ success: false, message: 'Failed to create company order' });
  }
});

// ── PATCH /:id/receive — pona arrived, fill mir + poly + link to batch ─────
router.patch('/:id/receive', async (req, res) => {
  try {
    const { mirValue, totalPoly, paidToCompany, batchId, notes } = req.body;

    if (!mirValue || !totalPoly) {
      return res.status(400).json({ success: false, message: 'mirValue and totalPoly required' });
    }

    const existing = await prisma.companyOrder.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    const totalPL = mirValue * totalPoly;
    const actualAmount = totalPL * existing.ratePerPL;
    const totalPaid = existing.paymentAmount + (paidToCompany ?? 0);

    const { prevDue, prevAdvance } = await getCarryForward(req.params.id);
    const { netDue, netAdvance } = computeNet(actualAmount, totalPaid, prevDue, prevAdvance);

    const updated = await prisma.companyOrder.update({
      where: { id: req.params.id },
      data: {
        mirValue,
        totalPoly,
        totalPL,
        actualAmount,
        paidToCompany: paidToCompany ?? 0,
        dueToCompany: netDue,
        advanceToUs: netAdvance,
        prevDue,
        prevAdvance,
        netDue,
        netAdvance,
        status: 'delivered',
        batchId: batchId ?? null,
        notes: notes ?? existing.notes,
      },
    });

    auditLogger.info('ORDER_DELIVERED', {
      entity: 'CompanyOrder',
      entityId: updated.id,
      after: updated,
    });

    res.json({ success: true, data: updated });
  } catch (e: any) {
    appLogger.error({ type: 'COMPANY_ORDER_RECEIVE_FAILED', error: e.message });
    res.status(500).json({ success: false, message: 'Failed to record receipt' });
  }
});

// ── PATCH /:id — update basic info (before delivery) ──────────────────────
router.patch('/:id', async (req, res) => {
  try {
    const { ponaType, paymentAmount, ratePerPL, expectedDate, notes } = req.body;

    const existing = await prisma.companyOrder.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Not found' });

    if (existing.status === 'delivered') {
      return res
        .status(400)
        .json({ success: false, message: 'Cannot edit a delivered company order' });
    }

    const newPayment = paymentAmount ?? existing.paymentAmount;
    const newRate = ratePerPL ?? existing.ratePerPL;
    const expectedPL = newPayment / newRate;

    const updated = await prisma.companyOrder.update({
      where: { id: req.params.id },
      data: {
        ponaType: ponaType ?? existing.ponaType,
        paymentAmount: newPayment,
        ratePerPL: newRate,
        expectedPL,
        expectedDate: expectedDate ? new Date(expectedDate) : existing.expectedDate,
        notes: notes ?? existing.notes,
      },
    });

    res.json({ success: true, data: updated });
  } catch (e: any) {
    appLogger.error({ type: 'COMPANY_ORDER_UPDATE_FAILED', error: e.message });
    res.status(500).json({ success: false, message: 'Failed to update' });
  }
});

// ── DELETE /:id — only pending ─────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.companyOrder.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Not found' });
    if (existing.status !== 'pending') {
      return res
        .status(400)
        .json({ success: false, message: 'Only pending orders can be deleted' });
    }
    await prisma.companyOrder.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ success: false, message: 'Failed to delete' });
  }
});

export { router as companyOrderRouter };
