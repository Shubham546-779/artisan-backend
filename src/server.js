/**
 * server.js — Artisan Bazaar API server
 *
 * Base URL: http://localhost:3001/api
 */

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

// ── Ensure data directory exists ───────────────────────────────────────────
const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ── App ────────────────────────────────────────────────────────────────────
const app = express();

app.use(cors({
origin: '*',
credentials: true,
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Request logger (dev) ───────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`${new Date().toISOString().slice(11, 19)}  ${req.method.padEnd(6)} ${req.path}`);
    next();
  });
}

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/reviews',  require('./routes/reviews'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/users',    require('./routes/users'));

// ── Health check ───────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status:  'ok',
    version: '1.0.0',
    time:    new Date().toISOString(),
    env:     process.env.NODE_ENV || 'development',
  });
});

// ── 404 ────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ───────────────────────────────────────────────────
const { errorHandler } = require('./middleware/errors');
app.use(errorHandler);

// ── Start ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {  console.log(`
╔══════════════════════════════════════════════╗
║       Artisan Bazaar API  🌿                 ║
╠══════════════════════════════════════════════╣
║  http://localhost:${PORT}/api                   ║
║                                              ║
║  POST /api/auth/register                     ║
║  POST /api/auth/login                        ║
║  GET  /api/products                          ║
║  GET  /api/products/:id                      ║
║  POST /api/products        (seller)          ║
║  GET  /api/orders          (auth)            ║
║  POST /api/orders          (buyer)           ║
║  GET  /api/reviews/product/:id               ║
║  GET  /api/wishlist        (auth)            ║
║  GET  /api/health                            ║
╚══════════════════════════════════════════════╝
  `);
});
