"use client";

import Link from "next/link";
import { useState } from "react";
import { ShoppingCart, MapPin, User, Search, ChevronDown } from "lucide-react";
import { useCommerceStore } from "@/store/useCommerceStore";
import { useLocationStore } from "@/store/useLocationStore";
import { useUserSync } from "@/hooks/useUserSync";
import AreaPicker from "./AreaPicker";

export default function Header() {
    useUserSync();
    const { cart } = useCommerceStore();
    const { area, city } = useLocationStore();
    const [isAreaPickerOpen, setIsAreaPickerOpen] = useState(false);

    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <>
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="text-2xl font-bold text-green-700 tracking-tighter">
                        ZIMLYMART
                    </Link>

                    <div className="hidden md:flex flex-1 max-w-lg mx-8 relative">
                        <input
                            type="text"
                            placeholder="Search groceries..."
                            className="w-full bg-gray-50 border-none rounded-xl py-2 pl-4 pr-10 focus:ring-2 focus:ring-green-500 transition-all"
                        />
                        <Search className="absolute right-3 top-2.5 text-gray-400 w-5 h-5" />
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsAreaPickerOpen(true)}
                            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-100 transition-colors group text-left"
                        >
                            <MapPin className="w-4 h-4 text-green-600 group-hover:scale-110 transition-transform" />
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 font-bold uppercase leading-none mb-0.5">{city}</span>
                                <div className="flex items-center gap-1 leading-none">
                                    <span className="text-sm font-bold text-gray-700 line-clamp-1">
                                        {area?.name || "Choose Area"}
                                    </span>
                                    <ChevronDown className="w-3 h-3 text-gray-400" />
                                </div>
                            </div>
                        </button>

                        <Link href="/cart" className="relative p-2 text-gray-600 hover:text-green-600 transition-colors">
                            <ShoppingCart className="w-6 h-6" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        <Link href="/profile" className="p-2 text-gray-600 hover:text-green-600 transition-colors">
                            <User className="w-6 h-6" />
                        </Link>
                    </div>
                </div>
            </header>

            <AreaPicker
                isOpen={isAreaPickerOpen}
                onClose={() => setIsAreaPickerOpen(false)}
            />
        </>
    );
}
