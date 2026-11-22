# REST API Documentation

Base URL: `http://localhost:5000/api`

---

## 1. Authentication (`/api/auth`)

### POST `/api/auth/login`
Admin dashboard sign in.
- **Request Body**:
  ```json
  {
    "email": "admin@store.pro",
    "password": "Admin@123456"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "admin": {
      "id": "664...",
      "username": "superadmin",
      "email": "admin@store.pro",
      "role": "Super Admin",
      "permissions": ["*"]
    }
  }
  ```

### GET `/api/auth/me`
Retrieve active admin profile (Requires Bearer Token header).

---

## 2. Customer Endpoints (`/api/users`)

### GET `/api/users/profile`
Retrieve authenticated Telegram customer profile.
- **Headers**:
  - `x-telegram-init-data`: Raw initData string from Telegram WebApp SDK, OR
  - `x-telegram-id`: Telegram user ID (in development)

### GET `/api/users/orders`
Retrieve customer order history and purchased digital items.

---

## 3. Products & Catalog (`/api/products`)

### GET `/api/products`
Query parameters:
- `category`: Category slug or ObjectId
- `type`: Product type (`ebook_pdf`, `software`, `license_key`, `course`, `account`)
- `search`: Case-insensitive text search
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

### GET `/api/products/:identifier`
Retrieve single product by slug or ObjectId.

---

## 4. Shopping Cart & Checkout (`/api/cart` & `/api/orders`)

### POST `/api/cart/validate`
Validate cart inventory, calculate discounts and totals.
- **Request Body**:
  ```json
  {
    "items": [
      { "productId": "664c...", "quantity": 1 }
    ],
    "couponCode": "WELCOME10",
    "currency": "USD"
  }
  ```

### POST `/api/orders`
Place order and generate dynamic Bakong KHQR request.
- **Request Body**:
  ```json
  {
    "items": [
      { "productId": "664c...", "quantity": 1 }
    ],
    "currency": "USD",
    "couponCode": "WELCOME10"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "order": {
      "id": "664d...",
      "orderNumber": "ORD-20261122-A1B2C3",
      "payableAmount": 14.99,
      "currency": "USD",
      "status": "PENDING"
    },
    "payment": {
      "transactionRef": "TX-M3K9P-8A2F",
      "qrString": "0002010102122930...",
      "qrImageDataUrl": "data:image/png;base64,...",
      "expiresAt": "2026-11-22T04:30:00Z"
    }
  }
  ```

---

## 5. Payments (`/api/payments`)

### GET `/api/payments/status/:transactionRef`
Returns the status of a transaction (`PENDING`, `SUCCESS`, `EXPIRED`).

### POST `/api/payments/verify/:transactionRef`
Authoritative server-side verification against the Bakong Open API or sandbox provider.

### POST `/api/payments/sandbox-simulate-approval/:transactionRef`
*Available only in development / sandbox mode.* Simulates bank app scan confirmation.

---

## 6. Digital Delivery (`/api/deliveries`)

### GET `/api/deliveries/order/:orderId`
Returns delivered digital assets, license keys, and instructions for an order.

### GET `/api/deliveries/download/:token`
Secure, token-authenticated, download rate-limited file download gateway.

### POST `/api/deliveries/resend/:orderId`
Resends delivery message to customer Telegram chat.

---

## 7. Admin Endpoints (`/api/admin`)
Requires `Authorization: Bearer <token>`.
- `GET /api/admin/dashboard/stats`: Analytics KPIs and charts
- `GET /api/admin/products`: Full catalog
- `POST /api/admin/products`: Create product
- `PUT /api/admin/products/:id`: Update product
- `DELETE /api/admin/products/:id`: Delete product
- `POST /api/admin/license-keys/batch`: Batch upload license keys
- `GET /api/admin/orders`: Orders with filter
- `PUT /api/admin/orders/:id/status`: Update status
- `GET /api/admin/payments`: Transaction history
- `GET /api/admin/customers`: Customer registry
- `PUT /api/admin/customers/:id/toggle-block`: Block / unblock
- `GET /api/admin/settings/telegram`: Telegram configuration
- `PUT /api/admin/settings/telegram`: Update Telegram settings
- `GET /api/admin/settings/bakong`: Bakong KHQR configuration
- `PUT /api/admin/settings/bakong`: Update Bakong settings
- `GET /api/admin/audit-logs`: Immutable audit trails
