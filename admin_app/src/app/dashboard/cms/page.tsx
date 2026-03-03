'use client';

import { useEffect, useState } from 'react';
import { cmsService } from '@/services/adminFirestoreService';
import { CmsBanner } from '@/types/models';
import RoleGuard from '@/components/RoleGuard';
import { Plus, Trash2, Edit, GripVertical, Eye, EyeOff } from 'lucide-react';

export default function CmsPage() {
    const [banners, setBanners] = useState<CmsBanner[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<CmsBanner | null>(null);
    const [form, setForm] = useState({ title: '', imageUrl: '', linkUrl: '', displayOrder: 0, isActive: true });

    const load = () => cmsService.listBanners().then(b => { setBanners(b); setLoading(false); });

    useEffect(() => { load(); }, []);

    const handleSave = async () => {
        await cmsService.saveBanner(editing?.id ?? null, {
            ...form, locationTargeting: '',
        });
        setEditing(null);
        setForm({ title: '', imageUrl: '', linkUrl: '', displayOrder: 0, isActive: true });
        load();
    };

    return (
        <RoleGuard permission="cms.read">
            <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Homepage Content</h1>
                    <button onClick={() => setEditing({} as any)}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-green-700 transition-all">
                        <Plus className="w-4 h-4" /> New Banner
                    </button>
                </div>

                {/* Banner Form Modal */}
                {editing !== null && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
                            <h2 className="text-lg font-bold mb-5">{editing.id ? 'Edit Banner' : 'New Banner'}</h2>
                            {(['title', 'imageUrl', 'linkUrl'] as const).map(field => (
                                <div key={field} className="mb-4">
                                    <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">{field}</label>
                                    <input value={(form as any)[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none text-sm" />
                                </div>
                            ))}
                            <div className="mb-5">
                                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Display Order</label>
                                <input type="number" value={form.displayOrder} onChange={e => setForm(f => ({ ...f, displayOrder: +e.target.value }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none text-sm" />
                            </div>
                            <div className="flex gap-3">
                                <button onClick={handleSave} className="flex-1 bg-green-600 text-white py-2.5 rounded-xl font-medium hover:bg-green-700 transition-all">Save</button>
                                <button onClick={() => setEditing(null)} className="flex-1 bg-gray-100 py-2.5 rounded-xl font-medium hover:bg-gray-200 transition-all">Cancel</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Banners List */}
                <div className="space-y-3">
                    {loading ? Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />
                    )) : banners.map(b => (
                        <div key={b.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
                            <GripVertical className="w-4 h-4 text-gray-300 cursor-grab" />
                            <img src={b.imageUrl} alt={b.title} className="w-20 h-14 rounded-xl object-cover bg-gray-100" />
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900">{b.title}</p>
                                <p className="text-xs text-gray-400 truncate">{b.linkUrl}</p>
                            </div>
                            <span className="text-xs text-gray-400">Order: {b.displayOrder}</span>
                            <div className="flex items-center gap-1">
                                <button onClick={() => { setEditing(b); setForm({ title: b.title, imageUrl: b.imageUrl, linkUrl: b.linkUrl ?? '', displayOrder: b.displayOrder, isActive: b.isActive }); }}
                                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-green-600 transition-colors">
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => cmsService.deleteBanner(b.id).then(load)}
                                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </RoleGuard>
    );
}
