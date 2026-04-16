<div align="center">
  <img src="https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-cp-zion/img/flipkart-plus_8d85f4.png" alt="ScaleCart Logo" width="150" />
  <h1> ScaleCart</h1>
  <p><strong>A Production-Grade E-Commerce Platform · Flipkart-Inspired Architecture</strong></p>
  
  [![Live Demo](https://img.shields.io/badge/Live-scalecart.vercel.app-blue?style=flat-square&logo=vercel)](https://scalecart.vercel.app)
  [![API](https://img.shields.io/badge/API-scalecart.onrender.com-green?style=flat-square&logo=render)](https://scalecart.onrender.com/api/v1)
  
  [![React](https://img.shields.io/badge/React-19-61DAFB.svg?style=flat-square&logo=react)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-Express-339933.svg?style=flat-square&logo=node.js)](https://nodejs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-Backend-3178C6.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791.svg?style=flat-square&logo=postgresql)](https://supabase.com/)
  [![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748.svg?style=flat-square&logo=prisma)](https://www.prisma.io/)
  [![Redis](https://img.shields.io/badge/Redis-Upstash-DC382D.svg?style=flat-square&logo=redis)](https://upstash.com/)
</div>

<br />

ScaleCart is a full-stack e-commerce application built to replicate **Flipkart's UI/UX** while implementing **production-grade backend patterns**. The system features a **12-table normalized PostgreSQL schema**, **ACID-compliant transactional checkout**, **Redis cache-aside caching**, **NLP-powered search filtering**, and **real-time PDF invoice generation with email delivery**.

---

## 🌐 Live Demo

> **Frontend:** [https://scalecart.vercel.app](https://scalecart.vercel.app)  
> **Backend API:** [https://scalecart.onrender.com/api/v1](https://scalecart.onrender.com/api/v1)

### Demo Credentials

| Field | Value |
|:---|:---|
| **Email** | `rajputsinghshiv17@gmail.com` |
| **Password** | `1234` |

> [!NOTE]
> Render free-tier backends cold-start after inactivity. The first API call may take ~30s — subsequent requests are instant.

---

## ✨ Key Highlights

| Feature | Implementation |
|:---|:---|
| **Full-Text Search + NLP Parsing** | Native PostgreSQL Full-Text Search (`tsvector`, `ts_rank`) is combined with NLP regex parsing. Queries like _"laptops under 50000"_ are converted into Ranked FTS matches + Prisma range filters (`price: { lte: 50000 }`) — providing ElasticSearch-like capabilities with zero extra infrastructure overhead. |
| **Atomic Checkout** | Order placement uses `prisma.$transaction()` — stock validation, order creation, inventory decrement, and cart clearing all execute atomically. If any step fails, everything rolls back. |
| **Cache-Aside Pattern** | Product reads hit Redis first (TTL: 30min–1hr). On cache miss, PostgreSQL is queried and the result is cached. Write operations (order placement, product updates) invalidate relevant cache keys. |
| **PDF Invoice Generation** | Server-side PDF invoices are generated using `pdfkit` and attached to confirmation emails via Nodemailer (Gmail SMTP). |
| **Secure Price Computation** | Cart prices are computed server-side from the Product table — the client cannot inject manipulated prices. Discounted price = `price - (price × discount / 100)`. |
| **12-Table Relational Schema** | Fully normalized PostgreSQL schema: User, Product, ProductImage, Category, Brand, Cart, CartItem, Order, OrderItem, Address, Review, Wishlist. |

---

## 🏗️ System Architecture

### Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--|| CART : owns
    USER ||--|{ ORDER : places
    USER ||--|{ ADDRESS : saves
    USER ||--|{ WISHLIST : maintains
    USER ||--|{ REVIEW : writes
    CART ||--|{ CART_ITEM : contains
    ORDER ||--|{ ORDER_ITEM : entails
    PRODUCT ||--|{ CART_ITEM : "added as"
    PRODUCT ||--|{ ORDER_ITEM : "billed as"
    PRODUCT ||--|{ PRODUCT_IMAGE : has
    PRODUCT ||--|{ REVIEW : receives
    PRODUCT ||--|{ WISHLIST : "wishlisted in"
    CATEGORY ||--|{ PRODUCT : categorizes
    BRAND ||--|{ PRODUCT : manufactures

    USER {
        string id PK
        string email UK
        string username UK
        string password
        string refreshToken
        boolean isVerified
    }
    PRODUCT {
        string id PK
        string name
        float price
        float discount
        int stock
        float rating
    }
    ORDER {
        string id PK
        string status
        float totalAmount
        string paymentStatus
    }
    CART {
        string id PK
        string userId FK
        float totalAmount
    }
```

### Request Flow — Search with Caching

```mermaid
sequenceDiagram
    participant User
    participant React as React Frontend
    participant Express as Express API
    participant Redis as Redis Cache
    participant PG as PostgreSQL

    User->>React: Searches "laptop under 50000"
    React->>Express: GET /api/v1/products?search=laptop+under+50000
    Express->>Redis: GET cache key
    alt Cache Hit
        Redis-->>Express: Return cached payload
    else Cache Miss
        Express->>Express: NLP regex parsing
        Note right of Express: name: { contains: "laptop" }<br/>price: { lte: 50000 }
        Express->>PG: Prisma findMany with filters
        PG-->>Express: Query results
        Express->>Redis: SETEX (TTL 3600s)
    end
    Express-->>React: JSON response
    React-->>User: Render product grid
```

### Checkout Transaction Flow

```mermaid
sequenceDiagram
    participant User
    participant API as Express API
    participant TX as Prisma $transaction
    participant PG as PostgreSQL
    participant Email as Nodemailer + PDFKit

    User->>API: POST /api/v1/orders/checkout
    API->>TX: Begin atomic transaction
    TX->>PG: Fetch cart + validate stock
    TX->>PG: Create Order + OrderItems
    TX->>PG: Decrement product stock
    TX->>PG: Clear CartItems
    TX-->>API: Transaction committed
    API->>Email: Fire-and-forget email
    Note right of Email: HTML confirmation + PDF invoice attachment
    API-->>User: 201 Order placed
```

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|:---|:---|:---|
| **Frontend** | React 19, Vite, TailwindCSS | SPA with Flipkart-inspired UI, responsive 2→5 column product grid, banner carousel |
| **Backend** | Node.js, Express, TypeScript | Type-safe REST API with layered architecture (Routes → Controllers → Middleware → Utils) |
| **Database** | PostgreSQL (Supabase) | 12-table normalized schema with referential integrity and cascading deletes |
| **ORM** | Prisma | Type-safe queries, migrations, atomic transactions, relation management |
| **Caching** | Redis (Upstash) | Cache-aside pattern for product/category reads with intelligent invalidation |
| **Auth** | JWT (HTTP-Only Cookies) | Access + Refresh token strategy with `sameSite: none` for cross-domain deployment |
| **File Storage** | Cloudinary + Multer | Image upload pipeline — Multer handles multipart, Cloudinary stores/serves media |
| **Email** | Nodemailer (Gmail SMTP) | Transactional emails — welcome email on registration, order confirmation with PDF invoice |
| **Payments** | Razorpay (test mode) | Payment gateway integration for order processing |
| **State** | React Context API | Client-side cart and wishlist state synchronized with backend |

---

## 📁 Project Structure

```
scalecart/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # 12-model PostgreSQL schema
│   │   └── seed.ts                # Seeds 100 products from DummyJSON API
│   ├── src/
│   │   ├── controllers/           # Business logic (11 controllers)
│   │   │   ├── user.controllers.ts
│   │   │   ├── product.controllers.ts
│   │   │   ├── cart.controllers.ts
│   │   │   ├── order.controllers.ts
│   │   │   ├── wishlist.controllers.ts
│   │   │   ├── payment.controllers.ts
│   │   │   └── ...
│   │   ├── middlewares/
│   │   │   ├── auth.middlewares.ts # JWT verification (cookie + Bearer)
│   │   │   └── multer.middlewares.ts
│   │   ├── routes/                # Express route definitions (11 files)
│   │   ├── utils/
│   │   │   ├── redis.ts           # Cache-aside helpers
│   │   │   ├── sendEmail.ts       # Email + PDF invoice generation
│   │   │   ├── cloudinary.ts      # Image upload utility
│   │   │   ├── apiError.ts        # Custom error class
│   │   │   ├── apiResponse.ts     # Standardized response wrapper
│   │   │   └── asyncHandler.ts    # Express async error wrapper
│   │   ├── app.ts                 # Express app config (CORS, routes, error handler)
│   │   └── index.ts               # Server entry point
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # Flipkart-style header with category dropdowns
│   │   │   ├── ProductCard.jsx    # Product tile with wishlist toggle
│   │   │   ├── AuthModal.jsx      # Login/Register modal
│   │   │   └── Loader.jsx         # Skeleton loader
│   │   ├── pages/
│   │   │   ├── Home.jsx           # Banner carousel + product grid + NLP search
│   │   │   ├── ProductDetail.jsx  # Image carousel + stock badge + add to cart
│   │   │   ├── Cart.jsx           # Cart management with quantity controls
│   │   │   ├── Checkout.jsx       # Address selection + order placement
│   │   │   ├── Orders.jsx         # Order history
│   │   │   ├── Wishlist.jsx       # Saved items
│   │   │   ├── Profile.jsx        # User profile + address management
│   │   │   └── OrderSuccess.jsx   # Post-checkout confirmation
│   │   ├── context/
│   │   │   ├── CartContext.jsx     # Cart state + API sync
│   │   │   └── WishlistContext.jsx # Wishlist state + API sync
│   │   ├── services/
│   │   │   └── api.js             # Axios instance with all API calls
│   │   └── App.jsx                # Router + layout
│   ├── .env.production
│   └── package.json
│
└── README.md
```

---

## 🔐 Security & Anti-Fraud Measures

| Measure | Implementation |
|:---|:---|
| **Server-Side Price Enforcement** | `addToCart` controller fetches the product from PostgreSQL and computes `securePrice = price - (price × discount / 100)`. Client-sent prices are ignored. |
| **Race Condition Prevention** | The checkout engine wraps stock validation + decrement inside `prisma.$transaction()`. Two concurrent purchases of the last unit will serialize — the second is rejected with "Insufficient stock". |
| **Token Security** | JWTs are stored in `httpOnly` cookies (inaccessible to JavaScript/XSS). Cross-domain cookie delivery uses `secure: true` + `sameSite: "none"`. |
| **CORS Hardening** | Dynamic origin validation — only `scalecart.vercel.app`, `localhost:5173`, and `*.vercel.app` preview URLs are allowed. No wildcard `*` with credentials. |
| **Input Validation** | Required fields are validated in controllers before any DB operation. Stock bounds are checked before cart additions. |

---

## 🖥️ Local Development Setup

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd scalecart

# 2. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 3. Configure environment
cp backend/.env.example backend/.env
# Fill in your PostgreSQL, Redis, Cloudinary, and SMTP credentials

# 4. Initialize the database
cd backend
npx prisma generate
npx prisma db push
npx prisma db seed    # Seeds 100 products from DummyJSON API

# 5. Start backend (Terminal 1)
npm run dev            # → http://localhost:8000

# 6. Start frontend (Terminal 2)
cd frontend
npm run dev            # → http://localhost:5173
```

---

## 📊 API Endpoints Overview

| Method | Endpoint | Auth | Description |
|:---|:---|:---|:---|
| `POST` | `/api/v1/users/register` | ✗ | Register new user |
| `POST` | `/api/v1/users/login` | ✗ | Login (sets JWT cookies) |
| `POST` | `/api/v1/users/logout` | ✔ | Logout (clears cookies) |
| `GET` | `/api/v1/users/profile` | ✔ | Get user profile |
| `PUT` | `/api/v1/users/profile` | ✔ | Update profile |
| `GET` | `/api/v1/products` | ✗ | List products (search, filter, pagination) |
| `GET` | `/api/v1/products/:id` | ✗ | Get single product |
| `GET` | `/api/v1/categories/categories` | ✗ | List all categories |
| `GET` | `/api/v1/cart` | ✔ | Get user's cart |
| `POST` | `/api/v1/cart/add` | ✔ | Add item to cart |
| `PUT` | `/api/v1/cart/update` | ✔ | Update cart item quantity |
| `DELETE` | `/api/v1/cart/remove` | ✔ | Remove item from cart |
| `POST` | `/api/v1/orders/checkout` | ✔ | Place order (atomic transaction) |
| `GET` | `/api/v1/orders` | ✔ | Get order history |
| `GET` | `/api/v1/wishlist` | ✔ | Get wishlist |
| `POST` | `/api/v1/wishlist/toggle` | ✔ | Toggle wishlist item |
| `GET` | `/api/v1/users/addresses` | ✔ | List saved addresses |
| `POST` | `/api/v1/users/address` | ✔ | Add new address |

---

<p align="center">
  <strong>Built as a production-grade engineering demonstration of scalable e-commerce systems.</strong>
</p>
