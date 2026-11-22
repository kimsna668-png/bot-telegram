import axios from 'axios';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe?: any;
        ready: () => void;
        expand: () => void;
        close: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        BackButton?: {
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
        };
      };
    };
  }
}

export const api = axios.create({
  baseURL: '/api',
  timeout: 15000
});

// Request interceptor to attach Telegram WebApp initData or Admin Token
api.interceptors.request.use((config) => {
  // Check if Telegram WebApp is present
  const tgInitData = window.Telegram?.WebApp?.initData;
  if (tgInitData) {
    config.headers['x-telegram-init-data'] = tgInitData;
  } else {
    // Fallback demo Telegram ID for browser testing
    const savedTgId = localStorage.getItem('demo_telegram_id') || '789123456';
    config.headers['x-telegram-id'] = savedTgId;
  }

  // Check if Admin JWT token is present
  const adminToken = localStorage.getItem('admin_token');
  if (adminToken) {
    config.headers['Authorization'] = `Bearer ${adminToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname.startsWith('/admin') && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('admin_token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);
