/**
 * db.js — lightweight JSON file-based database
 * Drop-in replacement for SQLite/Postgres during development.
 * Swap this module for a real DB client (pg, mysql2, mongoose) in production.
 */

const fs   = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function filePath(table) {
  return path.join(DATA_DIR, `${table}.json`);
}

function read(table) {
  ensureDir();
  const fp = filePath(table);
  if (!fs.existsSync(fp)) return [];
  try { return JSON.parse(fs.readFileSync(fp, 'utf8')); }
  catch { return []; }
}

function write(table, data) {
  ensureDir();
  fs.writeFileSync(filePath(table), JSON.stringify(data, null, 2));
}

// ── Generic CRUD ───────────────────────────────────────────────────────────────

const db = {
  // Return all rows, optionally filtered
  findAll(table, predicate) {
    const rows = read(table);
    return predicate ? rows.filter(predicate) : rows;
  },

  // Return first match
  findOne(table, predicate) {
    return read(table).find(predicate) || null;
  },

  // Insert a new row (must already have an `id`)
  insert(table, row) {
    const rows = read(table);
    rows.push(row);
    write(table, rows);
    return row;
  },

  // Update matching rows; returns updated count
  update(table, predicate, patch) {
    const rows = read(table);
    let count = 0;
    const updated = rows.map(r => {
      if (predicate(r)) { count++; return { ...r, ...patch }; }
      return r;
    });
    write(table, updated);
    return count;
  },

  // Delete matching rows; returns deleted count
  delete(table, predicate) {
    const rows = read(table);
    const kept = rows.filter(r => !predicate(r));
    write(table, kept);
    return rows.length - kept.length;
  },

  // Paginate helper
  paginate(rows, page = 1, limit = 20) {
    const total = rows.length;
    const pages = Math.ceil(total / limit);
    const data  = rows.slice((page - 1) * limit, page * limit);
    return { data, total, page, pages, limit };
  },
};

module.exports = db;
