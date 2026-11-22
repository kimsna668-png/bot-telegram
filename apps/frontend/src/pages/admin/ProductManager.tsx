import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Package, ShieldAlert, Check } from 'lucide-react';
import { api } from '../../services/api.js';
import type { IProduct, ICategory, ProductType, DeliveryMethod } from '@telegram-store/types';

export const ProductManager: React.FC = () => {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    shortDescription: '',
    description: '',
    categoryId: '',
    productType: 'license_key' as ProductType,
    deliveryMethod: 'instant_license' as DeliveryMethod,
    priceUSD: 10,
    priceKHR: 41000,
    discountPriceUSD: 0,
    discountPriceKHR: 0,
    stockQuantity: 10,
    isUnlimitedStock: false,
    images: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
    isActive: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/admin/products'),
        api.get('/admin/categories')
      ]);
      setProducts(prodRes.data.products || []);
      setCategories(catRes.data.categories || []);
    } catch (err) {
      console.error('Error loading products', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      shortDescription: '',
      description: '',
      categoryId: categories[0]?._id || '',
      productType: 'license_key',
      deliveryMethod: 'instant_license',
      priceUSD: 10,
      priceKHR: 41000,
      discountPriceUSD: 0,
      discountPriceKHR: 0,
      stockQuantity: 10,
      isUnlimitedStock: false,
      images: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
      isActive: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod: IProduct) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      shortDescription: prod.shortDescription || '',
      description: prod.description,
      categoryId: typeof prod.categoryId === 'string' ? prod.categoryId : (prod.categoryId as any)._id,
      productType: prod.productType,
      deliveryMethod: prod.deliveryMethod,
      priceUSD: prod.priceUSD,
      priceKHR: prod.priceKHR,
      discountPriceUSD: prod.discountPriceUSD || 0,
      discountPriceKHR: prod.discountPriceKHR || 0,
      stockQuantity: prod.stockQuantity,
      isUnlimitedStock: prod.isUnlimitedStock,
      images: prod.images[0] || '',
      isActive: prod.isActive
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        images: [formData.images],
        discountPriceUSD: formData.discountPriceUSD > 0 ? formData.discountPriceUSD : undefined,
        discountPriceKHR: formData.discountPriceKHR > 0 ? formData.discountPriceKHR : undefined
      };

      if (editingProduct) {
        await api.put(`/admin/products/${editingProduct._id}`, payload);
      } else {
        await api.post('/admin/products', payload);
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error saving product');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error deleting product');
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Product Catalog</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your digital assets, downloadables, software and license key products.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors shadow-lg shadow-purple-600/30"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3 bg-[#140826] p-3 rounded-2xl border border-purple-800/40">
        <Search className="w-4 h-4 text-purple-400 ml-2" />
        <input
          type="text"
          placeholder="Filter by product name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none flex-1"
        />
      </div>

      {/* Table */}
      <div className="bg-[#140826] border border-purple-800/40 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-purple-900/50 bg-purple-950/40 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">Type / Delivery</th>
                <th className="py-3.5 px-4">Price (USD / KHR)</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-900/30">
              {filteredProducts.map((p) => (
                <tr key={p._id} className="hover:bg-purple-900/20 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.images[0] || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=100&q=80'}
                        alt={p.name}
                        className="w-10 h-10 rounded-lg object-cover bg-purple-950 flex-shrink-0"
                      />
                      <div>
                        <div className="font-bold text-white leading-snug">{p.name}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-purple-900/60 text-purple-300 font-semibold text-[10px] uppercase">
                      {p.productType.replace('_', ' ')}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">{p.deliveryMethod}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white">${p.priceUSD.toFixed(2)}</div>
                    <div className="text-[10px] text-slate-400">{p.priceKHR.toLocaleString()} ៛</div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold">
                    {p.isUnlimitedStock ? (
                      <span className="text-emerald-400">Unlimited</span>
                    ) : (
                      <span className={p.stockQuantity <= 3 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                        {p.stockQuantity} in stock
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {p.isActive ? 'Active' : 'Draft'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-1.5 text-purple-300 hover:text-white rounded-lg hover:bg-purple-800/40"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-purple-800/40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-[#140826] border border-purple-800/50 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-4">
              {editingProduct ? 'Edit Digital Product' : 'Create New Digital Product'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-purple-950/70 border border-purple-800/40 rounded-xl px-3 py-2 text-white"
                  placeholder="e.g. Windows 11 Professional Retail Key"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full bg-purple-950/70 border border-purple-800/40 rounded-xl px-3 py-2 text-white"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Product Type</label>
                  <select
                    value={formData.productType}
                    onChange={(e) => setFormData({ ...formData, productType: e.target.value as any })}
                    className="w-full bg-purple-950/70 border border-purple-800/40 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="license_key">License Key</option>
                    <option value="activation_code">Activation Code</option>
                    <option value="ebook_pdf">E-Book / PDF</option>
                    <option value="software">Software / Script</option>
                    <option value="course">Video Course</option>
                    <option value="account">Digital Account</option>
                    <option value="subscription">Subscription</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Price (USD $)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.priceUSD}
                    onChange={(e) => {
                      const usd = parseFloat(e.target.value) || 0;
                      setFormData({ ...formData, priceUSD: usd, priceKHR: Math.round(usd * 4100) });
                    }}
                    className="w-full bg-purple-950/70 border border-purple-800/40 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Price (KHR ៛)</label>
                  <input
                    type="number"
                    required
                    value={formData.priceKHR}
                    onChange={(e) => setFormData({ ...formData, priceKHR: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-purple-950/70 border border-purple-800/40 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Delivery Method</label>
                <select
                  value={formData.deliveryMethod}
                  onChange={(e) => setFormData({ ...formData, deliveryMethod: e.target.value as any })}
                  className="w-full bg-purple-950/70 border border-purple-800/40 rounded-xl px-3 py-2 text-white"
                >
                  <option value="instant_license">Instant License Key (From Inventory Pool)</option>
                  <option value="secure_download">Secure Download URL (One-Time / Token)</option>
                  <option value="private_link">Private Access Link / Community</option>
                  <option value="credentials">Account Credentials & Setup Guide</option>
                  <option value="manual">Manual Admin Fulfillment</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-purple-950/70 border border-purple-800/40 rounded-xl px-3 py-2 text-white"
                  placeholder="Detailed product information, requirements and features..."
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Image URL</label>
                <input
                  type="text"
                  value={formData.images}
                  onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                  className="w-full bg-purple-950/70 border border-purple-800/40 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isUnlimitedStock}
                    onChange={(e) => setFormData({ ...formData, isUnlimitedStock: e.target.checked })}
                    className="rounded bg-purple-950 border-purple-800 text-purple-600"
                  />
                  <span className="text-slate-300">Unlimited Stock</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded bg-purple-950 border-purple-800 text-purple-600"
                  />
                  <span className="text-slate-300">Active in Store</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-purple-900/50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-purple-950 hover:bg-purple-900 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-md shadow-purple-600/30"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
