"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, MapPin, User, Search, ChevronDown, Leaf } from "lucide-react";
import { useCommerceStore } from "@/store/useCommerceStore";
import { useLocationStore } from "@/store/useLocationStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useUserSync } from "@/hooks/useUserSync";
import AreaPicker from "./AreaPicker";

export default function Header() {
    useUserSync();
    const router = useRouter();
    const { cart } = useCommerceStore();
    const { area, city } = useLocationStore();
    const { user } = useAuthStore();
    const [isAreaPickerOpen, setIsAreaPickerOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const searchRef = useRef<HTMLInputElement>(null);

    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const q = searchQuery.trim();
        if (!q) return;
        router.push(`/search?q=${encodeURIComponent(q)}`);
        setSearchQuery("");
        searchRef.current?.blur();
    };

    return (
        <>
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 shrink-0">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-emerald-500 rounded-lg flex items-center justify-center shadow-md shadow-green-200">
                            <Leaf className="w-4 h-4 text-white fill-white" />
                        </div>
                        <span className="text-xl font-black text-gray-900 tracking-tighter">
                            zimly<span className="text-green-600">mart</span>
                        </span>
                    </Link>

                    {/* Search */}
                    <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                        <input
                            ref={searchRef}
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search groceries, bundles..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all placeholder:text-gray-400"
                        />
                    </form>

                    {/* Right actions */}
                    <div className="flex items-center gap-1.5">

                        {/* Area selector */}
                        <button
                            onClick={() => setIsAreaPickerOpen(true)}
                            className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 hover:border-green-200 transition-all group"
                        >
                            <MapPin className="w-4 h-4 text-green-600 shrink-0 group-hover:scale-110 transition-transform" />
                            <div className="text-left">
                                <div className="text-[10px] text-gray-400 font-black uppercase leading-none">{city}</div>
                                <div className="flex items-center gap-0.5 mt-0.5">
                                    <span className="text-sm font-bold text-gray-800 max-w-[100px] truncate leading-none">
                                        {area?.name || "Choose Area"}
                                    </span>
                                    <ChevronDown className="w-3 h-3 text-gray-400" />
                                </div>
                            </div>
                        </button>

                        {/* Cart */}
                        <Link href="/cart" className="relative p-2.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all">
                            <ShoppingCart className="w-5 h-5" />
                            {cartCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 bg-green-600 text-white text-[10px] font-black min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 border-2 border-white shadow-sm">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        {/* Profile */}
                        <Link href="/profile" className="p-1 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all">
                            {user ? (
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-sm">
                                    <span className="text-white text-xs font-black">
                                        {(user.displayName || user.email || "U")[0].toUpperCase()}
                                    </span>
                                </div>
                            ) : (
                                <div className="p-1.5">
                                    <User className="w-5 h-5" />
                                </div>
                            )}
                        </Link>
                    </div>
                </div>
            </header>

            <AreaPicker isOpen={isAreaPickerOpen} onClose={() => setIsAreaPickerOpen(false)} />
        </>
    );
}
