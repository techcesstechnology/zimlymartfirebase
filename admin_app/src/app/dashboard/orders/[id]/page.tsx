'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ordersService } from '@/services/adminFirestoreService';
import { Order, OrderStatus, OrderLineItem } from '@/types/models';
import { useAuth } from '@/context/AuthContext';
import RoleGuard from '@/components/RoleGuard';
import {
    ChevronLeft, Package, MapPin, User, CreditCard,
    CheckCircle2, Clock, Truck, XCircle, AlertCircle, ShoppingBag,
} from 'lucide-react';
import Link from 'next/link';

// ─── Status config ─────────────────────────────────────────────────────────
const STATUS_FLOW: OrderStatus[] = [
    'pending_payment', 'paid', 'processing', 'packed',
    'out_for_delivery', 'delivered', 'cancelled', 'failed',
];

const VALID_NEXT: Record<OrderStatus, OrderStatus[]> = {
    pending_payment: ['paid', 'cancelled', 'failed'],
    paid: ['processing'],
    processing: ['packed'],
    packed: ['out_for_delivery'],
    out_for_delivery: ['delivered', 'failed'],
    delivered: [],
    cancelled: [],
    failed: [],
};

const STATUS_CONFIG: Record<OrderStatus, { color: string; bg: string; label: string; icon: React.ElementType }> = {
    pending_payment: { color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', label: 'Pending Payment', icon: Clock },
    paid: { color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', label: 'Paid', icon: CreditCard },
    processing: { color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200', label: 'Processing', icon: Package },
    packed: { color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', label: 'Packed', icon: Package },
    out_for_delivery: { color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', label: 'Out for Delivery', icon: Truck },
    delivered: { color: 'text-green-700', bg: 'bg-green-50 border-green-200', label: 'Delivered', icon: CheckCircle2 },
    cancelled: { color: 'text-red-700', bg: 'bg-red-50 border-red-200', label: 'Cancelled', icon: XCircle },
    failed: { color: 'text-red-800', bg: 'bg-red-100 border-red-300', label: 'Failed', icon: AlertCircle },
};

const PAYMENT_LABEL: Record<string, string> = {
    pending: 'Pending', paid: 'Paid', failed: 'Failed', refunded: 'Refunded',
};

// ─── Status timeline progress bar ──────────────────────────────────────────
const PROGRESS_STEPS: OrderStatus[] = [
    'pending_payment', 'paid', 'processing', 'packed', 'out_for_delivery', 'delivered',
];

function StatusTimeline({ current }: { current: OrderStatus }) {
    const idx = PROGRESS_STEPS.indexOf(current);
    const isTerminal = current === 'cancelled' || current === 'failed';
    return (
        <div className="flex items-center gap-0">
            {PROGRESS_STEPS.map((s, i) => {
                const done = !isTerminal && idx >= i;
                const active = !isTerminal && idx === i;
                const cfg = STATUS_CONFIG[s];
                const Icon = cfg.icon;
                return (
                    <div key={s} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${done ? 'bg-green-600 border-green-600' : active ? 'border-green-600 bg-white' : 'border-gray-200 bg-white'}`}>
                                <Icon className={`w-4 h-4 ${done ? 'text-white' : active ? 'text-green-600' : 'text-gray-300'}`} />
                            </div>
                            <span className={`text-[9px] mt-1 font-semibold uppercase tracking-tight text-center max-w-[54px] leading-tight ${done || active ? 'text-gray-700' : 'text-gray-300'}`}>
                                {cfg.label}
                            </span>
                        </div>
                        {i < PROGRESS_STEPS.length - 1 && (
                            <div className={`h-0.5 flex-1 mx-1 mb-5 transition-all ${!isTerminal && idx > i ? 'bg-green-500' : 'bg-gray-200'}`} />
                        )}
                    </div>
                );
            })}
            {isTerminal && (
                <div className="ml-4 flex items-center gap-1.5">
                    {current === 'cancelled'
                        ? <XCircle className="w-5 h-5 text-red-500" />
                        : <AlertCircle className="w-5 h-5 text-red-700" />}
                    <span className={`text-sm font-bold ${current === 'cancelled' ? 'text-red-500' : 'text-red-700'}`}>
                        {STATUS_CONFIG[current].label}
                    </span>
                </div>
            )}
        </div>
    );
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { adminUser } = useAuth();
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        ordersService.get(id).then(o => {
            if (!o) router.replace('/dashboard/orders');
            else setOrder(o);
            setLoading(false);
        }).catch(() => { setLoading(false); setError('Failed to load order.'); });
    }, [id, router]);

    const handleStatusUpdate = async (newStatus: OrderStatus) => {
        if (!order || !adminUser) return;
        setUpdating(true);
        setError('');
        try {
            await ordersService.updateStatus(order.id, newStatus, adminUser.displayName);
            setOrder({ ...order, status: newStatus });
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Status update failed.');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <div className="animate-spin h-10 w-10 rounded-full border-4 border-green-600 border-t-transparent" />
        </div>
    );

    if (!order) return null;

    const statusCfg = STATUS_CONFIG[order.status];
    const StatusIcon = statusCfg.icon;
    const nextStatuses = VALID_NEXT[order.status];
    const subtotal = order.subtotal ?? (order.items?.reduce((s, i) => s + i.priceSnapshot * i.quantity, 0) ?? 0);
    const deliveryFee = order.deliveryFee ?? 0;

    return (
        <RoleGuard permission="orders.read">
            <div className="p-8 max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/dashboard/orders" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6 text-gray-600" />
                    </Link>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900 font-mono">
                                {order.orderNumber}
                            </h1>
                            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${statusCfg.bg} ${statusCfg.color}`}>
                                <StatusIcon className="w-4 h-4" />
                                {statusCfg.label}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${order.paymentStatus === 'paid' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
                                Payment: {PAYMENT_LABEL[order.paymentStatus] ?? order.paymentStatus}
                            </span>
                        </div>
                        <p className="text-gray-400 text-sm mt-1">
                            Placed {order.createdAt?.toDate?.()?.toLocaleString?.() ?? '—'}
                        </p>
                    </div>
                </div>

                {/* Status Timeline */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 overflow-x-auto">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-5">Order Progress</h2>
                    <StatusTimeline current={order.status} />
                </div>

                {/* Status Actions */}
                {nextStatuses.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Advance Status</h2>
                        {error && <p className="text-sm text-red-600 mb-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                        <div className="flex flex-wrap gap-3">
                            {nextStatuses.map(ns => {
                                const cfg = STATUS_CONFIG[ns];
                                const isDestructive = ns === 'cancelled' || ns === 'failed';
                                return (
                                    <button
                                        key={ns}
                                        onClick={() => handleStatusUpdate(ns)}
                                        disabled={updating}
                                        className={`px-5 py-2 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 border ${isDestructive
                                            ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                                            : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                                            }`}
                                    >
                                        {updating ? 'Updating…' : `→ ${cfg.label}`}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-3 gap-6">

                    {/* Order Items */}
                    <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5 text-gray-500" />
                            <h2 className="font-bold text-gray-800">Order Items</h2>
                        </div>

                        {order.items && order.items.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                                {order.items.map((item: OrderLineItem) => (
                                    <div key={item.lineId} className="flex items-center gap-4 px-6 py-4">
                                        {item.imageSnapshot ? (
                                            <img src={item.imageSnapshot} alt={item.nameSnapshot}
                                                className="w-14 h-14 rounded-xl object-cover bg-gray-50 border border-gray-100 shrink-0" />
                                        ) : (
                                            <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                                                <Package className="w-6 h-6 text-gray-300" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-900 truncate">{item.nameSnapshot}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${item.type === 'bundle' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {item.type}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    ${item.priceSnapshot.toFixed(2)} each
                                                </span>
                                            </div>
                                            {item.type === 'bundle' && item.components && (
                                                <p className="text-xs text-gray-400 mt-1 truncate">
                                                    Contains: {item.components.map(c => c.name).join(', ')}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="font-bold text-gray-900">
                                                ${(item.priceSnapshot * item.quantity).toFixed(2)}
                                            </p>
                                            <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="px-6 py-12 text-center text-gray-400 italic text-sm">
                                No line items recorded for this order.
                            </div>
                        )}

                        {/* Totals */}
                        <div className="border-t border-gray-100 px-6 py-4 space-y-2 bg-gray-50/50">
                            {subtotal > 0 && (
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Subtotal</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                            )}
                            {deliveryFee > 0 && (
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Delivery Fee</span>
                                    <span>${deliveryFee.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-200 mt-1">
                                <span>Total</span>
                                <span>${order.total?.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right column */}
                    <div className="space-y-5">

                        {/* Delivery Info */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <h3 className="font-bold text-gray-800 text-sm">Delivery</h3>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-semibold">City / Area</p>
                                    <p className="font-medium text-gray-700 capitalize mt-0.5">
                                        {order.city} — {order.areaName || '—'}
                                    </p>
                                </div>
                                {order.deliveryAddressText && (
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-semibold">Address</p>
                                        <p className="font-medium text-gray-700 mt-0.5">{order.deliveryAddressText}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recipient */}
                        {(order.recipientName || order.recipientPhone) && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <User className="w-4 h-4 text-gray-400" />
                                    <h3 className="font-bold text-gray-800 text-sm">Recipient</h3>
                                </div>
                                <div className="space-y-2 text-sm">
                                    {order.recipientName && (
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase font-semibold">Name</p>
                                            <p className="font-medium text-gray-700 mt-0.5">{order.recipientName}</p>
                                        </div>
                                    )}
                                    {order.recipientPhone && (
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase font-semibold">Phone</p>
                                            <p className="font-medium text-gray-700 mt-0.5">{order.recipientPhone}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Customer */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <User className="w-4 h-4 text-gray-400" />
                                <h3 className="font-bold text-gray-800 text-sm">Customer</h3>
                            </div>
                            <p className="text-xs text-gray-400 uppercase font-semibold">User ID</p>
                            <p className="font-mono text-xs text-gray-600 mt-0.5 break-all">{order.userId}</p>
                        </div>

                    </div>
                </div>
            </div>
        </RoleGuard>
    );
}
