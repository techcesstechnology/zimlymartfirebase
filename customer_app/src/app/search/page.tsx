"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import BundleCard from "@/components/BundleCard";
import { useLocationStore } from "@/store/useLocationStore";
import { FirebaseCommerceService } from "@/services/FirebaseCommerceService";
import { InventoryItem, Bundle } from "@/types/commerce";
import { Search, PackageOpen, MapPin } from "lucide-react";
import AreaPicker from "@/components/AreaPicker";

const commerceService = new FirebaseCommerceService();

function SearchResults() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams.get("q")?.trim() ?? "";

    const { area, city } = useLocationStore();
    const [products, setProducts] = useState<InventoryItem[]>([]);
    const [bundles, setBundles] = useState<Bundle[]>([]);
    const [loading, setLoading] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [inputValue, setInputValue] = useState(query);

    // Location slug for ProductCard links
    const locationSlug = city.toLowerCase();

    useEffect(() => {
        setInputValue(query);
    }, [query]);

    useEffect(() => {
        if (!query || !area) {
            setProducts([]);
            setBundles([]);
            return;
        }

        setLoading(true);
        const q = query.toLowerCase();

        Promise.all([
            commerceService.getProductsByLocation(area.id),
            commerceService.getBundles(area.id),
        ]).then(([allProducts, allBundles]) => {
            setProducts(
                allProducts.filter(p =>
                    p.name?.toLowerCase().includes(q) ||
                    p.brand?.toLowerCase().includes(q) ||
                    p.sku?.toLowerCase().includes(q)
                )
            );
            setBundles(
                allBundles.filter(b =>
                    b.name?.toLowerCase().includes(q) ||
                    b.description?.toLowerCase().includes(q) ||
                    b.tags?.some(t => t.toLowerCase().includes(q))
                )
            );
        }).catch(console.error).finally(() => setLoading(false));
    }, [query, area]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const q = inputValue.trim();
        if (!q) return;
        router.push(`/search?q=${encodeURIComponent(q)}`);
    };

    const totalResults = products.length + bundles.length;

    return (
        <main className="min-h-screen bg-gray-50">
            <Header />

            <div className="container mx-auto px-4 py-8 max-w-6xl">

                {/* Search bar */}
                <form onSubmit={handleSearch} className="flex gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                        <input
                            type="text"
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            placeholder="Search groceries, bundles..."
                            autoFocus
                            className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 pl-12 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-6 py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl transition-all shadow-sm"
                    >
                        Search
                    </button>
                </form>

                {/* Location context */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        {query && (
                            <>
                                <span>
                                    {loading ? "Searching…" : `${totalResults} result${totalResults !== 1 ? "s" : ""} for`}
                                </span>
                                <span className="font-bold text-gray-900">&ldquo;{query}&rdquo;</span>
                            </>
                        )}
                    </div>

                    <button
                        onClick={() => setPickerOpen(true)}
                        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 transition-colors bg-white border border-gray-200 px-3 py-1.5 rounded-xl"
                    >
                        <MapPin className="w-3.5 h-3.5" />
                        {area ? area.name : "Choose area"}
                    </button>
                </div>

                {/* No area selected */}
                {!area && query && (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                        <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <h3 className="font-bold text-gray-700 mb-1">Select your delivery area</h3>
                        <p className="text-sm text-gray-400 mb-4">We show products available in your suburb.</p>
                        <button
                            onClick={() => setPickerOpen(true)}
                            className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-green-700 transition-all text-sm"
                        >
                            Choose Area
                        </button>
                    </div>
                )}

                {/* Loading skeletons */}
                {loading && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100 animate-pulse">
                                <div className="aspect-square bg-gray-100" />
                                <div className="p-3 space-y-2">
                                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Results */}
                {!loading && query && area && (
                    <>
                        {/* Bundles */}
                        {bundles.length > 0 && (
                            <section className="mb-8">
                                <h2 className="text-base font-bold text-gray-700 mb-4 flex items-center gap-2">
                                    Bundles
                                    <span className="text-xs bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">
                                        {bundles.length}
                                    </span>
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                                    {bundles.map(b => (
                                        <BundleCard key={b.id} bundle={b} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Products */}
                        {products.length > 0 && (
                            <section>
                                <h2 className="text-base font-bold text-gray-700 mb-4 flex items-center gap-2">
                                    Products
                                    <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">
                                        {products.length}
                                    </span>
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {products.map(item => (
                                        <ProductCard key={item.id} item={item} locationSlug={locationSlug} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* No results */}
                        {totalResults === 0 && (
                            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
                                <PackageOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-600 mb-2">No results found</h3>
                                <p className="text-gray-400 text-sm mb-1">
                                    No products matching &ldquo;{query}&rdquo; in{" "}
                                    <strong>{area.name}</strong>.
                                </p>
                                <p className="text-gray-400 text-sm">
                                    Try a different search term or{" "}
                                    <button onClick={() => setPickerOpen(true)} className="text-green-600 font-semibold hover:underline">
                                        switch your area
                                    </button>.
                                </p>
                            </div>
                        )}
                    </>
                )}

                {/* No query yet */}
                {!query && (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
                        <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <h3 className="font-bold text-gray-600 mb-1">What are you looking for?</h3>
                        <p className="text-sm text-gray-400">
                            Type a product name, brand, or category above.
                        </p>
                    </div>
                )}
            </div>

            <AreaPicker isOpen={pickerOpen} onClose={() => setPickerOpen(false)} />
        </main>
    );
}

// Suspense boundary required for useSearchParams() in Next.js App Router
export default function SearchPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-gray-50">
                <Header />
                <div className="container mx-auto px-4 py-12 text-center">
                    <div className="animate-spin h-8 w-8 rounded-full border-4 border-green-600 border-t-transparent mx-auto" />
                </div>
            </main>
        }>
            <SearchResults />
        </Suspense>
    );
}
