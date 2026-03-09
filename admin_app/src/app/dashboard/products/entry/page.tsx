'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { productsService, brandsService, categoriesService, locationsService, storageService } from '@/services/adminFirestoreService';
import { Brand, Category, Location, DeliveryArea } from '@/types/models';
import RoleGuard from '@/components/RoleGuard';
import { Plus, Trash2, Save, Image as ImageIcon, Loader2, Search, X, MapPin, ChevronDown, TrendingUp } from 'lucide-react';
import clsx from 'clsx';

interface ProductRow {
    id: string;
    name: string;
    brandId: string;
    brandName: string;
    categoryId: string;
    categoryName: string;
    unitLabel: string;
    unitCostPrice: number;
    markupPercent: number;
    finalPrice: number;
    cityId: string;
    cityName: string;
    areaIds: string[];
    areaNames: string[];
    imageUrl: string;
    isActive: boolean;
    uploading: boolean;
    error?: string;
}

// ─── Searchable Combobox ──────────────────────────────────────────────────────

function SearchableSelect({
    value,
    options,
    placeholder,
    onChange,
}: {
    value: string;
    options: { id: string; name: string }[];
    placeholder: string;
    onChange: (id: string, name: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const ref = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selected = options.find(o => o.id === value);
    const filtered = query
        ? options.filter(o => o.name.toLowerCase().includes(query.toLowerCase()))
        : options;

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setQuery('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleOpen = () => {
        setOpen(true);
        setQuery('');
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    return (
        <div ref={ref} className="relative w-full">
            <button
                type="button"
                onClick={handleOpen}
                className="w-full flex items-center justify-between gap-1 px-2 py-1.5 text-sm text-left hover:bg-gray-50 rounded transition-colors group"
            >
                <span className={clsx('truncate', selected ? 'text-gray-900' : 'text-gray-400 text-xs italic')}>
                    {selected?.name ?? placeholder}
                </span>
                <ChevronDown className={clsx('w-3 h-3 flex-shrink-0 text-gray-300 group-hover:text-gray-500 transition-transform', open && 'rotate-180')} />
            </button>

            {open && (
                <div className="absolute top-full left-0 z-50 mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden">
                    <div className="p-2 border-b border-gray-100">
                        <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-50 rounded-lg border border-gray-200 focus-within:border-green-400 transition-colors">
                            <Search className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search..."
                                className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400"
                            />
                            {query && (
                                <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="max-h-44 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <p className="px-3 py-3 text-xs text-gray-400 italic text-center">No results for "{query}"</p>
                        ) : filtered.map(o => (
                            <button
                                key={o.id}
                                type="button"
                                onClick={() => { onChange(o.id, o.name); setOpen(false); setQuery(''); }}
                                className={clsx(
                                    'w-full text-left px-3 py-2 text-xs transition-colors',
                                    o.id === value
                                        ? 'bg-green-50 text-green-700 font-semibold'
                                        : 'text-gray-700 hover:bg-gray-50'
                                )}
                            >
                                {o.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Location Tag Selector ────────────────────────────────────────────────────

function LocationTagSelector({
    row,
    locations,
    allAreas,
    onUpdate,
}: {
    row: ProductRow;
    locations: Location[];
    allAreas: DeliveryArea[];
    onUpdate: (updates: Partial<ProductRow>) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const cityAreas = allAreas.filter(a => a.city === row.cityName);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const toggleArea = (areaId: string) => {
        const next = row.areaIds.includes(areaId)
            ? row.areaIds.filter(id => id !== areaId)
            : [...row.areaIds, areaId];
        onUpdate({ areaIds: next, areaNames: allAreas.filter(a => next.includes(a.id)).map(a => a.name) });
    };

    const removeArea = (areaId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        toggleArea(areaId);
    };

    const selectAll = () => onUpdate({ areaIds: cityAreas.map(a => a.id), areaNames: cityAreas.map(a => a.name) });
    const clearAll = () => onUpdate({ areaIds: [], areaNames: [] });

    return (
        <div ref={ref} className="relative min-w-[240px] space-y-1">
            {/* City selector */}
            <select
                value={row.cityId}
                onChange={e => {
                    const loc = locations.find(l => l.id === e.target.value);
                    onUpdate({ cityId: e.target.value, cityName: loc?.name ?? '', areaIds: [], areaNames: [] });
                    setOpen(false);
                }}
                title="Select City"
                className="w-full px-2 py-1 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg outline-none cursor-pointer focus:border-green-400 transition-colors"
            >
                <option value="">Choose city…</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>

            {/* Suburb pill tags + dropdown trigger */}
            {row.cityId && (
                <button
                    type="button"
                    onClick={() => setOpen(o => !o)}
                    className="w-full text-left"
                >
                    <div className={clsx(
                        'flex flex-wrap gap-1 min-h-[26px] p-1 rounded-lg border transition-colors',
                        open ? 'border-green-400 bg-green-50/50' : 'border-gray-200 hover:border-green-300'
                    )}>
                        {row.areaIds.length === 0 ? (
                            <span className="flex items-center gap-1 text-[10px] text-gray-400 italic px-1">
                                <MapPin className="w-3 h-3" /> Select suburbs…
                            </span>
                        ) : row.areaIds.map((areaId, i) => (
                            <span
                                key={areaId}
                                className="flex items-center gap-0.5 pl-2 pr-1 py-0.5 bg-green-600 text-white text-[10px] rounded-full font-medium"
                            >
                                {row.areaNames[i]}
                                <button
                                    type="button"
                                    onClick={e => removeArea(areaId, e)}
                                    className="ml-0.5 hover:bg-green-700 rounded-full p-0.5 transition-colors"
                                >
                                    <X className="w-2.5 h-2.5" />
                                </button>
                            </span>
                        ))}
                    </div>
                </button>
            )}

            {/* Dropdown panel */}
            {open && row.cityId && (
                <div className="absolute top-full left-0 z-50 mt-1 w-60 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                            {row.cityName}
                        </span>
                        <div className="flex gap-2">
                            <button onClick={selectAll} className="text-[10px] text-green-600 hover:underline font-semibold">All</button>
                            <span className="text-gray-300">|</span>
                            <button onClick={clearAll} className="text-[10px] text-red-500 hover:underline font-semibold">Clear</button>
                        </div>
                    </div>

                    <div className="max-h-44 overflow-y-auto p-1.5 space-y-0.5">
                        {cityAreas.length === 0 ? (
                            <p className="px-2 py-3 text-xs text-gray-400 italic text-center">No suburbs for this city</p>
                        ) : cityAreas.map(area => (
                            <label
                                key={area.id}
                                className={clsx(
                                    'flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors text-xs',
                                    row.areaIds.includes(area.id)
                                        ? 'bg-green-50 text-green-800'
                                        : 'hover:bg-gray-50 text-gray-700'
                                )}
                            >
                                <input
                                    type="checkbox"
                                    checked={row.areaIds.includes(area.id)}
                                    onChange={() => toggleArea(area.id)}
                                    className="w-3.5 h-3.5 text-green-600 rounded border-gray-300 focus:ring-green-500"
                                />
                                <span className="flex-1 font-medium">{area.name}</span>
                                <span className="text-[10px] text-gray-400 font-mono">${area.fee}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProductEntryPage() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [allAreas, setAllAreas] = useState<DeliveryArea[]>([]);
    const [rows, setRows] = useState<ProductRow[]>([]);
    const [saving, setSaving] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [b, c, l, a] = await Promise.all([
                    brandsService.list(),
                    categoriesService.list(),
                    locationsService.list(),
                    locationsService.listAreas(),
                ]);
                setBrands(b);
                setCategories(c);
                setLocations(l);
                setAllAreas(a);
                addEmptyRow();
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingData(false);
            }
        };
        loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const makeEmptyRow = (): ProductRow => ({
        id: Math.random().toString(36).slice(2, 11),
        name: '', brandId: '', brandName: '', categoryId: '', categoryName: '',
        unitLabel: '', unitCostPrice: 0, markupPercent: 0, finalPrice: 0,
        cityId: '', cityName: '', areaIds: [], areaNames: [],
        imageUrl: '', isActive: true, uploading: false,
    });

    const addEmptyRow = () => setRows(prev => [...prev, makeEmptyRow()]);

    const removeRow = (id: string) => setRows(prev => prev.filter(r => r.id !== id));

    const updateRow = useCallback((id: string, updates: Partial<ProductRow>) => {
        setRows(prev => prev.map(row => {
            if (row.id !== id) return row;
            const next = { ...row, ...updates };

            if ('unitCostPrice' in updates || 'markupPercent' in updates) {
                const cost = next.unitCostPrice || 0;
                const markup = next.markupPercent || 0;
                next.finalPrice = Number((cost * (1 + markup / 100)).toFixed(2));
            }

            return next;
        }));
    }, []);

    const handleImageUpload = async (id: string, file: File) => {
        updateRow(id, { uploading: true, error: undefined });
        try {
            const url = await storageService.uploadProductImage(file);
            updateRow(id, { imageUrl: url, uploading: false });
        } catch {
            updateRow(id, { uploading: false, error: 'Upload failed' });
        }
    };

    const saveAll = async () => {
        const invalid = rows.filter(r => !r.name || !r.categoryId || !r.brandId || !r.cityId || r.areaIds.length === 0);
        if (invalid.length > 0) {
            alert(`${invalid.length} row(s) are missing required fields.`);
            return;
        }
        setSaving(true);
        try {
            await productsService.saveSpreadsheetRows(rows.map(r => ({
                name: r.name,
                slug: r.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
                brandId: r.brandId, brandName: r.brandName,
                categoryId: r.categoryId, categoryName: r.categoryName,
                unitCostPrice: r.unitCostPrice, markupPercent: r.markupPercent, finalPrice: r.finalPrice,
                cityId: r.cityId, cityName: r.cityName,
                areaIds: r.areaIds, areaNames: r.areaNames,
                imageUrl: r.imageUrl, unitLabel: r.unitLabel,
                isActive: r.isActive,
                tags: [r.categoryName.toLowerCase(), r.brandName.toLowerCase()],
                imageUrls: r.imageUrl ? [r.imageUrl] : [],
                description: `${r.name} - ${r.unitLabel}`,
                externalSource: 'firebase' as const,
            })));
            alert('All products saved successfully!');
            setRows([makeEmptyRow()]);
        } catch (err) {
            console.error(err);
            alert('Failed to save products.');
        } finally {
            setSaving(false);
        }
    };

    if (loadingData) {
        return (
            <div className="flex items-center justify-center h-64 gap-3 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading master data…</span>
            </div>
        );
    }

    return (
        <RoleGuard permission="products.write">
            <div className="p-4 flex flex-col h-screen max-h-screen">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Product Entry</h1>
                        <p className="text-xs text-gray-500">Batch entry · {rows.length} row{rows.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={addEmptyRow}
                            className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all"
                        >
                            <Plus className="w-4 h-4" /> Add Row
                        </button>
                        <button
                            onClick={saveAll}
                            disabled={saving || rows.length === 0}
                            className="flex items-center gap-1.5 bg-green-600 text-white px-5 py-1.5 rounded-lg text-sm font-bold hover:bg-green-700 transition-all shadow disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save All
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto bg-white rounded-xl border border-gray-200 shadow-sm">
                    <table className="w-full text-left border-collapse min-w-[1500px]">
                        <thead className="sticky top-0 z-20 bg-gray-900 text-white text-[11px] uppercase tracking-wider">
                            <tr>
                                <th className="px-3 py-3 w-8">#</th>
                                <th className="px-3 py-3 w-48">Product Name *</th>
                                <th className="px-3 py-3 w-40">Category *</th>
                                <th className="px-3 py-3 w-40">Brand *</th>
                                <th className="px-3 py-3 w-20">Unit</th>
                                <th className="px-3 py-3 w-24 text-right">Cost ($)</th>
                                <th className="px-3 py-3 w-20 text-right">Markup %</th>
                                <th className="px-3 py-3 w-36 text-right bg-green-900/40">Selling Price</th>
                                <th className="px-3 py-3">Location + Suburbs *</th>
                                <th className="px-3 py-3 w-24">Image</th>
                                <th className="px-3 py-3 w-16 text-center">Active</th>
                                <th className="px-3 py-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.map((row, index) => {
                                const profit = row.finalPrice - row.unitCostPrice;
                                const hasPrice = row.unitCostPrice > 0 && row.markupPercent > 0;

                                return (
                                    <tr key={row.id} className="hover:bg-green-50/20 transition-colors">
                                        <td className="px-3 py-2 text-xs text-gray-400 font-mono">{index + 1}</td>

                                        {/* Name */}
                                        <td className="px-2 py-2">
                                            <input
                                                value={row.name}
                                                onChange={e => updateRow(row.id, { name: e.target.value })}
                                                placeholder="Product name…"
                                                className="w-full px-2 py-1.5 text-sm rounded border-transparent focus:border-green-300 focus:ring-1 focus:ring-green-300 outline-none"
                                            />
                                        </td>

                                        {/* Category — searchable */}
                                        <td className="px-2 py-2">
                                            <SearchableSelect
                                                value={row.categoryId}
                                                options={categories}
                                                placeholder="Category…"
                                                onChange={(id, name) => updateRow(row.id, { categoryId: id, categoryName: name })}
                                            />
                                        </td>

                                        {/* Brand — searchable */}
                                        <td className="px-2 py-2">
                                            <SearchableSelect
                                                value={row.brandId}
                                                options={brands}
                                                placeholder="Brand…"
                                                onChange={(id, name) => updateRow(row.id, { brandId: id, brandName: name })}
                                            />
                                        </td>

                                        {/* Unit label */}
                                        <td className="px-2 py-2">
                                            <input
                                                value={row.unitLabel}
                                                onChange={e => updateRow(row.id, { unitLabel: e.target.value })}
                                                placeholder="2L, 1kg…"
                                                className="w-full px-2 py-1.5 text-sm rounded border-transparent focus:border-green-300 focus:ring-1 focus:ring-green-300 outline-none"
                                            />
                                        </td>

                                        {/* Cost */}
                                        <td className="px-2 py-2">
                                            <input
                                                type="number" step="0.01" min="0"
                                                value={row.unitCostPrice || ''}
                                                onChange={e => updateRow(row.id, { unitCostPrice: parseFloat(e.target.value) || 0 })}
                                                placeholder="0.00"
                                                className="w-full px-2 py-1.5 text-sm text-right font-mono rounded border-transparent focus:border-green-300 focus:ring-1 focus:ring-green-300 outline-none"
                                            />
                                        </td>

                                        {/* Markup % */}
                                        <td className="px-2 py-2">
                                            <input
                                                type="number" step="0.5" min="0"
                                                value={row.markupPercent || ''}
                                                onChange={e => updateRow(row.id, { markupPercent: parseFloat(e.target.value) || 0 })}
                                                placeholder="0"
                                                className="w-full px-2 py-1.5 text-sm text-right font-mono rounded border-transparent focus:border-green-300 focus:ring-1 focus:ring-green-300 outline-none"
                                            />
                                        </td>

                                        {/* Final price — auto-calculated */}
                                        <td className="px-3 py-2 bg-green-50">
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-green-700 font-mono">
                                                    ${row.finalPrice.toFixed(2)}
                                                </div>
                                                {hasPrice && (
                                                    <div className="flex items-center justify-end gap-1 mt-0.5">
                                                        <TrendingUp className="w-2.5 h-2.5 text-green-500" />
                                                        <span className="text-[10px] text-green-600 font-medium">
                                                            +${profit.toFixed(2)} profit
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Location + suburbs */}
                                        <td className="px-2 py-2">
                                            <LocationTagSelector
                                                row={row}
                                                locations={locations}
                                                allAreas={allAreas}
                                                onUpdate={updates => updateRow(row.id, updates)}
                                            />
                                        </td>

                                        {/* Image upload */}
                                        <td className="px-2 py-2">
                                            <div className="flex items-center gap-2">
                                                {row.uploading ? (
                                                    <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                                                ) : row.imageUrl ? (
                                                    <div className="relative group">
                                                        <img src={row.imageUrl} alt="Preview" className="w-9 h-9 rounded-lg border object-cover" />
                                                        <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-1.5 bg-white shadow-2xl rounded-xl border z-50">
                                                            <img src={row.imageUrl} alt="Preview" className="w-28 h-28 object-contain" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <label className="p-2 text-gray-400 hover:text-green-600 cursor-pointer rounded-lg hover:bg-green-50 transition-colors">
                                                        <ImageIcon className="w-4 h-4" />
                                                        <input
                                                            type="file" className="hidden" accept="image/*"
                                                            onChange={e => e.target.files?.[0] && handleImageUpload(row.id, e.target.files[0])}
                                                        />
                                                    </label>
                                                )}
                                                {row.error && <span className="text-[10px] text-red-500 font-bold">!</span>}
                                            </div>
                                        </td>

                                        {/* Active */}
                                        <td className="px-3 py-2 text-center">
                                            <input
                                                type="checkbox"
                                                checked={row.isActive}
                                                onChange={e => updateRow(row.id, { isActive: e.target.checked })}
                                                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                            />
                                        </td>

                                        {/* Delete */}
                                        <td className="px-2 py-2">
                                            <button
                                                onClick={() => removeRow(row.id)}
                                                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {rows.length === 0 && (
                        <div className="p-16 text-center text-gray-400 italic text-sm">
                            No rows yet — click "Add Row" to start.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-3 flex justify-between items-center text-[10px] text-gray-400 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                    <span>* Required fields</span>
                    <span>Selling price = Cost × (1 + Markup / 100)</span>
                </div>
            </div>
        </RoleGuard>
    );
}
