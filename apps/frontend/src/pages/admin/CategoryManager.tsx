import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Layers, Folder } from 'lucide-react';
import { api } from '../../services/api.js';
import type { ICategory } from '@telegram-store/types';

export const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<ICategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: 'folder',
    sortOrder: 0,
    isActive: true
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await api.get('/admin/categories');
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenCreate = () => {
    setEditingCat(null);
    setFormData({ name: '', slug: '', description: '', icon: 'folder', sortOrder: categories.length + 1, isActive: true });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: ICategory) => {
    setEditingCat(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      icon: cat.icon || 'folder',
      sortOrder: cat.sortOrder || 0,
      isActive: cat.isActive
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCat) {
        await api.put(`/admin/categories/${editingCat._id}`, formData);
      } else {
        await api.post('/admin/categories', formData);
      }
      setIsModalOpen(false);
      loadCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error saving category');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete category?')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      loadCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error deleting category');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Categories</h1>
          <p className="text-xs text-slate-400 mt-1">Organize your store catalog into browseable sections.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div
            key={cat._id}
            className="p-5 rounded-2xl bg-[#140826] border border-purple-800/40 shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-9 h-9 rounded-xl bg-purple-900/60 border border-purple-700/50 flex items-center justify-center text-purple-300">
                  <Folder className="w-4 h-4" />
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cat.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-500/20 text-slate-300'}`}>
                  {cat.isActive ? 'Active' : 'Disabled'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">{cat.name}</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{cat.description || 'No description provided.'}</p>
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-purple-900/40 text-xs">
              <span className="text-[11px] text-purple-400 font-mono">/{cat.slug}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => handleOpenEdit(cat)} className="p-1.5 text-purple-300 hover:text-white rounded-lg">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(cat._id)} className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#140826] border border-purple-800/50 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">{editingCat ? 'Edit Category' : 'Create Category'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-purple-950/70 border border-purple-800/40 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Slug (URL identifier)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="Auto-generated if empty"
                  className="w-full bg-purple-950/70 border border-purple-800/40 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
