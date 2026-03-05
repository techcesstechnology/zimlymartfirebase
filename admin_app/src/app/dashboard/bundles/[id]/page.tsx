'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { bundlesService, inventoryService } from '@/services/adminFirestoreService';
import { Bundle, InventoryDoc, BundleItem } from '@/types/models';
import RoleGuard from '@/components/RoleGuard';
import { ArrowLeft, Save, Plus, Trash2, Search, Package, X } from 'lucide-react';
import Link from 'next/link';

export default function BundleEditorPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const isNew = id === 'new';

    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [inventory, setInventory] = useState<InventoryDoc[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showPicker, setShowPicker] = useState(false);

    const [formData, setFormData] = useState<Partial<Bundle>>({
        name: '',
        slug: '',
        description: '',
        imageUrls: [],
        locationId: 'harare',
        isActive: true,
        tags: [],
        sortPriority: 0,
        pricing: { price: 0, currency: 'USD' },
        items: []
    });

    useEffect(() => {
        if (!isNew) {
            bundlesService.get(id).then(bundle => {
                if (bundle) setFormData(bundle);
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
        loadInventory(formData.locationId || 'harare');
    }, [id, isNew, formData.locationId]);

    const loadInventory = async (location: string) => {
        const data = await inventoryService.listByLocation(location);
        setInventory(data);
    };

    const handleLocationChange = (loc: string) => {
        setFormData(prev => ({ ...prev, locationId: loc, items: [] }));
        loadInventory(loc);
    };

    const handleAddItem = (inv: InventoryDoc) => {
        const exists = formData.items?.find(item => item.inventoryRefId === inv.id);
        if (exists) return;

        const newItem: BundleItem = {
            inventoryRefId: inv.id,
            productId: inv.productId,
            productName: inv.productName,
            imageUrl: inv.imageUrl || '',
            priceSnapshot: inv.price,
            qty: 1,
            required: true
        };

        setFormData(prev => ({
            ...prev,
            items: [...(prev.items || []), newItem]
        }));
        setShowPicker(false);
    };

    const handleRemoveItem = (inventoryRefId: string) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items?.filter(item => item.inventoryRefId !== inventoryRefId)
        }));
    };

    const handleUpdateItemQty = (inventoryRefId: string, qty: number) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items?.map(item =>
                item.inventoryRefId === inventoryRefId ? { ...item, qty: Math.max(1, qty) } : item
            )
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await bundlesService.save(isNew ? null : id, formData as Bundle);
            router.push('/dashboard/bundles');
        } catch (err) {
            console.error(err);
            alert("Failed to save bundle");
        } finally {
            setSaving(false);
        }
    };

    // Calculations
    const totalCost = formData.items?.reduce((sum, item) => sum + (item.priceSnapshot * item.qty), 0) || 0;
    const margin = (formData.pricing?.price || 0) - totalCost;

    const filteredInventory = inventory.filter(i =>
        i.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.variantSku.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="p-8 animate-pulse text-gray-400">Loading bundle data...</div>;

    return (
        <RoleGuard permission="bundles.read">
            <div className="p-8 max-w-5xl mx-auto">
                <Link href="/dashboard/bundles" className="inline-flex items-center gap-2 text-gray-500 hover:text-green-600 transition-colors mb-6 font-medium">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Bundles
                </Link>

                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">{isNew ? 'New Bundle' : 'Edit Bundle'}</h1>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-900/20 disabled:opacity-50"
                    >
                        <Save className="w-5 h-5" />
                        {saving ? 'Saving...' : 'Save Bundle'}
                    </button>
                </div>

                <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Basic Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                            <h2 className="text-lg font-bold text-gray-800 border-b border-gray-50 pb-2">Basic Information</h2>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label htmlFor="bundleName" className="block text-xs font-bold text-gray-400 uppercase mb-1">Bundle Name</label>
                                    <input
                                        id="bundleName"
                                        type="text"
                                        required
                                        className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-green-500 transition-all font-medium"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                        placeholder="e.g. Breakfast Essentials"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="bundleSlug" className="block text-xs font-bold text-gray-400 uppercase mb-1">Slug</label>
                                    <input
                                        id="bundleSlug"
                                        type="text"
                                        readOnly
                                        className="w-full bg-gray-100 border-none rounded-xl py-3 px-4 text-gray-500 cursor-not-allowed font-medium"
                                        value={formData.slug}
                                        placeholder="Auto-generated slug"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="locationSelect" className="block text-xs font-bold text-gray-400 uppercase mb-1">Location</label>
                                    <select
                                        id="locationSelect"
                                        title="Select Location"
                                        className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-green-500 transition-all font-medium capitalize"
                                        value={formData.locationId}
                                        onChange={e => handleLocationChange(e.target.value)}
                                    >
                                        {['harare', 'bulawayo', 'beitbridge', 'mutare', 'gweru'].map(l => (
                                            <option key={l} value={l}>{l}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="bundleDesc" className="block text-xs font-bold text-gray-400 uppercase mb-1">Description</label>
                                <textarea
                                    id="bundleDesc"
                                    className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-green-500 transition-all font-medium"
                                    rows={4}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="What's inside this bundle?"
                                />
                            </div>
                        </section>

                        <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                                <h2 className="text-lg font-bold text-gray-800">Bundle Components</h2>
                                <button
                                    type="button"
                                    onClick={() => setShowPicker(true)}
                                    className="text-xs font-bold text-green-600 flex items-center gap-1 hover:underline"
                                >
                                    <Plus className="w-3 h-3" /> Add Product
                                </button>
                            </div>

                            <div className="space-y-3">
                                {formData.items?.length === 0 ? (
                                    <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400 italic">
                                        No items added yet. Click &quot;Add Product&quot; to start curating.
                                    </div>
                                ) : (
                                    formData.items?.map(item => {
                                        return (
                                            <div key={item.inventoryRefId} className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                    {item.imageUrl ? (
                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                        <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package className="w-5 h-5 text-gray-300" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-bold text-gray-900 text-sm">{item.productName}</div>
                                                    <div className="text-[10px] text-gray-400 font-mono">Cost snapshot: ${item.priceSnapshot.toFixed(2)}</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <label htmlFor={`qty-${item.inventoryRefId}`} className="text-[10px] font-bold text-gray-400 uppercase">Qty</label>
                                                    <input
                                                        id={`qty-${item.inventoryRefId}`}
                                                        type="number"
                                                        className="w-16 bg-white border-gray-200 rounded-lg py-1 px-2 text-center text-sm font-bold focus:ring-green-500"
                                                        value={item.qty}
                                                        onChange={e => handleUpdateItemQty(item.inventoryRefId, parseInt(e.target.value))}
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    title="Remove Item"
                                                    onClick={() => handleRemoveItem(item.inventoryRefId)}
                                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Pricing & Calculations */}
                    <div className="space-y-6">
                        <section className="bg-green-600 p-6 rounded-2xl shadow-lg shadow-green-900/20 text-white space-y-4">
                            <h2 className="text-lg font-bold border-b border-green-500/50 pb-2">Analysis</h2>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm opacity-80">
                                    <span>Items Total Cost</span>
                                    <span>${totalCost.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-xl uppercase tracking-tighter">
                                    <span>Margin Estimate</span>
                                    <span className={margin >= 0 ? 'text-white' : 'text-red-200'}>
                                        ${margin.toFixed(2)}
                                    </span>
                                </div>
                                <div className="text-[10px] opacity-60 italic leading-tight pt-2">
                                    * Margin = Bundle Price - Sum(Item Cost Snapshot * Qty).
                                </div>
                            </div>
                        </section>

                        <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                            <h2 className="text-lg font-bold text-gray-800 border-b border-gray-50 pb-2">Pricing</h2>
                            <div>
                                <label htmlFor="bundlePrice" className="block text-xs font-bold text-gray-400 uppercase mb-1">Bundle Selling Price ($)</label>
                                <input
                                    id="bundlePrice"
                                    type="number"
                                    step="0.01"
                                    required
                                    className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-green-500 transition-all font-bold text-xl text-green-700"
                                    value={formData.pricing?.price}
                                    onChange={e => setFormData({ ...formData, pricing: { ...formData.pricing!, price: parseFloat(e.target.value) || 0 } })}
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label htmlFor="compareAt" className="block text-xs font-bold text-gray-400 uppercase mb-1">Compare At ($)</label>
                                <input
                                    id="compareAt"
                                    type="number"
                                    step="0.01"
                                    className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-green-500 transition-all font-medium text-gray-400"
                                    value={formData.pricing?.compareAtPrice || ''}
                                    onChange={e => setFormData({ ...formData, pricing: { ...formData.pricing!, compareAtPrice: parseFloat(e.target.value) || undefined } })}
                                    placeholder="Strike-through price"
                                />
                            </div>
                        </section>

                        <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                            <h2 className="text-lg font-bold text-gray-800 border-b border-gray-50 pb-2">Settings</h2>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Display Priority</span>
                                <input
                                    title="Sort Priority"
                                    type="number"
                                    className="w-20 bg-gray-50 border-none rounded-lg py-1 px-2 text-center text-sm font-bold"
                                    value={formData.sortPriority}
                                    onChange={e => setFormData({ ...formData, sortPriority: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Active Status</span>
                                <button
                                    type="button"
                                    title={formData.isActive ? "Set Inactive" : "Set Active"}
                                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.isActive ? 'bg-green-600' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </section>
                    </div>
                </form>
            </div>

            {/* Product Picker Modal */}
            {showPicker && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900">Add Product to Bundle</h3>
                            <button title="Close Modal" onClick={() => setShowPicker(false)} className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 bg-gray-50 border-b border-gray-100">
                            <div className="relative">
                                <input
                                    id="inventorySearch"
                                    type="text"
                                    placeholder="Search by name or SKU..."
                                    className="w-full bg-white border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-green-500 transition-all font-medium"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    autoFocus
                                />
                                <Search className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2">
                            <div className="grid grid-cols-1 gap-1">
                                {filteredInventory.map(inv => (
                                    <button
                                        key={inv.id}
                                        onClick={() => handleAddItem(inv)}
                                        className="flex items-center gap-4 p-3 hover:bg-green-50 rounded-2xl transition-all group text-left"
                                    >
                                        <div className="w-12 h-12 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex-shrink-0">
                                            {inv.imageUrl ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img src={inv.imageUrl} alt={inv.productName} className="w-full h-full object-cover" />
                                            ) : (
                                                <Package className="w-6 h-6 text-gray-200" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-gray-900 truncate group-hover:text-green-700">{inv.productName}</div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span className="font-mono">{inv.variantSku}</span>
                                                <span>•</span>
                                                <span className="text-green-600 font-bold">${inv.price.toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-bold text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity uppercase">Click to add</div>
                                    </button>
                                ))}
                                {filteredInventory.length === 0 && (
                                    <div className="py-20 text-center text-gray-400 italic">No products matched your search.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </RoleGuard>
    );
}
