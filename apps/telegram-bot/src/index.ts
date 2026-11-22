import { Telegraf, Markup } from 'telegraf';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const API_URL = process.env.BACKEND_API_URL || 'http://localhost:5000/api';
const MINI_APP_URL = process.env.TELEGRAM_MINI_APP_URL || 'http://localhost:3000/store';

if (!BOT_TOKEN) {
  console.warn('⚠️ [TelegramBot] TELEGRAM_BOT_TOKEN is not configured in .env. Bot will run in offline standby mode.');
}

export const bot = new Telegraf(BOT_TOKEN || '0000000000:AAFakeBotTokenForStandbyModeOnly123456');

// Helper to interact with backend
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000
});

// Helper for bot auth headers
function getTgHeader(telegramId: number) {
  return {
    headers: {
      'x-telegram-id': telegramId.toString()
    }
  };
}

// In-memory cart for Telegram text bot (per telegramId)
interface ICartStateItem {
  productId: string;
  name: string;
  priceUSD: number;
  quantity: number;
}
const userCarts = new Map<number, ICartStateItem[]>();

// 1. Welcome & Registration
bot.command('start', async (ctx) => {
  const telegramId = ctx.from.id;
  const username = ctx.from.username;
  const firstName = ctx.from.first_name;
  const lastName = ctx.from.last_name;

  // Check referral parameter (e.g. /start ref_123456)
  const text = ctx.message.text || '';
  const match = text.match(/ref_(\d+)/);
  const referredBy = match ? parseInt(match[1], 10) : undefined;

  try {
    // Register or sync user with backend
    await api.get('/users/profile', getTgHeader(telegramId));
  } catch (e) {
    // Backend may auto-create via x-telegram-id header
  }

  const welcomeText =
    `✨ *Welcome to Telegram Digital Store Pro!* ✨\n\n` +
    `Hello *${firstName}*! We provide premium digital products with instant delivery and *Bakong KHQR* automated payments.\n\n` +
    `🚀 *Features:*\n` +
    `• Instant license keys & activation codes\n` +
    `• Secure digital eBooks & software downloads\n` +
    `• Instant automated delivery after scan\n` +
    `• 24/7 automated KHQR payment verification\n\n` +
    `Tap the buttons below to explore our store or open the *Mini App* for a rich shopping experience!`;

  await ctx.replyWithMarkdown(
    welcomeText,
    Markup.inlineKeyboard([
      [Markup.button.webApp('🛍️ Open Store (Mini App)', MINI_APP_URL)],
      [
        Markup.button.callback('📂 Browse Categories', 'cmd_categories'),
        Markup.button.callback('🔍 Search Products', 'cmd_search_prompt')
      ],
      [
        Markup.button.callback('🛒 My Cart', 'cmd_cart'),
        Markup.button.callback('📦 My Orders', 'cmd_orders')
      ],
      [
        Markup.button.callback('🎁 Referral Program', 'cmd_referral'),
        Markup.button.callback('💬 Customer Support', 'cmd_support')
      ]
    ])
  );
});

// 2. Categories
bot.action('cmd_categories', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const res = await api.get('/categories');
    const categories = res.data.categories || [];

    if (categories.length === 0) {
      await ctx.reply('No categories found.');
      return;
    }

    const buttons = categories.map((cat: any) => [
      Markup.button.callback(`📁 ${cat.name}`, `cat_${cat.slug}`)
    ]);
    buttons.push([Markup.button.callback('🔙 Back to Main Menu', 'cmd_menu')]);

    await ctx.reply('*Select a Category:*', {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons)
    });
  } catch (err: any) {
    await ctx.reply('⚠️ Error loading categories: ' + (err.message || 'Server error'));
  }
});

