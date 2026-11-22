import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Calendar, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api.js';
import type { ICoupon } from '@telegram-store/types';

export const CouponManager: React.FC = () => {
  const [coupons, setCoupons] = useState<ICoupon[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValueUSD: 10,
    discountValueKHR: 41000,
    minOrderUSD: 10,
    minOrderKHR: 41000,
    usageLimit: 100,
    validFrom: new Date().toISOString().split('T')[0],
    validTo: '2030-12-31',
    isActive: true
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      const res = await api.get('/admin/coupons');
      setCoupons(res.data.coupons || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/coupons', formData);
      setIsModalOpen(false);
      loadCoupons();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating coupon');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete coupon?')) return;
    try {
      await api.delete(`/admin/coupons/${id}`);
      loadCoupons();
    } catch (err: any) {
      alert('Error deleting coupon');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Promotional Coupons</h1>
          <p className="text-xs text-slate-400 mt-1">
            Create discount codes for marketing campaigns, influencers and holiday sales.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30"
        >
          <Plus className="w-4 h-4" />
          <span>New Coupon</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((coupon) => (
          <div
            key={coupon._id}
            className="p-5 rounded-2xl bg-[#140826] border border-purple-800/40 shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-3 py-1 rounded-lg bg-purple-900/60 border border-purple-700/50 text-white font-mono font-black text-sm tracking-wider">
                  {coupon.code}
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  {coupon.discountType === 'percentage'
                    ? `${coupon.discountValueUSD}% OFF`
                    : `$${coupon.discountValueUSD} OFF`}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Min Order: ${coupon.minOrderUSD || 0} • Used: {coupon.usedCount} / {coupon.usageLimit}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-purple-900/40 text-[11px] text-slate-500">
              <span>Expires {new Date(coupon.validTo).toLocaleDateString()}</span>
              <button
                onClick={() => handleDelete(coupon._id)}
                className="text-slate-400 hover:text-red-400 p-1 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#140826] border border-purple-800/50 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Create Promo Coupon</h2>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Coupon Code</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. FLASH20"
                  className="w-full bg-purple-950/70 border border-purple-800/40 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Discount Type</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full bg-purple-950/70 border border-purple-800/40 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Value (USD)</label>
                  <input
                    type="number"
                    required
                    value={formData.discountValueUSD}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      setFormData({ ...formData, discountValueUSD: v, discountValueKHR: Math.round(v * 4100) });
                    }}
                    className="w-full bg-purple-950/70 border border-purple-800/40 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Min Order ($)</label>
                  <input
                    type="number"
                    value={formData.minOrderUSD}
                    onChange={(e) => setFormData({ ...formData, minOrderUSD: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-purple-950/70 border border-purple-800/40 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Usage Limit</label>
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value, 10) || 1 })}
                    className="w-full bg-purple-950/70 border border-purple-800/40 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Valid Until</label>
                <input
                  type="date"
                  value={formData.validTo}
                  onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                  className="w-full bg-purple-950/70 border border-purple-800/40 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-purple-900/50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-purple-950 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-purple-600 text-white font-bold">
                  Create Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
