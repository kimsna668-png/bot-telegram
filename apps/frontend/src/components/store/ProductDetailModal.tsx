import React, { useState } from 'react';
import { X, ShoppingCart, Zap, Star, ShieldCheck, Download, Key, ExternalLink } from 'lucide-react';
import type { IProduct } from '@telegram-store/types';
import { useStore } from '../../context/StoreContext.js';

interface Props {
  product: IProduct | null;
  onClose: () => void;
  onInstantBuy: (product: IProduct, quantity: number) => void;
}

export const ProductDetailModal: React.FC<Props> = ({ product, onClose, onInstantBuy }) => {
  const { currency, addToCart } = useStore();
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const price = currency === 'USD' ? (product.discountPriceUSD ?? product.priceUSD) : (product.discountPriceKHR ?? product.priceKHR);
  const originalPrice = currency === 'USD' ? product.priceUSD : product.priceKHR;
  const hasDiscount = currency === 'USD' ? !!product.discountPriceUSD : !!product.discountPriceKHR;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    onClose();
  };

  const getDeliveryIcon = () => {
    switch (product.deliveryMethod) {
      case 'instant_license':
        return <Key className="w-4 h-4 text-amber-400" />;
      case 'secure_download':
        return <Download className="w-4 h-4 text-blue-400" />;
      case 'private_link':
        return <ExternalLink className="w-4 h-4 text-emerald-400" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-[#140826] border border-purple-800/50 rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="relative h-56 sm:h-64 bg-purple-950 overflow-hidden flex-shrink-0">
          <img
            src={product.images[0] || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80'}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#140826] via-transparent to-black/40" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-purple-600/80 text-white backdrop-blur-md">
              {product.productType.replace('_', ' ')}
            </span>
            <div className="flex items-center gap-1 bg-black/60 px-2.5 py-1 rounded-full text-amber-400 text-xs font-medium backdrop-blur-md">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{product.rating || 5}.0</span>
              <span className="text-slate-400">({product.salesCount || 0} sold)</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-bold text-white leading-snug">{product.name}</h2>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-extrabold text-purple-400">
                {currency === 'USD' ? `$${price.toFixed(2)}` : `${price.toLocaleString()} ៛`}
              </span>
              {hasDiscount && (
                <span className="text-sm text-slate-500 line-through">
                  {currency === 'USD' ? `$${originalPrice.toFixed(2)}` : `${originalPrice.toLocaleString()} ៛`}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-900/30 border border-purple-800/40 text-xs text-purple-200">
            {getDeliveryIcon()}
            <span>
              <strong>Delivery:</strong> {product.deliveryMethod.replace('_', ' ').toUpperCase()} — automated instant delivery after scan
            </span>
          </div>

          <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line border-t border-purple-900/50 pt-3">
            {product.description}
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center justify-between border-t border-purple-900/50 pt-4 mt-auto">
            <span className="text-sm font-medium text-slate-400">Quantity</span>
            <div className="flex items-center gap-3 bg-purple-900/40 border border-purple-800/50 rounded-xl px-3 py-1.5">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="text-purple-300 hover:text-white font-bold text-lg px-1"
              >
                -
              </button>
              <span className="font-semibold text-white min-w-[20px] text-center">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="text-purple-300 hover:text-white font-bold text-lg px-1"
              >
                +
              </button>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleAddToCart}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-900/60 hover:bg-purple-800/80 border border-purple-700/50 text-purple-200 font-semibold text-sm transition-all shadow-md active:scale-[0.98]"
            >
              <ShoppingCart className="w-4 h-4" />
              Add to Cart
            </button>
            <button
              onClick={() => onInstantBuy(product, quantity)}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-600/30 active:scale-[0.98]"
            >
              <Zap className="w-4 h-4 fill-current" />
              Instant Buy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
