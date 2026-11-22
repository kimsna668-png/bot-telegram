# Telegram Digital Store Pro

A production-ready Telegram Digital Product E-Commerce Platform with automated **Bakong KHQR** payments and instant digital product delivery.

---

## 🌟 Key Highlights

- **Telegram Customer Bot & Mini App (TMA)**: Seamless in-app shopping experience powered by React 18, Tailwind CSS, and Telegram WebApp SDK.
- **Bakong KHQR Dynamic Payment Engine**: Native National Bank of Cambodia (NBC) KHQR EMVCo generator with CRC16-CCITT checksum, automatic polling, and Open API verification.
- **Automated Instant Digital Delivery**: Immediate delivery of license keys from the inventory pool, expiring secure download links for PDFs and software archives, and course access credentials.
- **Enterprise Dark Purple Admin Dashboard**: 17 dedicated administration modules including Real-time Analytics, Product Management, Category Management, License Key Pool, Order Fulfillment, KHQR Transaction Auditing, Customer Management, Coupons, Bot Settings, Gateway Settings, and Security Audit Logs.
- **Full Security Hardening**: Telegram WebApp `initData` HMAC-SHA256 signature verification, Admin JWT with bcrypt hashing, rate limiting, and zero exposure of private gateway tokens.

---

## 📦 Project Architecture

```
telegram-digital-store-pro/
├── apps/
│   ├── frontend/         # React 18 + Vite + Tailwind CSS (Mini App & Dark Purple Admin Dashboard)
│   ├── backend/          # Node.js + Express + TypeScript + Mongoose + Socket.io + KHQR Engine
│   └── telegram-bot/     # Telegraf.js bot with inline keyboards & instant delivery notifications
├── packages/
│   ├── shared/           # KHQR EMVCo generator, CRC16 checksum, constants & utility helpers
│   └── types/            # Domain interfaces (IUser, IProduct, IOrder, IPayment, IDelivery, etc.)
├── docs/                 # Architecture, API Documentation, KHQR Guide, Deployment Guide
├── tests/                # Automated test suite (KHQR, Security, Payment Engine, Inventory)
├── docker-compose.yml    # Production container orchestration
├── .env.example          # Environment variables template
├── package.json          # Monorepo workspace configuration
└── README.md
```

---

## 🚀 Quick Setup & Installation

### 1. Prerequisites
- Node.js v20+ & npm v10+
- MongoDB instance (local or MongoDB Atlas)

### 2. Install Dependencies
```bash
npm install
```

### 3. Build Packages
```bash
npm run build:packages
```

### 4. Configure Environment
```bash
cp .env.example .env
```
Update `.env` with your `MONGODB_URI` and `TELEGRAM_BOT_TOKEN`.

### 5. Seed Database
Pre-populates Super Admin (`admin@store.pro` / `Admin@123456`), digital product categories, retail products with license key pools, and discount coupons:
```bash
npm run seed
```

### 6. Run Automated Test Suite
```bash
npx tsx tests/run-tests.ts
```

### 7. Run in Development
Start backend:
```bash
npm run dev:backend
```
Start frontend (Mini App + Admin Dashboard):
```bash
npm run dev:frontend
```
Start customer Telegram bot:
```bash
npm run dev:bot
```

Access the applications:
- **Telegram Mini App Storefront**: [http://localhost:3000/store](http://localhost:3000/store)
- **Admin Dashboard**: [http://localhost:3000/admin](http://localhost:3000/admin) (Login: `admin@store.pro` / `Admin@123456`)
- **Backend REST API**: [http://localhost:5000/api](http://localhost:5000/api)

---

## 💳 KHQR Payment Workflow

1. Customer adds digital product to cart and clicks **Pay with Bakong KHQR**.
2. Backend creates an order with a unique transaction reference and generates an NBC KHQR string conforming to EMVCo Merchant-Presented specifications.
3. The dynamic QR code is displayed with a live 15-minute countdown timer.
4. Customer scans with Bakong, ABA, Wing, ACLEDA, or any KHQR banking app.
5. In development/testing, developers can click **[Sandbox Test] Simulate Bank Scan** to test end-to-end payment confirmation and delivery without live banking credentials.
6. The backend verifies the transaction server-side against the Bakong Open API.
7. Upon confirmation, the order transitions to `PAID`, digital assets or license keys are atomically provisioned, and the customer receives an instant notification in Telegram with download links and keys.

---

## 📄 License
MIT License. Built for Telegram Digital Store Pro.
