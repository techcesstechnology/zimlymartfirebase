'use client';

import { useEffect, useState } from 'react';
import { inventoryService } from '@/services/adminFirestoreService';
import { InventoryDoc } from '@/types/models';
import RoleGuard from '@/components/RoleGuard';
import { AlertTriangle, TrendingDown } from 'lucide-react';

export default function InventoryPage() {
    const [locationId, setLocationId] = useState('harare');
    const [items, setItems] = useState<InventoryDoc[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        inventoryService.listByLocation(locationId).then(i => { setItems(i); setLoading(false); });
    }, [locationId]);

    const handleAdjust = async (item: InventoryDoc) => {
        const delta = Number(prompt(`Adjust stockOnHand for "${item.productName}" (use negative to deduct):`));
        const reason = prompt('Reason for adjustment:') ?? '';
        if (isNaN(delta) || !reason) return;
        await inventoryService.adjustStock({
            inventoryId: item.id, delta, reason, adminUid: 'admin', adminName: 'Admin User',
            timestamp: new Date(),
        });
        inventoryService.listByLocation(locationId).then(setItems);
    };

    const sellable = (i: InventoryDoc) => Math.max(0, i.stockOnHand - i.stockReserved);
    const isLow = (i: InventoryDoc) => sellable(i) <= i.reorderLevel;

    return (
        <RoleGuard permission="inventory.read">
            <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
                    <select value={locationId} onChange={e => setLocationId(e.target.value)}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-500">
                        {['harare', 'bulawayo', 'beitbridge', 'mutare', 'gweru'].map(l => (
                            <option key={l} value={l} className="capitalize">{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                        ))}
                    </select>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                {['Product', 'SKU', 'On Hand', 'Reserved', 'Sellable', 'Reorder', 'Status', 'Action'].map(h => (
                                    <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading
                                ? Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i}><td colSpan={8} className="px-5 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                                ))
                                : items.map(item => (
                                    <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${isLow(item) ? 'bg-red-50/50' : ''}`}>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                {item.imageUrl && <img src={item.imageUrl} className="w-8 h-8 rounded object-cover" />}
                                                <span className="font-medium text-gray-900">{item.productName}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 font-mono text-xs text-gray-500">{item.variantSku}</td>
                                        <td className="px-5 py-4 font-bold">{item.stockOnHand}</td>
                                        <td className="px-5 py-4 text-orange-600">{item.stockReserved}</td>
                                        <td className="px-5 py-4 font-bold text-green-700">{sellable(item)}</td>
                                        <td className="px-5 py-4 text-gray-500">{item.reorderLevel}</td>
                                        <td className="px-5 py-4">
                                            {isLow(item)
                                                ? <span className="flex items-center gap-1 text-red-600 text-xs font-medium"><AlertTriangle className="w-3 h-3" />Low Stock</span>
                                                : <span className="text-green-600 text-xs font-medium">OK</span>
                                            }
                                        </td>
                                        <td className="px-5 py-4">
                                            <button onClick={() => handleAdjust(item)}
                                                className="px-3 py-1.5 bg-gray-100 hover:bg-green-50 hover:text-green-700 rounded-lg text-xs font-medium transition-colors">
                                                Adjust
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
