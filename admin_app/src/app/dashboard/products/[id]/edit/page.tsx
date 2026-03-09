'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { productsService } from '@/services/adminFirestoreService';
import { Product } from '@/types/models';
import RoleGuard from '@/components/RoleGuard';
import { ChevronLeft, Save, Trash2, Image as ImageIcon, Plus } from 'lucide-react';
import Link from 'next/link';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<Product | null>(null);

    useEffect(() => {
        productsService.get(id).then(p => {
            if (p) setFormData(p);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [id]);

    const updatePricing = (cost: number, markup: number) => ({
        unitCostPrice: cost,
        markupPercent: markup,
        finalPrice: Number((cost * (1 + markup / 100)).toFixed(2)),
    });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData) return;
        setSaving(true);
        try {
            const { id: _id, createdAt: _ca, updatedAt: _ua, ...updateData } = formData;
            await productsService.update(id, updateData);
            router.push('/dashboard/products');
        } catch (err) {
            console.error(err);
            alert('Failed to update product');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <div className="animate-spin h-10 w-10 rounded-full border-4 border-green-600 border-t-transparent" />
        </div>
    );

    if (!formData) return (
        <div className="p-8 text-center">
            <h2 className="text-xl font-bold text-gray-800">Product not found</h2>
            <Link href="/dashboard/products" className="text-green-600 hover:underline mt-2 inline-block">Back to products</Link>
        </div>
    );

    return (
        <RoleGuard permission="products.write">
            <div className="p-8 max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/dashboard/products" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
                        <p className="text-gray-500 text-sm">{formData.name}</p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                        <h2 className="font-bold text-gray-800">Basic Info</h2>
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Product Name *</label>
                                <input required value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Unit Label</label>
                                <input placeholder="e.g. 2L, 1kg" value={formData.unitLabel || ''}
                                    onChange={e => setFormData({ ...formData, unitLabel: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Description</label>
                            <textarea rows={3} value={formData.description || ''}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none" />
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Brand Name</label>
                                <input value={formData.brandName || ''}
                                    onChange={e => setFormData({ ...formData, brandName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Category Name</label>
                                <input value={formData.categoryName || ''}
                                    onChange={e => setFormData({ ...formData, categoryName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">City</label>
                                <input value={formData.cityName || ''}
                                    onChange={e => setFormData({ ...formData, cityName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Status</label>
                                <label className="flex items-center gap-2 cursor-pointer mt-2">
                                    <input type="checkbox" checked={formData.isActive}
                                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" />
                                    <span className="text-sm text-gray-600">Active (visible to customers)</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                        <h2 className="font-bold text-gray-800">Pricing</h2>
                        <div className="grid grid-cols-3 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Cost Price ($)</label>
                                <input type="number" step="0.01" min="0"
                                    value={formData.unitCostPrice || ''}
                                    onChange={e => setFormData({ ...formData, ...updatePricing(parseFloat(e.target.value) || 0, formData.markupPercent || 0) })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none font-mono" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Markup %</label>
                                <input type="number" step="0.5" min="0"
                                    value={formData.markupPercent || ''}
                                    onChange={e => setFormData({ ...formData, ...updatePricing(formData.unitCostPrice || 0, parseFloat(e.target.value) || 0) })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none font-mono" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Selling Price ($)</label>
                                <div className="w-full px-4 py-2 border border-green-200 rounded-xl bg-green-50 font-mono font-bold text-green-700">
                                    ${(formData.finalPrice || 0).toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Images */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-base font-bold mb-4 flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-green-600" /> Images
                        </h2>
                        <div className="space-y-3">
                            {(formData.imageUrls || []).map((url, i) => (
                                <div key={i} className="flex gap-2">
                                    <input placeholder="https://..." value={url}
                                        onChange={e => {
                                            const next = [...(formData.imageUrls || [])];
                                            next[i] = e.target.value;
                                            setFormData({ ...formData, imageUrls: next });
                                        }}
                                        className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none" />
                                    <button type="button"
                                        onClick={() => setFormData({ ...formData, imageUrls: (formData.imageUrls || []).filter((_, idx) => idx !== i) })}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                            <button type="button"
                                onClick={() => setFormData({ ...formData, imageUrls: [...(formData.imageUrls || []), ''] })}
                                className="text-sm text-green-600 font-medium flex items-center gap-1 hover:text-green-700">
                                <Plus className="w-4 h-4" /> Add Image URL
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Link href="/dashboard/products" className="px-6 py-2 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                            Cancel
                        </Link>
                        <button type="submit" disabled={saving}
                            className="flex items-center gap-2 bg-green-600 text-white px-8 py-2 rounded-xl font-medium hover:bg-green-700 transition-all shadow-sm disabled:opacity-50">
                            {saving ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <Save className="w-5 h-5" />}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </RoleGuard>
    );
}
