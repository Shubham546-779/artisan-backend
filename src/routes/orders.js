/**
 * /api/orders
 *
 * POST /           — place an order (buyer)
 * GET  /           — my orders (buyer sees own; seller sees received)
 * GET  /:id        — single order
 * PUT  /:id/status — update status (seller only)
 * POST /:id/cancel — cancel order (buyer only, if pending)
 */

const express  = require('express');
const { v4: uuidv4 } = require('uuid');
const { body } = require('express-validator');

const db = require('../db/db');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate, asyncWrap } = require('../middleware/errors');

const router = express.Router();

const VALID_STATUSES = ['pending', 'confirmed', 'dispatched', 'delivered', 'cancelled'];

// ── POST / ─────────────────────────────────────────────────────────────────
router.post(
  '/',
  authenticate,
  requireRole('buyer'),
  [
    body('items').isArray({ min: 1 }).withMessage('Items array required'),
    body('items.*.productId').notEmpty(),
    body('items.*.quantity').isInt({ min: 1 }),
    body('shippingAddress').isObject().withMessage('Shipping address required'),
    body('shippingAddress.name').notEmpty(),
    body('shippingAddress.line1').notEmpty(),
    body('shippingAddress.city').notEmpty(),
    body('shippingAddress.country').notEmpty(),
  ],
  validate,
  asyncWrap(async (req, res) => {
    const { items, shippingAddress, note } = req.body;

    // Resolve products & compute total
    const resolvedItems = [];
    let total = 0;

    for (const item of items) {
      const product = db.findOne('products', p => p.id === item.productId && !p.deletedAt);
      if (!product) {
        return res.status(404).json({ error: `Product ${item.productId} not found` });
      }
      if ((product.stock || 0) < item.quantity) {
        return res.status(409).json({ error: `Insufficient stock for "${product.name}"` });
      }

      resolvedItems.push({
        productId:  product.id,
        name:       product.name,
        imageUrl:   product.imageUrl,
        price:      product.price,
        quantity:   item.quantity,
        sellerId:   product.sellerId,
        sellerName: product.sellerName,
        subtotal:   product.price * item.quantity,
      });
      total += product.price * item.quantity;
    }

    // Deduct stock
    resolvedItems.forEach(i => {
      const p = db.findOne('products', p => p.id === i.productId);
      db.update('products', p => p.id === i.productId, { stock: (p.stock || 0) - i.quantity });
    });

    // Group items by seller into sub-orders
    const sellerMap = {};
    resolvedItems.forEach(i => {
      if (!sellerMap[i.sellerId]) sellerMap[i.sellerId] = [];
      sellerMap[i.sellerId].push(i);
    });

    const order = {
      id:              uuidv4(),
      buyerId:         req.user.id,
      buyerName:       req.user.name,
      items:           resolvedItems,
      subOrders:       Object.entries(sellerMap).map(([sellerId, sellerItems]) => ({
        sellerId,
        sellerName: sellerItems[0].sellerName,
        items:      sellerItems,
        subtotal:   sellerItems.reduce((s, i) => s + i.subtotal, 0),
        status:     'pending',
      })),
      shippingAddress,
      note:            note || null,
      total:           parseFloat(total.toFixed(2)),
      status:          'pending',
      paymentStatus:   'pending',  // integrate Stripe/Razorpay here
      createdAt:       new Date().toISOString(),
      updatedAt:       new Date().toISOString(),
    };

    db.insert('orders', order);

    // Update seller sales count
    const uniqueSellers = [...new Set(resolvedItems.map(i => i.sellerId))];
    uniqueSellers.forEach(sid => {
      const seller = db.findOne('users', u => u.id === sid);
      if (seller) db.update('users', u => u.id === sid, { salesCount: (seller.salesCount || 0) + 1 });
    });

    res.status(201).json(order);
  })
);

// ── GET / ──────────────────────────────────────────────────────────────────
router.get('/', authenticate, asyncWrap(async (req, res) => {
  const { role, id } = req.user;
  const page  = Math.max(1, parseInt(req.query.page  || 1));
  const limit = Math.min(50, parseInt(req.query.limit || 10));

  let orders;
  if (role === 'buyer') {
    orders = db.findAll('orders', o => o.buyerId === id);
  } else if (role === 'seller') {
    // Seller sees orders that contain their items
    orders = db.findAll('orders', o =>
      o.subOrders && o.subOrders.some(so => so.sellerId === id)
    );
    // Trim each order to only the seller's sub-order data
    orders = orders.map(o => ({
      ...o,
      subOrders: o.subOrders.filter(so => so.sellerId === id),
      items:     o.items.filter(i => i.sellerId === id),
    }));
  } else {
    orders = [];
  }

  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(db.paginate(orders, page, limit));
}));

// ── GET /:id ───────────────────────────────────────────────────────────────
router.get('/:id', authenticate, asyncWrap(async (req, res) => {
  const order = db.findOne('orders', o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const { role, id } = req.user;
  const isBuyer  = order.buyerId === id;
  const isSeller = order.subOrders?.some(so => so.sellerId === id);

  if (!isBuyer && !isSeller) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json(order);
}));

// ── PUT /:id/status ────────────────────────────────────────────────────────
router.put(
  '/:id/status',
  authenticate,
  requireRole('seller'),
  [body('status').isIn(VALID_STATUSES)],
  validate,
  asyncWrap(async (req, res) => {
    const order = db.findOne('orders', o => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const isSeller = order.subOrders?.some(so => so.sellerId === req.user.id);
    if (!isSeller) return res.status(403).json({ error: 'Not your order' });

    const { status } = req.body;

    // Update sub-order status for this seller
    const updatedSubOrders = order.subOrders.map(so =>
      so.sellerId === req.user.id ? { ...so, status } : so
    );

    // Derive overall order status
    const statuses     = updatedSubOrders.map(so => so.status);
    const overallStatus = statuses.every(s => s === 'delivered') ? 'delivered'
      : statuses.some(s => s === 'dispatched') ? 'dispatched'
      : statuses.some(s => s === 'confirmed')  ? 'confirmed'
      : statuses.every(s => s === 'cancelled') ? 'cancelled'
      : 'pending';

    db.update('orders', o => o.id === req.params.id, {
      subOrders: updatedSubOrders,
      status:    overallStatus,
      updatedAt: new Date().toISOString(),
    });

    const updated = db.findOne('orders', o => o.id === req.params.id);
    res.json(updated);
  })
);

// ── POST /:id/cancel ───────────────────────────────────────────────────────
router.post('/:id/cancel', authenticate, requireRole('buyer'), asyncWrap(async (req, res) => {
  const order = db.findOne('orders', o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.buyerId !== req.user.id) return res.status(403).json({ error: 'Not your order' });
  if (!['pending', 'confirmed'].includes(order.status)) {
    return res.status(409).json({ error: 'Order cannot be cancelled at this stage' });
  }

  // Restore stock
  order.items.forEach(item => {
    const p = db.findOne('products', p => p.id === item.productId);
    if (p) db.update('products', p => p.id === item.productId, { stock: (p.stock || 0) + item.quantity });
  });

  db.update('orders', o => o.id === req.params.id, {
    status:    'cancelled',
    updatedAt: new Date().toISOString(),
    subOrders: order.subOrders.map(so => ({ ...so, status: 'cancelled' })),
  });

  res.json({ message: 'Order cancelled' });
}));

module.exports = router;
