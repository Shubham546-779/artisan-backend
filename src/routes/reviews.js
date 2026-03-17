/**
 * /api/reviews
 *
 * GET  /product/:productId   — reviews for a product
 * POST /product/:productId   — post a review (must have purchased)
 * DELETE /:id                — delete own review
 */

const express  = require('express');
const { v4: uuidv4 } = require('uuid');
const { body } = require('express-validator');

const db = require('../db/db');
const { authenticate, requireRole, optionalAuth } = require('../middleware/auth');
const { validate, asyncWrap } = require('../middleware/errors');

const router = express.Router();

// ── GET /product/:productId ────────────────────────────────────────────────
router.get('/product/:productId', optionalAuth, asyncWrap(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page  || 1));
  const limit = Math.min(50, parseInt(req.query.limit || 10));

  const reviews = db
    .findAll('reviews', r => r.productId === req.params.productId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total  = reviews.length;
  const avgRating = total ? (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : null;

  res.json({ ...db.paginate(reviews, page, limit), avgRating, total });
}));

// ── POST /product/:productId ───────────────────────────────────────────────
router.post(
  '/product/:productId',
  authenticate,
  requireRole('buyer'),
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating 1–5'),
    body('comment').optional().trim(),
  ],
  validate,
  asyncWrap(async (req, res) => {
    const { productId } = req.params;

    const product = db.findOne('products', p => p.id === productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Check buyer has ordered this product (optional — can remove for demo)
    const hasPurchased = db.findOne('orders', o =>
      o.buyerId === req.user.id &&
      o.status !== 'cancelled' &&
      o.items.some(i => i.productId === productId)
    );
    if (!hasPurchased) {
      return res.status(403).json({ error: 'You can only review products you have purchased' });
    }

    // One review per buyer per product
    const existing = db.findOne('reviews', r => r.productId === productId && r.buyerId === req.user.id);
    if (existing) {
      return res.status(409).json({ error: 'You have already reviewed this product' });
    }

    const review = {
      id:         uuidv4(),
      productId,
      buyerId:    req.user.id,
      buyerName:  req.user.name,
      rating:     parseInt(req.body.rating),
      comment:    req.body.comment || null,
      createdAt:  new Date().toISOString(),
    };

    db.insert('reviews', review);

    // Recompute product aggregate rating
    const allReviews = db.findAll('reviews', r => r.productId === productId);
    const avgRating  = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
    db.update('products', p => p.id === productId, {
      rating:      parseFloat(avgRating.toFixed(1)),
      reviewCount: allReviews.length,
    });

    res.status(201).json(review);
  })
);

// ── DELETE /:id ────────────────────────────────────────────────────────────
router.delete('/:id', authenticate, asyncWrap(async (req, res) => {
  const review = db.findOne('reviews', r => r.id === req.params.id);
  if (!review) return res.status(404).json({ error: 'Review not found' });
  if (review.buyerId !== req.user.id) return res.status(403).json({ error: 'Not your review' });

  db.delete('reviews', r => r.id === req.params.id);

  // Recompute product rating
  const allReviews = db.findAll('reviews', r => r.productId === review.productId);
  const avgRating  = allReviews.length
    ? allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
    : 0;
  db.update('products', p => p.id === review.productId, {
    rating:      parseFloat(avgRating.toFixed(1)),
    reviewCount: allReviews.length,
  });

  res.json({ message: 'Review deleted' });
}));

module.exports = router;
