'use client';

import { useEffect, useState } from 'react';
import { ShoppingCart, Truck, AlertTriangle, DollarSign, Database, Loader2 } from 'lucide-react';
import { ordersService, inventoryService, deliveriesService } from '@/services/adminFirestoreService';
import { Order } from '@/types/models';
import { seedInitialData } from '@/lib/seed-data';

interface Stats {
    ordersToday: number;
    revenueToday: number;
    pendingDeliveries: number;
    lowStockItems: number;
}

function StatCard({ title, value, icon: Icon, color, sub }: { title: string, value: string | number, icon: React.ElementType, color: string, sub?: string }) {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start gap-4">
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium">{title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
                {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const [stats, setStats] = useState<Stats>({ ordersToday: 0, revenueToday: 0, pendingDeliveries: 0, lowStockItems: 0 });
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);

    const locationId = 'harare'; // Default inventory location
    const city = 'harare'; // Default city

    const loadData = async () => {
        setLoading(true);
        try {
            const [allOrders, deliveries, lowStock] = await Promise.all([
                ordersService.list({ city: city }),
                deliveriesService.listByCityArea(city),
                inventoryService.getLowStock(locationId)
            ]);

            const today = new Date(); today.setHours(0, 0, 0, 0);
            const ordersToday = allOrders.filter(o => {
                const d = o.createdAt?.toDate?.() || new Date();
                return d >= today;
            });

            const revenueToday = ordersToday
                .filter(o => o.paymentStatus === 'paid')
                .reduce((sum, o) => sum + (o.total || 0), 0);

            setStats({
                ordersToday: ordersToday.length,
                revenueToday: revenueToday,
                pendingDeliveries: deliveries.length,
                lowStockItems: lowStock.length,
            });
            setRecentOrders(allOrders.slice(0, 5));
        } catch (error) {
            console.error('Dashboard load failed:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSeed = async () => {
        setSeeding(true);
        try {
            await seedInitialData();
            await loadData();
        } catch (err) {
            console.error('Seed failed:', err);
            alert('Failed to seed data. See console.');
        } finally {
            setSeeding(false);
        }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <div className="animate-spin h-10 w-10 rounded-full border-4 border-green-600 border-t-transparent" />
        </div>
    );

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-500 mb-8">Welcome back. Here&apos;s what&apos;s happening today.</p>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard title="Orders Today" value={stats.ordersToday} icon={ShoppingCart} color="bg-blue-500" sub="across all locations" />
                <StatCard title="Revenue Today" value={`$${stats.revenueToday.toFixed(2)}`} icon={DollarSign} color="bg-green-500" sub="from paid orders" />
                <StatCard title="Pending Deliveries" value={stats.pendingDeliveries} icon={Truck} color="bg-orange-500" sub="in queue or in-transit" />
                <StatCard title="Low Stock Items" value={stats.lowStockItems} icon={AlertTriangle} color="bg-red-500" sub="at or below reorder level" />
            </div>

            {/* Recent Orders Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-800">Recent Orders</h2>
                </div>
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                            {['Order #', 'Status', 'Total', 'Location', 'Date'].map(h => (
                                <th key={h} className="px-6 py-3 text-left font-medium">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {recentOrders.map((order: Order) => (
                            <tr key={order.id} className="hover:bg-gray-50 cursor-pointer transition-colors">
                                <td className="px-6 py-4 font-mono font-medium">{order.orderNumber}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium capitalize">
                                        {order.status?.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-semibold">${order.total?.toFixed(2)}</td>
                                <td className="px-6 py-4 text-gray-500">{order.locationId}</td>
                                <td className="px-6 py-4 text-gray-400">
                                    {order.createdAt?.toDate?.()?.toLocaleDateString?.() ?? '—'}
                                </td>
                            </tr>
                        ))}
                        {recentOrders.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center py-20">
                                    <p className="text-gray-400 mb-4">No orders found</p>
                                    <button
                                        onClick={handleSeed}
                                        disabled={seeding}
                                        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-green-900/20 disabled:opacity-50"
                                    >
                                        {seeding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
                                        Seed Sample Data
                                    </button>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
