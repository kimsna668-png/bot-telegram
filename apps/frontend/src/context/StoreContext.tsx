import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Currency, IProduct } from '@telegram-store/types';
import { api } from '../services/api.js';

export interface CartItem {
  productId: string;
  product: IProduct;
  quantity: number;
}

interface StoreContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  cart: CartItem[];
  addToCart: (product: IProduct, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotalUSD: number;
  cartTotalKHR: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  activePayment: any | null;
  setActivePayment: (p: any | null) => void;
  user: any | null;
  refreshUser: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>('USD');
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('store_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activePayment, setActivePayment] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    localStorage.setItem('store_cart', JSON.stringify(cart));
  }, [cart]);

  const refreshUser = async () => {
    try {
      const res = await api.get('/users/profile');
      setUser(res.data.user);
    } catch (e) {
      // Offline or error
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const addToCart = (product: IProduct, quantity: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product._id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { productId: product._id, product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const cartTotalUSD = Number(
    cart
      .reduce((acc, item) => {
        const price = item.product.discountPriceUSD ?? item.product.priceUSD;
        return acc + price * item.quantity;
      }, 0)
      .toFixed(2)
  );

  const cartTotalKHR = Math.round(
    cart.reduce((acc, item) => {
      const price = item.product.discountPriceKHR ?? item.product.priceKHR;
      return acc + price * item.quantity;
    }, 0)
  );

  return (
    <StoreContext.Provider
      value={{
        currency,
        setCurrency,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotalUSD,
        cartTotalKHR,
        isCartOpen,
        setIsCartOpen,
        activePayment,
        setActivePayment,
        user,
        refreshUser
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
