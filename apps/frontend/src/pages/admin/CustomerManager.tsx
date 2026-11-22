import React, { useState, useEffect } from 'react';
import { Users, Search, ShieldBan, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api.js';

export const CustomerManager: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const res = await api.get('/admin/customers');
      setCustomers(res.data.customers || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleBlock = async (id: string) => {
    try {
      await api.put(`/admin/customers/${id}/toggle-block`);
      loadCustomers();
    } catch (err: any) {
      alert('Error updating user');
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.telegramId.toString().includes(search) ||
      (c.username && c.username.toLowerCase().includes(search.toLowerCase())) ||
      (c.firstName && c.firstName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Customer Management</h1>
        <p className="text-xs text-slate-400 mt-1">
          Registered Telegram customers, spending statistics, and account access.
        </p>
      </div>

      <div className="flex items-center gap-3 bg-[#140826] p-3 rounded-2xl border border-purple-800/40">
        <Search className="w-4 h-4 text-purple-400 ml-2" />
        <input
          type="text"
          placeholder="Search by Telegram ID, username, or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none flex-1"
        />
      </div>

      <div className="bg-[#140826] border border-purple-800/40 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-purple-900/50 bg-purple-950/40 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Telegram ID</th>
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Username</th>
                <th className="py-3.5 px-4">Referral Code</th>
                <th className="py-3.5 px-4">Orders Placed</th>
                <th className="py-3.5 px-4">Total Spent (USD)</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4 text-right">Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-900/30">
              {filtered.map((c) => (
                <tr key={c._id} className="hover:bg-purple-900/20 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-white select-all">{c.telegramId}</td>
                  <td className="py-3.5 px-4 font-semibold text-white">{c.firstName} {c.lastName || ''}</td>
                  <td className="py-3.5 px-4 text-purple-300">
                    {c.username ? `@${c.username}` : '—'}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">{c.referralCode}</td>
                  <td className="py-3.5 px-4 font-semibold text-white">{c.totalOrders || 0}</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-400">
                    ${c.totalSpentUSD?.toFixed(2) || '0.00'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.isBlocked ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {c.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleToggleBlock(c._id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        c.isBlocked
                          ? 'bg-emerald-950 text-emerald-300 hover:bg-emerald-900'
                          : 'bg-red-950 text-red-300 hover:bg-red-900'
                      }`}
                    >
                      {c.isBlocked ? 'Unblock' : 'Block'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
