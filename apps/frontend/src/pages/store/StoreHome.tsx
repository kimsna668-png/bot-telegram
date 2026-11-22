import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  Zap,
  Star,
  Package,
  Key,
  Download,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  User,
  ShoppingBag,
  Clock
} from 'lucide-react';
import { useStore } from '../../context/StoreContext.js';
import { api } from '../../services/api.js';
import type { IProduct, ICategory } from '@telegram-store/types';
import { ProductDetailModal } from '../../components/store/ProductDetailModal.js';
import { CartDrawer } from '../../components/store/CartDrawer.js';
import { KHQRModal } from '../../components/store/KHQRModal.js';

export const StoreHome: React.FC = () => {
  const {
    currency,
    setCurrency,
    cartCount,
    setIsCartOpen,
    addToCart,
    activePayment,
    setActivePayment,
    user
  } = useStore();

  const [categories, setCategories] = useState<ICategory[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);

  useEffect(() => {
    // Notify Telegram Mini App is ready
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      try {
        window.Telegram.WebApp.setHeaderColor('#0b0517');
        window.Telegram.WebApp.setBackgroundColor('#0b0517');
      } catch (e) {}
    }

    loadInitialData();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, searchQuery]);

  const loadInitialData = async () => {
    try {
      const catRes = await api.get('/categories');
      setCategories(catRes.data.categories || []);
    } catch (e) {
      console.error('Failed to load categories', e);
    }
  };

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      let url = '/products?';
      if (selectedCategory !== 'all') {
        url += `category=${selectedCategory}&`;
      }
      if (searchQuery.trim()) {
        url += `search=${encodeURIComponent(searchQuery.trim())}&`;
      }
      const res = await api.get(url);
      setProducts(res.data.products || []);
    } catch (e) {
      console.error('Failed to load products', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstantBuy = async (product: IProduct, quantity: number = 1) => {
    setSelectedProduct(null);
    try {
      const res = await api.post('/orders', {
        items: [{ productId: product._id, quantity }],
        currency
      });

      if (res.data.success) {
        setActivePayment(res.data.payment);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error processing instant purchase');
    }
  };

  const handleCheckoutSuccess = (order: any, payment: any) => {
    setActivePayment(payment);
  };

  return (
    <div className="min-h-screen bg-[#0b0517] text-slate-100 flex flex-col pb-24">
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 bg-[#10061e]/90 backdrop-blur-md border-b border-purple-900/40 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-600/30">
              <Zap className="w-5 h-5 text-white fill-current" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-white leading-none">
                STORE<span className="text-purple-400">PRO</span>
              </h1>
              <span className="text-[10px] text-purple-300 font-medium">Bakong KHQR Instant</span>
            </div>
          </div>

          {/* Right Tools: Currency Toggle, Orders link, Cart */}
          <div className="flex items-center gap-2">
            {/* Currency Pill */}
            <div className="flex bg-purple-950 border border-purple-800/40 rounded-xl p-0.5 text-xs font-semibold">
              <button
                onClick={() => setCurrency('USD')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  currency === 'USD' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                USD $
              </button>
              <button
                onClick={() => setCurrency('KHR')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  currency === 'KHR' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                KHR ៛
              </button>
            </div>

            {/* My Orders Button */}
            <Link
              to="/store/orders"
              className="p-2 rounded-xl bg-purple-950/80 border border-purple-800/40 text-purple-300 hover:text-white transition-colors"
              title="My Orders & Downloads"
            >
              <ShoppingBag className="w-5 h-5" />
            </Link>

            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30 active:scale-95 transition-transform"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 text-purple-950 font-black text-[11px] flex items-center justify-center shadow">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="max-w-4xl mx-auto mt-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-purple-400" />
            <input
              type="text"
              placeholder="Search products, software, license keys..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-purple-950/60 border border-purple-800/40 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto w-full px-4 pt-4 flex-1 flex flex-col gap-5">
        {/* Hero Card */}
        <div className="relative rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-950 to-purple-900 border border-purple-700/40 p-4 sm:p-5 overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-sm">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[11px] font-semibold border border-purple-500/30 mb-2">
              <Sparkles className="w-3 h-3 text-amber-400" /> Automated KHQR Payments
            </span>
            <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
              Instant Digital Goods Delivered In Seconds
            </h2>
            <p className="text-xs text-purple-200/80 mt-1">
              Scan with any banking app. No screenshot submission needed.
            </p>
          </div>
        </div>

        {/* Categories Scroller */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedCategory === 'all'
                ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-600/30'
                : 'bg-purple-950/60 border-purple-800/40 text-slate-300 hover:text-white'
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedCategory === cat.slug
                  ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-600/30'
                  : 'bg-purple-950/60 border-purple-800/40 text-slate-300 hover:text-white'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Catalog Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-purple-950/40 animate-pulse border border-purple-900/30" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Package className="w-12 h-12 text-purple-900 mx-auto mb-2" />
              <p className="text-sm font-semibold">No digital products found</p>
              <p className="text-xs text-slate-500 mt-0.5">Try searching for a different keyword or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {products.map((product) => {
                const price =
                  currency === 'USD'
                    ? (product.discountPriceUSD ?? product.priceUSD)
                    : (product.discountPriceKHR ?? product.priceKHR);
                const originalPrice = currency === 'USD' ? product.priceUSD : product.priceKHR;
                const hasDiscount = currency === 'USD' ? !!product.discountPriceUSD : !!product.discountPriceKHR;

                return (
                  <div
                    key={product._id}
                    onClick={() => setSelectedProduct(product)}
                    className="group bg-[#140826] hover:bg-[#1a0b32] border border-purple-800/40 hover:border-purple-600/60 rounded-2xl overflow-hidden shadow-lg transition-all cursor-pointer flex flex-col active:scale-[0.98]"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-[4/3] bg-purple-950 overflow-hidden">
                      <img
                        src={product.images[0] || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {hasDiscount && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-purple-600 text-[10px] font-black text-white shadow">
                          SALE
                        </span>
                      )}
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-semibold text-purple-200">
                        {product.deliveryMethod === 'instant_license' ? 'KEY' : 'FILE'}
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between gap-2">
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-purple-300 transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">
                          {product.shortDescription || product.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-purple-900/40 flex items-end justify-between">
                        <div>
                          <div className="text-sm font-black text-white">
                            {currency === 'USD' ? `$${price.toFixed(2)}` : `${price.toLocaleString()} ៛`}
                          </div>
                          {hasDiscount && (
                            <div className="text-[10px] text-slate-500 line-through">
                              {currency === 'USD' ? `$${originalPrice.toFixed(2)}` : `${originalPrice.toLocaleString()} ៛`}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product, 1);
                          }}
                          className="p-2 rounded-xl bg-purple-900/60 hover:bg-purple-600 text-purple-200 hover:text-white transition-colors border border-purple-700/50"
                          title="Add to cart"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Floating Bottom Nav for Mini App */}
      <nav className="fixed bottom-0 inset-x-0 bg-[#10061e]/95 backdrop-blur-md border-t border-purple-900/40 py-2.5 px-6 z-40">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <Link to="/store" className="flex flex-col items-center gap-1 text-purple-400 font-semibold text-[10px]">
            <Zap className="w-5 h-5 fill-current" />
            <span>Store</span>
          </Link>
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-white font-medium text-[10px]"
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-purple-600 text-white font-bold text-[9px] flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            <span>Cart</span>
          </button>
          <Link
            to="/store/orders"
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-white font-medium text-[10px]"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Orders</span>
          </Link>
          <a
            href="https://t.me/StoreProSupport"
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-white font-medium text-[10px]"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Support</span>
          </a>
        </div>
      </nav>

      {/* Modals */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onInstantBuy={handleInstantBuy}
      />

      <CartDrawer onCheckoutSuccess={handleCheckoutSuccess} />

      <KHQRModal
        paymentData={activePayment}
        onClose={() => setActivePayment(null)}
        onPaymentSuccess={() => {
          // Can refresh orders or load celebration
        }}
      />
    </div>
  );
};
