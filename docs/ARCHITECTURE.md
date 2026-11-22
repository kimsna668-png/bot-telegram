# Architecture Documentation

## Telegram Digital Store Pro

A production-oriented Telegram digital product e-commerce platform integrating **National Bank of Cambodia (NBC) Bakong KHQR** automated payments and instant digital delivery.

---

## 1. System Overview & Component Diagram

```
+-----------------------------------------------------------------------------------+
|                                 TELEGRAM CLIENT                                   |
|   +-------------------------------------+   +----------------------------------+  |
|   |         Telegram Customer Bot       |   |       Telegram Mini App (TMA)    |  |
|   |     (Inline Keyboards & Commands)   |   |   (React 18 + Tailwind + WebApp) |  |
|   +------------------+------------------+   +-----------------+----------------+  |
+----------------------|----------------------------------------|-------------------+
                       |                                        |
                       | Webhook / Polling                      | HTTPS / WebSocket
                       v                                        v
+-----------------------------------------------------------------------------------+
|                                BACKEND SERVICES LAYER                             |
|                                                                                   |
|  +---------------------+   +---------------------+   +-------------------------+  |
|  |     REST API Hub    |   |  Security & Auth    |   |    WebSocket Engine     |  |
|  | (Express/TypeScript)|   | (JWT, InitData HMAC)|   | (Socket.io Real-time)   |  |
|  +----------+----------+   +----------+----------+   +------------+------------+  |
|             |                         |                           |               |
|             +-------------------------+---------------------------+               |
|                                       |                                           |
|                                       v                                           |
|  +-----------------------------------------------------------------------------+  |
|  |                           DOMAIN CORE SERVICES                              |  |
|  |  +---------------------+   +---------------------+   +-------------------+  |  |
|  |  |   Order & Cart      |   |    Bakong KHQR      |   |  Digital Delivery |  |  |
|  |  |     Manager         |   |    Payment Engine   |   |     Service       |  |  |
|  |  +---------------------+   +----------+----------+   +-------------------+  |  |
|  +---------------------------------------|-------------------------------------+  |
+------------------------------------------|----------------------------------------+
                                           |
                                           v
                       +---------------------------------------+
                       |          BAKONG PAYMENT HUB           |
                       |  +---------------------------------+  |
                       |  |  Production Bakong Open API     |  |
                       |  |  (MD5 & Txn Status Verification)|  |
                       |  +---------------------------------+  |
                       |  |  Sandbox Mock Provider          |  |
                       |  |  (Development & Automated Tests)|  |
                       |  +---------------------------------+  |
                       +---------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                                DATA PERSISTENCE LAYER                             |
|  +-----------------------------------------------------------------------------+  |
|  | MongoDB (User, Product, Category, Order, Payment, DigitalAsset, LicenseKey) |  |
|  +-----------------------------------------------------------------------------+  |
|  | Redis (Distributed locks, session state, background job queues)             |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Core Workflows

### 2.1 Automated KHQR Payment & Verification Workflow

```
[Customer]                 [Backend]                 [Bakong Network]
    |                          |                            |
    |-- 1. Checkout Order ---->|                            |
    |                          |-- 2. Generate Dynamic KHQR |
    |                          |      (EMVCo Tag 00..63)    |
    |<- 3. Return KHQR Image --|                            |
    |                          |                            |
    |-- 4. Scan in Bank App ------------------------------->|
    |                          |                            |
    |                          |-- 5. Periodic Status Poll /|
    |                          |      MD5 Hash Verification |
    |                          |<- 6. Response: PAID -------|
    |                          |                            |
    |                          |-- 7. Atomic Status: PAID   |
    |                          |-- 8. Allocate License Key  |
    |                          |-- 9. Gen Secure Download   |
    |<- 10. Instant Delivery --|                            |
    |       in Telegram Chat   |                            |
```

### 2.2 Inventory Reservation & Delivery Isolation

1. **License Keys & Serials**: Allocated using atomic queries (`findOneAndUpdate` with `status: 'AVAILABLE'`) preventing race conditions or double deliveries.
2. **Downloadable Files**: Delivered via cryptographically random 32-byte secure tokens (`/api/deliveries/download/:token`) with strict download counters and time-to-live expirations.
3. **Private Access Links & Credentials**: Delivered securely with Telegram push notifications.
