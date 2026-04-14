# 🛒 ScaleCart — Flipkart-Style E-Commerce Platform

A full-stack e-commerce application inspired by Flipkart, built with **React**, **Node.js + Express**, and **MongoDB**. Features complete shopping flow from product discovery to order placement, with caching, authentication, and real-time cart management.

---

## 🚀 Live Demo

> Backend: `http://localhost:8000`
> Frontend: `http://localhost:5173`

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS v3, React Router v6 |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | MongoDB Atlas (Cloud) + Mongoose ODM |
| **Cache** | Upstash Redis (Cache-Aside pattern) |
| **Auth** | JWT (Access + Refresh tokens via HTTP-only cookies) |
| **Images** | Cloudinary (media storage) |
| **Seed Data** | DummyJSON API → transformed to MongoDB schema |

---

## ✅ Features

### Core Features
| Feature | Status |
|---|---|
| Product Listing (grid, search, filter, pagination) | ✅ |
| Product Detail Page (image gallery, price, stock, offers) | ✅ |
| Add to Cart / Remove / Update Quantity | ✅ |
| Cart Total Calculation | ✅ |
| Checkout Page (address form) | ✅ |
| Order Placement (MongoDB transaction) | ✅ |
| Order Confirmation Page | ✅ |
| User Registration & Login | ✅ |

### Bonus Features
| Feature | Status |
|---|---|
| Responsive Design (mobile, tablet, desktop) | ✅ |
| Wishlist (add/remove/toggle, backend persisted) | ✅ |
| Order History Page | ✅ |
| Email Notification (simulated) | ✅ |
| Redis Caching for products/categories | ✅ |
| Category Filtering (real DB categories) | ✅ |

---

## 📦 Project Structure

```
app/
├── backend/                  # Node.js + Express API
│   ├── src/
│   │   ├── controllers/      # Business logic
│   │   ├── models/           # Mongoose schemas
│   │   ├── routes/           # Express routers
│   │   ├── middlewares/      # Auth (JWT), Multer, Error handler
│   │   ├── utils/            # Redis, Cloudinary, ApiResponse
│   │   └── seed.ts           # Database seeder (DummyJSON)
│   └── .env                  # Environment variables
│
└── frontend/                 # React + Vite
    ├── src/
    │   ├── components/       # Navbar, ProductCard, AuthModal, Loader
    │   ├── context/          # CartContext, WishlistContext
    │   ├── pages/            # Home, ProductDetail, Cart, Checkout, Orders, Wishlist
    │   └── services/         # api.js (Axios instance)
    └── tailwind.config.js
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier works)
- Upstash Redis account (free tier works)

### 1. Clone & Install

```bash
git clone <repo-url>
cd app

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Backend Environment

Create `backend/.env`:

```env
PORT=8000
MONGODB_URL=mongodb+srv://<user>:<pass>@cluster.mongodb.net/scalecart
REDIS_URL=rediss://:token@hostname:port
CORS_ORIGIN=http://localhost:5173
ACCESS_TOKEN_SECRET=your_secret_here
REFRESH_TOKEN_SECRET=your_refresh_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_EXPIRY=10d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Seed the Database

```bash
cd backend
npx tsx --env-file=.env src/seed.ts
```

This fetches 30 products from [DummyJSON API](https://dummyjson.com/products?limit=30) and seeds them into MongoDB with proper categories and brands.

### 4. Run the App

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Visit: **http://localhost:5173**

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/users/register` | Register new user |
| `POST` | `/api/v1/users/login` | Login (returns JWT cookie) |
| `POST` | `/api/v1/users/logout` | Logout |

### Products
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/products` | List products (search, category, page, limit) |
| `GET` | `/api/v1/products/:id` | Get single product |

### Categories
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/categories/categories` | List all categories |

### Cart
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/v1/cart` | Get user's cart | 🔒 |
| `POST` | `/api/v1/cart/add` | Add item to cart | 🔒 |
| `PUT` | `/api/v1/cart/update` | Update item quantity | 🔒 |
| `DELETE` | `/api/v1/cart/remove` | Remove item | 🔒 |

### Orders
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/v1/orders/checkout` | Place order (atomic) | 🔒 |
| `GET` | `/api/v1/orders` | Get user's order history | 🔒 |
| `PATCH` | `/api/v1/orders/:id/cancel` | Cancel order | 🔒 |

### Wishlist
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/v1/wishlist` | Get wishlist | 🔒 |
| `POST` | `/api/v1/wishlist/toggle` | Toggle item (add/remove) | 🔒 |

---

## 🏗️ Architecture Decisions

### Cache-Aside Pattern (Redis)
Products and categories are cached in Redis after first fetch. Cache key includes query params for per-filter caching:
```
products:{"search":"phone","category":"xyz","page":"1","limit":"12"}
```

### MongoDB Transactions (Checkout)
Order placement uses `session.withTransaction()` to atomically:
1. Create the order document
2. Clear the cart

If either fails → both are rolled back. No orphan orders.

### Derived State (Cart Total)
`cartTotal` is **not stored as separate state**. It's computed inline from `cartItems`:
```js
const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
```
This avoids the common sync bug where state updates are batched and one "misses".

### Optimistic UI (Cart + Wishlist)
Both cart and wishlist update the UI **before** the API call resolves. On API failure, they revert via `loadCart()` / `loadWishlist()`. This gives instant feedback without waiting for network.

---

## 🏷️ Assumptions

1. All authenticated routes require a valid JWT cookie (set via `withCredentials: true` in Axios)
2. Prices are stored in INR (converted from USD seed data × 83)
3. Email notifications are simulated (displayed as UI text, not actually sent)
4. Stock numbers from DummyJSON are used as-is — no real inventory management
5. Payment is not integrated (Razorpay stub only) — order is placed on "Place Order" click

---

## 👨‍💻 Author

Built as a full-stack e-commerce assignment demonstrating:
- REST API design with Express + TypeScript
- JWT-based authentication with refresh tokens
- Redis caching (Cache-Aside pattern)
- MongoDB transactions for atomic operations
- React state management with Context API
- Optimistic UI updates
