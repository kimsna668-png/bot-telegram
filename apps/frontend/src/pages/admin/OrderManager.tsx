import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Filter, CheckCircle2, Clock, XCircle, RefreshCw } from 'lucide-react';
import { api } from '../../services/api.js';

export const OrderManager: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      let url = '/admin/orders?';
      if (statusFilter) url += `status=${statusFilter}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;
      const res = await api.get(url);
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status: newStatus });
      loadOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Order Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time orders, payment status reconciliation and fulfillment control.
          </p>
        </div>
        <button
          onClick={loadOrders}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-950 hover:bg-purple-900 border border-purple-800/50 text-purple-200 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-[#140826] p-3 rounded-2xl border border-purple-800/40">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-purple-400" />
          <input
            type="text"
            placeholder="Search order number or telegram ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadOrders()}
            className="w-full bg-purple-950/70 border border-purple-800/40 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-purple-950/70 border border-purple-800/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="PAID">PAID</option>
          <option value="DELIVERED">DELIVERED</option>
          <option value="PENDING">PENDING</option>
          <option value="EXPIRED">EXPIRED</option>
          <option value="REFUNDED">REFUNDED</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-[#140826] border border-purple-800/40 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-purple-900/50 bg-purple-950/40 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Order Number</th>
                <th className="py-3.5 px-4">Telegram ID</th>
                <th className="py-3.5 px-4">Items Summary</th>
                <th className="py-3.5 px-4">Payable</th>
                <th className="py-3.5 px-4">Order Status</th>
                <th className="py-3.5 px-4">Delivery Status</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 text-right">Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-900/30">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord._id} className="hover:bg-purple-900/20 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-white">{ord.orderNumber}</td>
                    <td className="py-3.5 px-4 text-purple-300 font-medium">TG: {ord.telegramId}</td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {ord.items.map((i: any) => `${i.quantity}x ${i.productName}`).join(', ')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      {ord.currency === 'USD'
                        ? `$${ord.payableAmount.toFixed(2)}`
                        : `${ord.payableAmount.toLocaleString()} ៛`}
                    </td>
                    <td className="py-3.5 px-4">
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
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] text-slate-400 font-medium">{ord.deliveryStatus}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(ord.createdAt).toLocaleDateString()} {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <select
                        value={ord.status}
                        onChange={(e) => handleUpdateStatus(ord._id, e.target.value)}
                        className="bg-purple-950 border border-purple-800/50 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="PAID">PAID</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="CANCELLED">CANCELLED</option>
                        <option value="REFUNDED">REFUNDED</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
