"use client";

import Header from "@/components/Header";
import { useCommerceStore } from "@/store/useCommerceStore";
import { useLocationStore } from "@/store/useLocationStore";
import { Trash2, Plus, Minus, ArrowRight, MapPin, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import AreaPicker from "@/components/AreaPicker";

export default function CartPage() {
    const { cart, removeFromCart, addToCart } = useCommerceStore();
    const { area } = useLocationStore();
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    const subtotal = cart.reduce((acc, item) => acc + (item.priceSnapshot * item.quantity), 0);
    const deliveryFee = area?.fee || 0;
    const total = subtotal + deliveryFee;

    if (cart.length === 0) {
        return (
            <main className="min-h-screen bg-gray-50">
                <Header />
                <div className="container mx-auto px-4 py-20 text-center">
                    <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 max-w-md mx-auto">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Trash2 className="w-8 h-8 text-gray-300" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
                        <p className="text-gray-500 mb-8">Add some groceries to get started.</p>
                        <Link href="/" className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-all inline-block">
                            Go Shopping
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 pb-20">
            <Header />
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        {cart.map((item) => (
                            <div key={item.lineId} className="bg-white p-4 rounded-2xl shadow-sm flex gap-4 items-center border border-white hover:border-green-100 transition-colors">
                                <img src={item.imageSnapshot} alt={item.nameSnapshot} className="w-20 h-20 rounded-lg object-cover bg-gray-50" />
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900">{item.nameSnapshot}</h3>
                                    <p className="text-green-700 font-bold">${item.priceSnapshot.toFixed(2)}</p>
                                </div>
                                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                                    <button
                                        onClick={() => addToCart({ ...item, quantity: -1 })}
                                        className="p-1 hover:bg-white rounded transition-colors disabled:opacity-30"
                                        disabled={item.quantity <= 1}
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                                    <button onClick={() => addToCart({ ...item, quantity: 1 })} className="p-1 hover:bg-white rounded transition-colors">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                                <button onClick={() => removeFromCart(item.lineId)} className="text-gray-400 hover:text-red-500 p-2 transition-colors">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 h-fit sticky top-24">
                            <h2 className="text-xl font-bold mb-6">Order Summary</h2>
                            <div className="space-y-4 text-gray-600 mb-8 font-medium">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span className="text-gray-900">${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span>Delivery Fee</span>
                                        {area && <span className="text-[10px] text-gray-400 uppercase font-bold">{area.name}</span>}
                                    </div>
                                    {area ? (
                                        <span className="text-green-600 font-bold">${deliveryFee.toFixed(2)}</span>
                                    ) : (
                                        <button
                                            onClick={() => setIsPickerOpen(true)}
                                            className="text-xs text-red-500 hover:underline flex items-center gap-1"
                                        >
                                            <AlertCircle className="w-3 h-3" /> Select Area
                                        </button>
                                    )}
                                </div>
                                <div className="border-t border-gray-100 pt-4 flex justify-between text-gray-900 text-xl font-bold">
                                    <span>Total</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>
                            </div>

                            {area ? (
                                <Link href="/checkout" className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 hover:shadow-lg hover:shadow-green-200 transition-all group">
                                    Checkout <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            ) : (
                                <button
                                    onClick={() => setIsPickerOpen(true)}
                                    className="w-full bg-gray-100 text-gray-400 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 cursor-not-allowed"
                                >
                                    Select Area to Checkout
                                </button>
                            )}

                            {!area && (
                                <p className="mt-4 text-xs text-center text-gray-400">
                                    We need your delivery area to calculate the final total.
                                </p>
                            )}
                        </div>

                        {area && (
                            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3">
                                <MapPin className="w-5 h-5 text-blue-600 shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-blue-900">Delivering to {area.name}</p>
                                    <p className="text-xs text-blue-700">{area.etaText} delivery guaranteed.</p>
                                    <button
                                        onClick={() => setIsPickerOpen(true)}
                                        className="text-xs font-bold text-blue-600 underline mt-1"
                                    >
                                        Change Area
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AreaPicker isOpen={isPickerOpen} onClose={() => setIsPickerOpen(false)} />
        </main>
    );
}
