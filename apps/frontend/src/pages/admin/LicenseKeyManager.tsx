import React, { useState, useEffect } from 'react';
import { Key, Plus, Upload, CheckCircle2, Clock, Trash2, Search, Filter } from 'lucide-react';
import { api } from '../../services/api.js';
import type { IProduct } from '@telegram-store/types';

export const LicenseKeyManager: React.FC = () => {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [keys, setKeys] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [batchText, setBatchText] = useState('');
  const [batchNotes, setBatchNotes] = useState('');
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    loadKeys();
  }, [selectedProductId]);

  const loadProducts = async () => {
    try {
      const res = await api.get('/admin/products');
      const prods = (res.data.products || []).filter(
        (p: any) => p.deliveryMethod === 'instant_license' || p.productType === 'license_key' || p.productType === 'activation_code'
      );
      setProducts(prods);
      if (prods.length > 0) {
        setSelectedProductId(prods[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadKeys = async () => {
    setIsLoading(true);
    try {
      const url = selectedProductId ? `/admin/license-keys?productId=${selectedProductId}` : '/admin/license-keys';
      const res = await api.get(url);
      setKeys(res.data.keys || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !batchText.trim()) return;

    const rawKeys = batchText
      .split('\n')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    try {
      const res = await api.post('/admin/license-keys/batch', {
        productId: selectedProductId,
        keys: rawKeys,
        notes: batchNotes
      });

      setUploadStatus(res.data.message);
      setBatchText('');
      setBatchNotes('');
      setTimeout(() => {
        setIsUploadModalOpen(false);
        setUploadStatus(null);
        loadKeys();
      }, 1500);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error uploading keys');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">License Key Pool & Inventory</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage automated stock of activation codes, serials, and retail keys.
          </p>
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30"
        >
          <Upload className="w-4 h-4" />
          <span>Batch Upload Keys</span>
        </button>
      </div>

      {/* Filter by Product */}
      <div className="flex flex-wrap items-center gap-3 bg-[#140826] p-3 rounded-2xl border border-purple-800/40">
        <label className="text-xs font-semibold text-slate-400 ml-2">Select Product:</label>
        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          className="bg-purple-950/80 border border-purple-800/50 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
        >
          {products.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
        <span className="text-xs text-purple-300 font-medium ml-auto mr-2">
          {keys.length} Total Keys in Pool
        </span>
      </div>

      {/* Keys Table */}
      <div className="bg-[#140826] border border-purple-800/40 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-purple-900/50 bg-purple-950/40 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">License Key / Serial</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Allocated Customer</th>
                <th className="py-3 px-4">Allocated At</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-900/30">
              {keys.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No keys found for this product. Use "Batch Upload Keys" to add stock.
                  </td>
                </tr>
              ) : (
                keys.map((k) => (
                  <tr key={k._id} className="hover:bg-purple-900/20 transition-colors font-mono">
                    <td className="py-3 px-4 font-bold text-white text-xs select-all">{k.licenseKey}</td>
                    <td className="py-3 px-4 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          k.status === 'AVAILABLE'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : k.status === 'ALLOCATED'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {k.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-300">
                      {k.allocatedToTelegramId ? `TG: ${k.allocatedToTelegramId}` : '—'}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-400">
                      {k.allocatedAt ? new Date(k.allocatedAt).toLocaleString() : '—'}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-400">{k.notes || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#140826] border border-purple-800/50 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-2">Batch Upload License Keys</h2>
            <p className="text-xs text-slate-400 mb-4">
              Paste keys one per line. Duplicate keys for the same product are automatically skipped.
            </p>

            {uploadStatus && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 text-xs font-semibold">
                {uploadStatus}
              </div>
            )}

            <form onSubmit={handleBatchUpload} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-purple-950/70 border border-purple-800/40 rounded-xl px-3 py-2 text-white"
                >
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Keys (One per line)</label>
                <textarea
                  rows={8}
                  required
                  value={batchText}
                  onChange={(e) => setBatchText(e.target.value)}
                  placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX&#10;YYYYY-YYYYY-YYYYY-YYYYY-YYYYY&#10;ZZZZZ-ZZZZZ-ZZZZZ-ZZZZZ-ZZZZZ"
                  className="w-full bg-purple-950/70 border border-purple-800/40 rounded-xl px-3 py-2 text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Batch Note (Optional)</label>
                <input
                  type="text"
                  value={batchNotes}
                  onChange={(e) => setBatchNotes(e.target.value)}
                  placeholder="e.g. Supplier Batch #2026-B"
                  className="w-full bg-purple-950/70 border border-purple-800/40 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-purple-900/50">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-purple-950 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-purple-600 text-white font-bold">
                  Import Keys
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
