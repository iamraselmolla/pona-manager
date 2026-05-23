// src/routes/customer.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { search, page = '1', limit = '20' } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { mobile: { contains: search } },
          ],
        }
      : {};
    const [data, total] = await Promise.all([
      prisma.customer.findMany({ where, skip, take: Number(limit), orderBy: { name: 'asc' } }),
      prisma.customer.count({ where }),
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
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch customers' });
  }
});

router.get('/mobile/:mobile', async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({ where: { mobile: req.params.mobile } });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: customer });
  } catch {
    res.status(500).json({ success: false, message: 'Failed' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({ where: { id: req.params.id } });
    if (!customer) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: customer });
  } catch {
    res.status(500).json({ success: false, message: 'Failed' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, mobile, address, area } = req.body;
    const customer = await prisma.customer.create({
      data: {
        name,
        mobile,
        address,
        area,
      },
    });
    res.status(201).json({ success: true, data: customer });
  } catch (err: any) {
    if (err.code === 'P2002')
      return res.status(400).json({ success: false, message: 'Mobile number already exists' });
    res.status(500).json({ success: false, message: 'Failed to create customer' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const {
      name,
      mobile,
      address,
      area,
      hasRunningOrder,
      totalOrders,
      totalPLPurchased,
      totalPaid,
      totalDue,
    } = req.body;
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: {
        name,
        mobile,
        address,
        area,
        hasRunningOrder,
        totalOrders,
        totalPLPurchased,
        totalPaid,
        totalDue,
      },
    });
    res.json({ success: true, data: customer });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.customer.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to delete' });
  }
});

router.get('/:id/orders', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { customerId: req.params.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: orders });
  } catch {
    res.status(500).json({ success: false, message: 'Failed' });
  }
});

router.get('/:id/payments', async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { customerId: req.params.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: payments });
  } catch {
    res.status(500).json({ success: false, message: 'Failed' });
  }
});

export { router as customerRoutes };
