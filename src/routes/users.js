/**
 * /api/users
 *
 * GET /sellers         — list all sellers (public)
 * GET /:id/profile     — public seller profile
 * GET /:id/products    — seller's products
 */

const express = require('express');
const db = require('../db/db');
const { asyncWrap } = require('../middleware/errors');

const router = express.Router();

function publicProfile(user) {
  return {
    id:          user.id,
    name:        user.name,
    shopName:    user.shopName,
    avatarUrl:   user.avatarUrl,
    bio:         user.bio,
    location:    user.location,
    memberSince: user.memberSince,
    rating:      user.rating,
    salesCount:  user.salesCount,
    reviewCount: user.reviewCount,
    verified:    user.verified,
  };
}

router.get('/sellers', asyncWrap(async (req, res) => {
  const sellers = db.findAll('users', u => u.role === 'seller').map(publicProfile);
  res.json({ data: sellers, total: sellers.length });
}));

router.get('/:id/profile', asyncWrap(async (req, res) => {
  const user = db.findOne('users', u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(publicProfile(user));
}));

router.get('/:id/products', asyncWrap(async (req, res) => {
  const products = db.findAll('products', p => p.sellerId === req.params.id && !p.deletedAt);
  res.json({ data: products, total: products.length });
}));

module.exports = router;
