'use client';

import { useState } from 'react';
import { Minus, Plus, ShoppingCart, Check, ArrowLeft } from 'lucide-react';
import { InventoryItem } from '@/types/commerce';
import { useCommerceStore } from '@/store/useCommerceStore';
import Link from 'next/link';

interface ProductDetailsClientProps {
    item: InventoryItem;
    locationSlug: string;
    locationName: string;
}

export default function ProductDetailsClient({ item, locationSlug, locationName }: ProductDetailsClientProps) {
    const [quantity, setQuantity] = useState(1);
    const [added, setAdded] = useState(false);
    const addToCart = useCommerceStore(state => state.addToCart);

    const handleAddToCart = () => {
        addToCart({
            variantId: item.variantId,
            productId: item.id,
            quantity: quantity,
            nameSnapshot: item.name,
            priceSnapshot: item.price,
            imageSnapshot: (item.imageUrls && item.imageUrls.length > 0) ? item.imageUrls[0] : '/placeholder.png',
            inventoryRefId: item.id
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    const mainImage = (item.imageUrls && item.imageUrls.length > 0) ? item.imageUrls[0] : '/placeholder.png';

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                <Link href="/" className="hover:text-green-600 transition-colors">Home</Link>
                <span>/</span>
                <Link href={`/l/${locationSlug}`} className="hover:text-green-600 transition-colors capitalize">{locationName}</Link>
                <span>/</span>
                <span className="text-gray-900 font-medium truncate max-w-[200px]">{item.name}</span>
            </nav>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
                {/* Image Gallery */}
                <div className="space-y-4">
                    <div className="aspect-square bg-gray-50 rounded-3xl overflow-hidden border border-gray-100">
                        <img
                            src={mainImage}
                            alt={item.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    {item.imageUrls && item.imageUrls.length > 1 && (
                        <div className="grid grid-cols-4 gap-4">
                            {item.imageUrls.map((url, i) => (
                                <div key={i} className="aspect-square bg-gray-50 rounded-xl overflow-hidden border border-gray-100 cursor-pointer hover:border-green-500 transition-colors">
                                    <img src={url} alt={`${item.name} ${i + 1}`} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="flex flex-col">
                    <div className="mb-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full text-green-700 text-xs font-bold uppercase tracking-wider mb-4">
                            {item.brand}
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">
                            {item.name}
                        </h1>
                        <p className="text-gray-500 text-lg">SKU: {item.sku}</p>
                    </div>

                    <div className="flex items-baseline gap-4 mb-8">
                        <span className="text-4xl font-black text-green-700">
                            ${item.price.toFixed(2)}
                        </span>
                        <span className="text-gray-400 text-sm">Inclusive of VAT</span>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Availability</span>
                            <span className={`text-sm font-bold ${item.stockOnHand > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {item.stockOnHand > 0 ? `${item.stockOnHand} in stock` : 'Out of stock'}
                            </span>
                        </div>
                        <p className="text-gray-600 leading-relaxed">
                            {item.description || "Fresh and high-quality product sourced for your family. Zimlymart ensures only the best reaching your loved ones."}
                        </p>
                    </div>

                    {item.stockOnHand > 0 && (
                        <div className="mt-auto space-y-6">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center bg-white border border-gray-200 rounded-2xl p-1 shadow-sm">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="p-3 hover:bg-gray-50 rounded-xl transition-colors text-gray-500"
                                    >
                                        <Minus className="w-5 h-5" />
                                    </button>
                                    <span className="w-12 text-center font-bold text-xl text-gray-900">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(Math.min(item.stockOnHand, quantity + 1))}
                                        className="p-3 hover:bg-gray-50 rounded-xl transition-colors text-gray-500"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="text-sm text-gray-500 font-medium">
                                    Subtotal: <span className="text-gray-900 font-bold">${(item.price * quantity).toFixed(2)}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleAddToCart}
                                disabled={added}
                                className={`w-full py-5 rounded-3xl font-bold text-xl flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] shadow-lg ${added
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-green-600 hover:bg-green-500 text-white shadow-green-600/20'
                                    }`}
                            >
                                {added ? (
                                    <>
                                        <Check className="w-6 h-6" />
                                        Added to Cart
                                    </>
                                ) : (
                                    <>
                                        <ShoppingCart className="w-6 h-6" />
                                        Add to Cart
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    <Link href={`/l/${locationSlug}`} className="mt-8 flex items-center gap-2 text-gray-500 hover:text-green-600 transition-colors font-medium">
                        <ArrowLeft className="w-4 h-4" />
                        Back to browsing
                    </Link>
                </div>
            </div>
        </div>
    );
}
