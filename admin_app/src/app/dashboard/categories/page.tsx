'use client';

import { useState, useEffect } from 'react';
import { categoriesService } from '@/services/adminFirestoreService';
import { Category } from '@/types/models';
import RoleGuard from '@/components/RoleGuard';
import { Plus, Edit2, Trash2, Check, X, Layers } from 'lucide-react';

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCategory, setCurrentCategory] = useState<Partial<Category>>({ name: '', description: '', isActive: true });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setLoading(true);
        try {
            const data = await categoriesService.list();
            setCategories(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (currentCategory.id) {
                await categoriesService.update(currentCategory.id, {
                    name: currentCategory.name,
                    description: currentCategory.description,
                    isActive: currentCategory.isActive
                });
            } else {
                await categoriesService.create({
                    name: currentCategory.name!,
                    description: currentCategory.description || '',
                    isActive: currentCategory.isActive ?? true
                });
            }
            setIsModalOpen(false);
            setCurrentCategory({ name: '', description: '', isActive: true });
            loadCategories();
        } catch (err) {
            console.error(err);
            alert('Failed to save category');
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (category: Category) => {
        try {
            await categoriesService.toggleActive(category.id, !category.isActive);
            loadCategories();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <RoleGuard permission="categories.read">
            <div className="p-8 max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
                        <p className="text-gray-500 text-sm">Organize products into meaningful groups</p>
                    </div>
                    <button
                        onClick={() => { setCurrentCategory({ name: '', description: '', isActive: true }); setIsModalOpen(true); }}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-green-700 transition-all shadow-sm"
                    >
                        <Plus className="w-5 h-5" /> Add Category
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 font-medium text-gray-600 text-sm">
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Slug</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">Loading categories...</td>
                                </tr>
                            ) : categories.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">No categories found. Add your first category!</td>
                                </tr>
                            ) : categories.map(cat => (
                                <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">{cat.name}</td>
                                    <td className="px-6 py-4 text-gray-500 text-sm font-mono">{cat.slug}</td>
                                    <td className="px-6 py-4 text-gray-500 text-sm">{cat.description || '-'}</td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => toggleActive(cat)}
                                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                                }`}
                                        >
                                            {cat.isActive ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                            {cat.isActive ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => { setCurrentCategory(cat); setIsModalOpen(true); }}
                                            className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-900">{currentCategory.id ? 'Edit Category' : 'New Category'}</h2>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors font-medium text-gray-400">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <form onSubmit={handleSave} className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Category Name</label>
                                    <input
                                        required
                                        value={currentCategory.name}
                                        onChange={e => setCurrentCategory({ ...currentCategory, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none"
                                        placeholder="e.g. Dairy, Grains, Baking"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Description (Optional)</label>
                                    <textarea
                                        rows={3}
                                        value={currentCategory.description}
                                        onChange={e => setCurrentCategory({ ...currentCategory, description: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none"
                                        placeholder="Brief details about the category"
                                    />
                                </div>
                                <div className="flex items-center gap-3 py-2">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={currentCategory.isActive}
                                        onChange={e => setCurrentCategory({ ...currentCategory, isActive: e.target.checked })}
                                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                    />
                                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active and visible</label>
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-4 py-2 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-green-700 transition-all shadow-sm disabled:opacity-50"
                                    >
                                        {saving ? 'Saving...' : currentCategory.id ? 'Save Changes' : 'Create Category'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </RoleGuard>
    );
}