// Category products action
bot.action(/cat_(.+)/, async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const slug = ctx.match[1];
    const res = await api.get(`/products?category=${slug}`);
    const products = res.data.products || [];

    if (products.length === 0) {
      await ctx.reply('No products found in this category.', Markup.inlineKeyboard([
        [Markup.button.callback('🔙 Back to Categories', 'cmd_categories')]
      ]));
      return;
    }

    const buttons = products.map((prod: any) => [
      Markup.button.callback(`🔹 ${prod.name} - $${prod.discountPriceUSD || prod.priceUSD}`, `prod_${prod._id}`)
    ]);
    buttons.push([Markup.button.callback('🔙 Back to Categories', 'cmd_categories')]);

    await ctx.reply(`*Products in Category:*`, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons)
    });
  } catch (err: any) {
    await ctx.reply('⚠️ Error loading products: ' + err.message);
  }
});

// 3. Product Details
bot.action(/prod_(.+)/, async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const prodId = ctx.match[1];
    const res = await api.get(`/products/${prodId}`);
    const prod = res.data.product;

    if (!prod) {
      await ctx.reply('Product not found.');
      return;
    }

    const priceUSD = prod.discountPriceUSD ?? prod.priceUSD;
    const priceKHR = prod.discountPriceKHR ?? prod.priceKHR;

    let msg = `🛍️ *${prod.name}*\n\n`;
    msg += `📝 ${prod.shortDescription || prod.description}\n\n`;
    msg += `💵 *Price:* $${priceUSD.toFixed(2)} (${priceKHR.toLocaleString()} ៛)\n`;
    if (prod.discountPriceUSD) {
      msg += `🏷️ *Original:* ~$${prod.priceUSD.toFixed(2)}~\n`;
    }
    msg += `📦 *Type:* \`${prod.productType}\`\n`;
    msg += `⚡ *Delivery:* \`${prod.deliveryMethod}\`\n`;
    msg += `📊 *Stock:* ${prod.isUnlimitedStock ? 'Unlimited' : prod.stockQuantity + ' available'}\n`;

    const buttons = [
      [
        Markup.button.callback('🛒 Add to Cart', `add_cart_${prod._id}`),
        Markup.button.callback('⚡ Instant Buy', `buy_instant_${prod._id}`)
      ],
      [Markup.button.webApp('🌐 View in Mini App', `${MINI_APP_URL}`)],
      [Markup.button.callback('🔙 Categories', 'cmd_categories')]
    ];

    if (prod.images && prod.images.length > 0 && prod.images[0].startsWith('http')) {
      await ctx.replyWithPhoto(prod.images[0], {
        caption: msg,
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons)
      });
    } else {
      await ctx.replyWithMarkdown(msg, Markup.inlineKeyboard(buttons));
    }
  } catch (err: any) {
    await ctx.reply('⚠️ Error loading product details: ' + err.message);
  }
});

// 4. Add to Cart & Instant Buy
bot.action(/add_cart_(.+)/, async (ctx) => {
  try {
    await ctx.answerCbQuery('Added to cart!');
    const prodId = ctx.match[1];
    const telegramId = ctx.from.id;

    const res = await api.get(`/products/${prodId}`);
    const prod = res.data.product;

    const cart = userCarts.get(telegramId) || [];
    const existing = cart.find((i) => i.productId === prodId);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        productId: prod._id,
        name: prod.name,
        priceUSD: prod.discountPriceUSD ?? prod.priceUSD,
        quantity: 1
      });
    }
    userCarts.set(telegramId, cart);

    await ctx.reply(
      `✅ Added *${prod.name}* to your cart!`,
      Markup.inlineKeyboard([
        [Markup.button.callback('🛒 View Cart & Checkout', 'cmd_cart')],
        [Markup.button.callback('➕ Continue Shopping', 'cmd_categories')]
      ])
    );
  } catch (err: any) {
    await ctx.reply('Error adding to cart: ' + err.message);
  }
});

// 5. Shopping Cart & Checkout
bot.action('cmd_cart', async (ctx) => {
  await showCart(ctx);
});

bot.command('cart', async (ctx) => {
  await showCart(ctx);
});

