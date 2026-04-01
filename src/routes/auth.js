const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body } = require('express-validator');

const db = require('../db/db');
const { authenticate }        = require('../middleware/auth');
const { validate, asyncWrap } = require('../middleware/errors');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function safeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 chars'),
    body('role').isIn(['buyer', 'seller']).withMessage('Role must be buyer or seller'),
  ],
  validate,
  asyncWrap(async (req, res) => {
    const { name, email, password, role, shopName } = req.body;
    const existing = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      id:           uuidv4(),
      name,
      email,
      passwordHash,
      role,
      shopName:     role === 'seller' ? (shopName || name + "'s Workshop") : null,
      avatarUrl:    null,
      bio:          null,
      location:     null,
      memberSince:  new Date().toISOString(),
      verified:     false,
      salesCount:   0,
      reviewCount:  0,
      rating:       0,
    };
    db.insert('users', user);
    const token = signToken(user);
    res.status(201).json({ token, user: safeUser(user) });
  })
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  asyncWrap(async (req, res) => {
    const { email, password } = req.body;
    const user = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken(user);
    res.json({ token, user: safeUser(user) });
  })
);

router.get('/me', authenticate, asyncWrap(async (req, res) => {
  const user = db.findOne('users', u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(safeUser(user));
}));

// ✅ FIXED: allows role update and returns a fresh token
router.put(
  '/me',
  authenticate,
  [
    body('name').optional().trim().notEmpty(),
    body('bio').optional().trim(),
    body('location').optional().trim(),
    body('shopName').optional().trim(),
    body('avatarUrl').optional().isURL(),
    body('role').optional().isIn(['buyer', 'seller']),
  ],
  validate,
  asyncWrap(async (req, res) => {
const allowed = ['name', 'bio', 'location', 'shopName', 'avatarUrl', 'role'];
    const patch   = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });

    // Auto-set shopName when upgrading to seller if not already set
    if (patch.role === 'seller') {
      const current = db.findOne('users', u => u.id === req.user.id);
      if (!current.shopName && !patch.shopName) {
        patch.shopName = current.name + "'s Workshop";
      }
    }

    db.update('users', u => u.id === req.user.id, patch);
    const updated = db.findOne('users', u => u.id === req.user.id);

    // Issue a new token so the updated role takes effect immediately
    const token = signToken(updated);
    res.json({ ...safeUser(updated), token });
  })
);

router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 }),
  ],
  validate,
  asyncWrap(async (req, res) => {
    const user  = db.findOne('users', u => u.id === req.user.id);
    const valid = await bcrypt.compare(req.body.currentPassword, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Current password incorrect' });
    const passwordHash = await bcrypt.hash(req.body.newPassword, 10);
    db.update('users', u => u.id === req.user.id, { passwordHash });
    res.json({ message: 'Password updated successfully' });
  })
);

module.exports = router;