const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/products.json');
const products = JSON.parse(fs.readFileSync(filePath));

const seen = new Set();
const unique = products.filter(p => {
  if (seen.has(p.name)) return false;
  seen.add(p.name);
  return true;
});

fs.writeFileSync(filePath, JSON.stringify(unique, null, 2));
console.log('Done! Unique products:', unique.length);