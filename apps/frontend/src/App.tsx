import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { StoreHome } from './pages/store/StoreHome.js';
import { StoreOrders } from './pages/store/StoreOrders.js';
import { AdminLogin } from './pages/admin/AdminLogin.js';
import { AdminLayout } from './pages/admin/AdminLayout.js';
import { DashboardOverview } from './pages/admin/DashboardOverview.js';
import { ProductManager } from './pages/admin/ProductManager.js';
import { CategoryManager } from './pages/admin/CategoryManager.js';
import { LicenseKeyManager } from './pages/admin/LicenseKeyManager.js';
import { OrderManager } from './pages/admin/OrderManager.js';
import { PaymentManager } from './pages/admin/PaymentManager.js';
import { CustomerManager } from './pages/admin/CustomerManager.js';
import { CouponManager } from './pages/admin/CouponManager.js';
import { SettingsManager } from './pages/admin/SettingsManager.js';
import { AuditLogsViewer } from './pages/admin/AuditLogsViewer.js';
import { useAdminAuth } from './context/AdminAuthContext.js';

const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0517] flex items-center justify-center text-purple-400">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Customer Storefront (Telegram Mini App) */}
      <Route path="/" element={<Navigate to="/store" replace />} />
      <Route path="/store" element={<StoreHome />} />
      <Route path="/store/orders" element={<StoreOrders />} />

      {/* Admin Portal */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardOverview />} />
        <Route path="products" element={<ProductManager />} />
        <Route path="categories" element={<CategoryManager />} />
        <Route path="license-keys" element={<LicenseKeyManager />} />
        <Route path="orders" element={<OrderManager />} />
        <Route path="payments" element={<PaymentManager />} />
        <Route path="customers" element={<CustomerManager />} />
        <Route path="coupons" element={<CouponManager />} />
        <Route path="settings" element={<SettingsManager />} />
        <Route path="audit-logs" element={<AuditLogsViewer />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/store" replace />} />
    </Routes>
  );
};
export default App;
