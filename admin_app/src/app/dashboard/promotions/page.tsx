'use client';

import { useEffect, useState } from 'react';
import { promotionsService } from '@/services/adminFirestoreService';
import { Promotion } from '@/types/models';
import RoleGuard from '@/components/RoleGuard';
import { Plus, ToggleLeft, ToggleRight } from 'lucide-react';

export default function PromotionsPage() {
    const [promos, setPromos] = useState<Promotion[]>([]);
    const [loading, setLoading] = useState(true);

    const load = () => promotionsService.list().then(p => { setPromos(p); setLoading(false); });
    useEffect(() => { load(); }, []);

    const toggle = async (p: Promotion) => {
        await promotionsService.toggle(p.id, !p.isActive);
        load();
    };

    return (
        <RoleGuard permission="promotions.read">
            <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Promotions & Coupons</h1>
                    <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-green-700 transition-all">
                        <Plus className="w-4 h-4" /> New Promotion
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                {['Code', 'Type', 'Value', 'Min Spend', 'Usage', 'Expires', 'Active'].map(h => (
                                    <th key={h} className="px-6 py-3 text-left font-medium">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading
                                ? Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}><td colSpan={7} className="px-6 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                                ))
                                : promos.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-mono font-bold text-gray-800">{p.code}</td>
                                        <td className="px-6 py-4 capitalize">
                                            <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">{p.discountType}</span>
                                        </td>
                                        <td className="px-6 py-4 font-semibold">
                                            {p.discountType === 'percentage' ? `${p.value}%` : `$${p.value}`}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{p.minSpend ? `$${p.minSpend}` : '—'}</td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {p.usageCount} / {p.usageLimit ?? '∞'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">
                                            {p.endDate?.toDate?.()?.toLocaleDateString?.() ?? '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button onClick={() => toggle(p)} className="text-gray-400 hover:text-green-600 transition-colors">
                                                {p.isActive
                                                    ? <ToggleRight className="w-6 h-6 text-green-500" />
                                                    : <ToggleLeft className="w-6 h-6" />
                                                }
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </RoleGuard>
    );
}
