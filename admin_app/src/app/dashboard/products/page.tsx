'use client';

import { useEffect, useState } from 'react';
import { productsService } from '@/services/adminFirestoreService';
import { Product } from '@/types/models';
import RoleGuard from '@/components/RoleGuard';
import { Plus, Search, Archive, Edit, Tag } from 'lucide-react';
import Link from 'next/link';

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        productsService.list().then(p => { setProducts(p); setLoading(false); });
    }, []);

    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.brandName || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.cityName || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <RoleGuard permission="products.read">
            <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                        <p className="text-gray-500 text-sm mt-1">{products.length} total products</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/dashboard/products/entry"
                            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-medium hover:bg-gray-200 transition-all border border-gray-200">
                            <Tag className="w-4 h-4" /> Spreadsheet Entry
                        </Link>
                        <Link href="/dashboard/products/new"
                            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-green-700 transition-all shadow-sm">
                            <Plus className="w-4 h-4" /> New Product
                        </Link>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name, brand, or city..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none shadow-sm" />
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4 text-left">Product</th>
                                <th className="px-6 py-4 text-left">Brand</th>
                                <th className="px-6 py-4 text-left">Category</th>
                                <th className="px-6 py-4 text-right">Cost ($)</th>
                                <th className="px-6 py-4 text-right">Markup%</th>
                                <th className="px-6 py-4 text-right">Selling ($)</th>
                                <th className="px-6 py-4 text-left">City</th>
                                <th className="px-6 py-4 text-left">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}><td colSpan={9} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={9} className="px-6 py-12 text-center text-gray-400 italic">No products found matching your search.</td></tr>
                            ) : filtered.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {p.imageUrl ? (
                                                <img src={p.imageUrl} className="w-10 h-10 rounded-lg object-cover bg-gray-50 border border-gray-100" />
                                            ) : p.imageUrls?.[0] ? (
                                                <img src={p.imageUrls[0]} className="w-10 h-10 rounded-lg object-cover bg-gray-50 border border-gray-100" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300">
                                                    <Tag className="w-5 h-5" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-semibold text-gray-900 line-clamp-1">{p.name}</p>
                                                <p className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase">{p.unitLabel || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{p.brandName || '-'}</td>
                                    <td className="px-6 py-4 text-gray-600">{p.categoryName || '-'}</td>
                                    <td className="px-6 py-4 text-right font-mono text-gray-500">${p.unitCostPrice?.toFixed(2) || '0.00'}</td>
                                    <td className="px-6 py-4 text-right font-mono text-gray-500">{p.markupPercent || 0}%</td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-green-700">${p.finalPrice?.toFixed(2) || '0.00'}</td>
                                    <td className="px-6 py-4 text-gray-600 font-medium">{(p.cityName || '-').split(',')[0]}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold uppercase tracking-tight ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                                            {p.isActive ? 'Active' : 'Offline'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-1">
                                            <Link href={`/dashboard/products/${p.id}/edit`} className="p-2 hover:bg-green-50 rounded-lg text-gray-400 hover:text-green-600 transition-colors">
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                            <button onClick={() => {
                                                if (!confirm(`Archive "${p.name}"?`)) return;
                                                productsService.archive(p.id)
                                                    .then(() => setProducts(prev => prev.map(x => x.id === p.id ? { ...x, isActive: false } : x)))
                                                    .catch(() => alert('Failed to archive product'));
                                            }}
                                                className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                                                <Archive className="w-4 h-4" />
                                            </button>
                                        </div>
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
