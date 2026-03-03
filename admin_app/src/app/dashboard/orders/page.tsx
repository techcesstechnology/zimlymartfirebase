'use client';

import { useEffect, useState } from 'react';
import { ordersService } from '@/services/adminFirestoreService';
import { Order, OrderStatus } from '@/types/models';
import RoleGuard from '@/components/RoleGuard';
import { Filter } from 'lucide-react';

const STATUS_FLOW: OrderStatus[] = [
    'pending_payment', 'paid', 'processing', 'packed', 'out_for_delivery', 'delivered', 'cancelled', 'failed',
];

const STATUS_COLORS: Record<string, string> = {
    pending_payment: 'bg-yellow-50 text-yellow-700',
    paid: 'bg-blue-50 text-blue-700',
    processing: 'bg-indigo-50 text-indigo-700',
    packed: 'bg-purple-50 text-purple-700',
    out_for_delivery: 'bg-orange-50 text-orange-700',
    delivered: 'bg-green-50 text-green-700',
    cancelled: 'bg-red-50 text-red-700',
    failed: 'bg-red-100 text-red-800',
};

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [statusFilter, setStatus] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        ordersService.list({ status: statusFilter || undefined }).then(o => {
            setOrders(o); setLoading(false);
        });
    }, [statusFilter]);

    return (
        <RoleGuard permission="orders.read">
            <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <select value={statusFilter} onChange={e => setStatus(e.target.value)}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 bg-white">
                            <option value="">All Statuses</option>
                            {STATUS_FLOW.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                        </select>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                            <tr>
                                {['Order #', 'Customer', 'Location', 'Total', 'Status', 'Payment', 'Date'].map(h => (
                                    <th key={h} className="px-6 py-3 text-left font-medium">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading
                                ? Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i}><td colSpan={7} className="px-6 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                                ))
                                : orders.map(o => (
                                    <tr key={o.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                                        <td className="px-6 py-4 font-mono font-semibold text-gray-800">{o.orderNumber}</td>
                                        <td className="px-6 py-4 text-gray-600 font-mono text-xs">{o.userId.slice(0, 8)}…</td>
                                        <td className="px-6 py-4 text-gray-500 capitalize">{o.locationId}</td>
                                        <td className="px-6 py-4 font-bold">${o.total?.toFixed(2)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs rounded-full font-medium capitalize ${STATUS_COLORS[o.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                                {o.status?.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${o.paymentStatus === 'paid' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                                                {o.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">
                                            {o.createdAt?.toDate?.()?.toLocaleDateString?.() ?? '—'}
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
