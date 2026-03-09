"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { useAuthStore } from "@/store/useAuthStore";
import { useLocationStore } from "@/store/useLocationStore";
import { FirebaseCommerceService } from "@/services/FirebaseCommerceService";
import { Order } from "@/types/commerce";
import {
    User, Package, MapPin, LogOut, ChevronRight,
    ShoppingBag, Clock, CheckCircle2, Truck, XCircle, AlertCircle,
    Loader2,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";

const commerceService = new FirebaseCommerceService();

// ─── Status config ─────────────────────────────────────────────────────────
const STATUS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    pending:    { label: "Pending Payment", color: "text-yellow-700 bg-yellow-50 border-yellow-200", icon: Clock },
    confirmed:  { label: "Confirmed",       color: "text-blue-700 bg-blue-50 border-blue-200",       icon: CheckCircle2 },
    dispatched: { label: "On the Way",      color: "text-orange-700 bg-orange-50 border-orange-200", icon: Truck },
    delivered:  { label: "Delivered",       color: "text-green-700 bg-green-50 border-green-200",    icon: CheckCircle2 },
    cancelled:  { label: "Cancelled",       color: "text-red-600 bg-red-50 border-red-200",          icon: XCircle },
};

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS[status] ?? { label: status, color: "text-gray-600 bg-gray-50 border-gray-200", icon: AlertCircle };
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
            <Icon className="w-3 h-3" />
            {cfg.label}
        </span>
    );
}

// ─── Order card ─────────────────────────────────────────────────────────────
function OrderCard({ order }: { order: Order }) {
    const date = order.createdAt?.toDate?.()?.toLocaleDateString?.()
        ?? (order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : "—");

    const itemCount = order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:border-green-200 transition-colors">
            <div className="px-5 py-4 flex items-start justify-between gap-4 border-b border-gray-50">
                <div>
                    <p className="font-mono font-black text-gray-900 text-base tracking-tight">
                        {order.orderNumber}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{date}</p>
                </div>
                <StatusBadge status={order.status} />
            </div>

            <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm text-gray-500">
                    <MapPin className="w-4 h-4 text-gray-300 shrink-0" />
                    <span className="capitalize">{order.areaName || order.city}</span>
                    {itemCount > 0 && (
                        <>
                            <span className="text-gray-200">·</span>
                            <ShoppingBag className="w-4 h-4 text-gray-300 shrink-0" />
                            <span>{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
                        </>
                    )}
                </div>
                <p className="font-black text-gray-900 text-lg">${order.total?.toFixed(2)}</p>
            </div>

            {/* Item names preview */}
            {order.items && order.items.length > 0 && (
                <div className="px-5 pb-4">
                    <p className="text-xs text-gray-400 truncate">
                        {order.items.slice(0, 3).map(i => i.nameSnapshot).join(" · ")}
                        {order.items.length > 3 && ` +${order.items.length - 3} more`}
                    </p>
                </div>
            )}
        </div>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuthStore();
    const { area, city } = useLocationStore();

    const [orders, setOrders] = useState<Order[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    useEffect(() => {
        if (!user) return;
        setOrdersLoading(true);
        commerceService.getUserOrders(user.uid)
            .then(setOrders)
            .catch(console.error)
            .finally(() => setOrdersLoading(false));
    }, [user]);

    const handleLogout = async () => {
        await auth.signOut();
        router.push("/");
    };

    // ── Loading state ─────────────────────────────────────────────────────────
    if (authLoading) {
        return (
            <main className="min-h-screen bg-gray-50">
                <Header />
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                </div>
            </main>
        );
    }

    // ── Not logged in ─────────────────────────────────────────────────────────
    if (!user) {
        return (
            <main className="min-h-screen bg-gray-50">
                <Header />
                <div className="container mx-auto px-4 py-20 max-w-md text-center">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <User className="w-10 h-10 text-gray-300" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to your account</h2>
                        <p className="text-gray-500 mb-8 text-sm">
                            View your order history, saved addresses, and account details.
                        </p>
                        <Link
                            href="/login"
                            className="block w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-all shadow-sm text-center"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/register"
                            className="block w-full mt-3 border border-gray-200 hover:bg-gray-50 text-gray-700 py-3 rounded-xl font-semibold transition-all text-center"
                        >
                            Create Account
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    // ── Authenticated ─────────────────────────────────────────────────────────
    return (
        <main className="min-h-screen bg-gray-50 pb-16">
            <Header />

            {/* Profile hero card */}
            <div className="bg-white border-b border-gray-100 mb-8">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="flex items-center gap-5 py-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-200/80 shrink-0">
                            <span className="text-3xl font-black text-white">
                                {(user.displayName || user.email || "U")[0].toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl font-black text-gray-900 truncate">
                                {user.displayName || "Zimlymart User"}
                            </h1>
                            <p className="text-gray-500 text-sm truncate">{user.email}</p>
                            {area && (
                                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-400">
                                    <MapPin className="w-3.5 h-3.5 text-green-500" />
                                    <span>{city} — {area.name}</span>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 border border-red-100 rounded-xl font-semibold transition-all"
                        >
                            <LogOut className="w-4 h-4" />
                            Log Out
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-4xl">
                <div className="grid md:grid-cols-3 gap-6">

                    {/* Left: Quick links */}
                    <div className="space-y-3">
                        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1 mb-3">Account</h2>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                            <div className="px-5 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                                        <Package className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-700">Orders</p>
                                        <p className="text-xs text-gray-400">{orders.length} total</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                            </div>

                            <div className="px-5 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                                        <MapPin className="w-4 h-4 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-700">Delivery Area</p>
                                        <p className="text-xs text-gray-400">{area?.name || "Not set"}</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                            </div>
                        </div>

                        {/* Stats */}
                        {orders.length > 0 && (
                            <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl p-5 text-white shadow-md shadow-green-200">
                                <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-3">Summary</p>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm opacity-80">Total Orders</span>
                                        <span className="font-black text-lg">{orders.length}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm opacity-80">Total Spent</span>
                                        <span className="font-black text-lg">
                                            ${orders.reduce((s, o) => s + (o.total ?? 0), 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm opacity-80">Delivered</span>
                                        <span className="font-black text-lg">
                                            {orders.filter(o => o.status === "delivered").length}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Order history */}
                    <div className="md:col-span-2">
                        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1 mb-3">Order History</h2>

                        {ordersLoading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                                        <div className="flex justify-between mb-3">
                                            <div className="h-4 bg-gray-100 rounded w-32" />
                                            <div className="h-6 bg-gray-100 rounded-full w-24" />
                                        </div>
                                        <div className="h-3 bg-gray-100 rounded w-48" />
                                    </div>
                                ))}
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                                <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                <h3 className="font-bold text-gray-700 mb-1">No orders yet</h3>
                                <p className="text-sm text-gray-400 mb-6">
                                    Your orders will appear here after your first purchase.
                                </p>
                                <Link
                                    href="/"
                                    className="inline-block bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-700 transition-all text-sm"
                                >
                                    Start Shopping
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {orders
                                    .sort((a, b) => {
                                        const aTs = a.createdAt?.seconds ?? 0;
                                        const bTs = b.createdAt?.seconds ?? 0;
                                        return bTs - aTs;
                                    })
                                    .map(order => (
                                        <OrderCard key={order.id} order={order} />
                                    ))
                                }
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
