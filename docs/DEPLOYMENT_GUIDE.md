# Production Deployment Guide

## 1. Prerequisites

- Docker and Docker Compose v2+
- Node.js v20+ & npm v10+
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))
- Domain name with SSL/TLS certificate (HTTPS is mandatory for Telegram Mini Apps)

---

## 2. Quick Start with Docker Compose

1. Clone or extract the project:
   ```bash
   git clone <repo-url> telegram-digital-store-pro
   cd telegram-digital-store-pro
   ```

2. Copy and configure the environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and fill in:
   - `TELEGRAM_BOT_TOKEN`: Your bot token
   - `TELEGRAM_MINI_APP_URL`: Your public HTTPS Mini App URL (e.g. `https://store.yourdomain.com/store`)
   - `BAKONG_ACCOUNT_ID`: Your Bakong merchant account ID
   - `JWT_SECRET`: A secure 64-character random string

3. Start all services:
   ```bash
   docker compose up -d --build
   ```

4. Seed the initial database (Super Admin & default products):
   ```bash
   docker compose exec backend npm run seed
   ```

---

## 3. Manual / PM2 Deployment on Ubuntu / Debian

### 3.1 Install Dependencies & Build Monorepo
```bash
npm install
npm run build:packages
npm run build:backend
npm run build:frontend
npm run build:bot
```

### 3.2 Run Database Seed
```bash
npm run seed
```

### 3.3 Manage Services with PM2
```bash
npm install -g pm2
pm2 start apps/backend/dist/index.js --name "store-backend"
pm2 start apps/telegram-bot/dist/index.js --name "store-bot"
pm2 save
pm2 startup
```

---

## 4. Setting up Telegram Mini App (BotFather)

1. Open Telegram and talk to [@BotFather](https://t.me/BotFather)
2. Send `/newapp`
3. Select your bot
4. Provide title and description
5. Upload 640x360 app photo
6. When prompted for Web App URL, enter your HTTPS URL:
   `https://store.yourdomain.com/store`
7. Set short name (e.g., `store`)
8. Set Menu Button:
   Send `/setmenubutton` -> Select your bot -> Enter the URL `https://store.yourdomain.com/store` and title `🛍️ Open Store`.
