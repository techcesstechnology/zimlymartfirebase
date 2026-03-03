"use client";

import Link from "next/link";
import { ShoppingCart, MapPin, User, Search } from "lucide-react";
import { useCommerceStore } from "@/store/useCommerceStore";

export default function Header() {
    const { location, cart } = useCommerceStore();
    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    return (
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
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                        <MapPin className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-700">
                            {location?.name || "Select Location"}
                        </span>
                    </div>

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
    );
}
