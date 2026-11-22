import React, { useState } from 'react';
import { X, Trash2, ArrowRight, Tag, AlertCircle, ShoppingBag } from 'lucide-react';
import { useStore } from '../../context/StoreContext.js';
import { api } from '../../services/api.js';

interface Props {
  onCheckoutSuccess: (order: any, payment: any) => void;
}

export const CartDrawer: React.FC<Props> = ({ onCheckoutSuccess }) => {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    removeFromCart,
    updateQuantity,
    currency,
    cartTotalUSD,
    cartTotalKHR,
    clearCart
  } = useStore();

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponError, setCouponError] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  if (!isCartOpen) return null;

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponError('');
    try {
      const res = await api.get(`/coupons/verify/${couponInput.trim()}`);
      if (res.data.success) {
        setAppliedCoupon(res.data.coupon);
      }
    } catch (err: any) {
      setCouponError(err.response?.data?.message || 'Invalid coupon code');
      setAppliedCoupon(null);
    }
  };

  // Calculate discounts
  let discountUSD = 0;
  let discountKHR = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      discountUSD = (cartTotalUSD * appliedCoupon.discountValueUSD) / 100;
      discountKHR = (cartTotalKHR * appliedCoupon.discountValueKHR) / 100;
    } else {
      discountUSD = appliedCoupon.discountValueUSD;
      discountKHR = appliedCoupon.discountValueKHR;
    }
  }

  const payableUSD = Math.max(0, cartTotalUSD - discountUSD);
  const payableKHR = Math.max(0, cartTotalKHR - discountKHR);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);
    try {
      const items = cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity
      }));

      const res = await api.post('/orders', {
        items,
        currency,
        couponCode: appliedCoupon?.code
      });

      if (res.data.success) {
        clearCart();
        setIsCartOpen(false);
        onCheckoutSuccess(res.data.order, res.data.payment);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating order');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#140826] border-l border-purple-800/40 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-purple-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-bold text-white">Your Cart</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900/80 text-purple-300 font-semibold">
                {cart.length}
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-purple-900/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16 text-slate-400 flex flex-col items-center">
                <ShoppingBag className="w-12 h-12 text-purple-900 mb-3" />
                <p className="text-sm font-medium">Your cart is currently empty</p>
                <p className="text-xs text-slate-500 mt-1">Browse our catalog to add digital products</p>
              </div>
            ) : (
              cart.map((item) => {
                const price =
                  currency === 'USD'
                    ? (item.product.discountPriceUSD ?? item.product.priceUSD)
                    : (item.product.discountPriceKHR ?? item.product.priceKHR);
                const subtotal = price * item.quantity;

                return (
                  <div
                    key={item.productId}
                    className="p-3.5 rounded-xl bg-purple-950/60 border border-purple-800/30 flex gap-3.5 items-center"
                  >
                    <img
                      src={item.product.images[0] || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=150&q=80'}
                      alt={item.product.name}
                      className="w-16 h-16 rounded-lg object-cover bg-purple-900 flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-white truncate">{item.product.name}</h4>
                      <div className="text-xs text-purple-300 mt-0.5 font-medium">
                        {currency === 'USD' ? `$${price.toFixed(2)}` : `${price.toLocaleString()} ៛`}
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center bg-purple-900/50 rounded-lg px-2 py-0.5 border border-purple-800/40">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="text-xs text-purple-300 hover:text-white px-1"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold text-white px-2">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="text-xs text-purple-300 hover:text-white px-1"
                          >
                            +
                          </button>
                        </div>

                        <span className="text-xs font-semibold text-slate-300 ml-auto">
                          {currency === 'USD' ? `$${subtotal.toFixed(2)}` : `${subtotal.toLocaleString()} ៛`}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Checkout */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-purple-900/50 bg-[#10061e] space-y-4">
              {/* Promo Code Input */}
              <div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 absolute left-3 top-3 text-purple-400" />
                    <input
                      type="text"
                      placeholder="Promo Code (e.g. WELCOME10)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="w-full bg-purple-950/70 border border-purple-800/40 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <button
                    onClick={handleApplyCoupon}
                    className="px-3.5 py-2 bg-purple-800 hover:bg-purple-700 text-xs font-semibold text-white rounded-xl transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {couponError && (
                  <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {couponError}
                  </p>
                )}
                {appliedCoupon && (
                  <p className="text-[11px] text-emerald-400 mt-1">
                    ✓ Coupon {appliedCoupon.code} applied!
                  </p>
                )}
              </div>

              {/* Totals */}
              <div className="space-y-1.5 text-xs text-slate-300 border-t border-purple-900/40 pt-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{currency === 'USD' ? `$${cartTotalUSD.toFixed(2)}` : `${cartTotalKHR.toLocaleString()} ៛`}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-400 font-medium">
                    <span>Discount</span>
                    <span>-{currency === 'USD' ? `$${discountUSD.toFixed(2)}` : `${discountKHR.toLocaleString()} ៛`}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-white pt-1">
                  <span>Payable</span>
                  <span className="text-purple-400">
                    {currency === 'USD' ? `$${payableUSD.toFixed(2)}` : `${payableKHR.toLocaleString()} ៛`}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isCheckingOut ? (
                  <span>Generating Bakong KHQR...</span>
                ) : (
                  <>
                    <span>Pay with Bakong KHQR</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
