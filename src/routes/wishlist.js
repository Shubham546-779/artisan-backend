/**
 * /api/wishlist
 *
 * GET    /         — get my wishlist
 * POST   /:productId — add item
 * DELETE /:productId — remove item
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');

const db = require('../db/db');
const { authenticate } = require('../middleware/auth');
const { asyncWrap } = require('../middleware/errors');

const router = express.Router();

router.get('/', authenticate, asyncWrap(async (req, res) => {
  const entries = db.findAll('wishlist', w => w.userId === req.user.id);
  const products = entries
    .map(w => db.findOne('products', p => p.id === w.productId && !p.deletedAt))
    .filter(Boolean);
  res.json({ data: products, total: products.length });
}));

router.post('/:productId', authenticate, asyncWrap(async (req, res) => {
  const product = db.findOne('products', p => p.id === req.params.productId && !p.deletedAt);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const existing = db.findOne('wishlist', w => w.userId === req.user.id && w.productId === req.params.productId);
  if (existing) return res.status(409).json({ error: 'Already in wishlist' });

  const entry = { id: uuidv4(), userId: req.user.id, productId: req.params.productId, addedAt: new Date().toISOString() };
  db.insert('wishlist', entry);

  // Increment like count
  db.update('products', p => p.id === req.params.productId, { likeCount: (product.likeCount || 0) + 1 });

  res.status(201).json({ message: 'Added to wishlist', entry });
}));

router.delete('/:productId', authenticate, asyncWrap(async (req, res) => {
  const deleted = db.delete('wishlist', w => w.userId === req.user.id && w.productId === req.params.productId);
  if (!deleted) return res.status(404).json({ error: 'Not in wishlist' });

  const product = db.findOne('products', p => p.id === req.params.productId);
  if (product) {
    db.update('products', p => p.id === req.params.productId, { likeCount: Math.max(0, (product.likeCount || 0) - 1) });
  }

  res.json({ message: 'Removed from wishlist' });
}));

module.exports = router;
