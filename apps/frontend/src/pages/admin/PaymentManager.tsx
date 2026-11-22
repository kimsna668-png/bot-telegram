import React, { useState, useEffect } from 'react';
import { CreditCard, Search, CheckCircle2, Clock, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { api } from '../../services/api.js';

export const PaymentManager: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [verifyingRef, setVerifyingRef] = useState<string | null>(null);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/payments');
      setPayments(res.data.payments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualVerify = async (transactionRef: string) => {
    setVerifyingRef(transactionRef);
    try {
      const res = await api.post(`/payments/verify/${transactionRef}`);
      alert(res.data.verification?.message || (res.data.success ? 'Payment verified successfully!' : 'Payment pending on Bakong network'));
      loadPayments();
    } catch (err: any) {
      alert('Error verifying payment: ' + (err.response?.data?.message || err.message));
    } finally {
      setVerifyingRef(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">KHQR Payment Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Audit Bakong dynamic QR transactions, MD5 hashes, and live network confirmations.
          </p>
        </div>
        <button
          onClick={loadPayments}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-950 hover:bg-purple-900 border border-purple-800/50 text-purple-200 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Transactions</span>
        </button>
      </div>

      {/* Payments Table */}
      <div className="bg-[#140826] border border-purple-800/40 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-purple-900/50 bg-purple-950/40 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Transaction Ref</th>
                <th className="py-3.5 px-4">Order / Customer</th>
                <th className="py-3.5 px-4">Amount & Currency</th>
                <th className="py-3.5 px-4">Provider / Engine</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Bakong / MD5 Hash</th>
                <th className="py-3.5 px-4">Verification Attempts</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-900/30">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                payments.map((pay) => (
                  <tr key={pay._id} className="hover:bg-purple-900/20 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-white select-all">{pay.transactionRef}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{pay.orderId?.orderNumber || '—'}</div>
                      <div className="text-[10px] text-purple-300">TG: {pay.telegramId}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      {pay.currency === 'USD' ? `$${pay.amount.toFixed(2)}` : `${pay.amount.toLocaleString()} ៛`}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] text-slate-300 font-medium">{pay.provider}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          pay.status === 'SUCCESS'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : pay.status === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {pay.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[10px] text-slate-400 max-w-[150px] truncate select-all">
                      {pay.bakongHash || pay.md5Hash || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{pay.verificationAttempts}</td>
                    <td className="py-3.5 px-4 text-right">
                      {pay.status === 'PENDING' && (
                        <button
                          onClick={() => handleManualVerify(pay.transactionRef)}
                          disabled={verifyingRef === pay.transactionRef}
                          className="px-2.5 py-1 rounded-lg bg-purple-700 hover:bg-purple-600 text-white font-bold text-[11px] transition-colors"
                        >
                          {verifyingRef === pay.transactionRef ? 'Checking...' : 'Verify Now'}
                        </button>
                      )}
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
