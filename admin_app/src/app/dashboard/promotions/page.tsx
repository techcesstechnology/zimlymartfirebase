'use client';

import { useEffect, useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { promotionsService } from '@/services/adminFirestoreService';
import { Promotion } from '@/types/models';
import RoleGuard from '@/components/RoleGuard';
import { hasPermission } from '@/types/roles';
import { useAuth } from '@/context/AuthContext';
import {
    Plus, ToggleLeft, ToggleRight, Edit2, Trash2, X,
    Tag, Percent, DollarSign, Calendar, RefreshCw,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDateInput(ts: { seconds: number; nanoseconds: number } | undefined): string {
    if (!ts) return '';
    return new Date(ts.seconds * 1000).toISOString().split('T')[0];
}

function toTimestamp(dateStr: string): { seconds: number; nanoseconds: number } {
    const ts = Timestamp.fromDate(new Date(dateStr));
    return { seconds: ts.seconds, nanoseconds: ts.nanoseconds };
}

function generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ─── Types ────────────────────────────────────────────────────────────────────

type FormData = {
    code: string;
    discountType: 'percentage' | 'fixed';
    value: number;
    minSpend: number;
    usageLimit: number;
    startDate: string;
    endDate: string;
    locationId: string;
    isActive: boolean;
};

const DEFAULT_FORM: FormData = {
    code: '',
    discountType: 'percentage',
    value: 10,
    minSpend: 0,
    usageLimit: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    locationId: '',
    isActive: true,
};

// ─── Modal ────────────────────────────────────────────────────────────────────

function PromoModal({
    editing,
    onClose,
    onSave,
}: {
    editing: Promotion | null; // null = new
    onClose: () => void;
    onSave: () => void;
}) {
    const isNew = !editing?.id;
    const [form, setForm] = useState<FormData>(() =>
        editing?.id
            ? {
                code: editing.code,
                discountType: editing.discountType,
                value: editing.value,
                minSpend: editing.minSpend ?? 0,
                usageLimit: editing.usageLimit ?? 0,
                startDate: toDateInput(editing.startDate),
                endDate: toDateInput(editing.endDate),
                locationId: editing.locationId ?? '',
                isActive: editing.isActive,
            }
            : { ...DEFAULT_FORM, code: generateCode() }
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const f = (field: keyof FormData, value: unknown) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.code.trim()) { setError('Coupon code is required.'); return; }
        if (!form.endDate) { setError('End date is required.'); return; }
        if (form.value <= 0) { setError('Discount value must be greater than 0.'); return; }
        if (form.discountType === 'percentage' && form.value > 100) {
            setError('Percentage discount cannot exceed 100%.');
            return;
        }

        setSaving(true);
        setError('');
        try {
            const payload: Omit<Promotion, 'id' | 'usageCount'> = {
                code: form.code.toUpperCase().trim(),
                discountType: form.discountType,
                value: form.value,
                startDate: toTimestamp(form.startDate),
                endDate: toTimestamp(form.endDate),
                isActive: form.isActive,
                ...(form.minSpend > 0 && { minSpend: form.minSpend }),
                ...(form.usageLimit > 0 && { usageLimit: form.usageLimit }),
                ...(form.locationId && { locationId: form.locationId }),
            };
            await promotionsService.save(editing?.id ?? null, payload);
            onSave();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Save failed.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Panel */}
            <div className="relative h-full w-full max-w-md bg-white shadow-2xl flex flex-col overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">
                            {isNew ? 'New Promotion' : 'Edit Promotion'}
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {isNew ? 'Create a new discount code' : `Editing ${editing?.code}`}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-5">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                            {error}
                        </div>
                    )}

                    {/* Code */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5" /> Coupon Code *
                        </label>
                        <div className="flex gap-2">
                            <input
                                value={form.code}
                                onChange={e => f('code', e.target.value.toUpperCase())}
                                placeholder="e.g. SAVE20"
                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-green-500 focus:outline-none uppercase tracking-widest"
                            />
                            <button
                                type="button"
                                onClick={() => f('code', generateCode())}
                                title="Generate random code"
                                className="px-3 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-500"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Discount type */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">Discount Type *</label>
                        <div className="grid grid-cols-2 gap-3">
                            {(['percentage', 'fixed'] as const).map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => f('discountType', type)}
                                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${form.discountType === type
                                        ? 'bg-green-600 text-white border-green-600'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
                                        }`}
                                >
                                    {type === 'percentage' ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                                    {type === 'percentage' ? 'Percentage' : 'Fixed ($)'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Value */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">
                            Discount Value * {form.discountType === 'percentage' ? '(%)' : '(USD)'}
                        </label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                                {form.discountType === 'percentage' ? '%' : '$'}
                            </span>
                            <input
                                type="number"
                                min="0.01"
                                max={form.discountType === 'percentage' ? 100 : undefined}
                                step="0.01"
                                value={form.value || ''}
                                onChange={e => f('value', parseFloat(e.target.value) || 0)}
                                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Min spend + Usage limit */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">Min Spend ($)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.minSpend || ''}
                                onChange={e => f('minSpend', parseFloat(e.target.value) || 0)}
                                placeholder="0 = no minimum"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">Usage Limit</label>
                            <input
                                type="number"
                                min="0"
                                step="1"
                                value={form.usageLimit || ''}
                                onChange={e => f('usageLimit', parseInt(e.target.value) || 0)}
                                placeholder="0 = unlimited"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" /> Start Date *
                            </label>
                            <input
                                type="date"
                                value={form.startDate}
                                onChange={e => f('startDate', e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" /> End Date *
                            </label>
                            <input
                                type="date"
                                value={form.endDate}
                                min={form.startDate}
                                onChange={e => f('endDate', e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Active toggle */}
                    <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div>
                            <p className="text-sm font-semibold text-gray-700">Active</p>
                            <p className="text-xs text-gray-400">Customers can apply this code immediately</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => f('isActive', !form.isActive)}
                            className="transition-colors"
                        >
                            {form.isActive
                                ? <ToggleRight className="w-8 h-8 text-green-500" />
                                : <ToggleLeft className="w-8 h-8 text-gray-300" />
                            }
                        </button>
                    </div>

                    {/* Preview */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl p-4">
                        <p className="text-xs text-green-700 font-semibold uppercase tracking-wide mb-2">Preview</p>
                        <div className="flex items-center gap-3">
                            <div className="bg-white border border-dashed border-green-400 rounded-lg px-4 py-2">
                                <span className="font-mono font-black text-green-700 tracking-widest text-lg">
                                    {form.code || 'CODE'}
                                </span>
                            </div>
                            <div className="text-sm text-gray-700">
                                <p className="font-bold">
                                    {form.discountType === 'percentage'
                                        ? `${form.value}% off`
                                        : `$${form.value.toFixed(2)} off`}
                                </p>
                                {form.minSpend > 0 && (
                                    <p className="text-xs text-gray-400">Min spend: ${form.minSpend.toFixed(2)}</p>
                                )}
                                {form.endDate && (
                                    <p className="text-xs text-gray-400">Expires {form.endDate}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-100 p-5 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        {isNew ? 'Create Promotion' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PromotionsPage() {
    const { adminUser } = useAuth();
    const canWrite = adminUser ? hasPermission(adminUser.role, 'promotions.write') : false;

    const [promos, setPromos] = useState<Promotion[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Promotion | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        const data = await promotionsService.list();
        setPromos(data);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const openNew = () => { setEditing(null); setModalOpen(true); };
    const openEdit = (p: Promotion) => { setEditing(p); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setEditing(null); };
    const handleSaved = () => { closeModal(); load(); };

    const toggle = async (p: Promotion) => {
        await promotionsService.toggle(p.id, !p.isActive);
        load();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this promotion? This cannot be undone.')) return;
        setDeleting(id);
        try {
            await promotionsService.delete(id);
            load();
        } catch {
            alert('Failed to delete promotion.');
        } finally {
            setDeleting(null);
        }
    };

    const isExpired = (p: Promotion) => {
        const end = p.endDate?.seconds;
        if (!end) return false;
        return end * 1000 < Date.now();
    };

    return (
        <RoleGuard permission="promotions.read">
            <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Promotions & Coupons</h1>
                        <p className="text-sm text-gray-400 mt-1">{promos.length} total promotions</p>
                    </div>
                    {canWrite && (
                        <button
                            onClick={openNew}
                            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-green-700 transition-all shadow-sm"
                        >
                            <Plus className="w-4 h-4" /> New Promotion
                        </button>
                    )}
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-bold">
                            <tr>
                                {['Code', 'Type', 'Value', 'Min Spend', 'Usage', 'Expires', 'Status', 'Actions'].map(h => (
                                    <th key={h} className="px-6 py-3 text-left font-medium">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading
                                ? Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={8} className="px-6 py-3">
                                            <div className="h-4 bg-gray-100 rounded animate-pulse" />
                                        </td>
                                    </tr>
                                ))
                                : promos.length === 0
                                    ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-16 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                                        <Tag className="w-6 h-6 text-gray-300" />
                                                    </div>
                                                    <p className="text-gray-400 font-medium">No promotions yet</p>
                                                    {canWrite && (
                                                        <button onClick={openNew} className="text-green-600 text-sm font-semibold hover:underline">
                                                            Create your first coupon →
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                    : promos.map(p => {
                                        const expired = isExpired(p);
                                        return (
                                            <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="font-mono font-black text-gray-800 tracking-wider text-sm">
                                                        {p.code}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-[10px] rounded-full font-bold uppercase tracking-tight ${p.discountType === 'percentage' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                                                        {p.discountType === 'percentage' ? '%' : '$'} {p.discountType}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-gray-800">
                                                    {p.discountType === 'percentage' ? `${p.value}%` : `$${p.value.toFixed(2)}`}
                                                </td>
                                                <td className="px-6 py-4 text-gray-500">
                                                    {p.minSpend ? `$${p.minSpend.toFixed(2)}` : '—'}
                                                </td>
                                                <td className="px-6 py-4 text-gray-500">
                                                    <span className={p.usageLimit && p.usageCount >= p.usageLimit ? 'text-red-500 font-bold' : ''}>
                                                        {p.usageCount}
                                                    </span>
                                                    {' / '}
                                                    {p.usageLimit ?? '∞'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={expired ? 'text-red-500 font-semibold' : 'text-gray-400'}>
                                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                                        {(p.endDate as any)?.toDate?.()?.toLocaleDateString?.() ??
                                                            (p.endDate?.seconds ? new Date(p.endDate.seconds * 1000).toLocaleDateString() : '—')}
                                                    </span>
                                                    {expired && (
                                                        <span className="ml-1.5 text-[9px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full uppercase">
                                                            Expired
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => toggle(p)}
                                                        className="flex items-center gap-1 text-xs font-medium transition-colors"
                                                        disabled={!canWrite}
                                                    >
                                                        {p.isActive && !expired
                                                            ? <><ToggleRight className="w-5 h-5 text-green-500" /><span className="text-green-600">Active</span></>
                                                            : <><ToggleLeft className="w-5 h-5 text-gray-300" /><span className="text-gray-400">Off</span></>
                                                        }
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {canWrite && (
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => openEdit(p)}
                                                                className="p-1.5 hover:bg-green-50 text-gray-400 hover:text-green-600 rounded-lg transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(p.id)}
                                                                disabled={deleting === p.id}
                                                                className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors disabled:opacity-40"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {modalOpen && (
                <PromoModal
                    editing={editing}
                    onClose={closeModal}
                    onSave={handleSaved}
                />
            )}
        </RoleGuard>
    );
}
