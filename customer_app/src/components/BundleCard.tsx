"use client";

import React from "react";
import { Bundle, BundleCartItem } from "../types/commerce";
import { useCommerceStore } from "../store/useCommerceStore";
import { ShoppingBag, Tag } from "lucide-react";

interface BundleCardProps {
    bundle: Bundle;
}

const BundleCard: React.FC<BundleCardProps> = ({ bundle }) => {
    const addToCart = useCommerceStore((state) => state.addToCart);

    const handleAddBundle = () => {
        const cartItem: BundleCartItem = {
            lineId: `bundle-${bundle.id}-${Date.now()}`,
            type: "bundle",
            bundleId: bundle.id,
            quantity: 1,
            nameSnapshot: bundle.name,
            priceSnapshot: bundle.pricing.price,
            imageSnapshot: bundle.imageUrls[0] || "",
            components:
                bundle.items?.map((item) => ({
                    inventoryRefId: item.inventoryRefId,
                    qty: item.qty,
                    name: item.productName,
                })) || [],
        };
        addToCart(cartItem);
    };

    const savings =
        bundle.pricing.compareAtPrice
            ? bundle.pricing.compareAtPrice - bundle.pricing.price
            : null;

    return (
        <div className="bg-white rounded-2xl overflow-hidden group hover:-translate-y-1 transition-all duration-300 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] hover:shadow-[0_16px_48px_-8px_rgba(0,0,0,0.18)] border border-gray-100 hover:border-green-100">

            {/* Image area */}
            <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                {bundle.imageUrls?.[0] ? (
                    <img
                        src={bundle.imageUrls[0]}
                        alt={bundle.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <ShoppingBag className="w-12 h-12" />
                    </div>
                )}

                {/* Gradient scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />

                {/* Tags */}
                <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                    {bundle.tags.slice(0, 2).map((tag) => (
                        <span
                            key={tag}
                            className="bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1"
                        >
                            <Tag className="w-2.5 h-2.5" />
                            {tag}
                        </span>
                    ))}
                </div>

                {/* Savings badge */}
                {savings && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
                        SAVE ${savings.toFixed(2)}
                    </div>
                )}

                {/* Price badge (bottom-right of image) */}
                <div className="absolute bottom-3 right-3">
                    <div className="bg-white rounded-xl px-3 py-1.5 shadow-lg">
                        <span className="text-xl font-black text-gray-900">
                            ${bundle.pricing.price.toFixed(2)}
                        </span>
                        {bundle.pricing.compareAtPrice && (
                            <span className="ml-1.5 text-xs text-gray-400 line-through">
                                ${bundle.pricing.compareAtPrice.toFixed(2)}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-5">
                <h3 className="text-base font-black text-gray-900 mb-1.5 leading-snug">
                    {bundle.name}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-5 leading-relaxed h-10">
                    {bundle.description}
                </p>

                <button
                    onClick={handleAddBundle}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-md shadow-green-200/80 hover:shadow-green-300 hover:shadow-lg"
                >
                    <ShoppingBag className="w-4 h-4" />
                    Add to Cart
                </button>
            </div>
        </div>
    );
};

export default BundleCard;