async function showCart(ctx: any) {
  const telegramId = ctx.from.id;
  const cart = userCarts.get(telegramId) || [];

  if (cart.length === 0) {
    await ctx.reply(
      '🛒 Your cart is currently empty.',
      Markup.inlineKeyboard([
        [Markup.button.callback('🛍️ Browse Products', 'cmd_categories')],
        [Markup.button.webApp('📱 Open Mini App Store', MINI_APP_URL)]
      ])
    );
    return;
  }

  let totalUSD = 0;
  let text = `🛒 *Your Shopping Cart:*\n\n`;

  cart.forEach((item, index) => {
    const subtotal = item.priceUSD * item.quantity;
    totalUSD += subtotal;
    text += `${index + 1}. *${item.name}*\n   Qty: ${item.quantity} × $${item.priceUSD.toFixed(2)} = *$${subtotal.toFixed(2)}*\n`;
  });

  text += `\n━━━━━━━━━━━━━━━━━━━━\n`;
  text += `💰 *Total Amount:* *$${totalUSD.toFixed(2)}* (~${Math.round(totalUSD * 4100).toLocaleString()} ៛)\n`;

  await ctx.replyWithMarkdown(
    text,
    Markup.inlineKeyboard([
      [Markup.button.callback('💳 Checkout with KHQR', 'cmd_checkout')],
      [Markup.button.callback('🗑️ Clear Cart', 'cmd_clear_cart')],
      [Markup.button.callback('🔙 Categories', 'cmd_categories')]
    ])
  );
}

bot.action('cmd_clear_cart', async (ctx) => {
  await ctx.answerCbQuery('Cart cleared');
  userCarts.delete(ctx.from.id);
  await ctx.reply('🛒 Your cart has been emptied.');
});

// 6. Checkout & KHQR Payment
bot.action(['cmd_checkout', /buy_instant_(.+)/], async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const telegramId = ctx.from.id;
    let itemsToOrder: any[] = [];

    if (ctx.match && ctx.match[0].startsWith('buy_instant_')) {
      const prodId = ctx.match[1];
      itemsToOrder.push({ productId: prodId, quantity: 1 });
    } else {
      const cart = userCarts.get(telegramId) || [];
      if (cart.length === 0) {
        await ctx.reply('Your cart is empty.');
        return;
      }
      itemsToOrder = cart.map((i) => ({ productId: i.productId, quantity: i.quantity }));
    }

    await ctx.reply('⏳ Creating your order and generating dynamic Bakong KHQR...');

    const res = await api.post(
      '/orders',
      {
        items: itemsToOrder,
        currency: 'USD'
      },
      getTgHeader(telegramId)
    );

    const { order, payment } = res.data;

    // Clear cart on successful order creation
    userCarts.delete(telegramId);

    let payMsg = `💳 *Bakong KHQR Payment Request*\n\n`;
    payMsg += `📦 *Order:* \`${order.orderNumber}\`\n`;
    payMsg += `💵 *Amount:* *$${order.payableAmount.toFixed(2)}* USD\n`;
    payMsg += `⏱️ *Expires in:* 15 minutes\n\n`;
    payMsg += `📲 *How to pay:*\n`;
    payMsg += `1. Save the QR code image below.\n`;
    payMsg += `2. Open any Cambodian banking app (Bakong, ABA, Wing, ACLEDA, etc.).\n`;
    payMsg += `3. Scan and confirm payment.\n\n`;
    payMsg += `⚡ Your digital products will be delivered here instantly upon confirmation!`;

    // Convert data URL base64 image into buffer to send as Telegram Photo
    const base64Data = payment.qrImageDataUrl.replace(/^data:image\/png;base64,/, '');
    const imgBuffer = Buffer.from(base64Data, 'base64');

    await ctx.replyWithPhoto(
      { source: imgBuffer },
      {
        caption: payMsg,
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🔄 Check Payment Status', `verify_${payment.transactionRef}`)],
          [Markup.button.callback('🧪 [Sandbox] Simulate Scan', `sim_pay_${payment.transactionRef}`)],
          [Markup.button.webApp('📱 View Order in Mini App', `${MINI_APP_URL}`)]
        ])
      }
    );
  } catch (err: any) {
    await ctx.reply('⚠️ Error creating order: ' + (err.response?.data?.message || err.message));
  }
});

