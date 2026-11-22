import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import {
  AdminModel,
  RoleModel,
  CategoryModel,
  ProductModel,
  LicenseKeyModel,
  DigitalAssetModel,
  CouponModel,
  TelegramSettingsModel,
  BakongSettingsModel
} from '../models/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/telegram_store_pro';

async function seedDatabase() {
  console.log('[Seed] Connecting to MongoDB:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);

  console.log('[Seed] Clearing existing collections for fresh seed...');
  await Promise.all([
    AdminModel.deleteMany({}),
    RoleModel.deleteMany({}),
    CategoryModel.deleteMany({}),
    ProductModel.deleteMany({}),
    LicenseKeyModel.deleteMany({}),
    DigitalAssetModel.deleteMany({}),
    CouponModel.deleteMany({}),
    TelegramSettingsModel.deleteMany({}),
    BakongSettingsModel.deleteMany({})
  ]);

  // 1. Roles
  console.log('[Seed] Creating Roles...');
  const superAdminRole = await RoleModel.create({
    name: 'Super Admin',
    description: 'Full administrative access to all modules and configurations',
    permissions: ['*'],
    isSystem: true
  });

  const managerRole = await RoleModel.create({
    name: 'Store Manager',
    description: 'Manage products, orders, inventory and view reports',
    permissions: [
      'product:view',
      'product:edit',
      'order:view',
      'order:edit',
      'inventory:view',
      'inventory:edit',
      'report:view'
    ]
  });

  // 2. Super Admin User
  console.log('[Seed] Creating Super Admin Account...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Admin@123456', salt);

  await AdminModel.create({
    username: 'superadmin',
    email: 'admin@store.pro',
    passwordHash,
    roleId: superAdminRole._id,
    isActive: true
  });
  console.log('   -> Super Admin created: admin@store.pro / Admin@123456');

  // 3. Categories
  console.log('[Seed] Creating Product Categories...');
  const catEbooks = await CategoryModel.create({
    name: 'E-Books & Tech Guides',
    slug: 'ebooks-guides',
    description: 'Practical guides, architecture handbooks, and reference manuals',
    icon: 'book-open',
    sortOrder: 1,
    isActive: true
  });

  const catSoftware = await CategoryModel.create({
    name: 'Developer Software & Tools',
    slug: 'software-tools',
    description: 'Compiled apps, automation bots, and developer scripts',
    icon: 'terminal',
    sortOrder: 2,
    isActive: true
  });

  const catLicenses = await CategoryModel.create({
    name: 'License Keys & Activations',
    slug: 'licenses-keys',
    description: 'Genuine digital license keys for OS, IDEs, and office suites',
    icon: 'key',
    sortOrder: 3,
    isActive: true
  });

  const catCourses = await CategoryModel.create({
    name: 'Online Video Courses',
    slug: 'video-courses',
    description: 'Curated comprehensive bootcamps and certification courses',
    icon: 'video',
    sortOrder: 4,
    isActive: true
  });

  const catAccounts = await CategoryModel.create({
    name: 'Cloud & Subscriptions',
    slug: 'cloud-subscriptions',
    description: 'Pre-provisioned developer cloud and SaaS access pass',
    icon: 'shield-check',
    sortOrder: 5,
    isActive: true
  });

  // 4. Products & Digital Assets
  console.log('[Seed] Creating Digital Products...');

  // Product 1: Windows 11 Pro Key
  const prodWin11 = await ProductModel.create({
    name: 'Windows 11 Professional Retail License Key',
    slug: 'windows-11-pro-license',
    shortDescription: '100% Genuine Lifetime Retail Key for 1 PC with Instant Delivery',
    description: 'Genuine Microsoft Windows 11 Professional 64-bit retail product key. Instant automated delivery directly to your Telegram chat. Supports all languages, online activation and future updates.',
    priceUSD: 14.99,
    priceKHR: 61500,
    discountPriceUSD: 11.99,
    discountPriceKHR: 49000,
    categoryId: catLicenses._id,
    images: ['https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=600&q=80'],
    productType: 'license_key',
    deliveryMethod: 'instant_license',
    stockQuantity: 10,
    isUnlimitedStock: false,
    isActive: true,
    salesCount: 142,
    rating: 5
  });

  // Seed License Keys for Windows 11
  const win11Keys = [
    'W269N-WFGWX-YVC9B-4J6C9-T83GX',
    'MH37W-N47XK-V7XM9-C7227-GCQG9',
    'VK7JG-NPHTM-C97JM-9MPGT-3V66T',
    'NRG8B-VKK3Q-CXVCJ-9G2XF-6Q84J',
    'DPH2V-TTNVB-4X9Q3-TJR4H-KHJW4',
    'NW6C2-QMPVW-D7KKK-3GKT6-VCFB2',
    '2WH4N-8QGBV-H22JP-CT43Q-MDWWJ',
    'NPPR9-FWDCX-D2C8J-H872K-2YT43',
    'WGGHN-J84D6-QYCPR-T7PJ7-X766F',
    'RPH2V-TTNVB-4X9Q3-TJR4H-KHJW5'
  ];

  for (const k of win11Keys) {
    await LicenseKeyModel.create({
      productId: prodWin11._id,
      licenseKey: k,
      status: 'AVAILABLE',
      notes: 'Initial Batch A1'
    });
  }

  // Product 2: JetBrains All Products
  const prodJetbrains = await ProductModel.create({
    name: 'JetBrains All Products Pack 1-Year Activation',
    slug: 'jetbrains-all-products-pack',
    shortDescription: 'Full access to IntelliJ, WebStorm, PyCharm, CLion, Rider & more',
    description: 'Get full access to all JetBrains IDEs including IntelliJ IDEA Ultimate, WebStorm, PyCharm Pro, DataGrip, GoLand and CLion. Guaranteed 365 days activation code.',
    priceUSD: 29.99,
    priceKHR: 123000,
    discountPriceUSD: 24.99,
    discountPriceKHR: 102500,
    categoryId: catLicenses._id,
    images: ['https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80'],
    productType: 'activation_code',
    deliveryMethod: 'instant_license',
    stockQuantity: 5,
    isUnlimitedStock: false,
    isActive: true,
    salesCount: 89,
    rating: 5
  });

  const jbKeys = [
    'JB-PRO-2026-X892-4912-QKLA',
    'JB-PRO-2026-M481-9923-ZOPW',
    'JB-PRO-2026-C194-4412-BBNA',
    'JB-PRO-2026-D812-7721-OPQA',
    'JB-PRO-2026-F551-3312-MNYA'
  ];
  for (const k of jbKeys) {
    await LicenseKeyModel.create({
      productId: prodJetbrains._id,
      licenseKey: k,
      status: 'AVAILABLE'
    });
  }

  // Product 3: DevSecOps & Cloud Security Architecture Handbook (PDF)
  const prodDevsecops = await ProductModel.create({
    name: 'DevSecOps & Cloud Security Architecture (PDF Edition)',
    slug: 'devsecops-cloud-security-handbook',
    shortDescription: '450+ Pages of Real-world Security Patterns, CI/CD Hardening & Kubernetes Defense',
    description: 'The definitive blueprint for securing modern distributed cloud applications. Covers zero-trust architecture, OWASP API top 10 remediation, automated SAST/DAST pipelines, and AWS/GCP IAM hardening.',
    priceUSD: 19.00,
    priceKHR: 77900,
    discountPriceUSD: 14.50,
    discountPriceKHR: 59450,
    categoryId: catEbooks._id,
    images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'],
    productType: 'ebook_pdf',
    deliveryMethod: 'secure_download',
    stockQuantity: 9999,
    isUnlimitedStock: true,
    isActive: true,
    salesCount: 231,
    rating: 5
  });

  await DigitalAssetModel.create({
    productId: prodDevsecops._id,
    title: 'DevSecOps Architecture Handbook (Complete PDF Bundle)',
    assetType: 'file',
    originalFileName: 'DevSecOps_Security_Handbook_2026.pdf',
    textContent: 'Thank you for your purchase! This document contains your download authentication and verification checksum.',
    downloadLimit: 10,
    expiresInHours: 72
  });

  // Product 4: Automated Crypto & FX Algorithmic Trading Bot Source Code
  const prodTradingBot = await ProductModel.create({
    name: 'Algorithmic Trading Bot Engine (TypeScript / Python)',
    slug: 'algorithmic-trading-bot-engine',
    shortDescription: 'Full production source code with WebSocket feeds, backtesting & risk management',
    description: 'Production-ready algorithmic trading execution framework. Features low-latency order execution, risk parameter checks, automated trailing stop-losses, and multi-exchange API connectors.',
    priceUSD: 49.00,
    priceKHR: 200900,
    discountPriceUSD: 39.00,
    discountPriceKHR: 159900,
    categoryId: catSoftware._id,
    images: ['https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=600&q=80'],
    productType: 'software',
    deliveryMethod: 'secure_download',
    stockQuantity: 9999,
    isUnlimitedStock: true,
    isActive: true,
    salesCount: 67,
    rating: 5
  });

  await DigitalAssetModel.create({
    productId: prodTradingBot._id,
    title: 'Trading Bot Complete Source Archive (v2.4.0)',
    assetType: 'file',
    originalFileName: 'Algo_Trading_Engine_v2.4.zip',
    downloadLimit: 5,
    expiresInHours: 48
  });

  // Product 5: Full-Stack Microservices Bootcamp Video Course
  const prodCourse = await ProductModel.create({
    name: 'Production Microservices with Node, Go & Docker Bootcamp',
    slug: 'production-microservices-bootcamp',
    shortDescription: '60+ Hours of On-Demand HD Video, Code Repositories & Private Discord Access',
    description: 'Build enterprise-scale microservices from scratch using Node.js, Golang, Apache Kafka, Redis, and Docker. Includes access to private community discord and instructor Q&A sessions.',
    priceUSD: 35.00,
    priceKHR: 143500,
    discountPriceUSD: 29.00,
    discountPriceKHR: 118900,
    categoryId: catCourses._id,
    images: ['https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80'],
    productType: 'course',
    deliveryMethod: 'private_link',
    stockQuantity: 9999,
    isUnlimitedStock: true,
    isActive: true,
    salesCount: 112,
    rating: 5
  });

  await DigitalAssetModel.create({
    productId: prodCourse._id,
    title: 'Microservices Masterclass VIP Portal',
    assetType: 'link',
    externalUrl: 'https://academy.store.pro/learn/microservices-2026',
    downloadLimit: 999
  });

  // 5. Coupons
  console.log('[Seed] Creating Promotional Coupons...');
  await CouponModel.create([
    {
      code: 'WELCOME10',
      discountType: 'percentage',
      discountValueUSD: 10,
      discountValueKHR: 10,
      minOrderUSD: 10,
      minOrderKHR: 40000,
      usageLimit: 1000,
      usedCount: 12,
      validFrom: new Date('2024-01-01'),
      validTo: new Date('2030-12-31'),
      isActive: true
    },
    {
      code: 'KHQR5',
      discountType: 'fixed',
      discountValueUSD: 5,
      discountValueKHR: 20500,
      minOrderUSD: 20,
      minOrderKHR: 82000,
      usageLimit: 500,
      usedCount: 4,
      validFrom: new Date('2024-01-01'),
      validTo: new Date('2030-12-31'),
      isActive: true
    }
  ]);

  // 6. Settings
  console.log('[Seed] Initializing Telegram & Bakong Settings...');
  await TelegramSettingsModel.create({
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    botUsername: 'StoreProKHQRBot',
    miniAppUrl: 'http://localhost:3000/store',
    welcomeMessage: '🚀 *Welcome to Telegram Digital Store Pro!*\n\nYour premier digital goods marketplace. Pay seamlessly with *Bakong KHQR* and receive your digital downloads, license keys and subscriptions instantly!',
    supportContact: '@StoreProSupport',
    broadcastChannel: '@StoreProAnnouncements',
    defaultLanguage: 'en',
    isBotActive: true,
    autoDeliveryEnabled: true
  });

  await BakongSettingsModel.create({
    merchantId: 'devb_retail',
    merchantName: 'DIGITAL STORE PRO',
    merchantCity: 'Phnom Penh',
    bakongAccountId: 'devb_retail@devb',
    acquireId: 'DEVB',
    apiUrl: 'https://api-bakong.nbc.gov.kh/v1',
    isSandbox: true,
    sandboxMockDelayMs: 3000,
    pollIntervalSeconds: 3,
    qrExpiryMinutes: 15
  });

  console.log('✅ [Seed] Database seeding completed successfully!');
  await mongoose.disconnect();
}

seedDatabase().catch((err) => {
  console.error('❌ [Seed] Error seeding database:', err);
  process.exit(1);
});
