"use client";

import Header from "@/components/Header";
import { useCommerceStore } from "@/store/useCommerceStore";
import { Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CartPage() {
    const { cart, removeFromCart, addToCart, clearCart } = useCommerceStore();
    const subtotal = cart.reduce((acc, item) => acc + (item.priceSnapshot * item.quantity), 0);

    if (cart.length === 0) {
        return (
            <main className="min-h-screen bg-gray-50">
                <Header />
                <div className="container mx-auto px-4 py-20 text-center">
                    <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 max-w-md mx-auto">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
                        <p className="text-gray-500 mb-8">Add some groceries to get started.</p>
                        <Link href="/" className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-all">
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
                            <div key={item.variantId} className="bg-white p-4 rounded-2xl shadow-sm flex gap-4 items-center">
                                <img src={item.imageSnapshot} className="w-20 h-20 rounded-lg object-cover" />
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900">{item.nameSnapshot}</h3>
                                    <p className="text-green-700 font-bold">${item.priceSnapshot.toFixed(2)}</p>
                                </div>
                                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                                    <button onClick={() => addToCart({ ...item, quantity: -1 })} className="p-1 hover:bg-white rounded transition-colors">
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="w-8 text-center font-bold">{item.quantity}</span>
                                    <button onClick={() => addToCart({ ...item, quantity: 1 })} className="p-1 hover:bg-white rounded transition-colors">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                                <button onClick={() => removeFromCart(item.variantId)} className="text-gray-400 hover:text-red-500 p-2">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 h-fit sticky top-24">
                        <h2 className="text-xl font-bold mb-6">Order Summary</h2>
                        <div className="space-y-3 text-gray-600 mb-6 font-medium">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Delivery Fee</span>
                                <span className="text-green-600">Calculated at checkout</span>
                            </div>
                            <div className="border-t pt-3 flex justify-between text-gray-900 text-lg font-bold">
                                <span>Total</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                        </div>
                        <Link href="/checkout" className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 hover:shadow-lg hover:shadow-green-200 transition-all group">
                            Checkout <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
