# Artisan Bazaar — Backend API

A complete REST API backend for the Artisan Bazaar handmade marketplace. Built with **Node.js + Express**, using a lightweight **JSON file database** (easily swappable for PostgreSQL/MongoDB in production).

---

## Quick Start

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Create environment file
cp .env.example .env
# Edit .env and set a strong JWT_SECRET

# 3. Seed the database (populates all 70+ products & demo accounts)
npm run seed

# 4. Start the server
npm run dev        # development (with nodemon auto-reload)
npm start          # production
```

Server runs at **http://localhost:3001**

---

## Demo Credentials

| Role   | Email                    | Password    |
|--------|--------------------------|-------------|
| Buyer  | buyer@demo.com           | password123 |
| Seller | u1@artisanbazaar.com     | password123 |

---

## API Reference

### Base URL
```
http://localhost:3001/api
```

### Authentication
Most write endpoints require a JWT Bearer token:
```
Authorization: Bearer <token>
```
Tokens are returned from `/auth/register` and `/auth/login`.

---

### Auth Endpoints

| Method | Path                     | Auth | Description                  |
|--------|--------------------------|------|------------------------------|
| POST   | /auth/register           | —    | Register buyer or seller     |
| POST   | /auth/login              | —    | Login, returns JWT           |
| GET    | /auth/me                 | ✓    | Get own profile              |
| PUT    | /auth/me                 | ✓    | Update profile               |
| POST   | /auth/change-password    | ✓    | Change password              |

**Register payload:**
```json
{
  "name": "Jane Artisan",
  "email": "jane@example.com",
  "password": "secret123",
  "role": "seller",
  "shopName": "Jane's Workshop"
}
```

---

### Products Endpoints

| Method | Path                       | Auth        | Description                     |
|--------|----------------------------|-------------|---------------------------------|
| GET    | /products                  | —           | List products (search/filter)   |
| GET    | /products/:id              | —           | Single product + seller + related |
| POST   | /products                  | seller only | Create listing                  |
| PUT    | /products/:id              | owner only  | Update listing                  |
| DELETE | /products/:id              | owner only  | Soft-delete listing             |
| GET    | /products/seller/:sellerId | —           | Products by a seller            |

**Query parameters for GET /products:**
```
search=ring
category=Jewelry          # Jewelry|Home Decor|Clothing|Art|Toys|Gifts|Other
minPrice=10
maxPrice=100
sort=newest               # newest|oldest|price_asc|price_desc|popular
page=1
limit=20
sellerId=u4
```

**Create product payload:**
```json
{
  "name": "Hand-forged Copper Ring",
  "description": "Made with hammered copper, one of a kind.",
  "price": 45.00,
  "category": "Jewelry",
  "imageUrl": "https://example.com/image.jpg",
  "stock": 10
}
```

---

### Orders Endpoints

| Method | Path                  | Auth        | Description                    |
|--------|-----------------------|-------------|--------------------------------|
| POST   | /orders               | buyer only  | Place an order                 |
| GET    | /orders               | ✓           | My orders (buyer or seller)    |
| GET    | /orders/:id           | ✓           | Single order                   |
| PUT    | /orders/:id/status    | seller only | Update fulfillment status      |
| POST   | /orders/:id/cancel    | buyer only  | Cancel a pending order         |

**Place order payload:**
```json
{
  "items": [
    { "productId": "j1", "quantity": 1 },
    { "productId": "h2", "quantity": 2 }
  ],
  "shippingAddress": {
    "name": "Jane Doe",
    "line1": "12 Oak Lane",
    "city": "Mumbai",
    "country": "India"
  },
  "note": "Please wrap as a gift"
}
```

**Order statuses:** `pending` → `confirmed` → `dispatched` → `delivered` (or `cancelled`)

---

### Reviews Endpoints

| Method | Path                          | Auth       | Description              |
|--------|-------------------------------|------------|--------------------------|
| GET    | /reviews/product/:productId   | —          | Product reviews          |
| POST   | /reviews/product/:productId   | buyer only | Post a review            |
| DELETE | /reviews/:id                  | owner only | Delete own review        |

> Note: By default, buyers must have purchased the product before reviewing. Disable this check in `reviews.js` for demo purposes.

---

### Wishlist Endpoints

| Method | Path                    | Auth | Description             |
|--------|-------------------------|------|-------------------------|
| GET    | /wishlist               | ✓    | Get my wishlist         |
| POST   | /wishlist/:productId    | ✓    | Add to wishlist         |
| DELETE | /wishlist/:productId    | ✓    | Remove from wishlist    |

---

### Users / Sellers Endpoints

| Method | Path                  | Auth | Description               |
|--------|-----------------------|------|---------------------------|
| GET    | /users/sellers        | —    | List all sellers           |
| GET    | /users/:id/profile    | —    | Public seller profile     |
| GET    | /users/:id/products   | —    | Seller's product listings |

---

### Health Check

```
GET /api/health
```

---

## Connecting Your Frontend

1. Copy `src/api.ts` into your frontend project at `src/api/api.ts`

2. Add to your `.env` (Vite):
   ```
   VITE_API_URL=http://localhost:3001/api
   ```

3. Replace local state login with the real API:
   ```tsx
   // In your LoginView onLogin handler:
   const { token, user } = await api.auth.login(email, password);
   setUser({ role: user.role, name: user.name });
   ```

4. Replace static PRODUCTS array with API calls:
   ```tsx
   useEffect(() => {
     api.products.list({ category: selectedCat !== 'All' ? selectedCat : undefined, search })
       .then(({ data }) => setProducts(data));
   }, [selectedCat, search]);
   ```

---

## Project Structure

```
backend/
├── src/
│   ├── server.js           # Express app entry point
│   ├── seed.js             # Database seeder
│   ├── api.ts              # Frontend API client (copy to your frontend)
│   ├── db/
│   │   └── db.js           # JSON file database layer
│   ├── middleware/
│   │   ├── auth.js         # JWT authentication middleware
│   │   └── errors.js       # Validation & error handling
│   └── routes/
│       ├── auth.js         # /api/auth
│       ├── products.js     # /api/products
│       ├── orders.js       # /api/orders
│       ├── reviews.js      # /api/reviews
│       ├── wishlist.js     # /api/wishlist
│       └── users.js        # /api/users
├── data/                   # JSON database files (auto-created)
│   ├── users.json
│   ├── products.json
│   ├── orders.json
│   ├── reviews.json
│   └── wishlist.json
├── .env.example
└── package.json
```

---

## Upgrading to a Real Database

The `src/db/db.js` module is a drop-in abstraction. To switch to PostgreSQL:

1. `npm install pg`
2. Replace `db.js` with a `pg` Pool client
3. Run the equivalent SQL `CREATE TABLE` migrations
4. The routes remain completely unchanged

---

## Environment Variables

| Variable         | Default                    | Description              |
|------------------|----------------------------|--------------------------|
| PORT             | 3001                       | Server port              |
| JWT_SECRET       | (required)                 | Secret for signing JWTs  |
| JWT_EXPIRES_IN   | 7d                         | Token expiry             |
| NODE_ENV         | development                | Environment mode         |
| CORS_ORIGIN      | http://localhost:5173      | Allowed frontend origin  |
