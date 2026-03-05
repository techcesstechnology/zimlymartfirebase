'use client';

import { useEffect, useState } from 'react';
import { bundlesService, locationsService } from '@/services/adminFirestoreService';
import { Bundle, Location } from '@/types/models';
import RoleGuard from '@/components/RoleGuard';
import { Plus, Edit2, Trash2, Power, PowerOff, Package } from 'lucide-react';
import Link from 'next/link';

export default function BundlesPage() {
    const [bundles, setBundles] = useState<Bundle[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [locationId, setLocationId] = useState('harare');

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                const locs = await locationsService.list();
                setLocations(locs);

                const data = await bundlesService.listByLocation(locationId);
                setBundles(data);
            } catch (err) {
                console.error("Error loading bundles:", err);
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [locationId]);

    const handleToggleActive = async (bundle: Bundle) => {
        try {
            await bundlesService.toggleActive(bundle.id, !bundle.isActive);
            // Refresh
            const data = await bundlesService.listByLocation(locationId);
            setBundles(data);
        } catch (err) {
            console.error(err);
            alert("Failed to toggle status");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this bundle?")) return;
        try {
            await bundlesService.delete(id);
            // Refresh
            const data = await bundlesService.listByLocation(locationId);
            setBundles(data);
        } catch (err) {
            console.error(err);
            alert("Failed to delete bundle");
        }
    };

    return (
        <RoleGuard permission="bundles.read">
            <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Grocery Bundles</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage curated collections of products for customers.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <select
                            title="Select Location"
                            value={locationId}
                            onChange={e => setLocationId(e.target.value)}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-500 font-medium capitalize"
                        >
                            {locations.length > 0 ? (
                                locations.map(l => (
                                    <option key={l.id} value={l.id}>{l.name}</option>
                                ))
                            ) : (
                                <option value="harare">Harare</option>
                            )}
                        </select>
                        <Link
                            href="/dashboard/bundles/new"
                            className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-900/20 flex-shrink-0 whitespace-nowrap"
                        >
                            <Plus className="w-5 h-5 transition-transform group-hover:scale-110" />
                            <span>Create Bundle</span>
                        </Link>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-bold">
                            <tr>
                                <th className="px-6 py-4 text-left">Bundle</th>
                                <th className="px-6 py-4 text-left">Location</th>
                                <th className="px-6 py-4 text-left">Price</th>
                                <th className="px-6 py-4 text-left">Items</th>
                                <th className="px-6 py-4 text-left">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-4"><div className="h-12 bg-gray-50 rounded-lg"></div></td>
                                    </tr>
                                ))
                            ) : bundles.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">
                                        No bundles found for {locationId}. Create your first grocery bundle!
                                    </td>
                                </tr>
                            ) : (
                                bundles.map((bundle) => (
                                    <tr key={bundle.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                    {bundle.imageUrls?.[0] ? (
                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                        <img src={bundle.imageUrls[0]} alt={bundle.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                            <Package className="w-6 h-6" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">{bundle.name}</div>
                                                    <div className="text-xs text-gray-500 truncate max-w-[200px]">{bundle.description}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 capitalize font-medium text-gray-600">
                                            {bundle.locationId}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-green-700">${bundle.pricing.price.toFixed(2)}</div>
                                            {bundle.pricing.compareAtPrice && (
                                                <div className="text-xs text-gray-400 line-through">${bundle.pricing.compareAtPrice.toFixed(2)}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-600 text-xs">
                                            {bundle.items?.length || 0} products
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${bundle.isActive
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {bundle.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleToggleActive(bundle)}
                                                    title={bundle.isActive ? "Deactivate" : "Activate"}
                                                    className={`p-2 rounded-lg transition-colors ${bundle.isActive
                                                        ? 'text-orange-600 hover:bg-orange-50'
                                                        : 'text-green-600 hover:bg-green-50'
                                                        }`}
                                                >
                                                    {bundle.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                                                </button>
                                                <Link
                                                    href={`/dashboard/bundles/${bundle.id}`}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit Bundle"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(bundle.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Bundle"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </RoleGuard>
    );
}
