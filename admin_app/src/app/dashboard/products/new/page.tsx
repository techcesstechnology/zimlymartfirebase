'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { productsService, brandsService, categoriesService, locationsService } from '@/services/adminFirestoreService';
import { Brand, Category, Location, DeliveryArea } from '@/types/models';
import RoleGuard from '@/components/RoleGuard';
import { ChevronLeft, Save, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function NewProductPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [areas, setAreas] = useState<DeliveryArea[]>([]);
    const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        brandId: '',
        brandName: '',
        categoryId: '',
        categoryName: '',
        unitLabel: '',
        unitCostPrice: 0,
        markupPercent: 0,
        finalPrice: 0,
        cityId: '',
        cityName: '',
        tags: [] as string[],
        imageUrls: [] as string[],
        isActive: true,
        externalSource: 'firebase' as const,
    });

    useEffect(() => {
        Promise.all([brandsService.list(), categoriesService.list(), locationsService.list()])
            .then(([b, c, l]) => { setBrands(b); setCategories(c); setLocations(l); })
            .catch(console.error);
    }, []);

    const updatePricing = (cost: number, markup: number) => ({
        unitCostPrice: cost,
        markupPercent: markup,
        finalPrice: Number((cost * (1 + markup / 100)).toFixed(2)),
    });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.brandId || !formData.categoryId || !formData.cityId) {
            alert('Please select a brand, category, and city.');
            return;
        }
        setLoading(true);
        try {
            const slug = formData.slug || formData.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
            const selectedAreas = areas.filter(a => selectedAreaIds.includes(a.id));
            await productsService.create({
                ...formData,
                slug,
                imageUrl: formData.imageUrls[0] || '',
                areaIds: selectedAreaIds,
                areaNames: selectedAreas.map(a => a.name),
            });
            router.push('/dashboard/products');
        } catch (err) {
            console.error(err);
            alert('Failed to create product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <RoleGuard permission="products.write">
            <div className="p-8 max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/dashboard/products" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">New Product</h1>
                        <p className="text-gray-500 text-sm">For bulk entry use the Spreadsheet Entry page.</p>
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
                                <input placeholder="e.g. 2L, 1kg, 6-pack" value={formData.unitLabel}
                                    onChange={e => setFormData({ ...formData, unitLabel: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Description</label>
                            <textarea rows={3} value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none" />
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Brand *</label>
                                <select required value={formData.brandId}
                                    onChange={e => {
                                        const b = brands.find(x => x.id === e.target.value);
                                        setFormData({ ...formData, brandId: e.target.value, brandName: b?.name ?? '' });
                                    }}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none bg-white">
                                    <option value="">Select brand…</option>
                                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Category *</label>
                                <select required value={formData.categoryId}
                                    onChange={e => {
                                        const c = categories.find(x => x.id === e.target.value);
                                        setFormData({ ...formData, categoryId: e.target.value, categoryName: c?.name ?? '' });
                                    }}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none bg-white">
                                    <option value="">Select category…</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">City *</label>
                                <select required value={formData.cityId}
                                    onChange={e => {
                                        const l = locations.find(x => x.id === e.target.value);
                                        setFormData({ ...formData, cityId: e.target.value, cityName: l?.name ?? '' });
                                        setSelectedAreaIds([]);
                                        locationsService.listAreas(l?.name ?? '').then(setAreas);
                                    }}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none bg-white">
                                    <option value="">Select city…</option>
                                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">URL Slug</label>
                                <input placeholder="auto-generated if empty" value={formData.slug}
                                    onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none" />
                            </div>
                        </div>

                        {areas.length > 0 && (
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Delivery Areas *</label>
                                <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-xl bg-gray-50">
                                    {areas.map(a => (
                                        <label key={a.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedAreaIds.includes(a.id)}
                                                onChange={e => setSelectedAreaIds(prev =>
                                                    e.target.checked ? [...prev, a.id] : prev.filter(id => id !== a.id)
                                                )}
                                                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                            />
                                            {a.name}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pricing */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                        <h2 className="font-bold text-gray-800">Pricing</h2>
                        <div className="grid grid-cols-3 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Cost Price ($) *</label>
                                <input type="number" step="0.01" min="0" required
                                    value={formData.unitCostPrice || ''}
                                    onChange={e => setFormData({ ...formData, ...updatePricing(parseFloat(e.target.value) || 0, formData.markupPercent) })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none font-mono" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Markup %</label>
                                <input type="number" step="0.5" min="0"
                                    value={formData.markupPercent || ''}
                                    onChange={e => setFormData({ ...formData, ...updatePricing(formData.unitCostPrice, parseFloat(e.target.value) || 0) })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none font-mono" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Selling Price ($)</label>
                                <div className="w-full px-4 py-2 border border-green-200 rounded-xl bg-green-50 font-mono font-bold text-green-700">
                                    ${formData.finalPrice.toFixed(2)}
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
                            {formData.imageUrls.map((url, i) => (
                                <div key={i} className="flex gap-2">
                                    <input placeholder="https://..." value={url}
                                        onChange={e => {
                                            const next = [...formData.imageUrls];
                                            next[i] = e.target.value;
                                            setFormData({ ...formData, imageUrls: next });
                                        }}
                                        className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none" />
                                    <button type="button"
                                        onClick={() => setFormData({ ...formData, imageUrls: formData.imageUrls.filter((_, idx) => idx !== i) })}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                            <button type="button"
                                onClick={() => setFormData({ ...formData, imageUrls: [...formData.imageUrls, ''] })}
                                className="text-sm text-green-600 font-medium flex items-center gap-1 hover:text-green-700">
                                <Plus className="w-4 h-4" /> Add Image URL
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                            <input type="checkbox" checked={formData.isActive}
                                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" />
                            Active (visible to customers)
                        </label>
                        <div className="flex gap-3">
                            <Link href="/dashboard/products" className="px-6 py-2 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                                Cancel
                            </Link>
                            <button type="submit" disabled={loading}
                                className="flex items-center gap-2 bg-green-600 text-white px-8 py-2 rounded-xl font-medium hover:bg-green-700 transition-all shadow-sm disabled:opacity-50">
                                {loading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <Save className="w-5 h-5" />}
                                Create Product
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </RoleGuard>
    );
}