// 7. Payment Verification Callback
bot.action(/verify_(.+)/, async (ctx) => {
  try {
    const txnRef = ctx.match[1];
    await ctx.answerCbQuery('Checking payment status with Bakong...');

    const res = await api.post(`/payments/verify/${txnRef}`);
    const isPaid = res.data.success;

    if (isPaid) {
      await ctx.reply(`🎉 *Payment Confirmed!* Thank you! Your digital delivery is being processed right now.`);
    } else {
      await ctx.reply(
        `⏳ *Payment Pending:*\n${res.data.verification?.message || 'We have not yet detected your payment on the Bakong network. Please complete the scan in your banking app.'}`,
        Markup.inlineKeyboard([
          [Markup.button.callback('🔄 Re-check Status', `verify_${txnRef}`)],
          [Markup.button.callback('🧪 [Sandbox] Simulate Scan', `sim_pay_${txnRef}`)]
        ])
      );
    }
  } catch (err: any) {
    await ctx.reply('Error verifying payment: ' + (err.response?.data?.message || err.message));
  }
});

// 8. Sandbox Simulation Callback
bot.action(/sim_pay_(.+)/, async (ctx) => {
  try {
    const txnRef = ctx.match[1];
    await ctx.answerCbQuery('Simulating banking scan...');
    const res = await api.post(`/payments/sandbox-simulate-approval/${txnRef}`);
    if (res.data.success) {
      await ctx.reply('✅ *[Sandbox Simulation]* Payment scan successfully approved and verified! Digital delivery triggered.');
    } else {
      await ctx.reply('Simulation failed: ' + res.data.message);
    }
  } catch (err: any) {
    await ctx.reply('Simulation not available: ' + (err.response?.data?.message || err.message));
  }
});

// 9. My Orders & Downloads
bot.command('orders', async (ctx) => {
  await showUserOrders(ctx);
});

bot.action('cmd_orders', async (ctx) => {
  await ctx.answerCbQuery();
  await showUserOrders(ctx);
});

async function showUserOrders(ctx: any) {
  try {
    const telegramId = ctx.from.id;
    const res = await api.get('/users/orders', getTgHeader(telegramId));
    const orders = res.data.orders || [];

    if (orders.length === 0) {
      await ctx.reply(
        '📦 You have no past orders yet.',
        Markup.inlineKeyboard([
          [Markup.button.callback('🛍️ Start Shopping', 'cmd_categories')],
          [Markup.button.webApp('📱 Open Mini App Store', MINI_APP_URL)]
        ])
      );
      return;
    }

    let text = `📦 *Your Recent Orders:*\n\n`;
    const buttons: any[] = [];

    orders.slice(0, 10).forEach((ord: any, idx: number) => {
      const statusIcon = ord.status === 'PAID' || ord.status === 'DELIVERED' ? '✅' : ord.status === 'PENDING' ? '⏳' : '❌';
      text += `${idx + 1}. *${ord.orderNumber}* (${statusIcon} ${ord.status})\n`;
      text += `   Items: ${ord.items?.length || 1} | Total: $${ord.payableAmount?.toFixed(2) || '0.00'}\n`;
      buttons.push([Markup.button.callback(`View ${ord.orderNumber}`, `view_ord_${ord._id}`)]);
    });

    buttons.push([Markup.button.webApp('📱 View Full Hub in Mini App', MINI_APP_URL)]);
    buttons.push([Markup.button.callback('🔙 Main Menu', 'cmd_menu')]);

    await ctx.replyWithMarkdown(text, Markup.inlineKeyboard(buttons));
  } catch (err: any) {
    await ctx.reply('Error loading orders: ' + err.message);
  }
}

