import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  Key,
  ShoppingBag,
  CreditCard,
  Users,
  Tag,
  Settings,
  FileText,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Shield,
  Zap,
  Activity
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext.js';

export const AdminLayout: React.FC = () => {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Products', path: '/admin/products', icon: Package },
    { label: 'Categories', path: '/admin/categories', icon: Layers },
    { label: 'License Keys & Pool', path: '/admin/license-keys', icon: Key },
    { label: 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { label: 'KHQR Payments', path: '/admin/payments', icon: CreditCard },
    { label: 'Customers', path: '/admin/customers', icon: Users },
    { label: 'Coupons', path: '/admin/coupons', icon: Tag },
    { label: 'Bot & KHQR Settings', path: '/admin/settings', icon: Settings },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: Activity }
  ];

  return (
    <div className="min-h-screen bg-[#0b0517] text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-[#10061e] border-b border-purple-900/50 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white fill-current" />
          </div>
          <span className="font-extrabold text-sm text-white">Admin Portal</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-[#10061e] border-r border-purple-900/50 flex flex-col transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="p-5 border-b border-purple-900/40 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/30 flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-black text-white tracking-wide">STORE PRO</div>
            <div className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider">Admin Workspace</div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-3.5 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-purple-900/30'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Storefront Link & Admin Profile */}
        <div className="p-3.5 border-t border-purple-900/40 space-y-2 bg-[#0c0418]">
          <Link
            to="/store"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-purple-950/60 border border-purple-800/40 text-xs font-semibold text-purple-300 hover:text-white transition-colors"
          >
            <span>Open Customer Store</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <div className="flex items-center justify-between pt-1 px-1">
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate">{admin?.username || 'Admin'}</div>
              <div className="text-[10px] text-purple-400 truncate">{admin?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
