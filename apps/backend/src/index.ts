import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import apiRouter from './routes/index.js';
import { initSocketIO } from './socket.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { PaymentService } from './services/payment/PaymentService.js';
import { OrderModel, PaymentModel } from './models/index.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize WebSockets
initSocketIO(server);

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false // Allows Mini App / Vite dev loading
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-telegram-init-data', 'x-telegram-id']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global Rate Limiter
app.use('/api', apiRateLimiter);

// Mount API Routes
app.use('/api', apiRouter);

// Root healthcheck
app.get('/', (req, res) => {
  res.json({
    name: 'Telegram Digital Store Pro API',
    status: 'ONLINE',
    version: '1.0.0',
    documentation: '/api/docs',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    uptime: process.uptime(),
    dbConnected: mongoose.connection.readyState === 1,
    status: 'healthy'
  });
});

// Background Payment & Order Expiration Worker (Runs every 30 seconds)
setInterval(async () => {
  try {
    const now = new Date();

    // Expire unpaid orders past expiration
    const expiredOrders = await OrderModel.find({
      status: 'PENDING',
      expiresAt: { $lt: now }
    });

    for (const order of expiredOrders) {
      order.status = 'EXPIRED';
      await order.save();
      if (order.paymentId) {
        await PaymentModel.findByIdAndUpdate(order.paymentId, { status: 'EXPIRED' });
      }
    }
  } catch (err: any) {
    console.error('[Worker] Expiration worker error:', err.message);
  }
}, 30000);

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/telegram_store_pro';

async function start() {
  try {
    console.log('[Database] Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('[Database] Connected successfully to MongoDB:', MONGODB_URI);

    server.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 TELEGRAM DIGITAL STORE PRO API`);
      console.log(`📡 Server running on http://localhost:${PORT}`);
      console.log(`⚡ WebSocket server active`);
      console.log(`💳 Bakong KHQR Payment Engine initialized`);
      console.log(`=======================================================`);
    });
  } catch (err: any) {
    console.error('[Error] Server startup failed:', err.message);
    process.exit(1);
  }
}

// Only start listening if run directly
if (process.env.NODE_ENV !== 'test') {
  start();
}

export { app, server };
