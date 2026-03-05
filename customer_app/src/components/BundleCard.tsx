"use client";

import React from 'react';
import { Bundle, BundleCartItem } from '../types/commerce';
import { useCommerceStore } from '../store/useCommerceStore';

interface BundleCardProps {
    bundle: Bundle;
}

const BundleCard: React.FC<BundleCardProps> = ({ bundle }) => {
    const addToCart = useCommerceStore(state => state.addToCart);

    const handleAddBundle = () => {
        const cartItem: BundleCartItem = {
            lineId: `bundle-${bundle.id}-${Date.now()}`,
            type: 'bundle',
            bundleId: bundle.id,
            quantity: 1,
            nameSnapshot: bundle.name,
            priceSnapshot: bundle.pricing.price,
            imageSnapshot: bundle.imageUrls[0] || '',
            components: bundle.items?.map(item => ({
                inventoryRefId: item.inventoryRefId,
                qty: item.qty,
                name: 'Bundle Item'
            })) || []
        };
        addToCart(cartItem);
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="relative aspect-video overflow-hidden">
                <img
                    src={bundle.imageUrls[0]}
                    alt={bundle.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                    {bundle.tags.map(tag => (
                        <span key={tag} className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>

            <div className="p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{bundle.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">
                    {bundle.description}
                </p>

                <div className="flex items-center justify-between mt-auto">
                    <div>
                        <span className="text-2xl font-black text-maroon-700">
                            ${bundle.pricing.price.toFixed(2)}
                        </span>
                        {bundle.pricing.compareAtPrice && (
                            <span className="ml-2 text-sm text-gray-400 line-through">
                                ${bundle.pricing.compareAtPrice.toFixed(2)}
                            </span>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleAddBundle}
                    className="w-full mt-4 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl shadow-md hover:shadow-orange-500/30 transition-all active:scale-[0.98]"
                >
                    Add Bundle
                </button>
            </div>
        </div>
    );
};

export default BundleCard;
