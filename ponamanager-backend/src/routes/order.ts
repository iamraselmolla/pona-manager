// src/routes/order.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { search, status, date, page = '1', limit = '20' } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (search) where.OR = [
      { customerName: { contains: search, mode: 'insensitive' } },
      { customerMobile: { contains: search } },
    ];
    if (status) where.status = status;
    if (date)   where.deliveryDate = date;

    const [data, total] = await Promise.all([
      prisma.order.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' } }),
      prisma.order.count({ where }),
    ]);
    res.json({ success: true, data: { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } });
  } catch { res.status(500).json({ success: false, message: 'Failed to fetch orders' }); }
});

router.get('/schedule', async (req, res) => {
  try {
    const { date } = req.query as any;
    const orders = await prisma.order.findMany({
      where: { deliveryDate: date, status: { in: ['pending', 'in_batch'] } },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: orders });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

router.post('/', async (req, res) => {
  try {
    const order = await prisma.order.create({ data: req.body });
    // Update customer running order flag
    if (req.body.customerId) {
      await prisma.customer.update({
        where: { id: req.body.customerId },
        data: { hasRunningOrder: true, totalOrders: { increment: 1 } },
      });
    }
    res.status(201).json({ success: true, data: order });
  } catch { res.status(500).json({ success: false, message: 'Failed to create order' }); }
});

router.put('/:id', async (req, res) => {
  try {
    const order = await prisma.order.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: order });
  } catch { res.status(500).json({ success: false, message: 'Failed to update order' }); }
});

router.patch('/:id/cancel', async (req, res) => {
  try {
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: 'cancelled', batchId: null },
    });
    if (order.customerId) {
      const pendingOrders = await prisma.order.count({
        where: { customerId: order.customerId, status: { in: ['pending', 'in_batch'] } },
      });
      if (pendingOrders === 0) {
        await prisma.customer.update({
          where: { id: order.customerId },
          data: { hasRunningOrder: false },
        });
      }
    }
    res.json({ success: true, data: order });
  } catch { res.status(500).json({ success: false, message: 'Failed to cancel order' }); }
});

export { router as orderRoutes };