// View specific order & view delivered items
bot.action(/view_ord_(.+)/, async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const orderId = ctx.match[1];
    const res = await api.get(`/deliveries/order/${orderId}`);
    const delivery = res.data.delivery;

    if (!delivery) {
      await ctx.reply('Delivery is still pending or payment has not been received.');
      return;
    }

    let text = `🎁 *Digital Delivery for Order:*\n\n`;
    delivery.items.forEach((item: any, i: number) => {
      text += `*${i + 1}. ${item.productName}*\n`;
      text += `${item.deliveredContent}\n\n`;
    });

    await ctx.replyWithMarkdown(text, Markup.inlineKeyboard([
      [Markup.button.callback('🔙 Back to Orders', 'cmd_orders')]
    ]));
  } catch (err: any) {
    await ctx.reply('Error viewing delivery details: ' + (err.response?.data?.message || err.message));
  }
});

// 10. Referral System
bot.command('referral', async (ctx) => {
  await showReferral(ctx);
});

bot.action('cmd_referral', async (ctx) => {
  await ctx.answerCbQuery();
  await showReferral(ctx);
});

async function showReferral(ctx: any) {
  const telegramId = ctx.from.id;
  try {
    const res = await api.get('/users/profile', getTgHeader(telegramId));
    const user = res.data.user;

    const botUser = ctx.botInfo?.username || 'StoreProKHQRBot';
    const refLink = `https://t.me/${botUser}?start=ref_${telegramId}`;

    let msg = `🎁 *Customer Referral Program*\n\n`;
    msg += `Share your referral link with friends and fellow developers!\n\n`;
    msg += `🔗 *Your Personal Referral Link:*\n\`${refLink}\`\n\n`;
    msg += `📊 *Your Referral Stats:*\n`;
    msg += `• Total Friends Invited: *${user.referralCount || 0}*\n`;
    msg += `• Total Orders: *${user.totalOrders || 0}*\n\n`;
    msg += `Spread the word and enjoy exclusive coupons on your future purchases!`;

    await ctx.replyWithMarkdown(
      msg,
      Markup.inlineKeyboard([
        [Markup.button.url('📲 Share Link', `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent('Check out Telegram Digital Store Pro!')}`)],
        [Markup.button.callback('🔙 Main Menu', 'cmd_menu')]
      ])
    );
  } catch (err: any) {
    await ctx.reply('Error loading referral info: ' + err.message);
  }
}

// 11. Customer Support
bot.command('support', async (ctx) => {
  await showSupport(ctx);
});

bot.action('cmd_support', async (ctx) => {
  await ctx.answerCbQuery();
  await showSupport(ctx);
});

async function showSupport(ctx: any) {
  const supportText =
    `💬 *Customer Support & Assistance*\n\n` +
    `Need help with a product, payment verification, or license key?\n\n` +
    `🕒 *Support Hours:* 24/7 Mon - Sun\n` +
    `👤 *Direct Telegram Contact:* @StoreProSupport\n` +
    `📢 *Updates Channel:* @StoreProAnnouncements\n\n` +
    `When contacting support, please have your *Order Number* ready.`;

  await ctx.replyWithMarkdown(
    supportText,
    Markup.inlineKeyboard([
      [Markup.button.url('💬 Contact Support Agent', 'https://t.me/StoreProSupport')],
      [Markup.button.callback('🔙 Main Menu', 'cmd_menu')]
    ])
  );
}

// 12. Main Menu Action
bot.action('cmd_menu', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply(
    '📱 *Main Menu*',
    Markup.inlineKeyboard([
      [Markup.button.webApp('🛍️ Open Store (Mini App)', MINI_APP_URL)],
      [
        Markup.button.callback('📂 Browse Categories', 'cmd_categories'),
        Markup.button.callback('🛒 My Cart', 'cmd_cart')
      ],
      [
        Markup.button.callback('📦 My Orders', 'cmd_orders'),
        Markup.button.callback('🎁 Referral', 'cmd_referral')
      ],
      [Markup.button.callback('💬 Support', 'cmd_support')]
    ])
  );
});

// Launch Bot
if (process.env.NODE_ENV !== 'test' && BOT_TOKEN && !BOT_TOKEN.startsWith('0000000000')) {
  bot.launch()
    .then(() => {
      console.log('🤖 [TelegramBot] Customer Telegram Bot successfully started and listening for commands.');
    })
    .catch((err) => {
      console.error('❌ [TelegramBot] Failed to launch bot:', err.message);
    });

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}
