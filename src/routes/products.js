/**
 * /api/products
 *
 * GET    /           — list products (search, category, price, sort, pagination)
 * GET    /:id        — single product + seller info
 * POST   /           — create product (seller only)
 * PUT    /:id        — update product (owner only)
 * DELETE /:id        — delete product (owner only)
 * GET    /seller/:sellerId — all products by a seller
 */

const express  = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, query } = require('express-validator');

const db = require('../db/db');
const { authenticate, requireRole, optionalAuth } = require('../middleware/auth');
const { validate, asyncWrap } = require('../middleware/errors');

const router = express.Router();

const VALID_CATEGORIES = ['Jewelry', 'Home Decor', 'Clothing', 'Art', 'Toys', 'Gifts', 'Other'];
const VALID_SORTS      = ['newest', 'oldest', 'price_asc', 'price_desc', 'popular'];

// ── GET / ──────────────────────────────────────────────────────────────────
router.get('/', optionalAuth, asyncWrap(async (req, res) => {
  let {
    search = '',
    category = '',
    minPrice,
    maxPrice,
    sort = 'newest',
    page  = 1,
    limit = 20,
    sellerId = '',
  } = req.query;

  page  = Math.max(1, parseInt(page));
  limit = Math.min(100, Math.max(1, parseInt(limit)));

  let products = db.findAll('products', p => !p.deletedAt);

  // Filters
  if (search) {
    const q = search.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.sellerName.toLowerCase().includes(q)
    );
  }
  if (category && VALID_CATEGORIES.includes(category)) {
    products = products.filter(p => p.category === category);
  }
  if (minPrice !== undefined) {
    products = products.filter(p => p.price >= parseFloat(minPrice));
  }
  if (maxPrice !== undefined) {
    products = products.filter(p => p.price <= parseFloat(maxPrice));
  }
  if (sellerId) {
    products = products.filter(p => p.sellerId === sellerId);
  }

  // Sort
  switch (sort) {
    case 'oldest':     products.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
    case 'price_asc':  products.sort((a, b) => a.price - b.price); break;
    case 'price_desc': products.sort((a, b) => b.price - a.price); break;
    case 'popular':    products.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)); break;
    default:           products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  res.json(db.paginate(products, page, limit));
}));

// ── GET /seller/:sellerId ──────────────────────────────────────────────────
router.get('/seller/:sellerId', asyncWrap(async (req, res) => {
  const products = db.findAll('products', p => p.sellerId === req.params.sellerId && !p.deletedAt);
  res.json({ data: products, total: products.length });
}));

// ── GET /:id ───────────────────────────────────────────────────────────────
router.get('/:id', optionalAuth, asyncWrap(async (req, res) => {
  const product = db.findOne('products', p => p.id === req.params.id && !p.deletedAt);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  // Increment view count
  db.update('products', p => p.id === product.id, { viewCount: (product.viewCount || 0) + 1 });

  // Attach seller public profile
  const seller = db.findOne('users', u => u.id === product.sellerId);
  const sellerPublic = seller
    ? { id: seller.id, name: seller.name, shopName: seller.shopName, avatarUrl: seller.avatarUrl, bio: seller.bio, location: seller.location, rating: seller.rating, salesCount: seller.salesCount, memberSince: seller.memberSince }
    : null;

  // Related products (same category, exclude self)
  const related = db.findAll('products', p => p.category === product.category && p.id !== product.id && !p.deletedAt).slice(0, 8);

  res.json({ ...product, seller: sellerPublic, related });
}));

// ── POST / ────────────────────────────────────────────────────────────────
router.post(
  '/',
  authenticate,
  requireRole('seller'),
  [
    body('name').trim().notEmpty().withMessage('Name required'),
    body('description').trim().notEmpty().withMessage('Description required'),
    body('price').isFloat({ min: 0.01 }).withMessage('Price must be positive'),
    body('category').isIn(VALID_CATEGORIES).withMessage('Invalid category'),
    body('imageUrl').isURL().withMessage('Valid image URL required'),
    body('stock').optional().isInt({ min: 0 }),
  ],
  validate,
  asyncWrap(async (req, res) => {
    const seller = db.findOne('users', u => u.id === req.user.id);

    const product = {
      id:          uuidv4(),
      name:        req.body.name,
      description: req.body.description,
      price:       parseFloat(req.body.price),
      category:    req.body.category,
      imageUrl:    req.body.imageUrl,
      imageUrls:   req.body.imageUrls || [req.body.imageUrl],
      stock:       req.body.stock !== undefined ? parseInt(req.body.stock) : 99,
      tags:        req.body.tags || [],
      sellerId:    req.user.id,
      sellerName:  seller?.shopName || seller?.name || 'Artisan',
      createdAt:   new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
      viewCount:   0,
      likeCount:   0,
      rating:      0,
      reviewCount: 0,
      featured:    false,
      deletedAt:   null,
    };

    db.insert('products', product);
    res.status(201).json(product);
  })
);

// ── PUT /:id ───────────────────────────────────────────────────────────────
router.put(
  '/:id',
  authenticate,
  [
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim().notEmpty(),
    body('price').optional().isFloat({ min: 0.01 }),
    body('category').optional().isIn(VALID_CATEGORIES),
    body('imageUrl').optional().isURL(),
    body('stock').optional().isInt({ min: 0 }),
  ],
  validate,
  asyncWrap(async (req, res) => {
    const product = db.findOne('products', p => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.sellerId !== req.user.id) {
      return res.status(403).json({ error: 'Not your listing' });
    }

    const allowed = ['name', 'description', 'price', 'category', 'imageUrl', 'imageUrls', 'stock', 'tags'];
    const patch   = { updatedAt: new Date().toISOString() };
    allowed.forEach(k => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });
    if (patch.price) patch.price = parseFloat(patch.price);
    if (patch.stock !== undefined) patch.stock = parseInt(patch.stock);

    db.update('products', p => p.id === req.params.id, patch);
    const updated = db.findOne('products', p => p.id === req.params.id);
    res.json(updated);
  })
);

// ── DELETE /:id ────────────────────────────────────────────────────────────
router.delete('/:id', authenticate, asyncWrap(async (req, res) => {
  const product = db.findOne('products', p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (product.sellerId !== req.user.id) {
    return res.status(403).json({ error: 'Not your listing' });
  }

  // Soft delete
  db.update('products', p => p.id === req.params.id, { deletedAt: new Date().toISOString() });
  res.json({ message: 'Product deleted' });
}));

module.exports = router;
