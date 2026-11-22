import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Users,
  Package,
  TrendingUp,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { api } from '../../services/api.js';

export const DashboardOverview: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await api.get('/admin/dashboard/stats');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard stats', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-purple-900/40 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-purple-950/40 rounded-2xl border border-purple-900/30" />
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats;

  const statCards = [
    {
      label: 'Total Revenue (USD)',
      value: `$${stats?.totalRevenueUSD?.toFixed(2) || '0.00'}`,
      subtitle: `${stats?.totalRevenueKHR?.toLocaleString() || 0} ៛ KHR`,
      icon: DollarSign,
      color: 'from-purple-600 to-indigo-600'
    },
    {
      label: 'Paid Orders',
      value: stats?.paidOrders || 0,
      subtitle: `${stats?.pendingOrders || 0} pending payment`,
      icon: CheckCircle2,
      color: 'from-emerald-600 to-teal-600'
    },
    {
      label: 'Total Customers',
      value: stats?.totalCustomers || 0,
      subtitle: 'Registered Telegram Users',
      icon: Users,
      color: 'from-blue-600 to-cyan-600'
    },
    {
      label: 'Active Products',
      value: stats?.totalProducts || 0,
      subtitle: `${stats?.conversionRate || 0}% Conversion Rate`,
      icon: Package,
      color: 'from-amber-600 to-orange-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Dashboard Overview</h1>
        <p className="text-xs text-slate-400 mt-1">
          Real-time metrics, automated Bakong KHQR collections and digital product deliveries.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-[#140826] border border-purple-800/40 shadow-xl flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-semibold text-slate-400">{card.label}</span>
                <div className="text-2xl font-black text-white tracking-tight mt-1">{card.value}</div>
                <div className="text-[11px] text-purple-300 font-medium mt-0.5">{card.subtitle}</div>
              </div>
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${card.color} flex items-center justify-center text-white shadow-lg`}
              >
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout: Recent Orders & Best Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table (2 Cols) */}
        <div className="lg:col-span-2 bg-[#140826] border border-purple-800/40 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-purple-400" />
              <span>Recent Customer Orders</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-purple-900/40 text-slate-400 font-semibold">
                  <th className="pb-3">Order Number</th>
                  <th className="pb-3">Telegram ID</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-900/30">
                {data?.recentOrders?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      No orders yet.
                    </td>
                  </tr>
                ) : (
                  data?.recentOrders?.map((ord: any) => (
                    <tr key={ord._id} className="hover:bg-purple-900/20 transition-colors">
                      <td className="py-3 font-mono font-bold text-white">{ord.orderNumber}</td>
                      <td className="py-3 text-slate-300">{ord.telegramId}</td>
                      <td className="py-3 font-semibold text-purple-300">
                        {ord.currency === 'USD'
                          ? `$${ord.payableAmount.toFixed(2)}`
                          : `${ord.payableAmount.toLocaleString()} ៛`}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ord.status === 'PAID' || ord.status === 'DELIVERED'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : ord.status === 'PENDING'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400">
                        {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Best Selling Digital Products (1 Col) */}
        <div className="bg-[#140826] border border-purple-800/40 rounded-2xl p-5 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Top Performing Products</span>
          </h3>

          <div className="space-y-3">
            {data?.bestSellers?.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No sales recorded yet.</p>
            ) : (
              data?.bestSellers?.map((prod: any, idx: number) => (
                <div
                  key={prod._id}
                  className="p-3 rounded-xl bg-purple-950/60 border border-purple-800/30 flex items-center gap-3"
                >
                  <span className="w-6 text-center font-black text-sm text-purple-400">#{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{prod.name}</h4>
                    <span className="text-[10px] text-slate-400">{prod.productType}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400">{prod.salesCount} sold</span>
                    <div className="text-[10px] text-slate-400">${prod.priceUSD.toFixed(2)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
