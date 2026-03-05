"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useCommerceStore } from "@/store/useCommerceStore";
import { useLocationStore } from "@/store/useLocationStore";
import { useAuthStore } from "@/store/useAuthStore";
import { FirebaseCommerceService } from "@/services/FirebaseCommerceService";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { Order } from "@/types/commerce";
import toast from "react-hot-toast";
import { Loader2, CheckCircle2 } from "lucide-react";

const commerceService = new FirebaseCommerceService();

export default function CheckoutPage() {
    const router = useRouter();
    const { cart, clearCart } = useCommerceStore();
    const { area, location } = useLocationStore();
    const { user } = useAuthStore();

    const [recipient, setRecipient] = useState({ name: "", phone: "", address: "" });
    const [isReserving, setIsReserving] = useState(false);
    const [order, setOrder] = useState<Order | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const subtotal = cart.reduce((acc, item) => acc + (item.priceSnapshot * item.quantity), 0);
    const deliveryFee = area?.fee || 0;
    const total = subtotal + deliveryFee;

    if (!cart.length || !area || !location) {
        if (typeof window !== "undefined") router.push("/cart");
        return null; // Return nothing while redirecting
    }

    if (isSuccess) {
        return (
            <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-12 rounded-3xl shadow-xl border border-gray-100 max-w-md text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h2>
                    <p className="text-gray-500 mb-8">Your order has been placed and is being processed. Thank you for shopping with ZimlyMart!</p>
                    <button onClick={() => router.push("/")} className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition">
                        Continue Shopping
                    </button>
                </div>
            </main>
        );
    }

    const handleReserveStock = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast.error("Please login to complete your order");
            return;
        }

        if (!recipient.name || !recipient.phone || !recipient.address) {
            toast.error("Please fill out all delivery details");
            return;
        }

        setIsReserving(true);
        try {
            const newOrder = await commerceService.createOrder(
                user.uid,
                cart,
                location.id,
                recipient,
                { areaId: area.id, areaName: area.name, deliveryFee: area.fee }
            );
            toast.success("Order confirmed. Please proceed to payment.");
            setOrder(newOrder);
        } catch (error: any) {
            console.error("Reservation Error:", error);
            toast.error(error.message || "Failed to reserve stock. Please try again.");
        } finally {
            setIsReserving(false);
        }
    };

    const createPayPalOrderHook = async () => {
        if (!order) throw new Error("Order not initialized");
        const createOrder = httpsCallable<any, { paypalOrderId: string }>(functions, 'createPayPalOrder');
        try {
            const result = await createOrder({ orderId: order.id });
            return result.data.paypalOrderId;
        } catch (error: any) {
            console.error("PayPal Order Error:", error);
            toast.error("Error initiating payment.");
            throw error;
        }
    };

    const onApproveHook = async (data: any) => {
        if (!order) throw new Error("Order not initialized");
        const captureOrder = httpsCallable<any, { success: boolean, captureId?: string, status?: string }>(functions, 'capturePayPalOrder');
        try {
            const result = await captureOrder({
                paypalOrderId: data.orderID,
                orderId: order.id
            });

            if (result.data.success) {
                clearCart();
                setIsSuccess(true);
                toast.success("Payment verified successfully!");
            } else {
                toast.error(`Payment not verified: ${result.data.status}`);
            }
        } catch (error) {
            console.error("PayPal Capture Error:", error);
            toast.error("Error confirming payment. Please contact support.");
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 pb-20">
            <Header />
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">Checkout</h1>

                <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* Left Column: Form or PayPal */}
                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold mb-6">Delivery Details</h2>
                            {order ? (
                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="font-bold">{recipient.name}</p>
                                        <p className="text-gray-600">{recipient.phone}</p>
                                        <p className="text-gray-600 mt-2">{recipient.address}</p>
                                    </div>
                                    <div className="pt-4">
                                        <PayPalScriptProvider options={{
                                            // TODO: Retrieve from environment normally, but just for MVP:
                                            clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test",
                                            currency: "USD",
                                            intent: "capture"
                                        }}>
                                            <PayPalButtons
                                                createOrder={createPayPalOrderHook}
                                                onApprove={onApproveHook}
                                                style={{ layout: "vertical", shape: "pill" }}
                                            />
                                        </PayPalScriptProvider>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleReserveStock} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Recipient Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={recipient.name}
                                            onChange={(e) => setRecipient(r => ({ ...r, name: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                                        <input
                                            type="tel"
                                            required
                                            value={recipient.phone}
                                            onChange={(e) => setRecipient(r => ({ ...r, phone: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                                            placeholder="+263 71 234 5678"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Delivery Address</label>
                                        <textarea
                                            required
                                            value={recipient.address}
                                            onChange={(e) => setRecipient(r => ({ ...r, address: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition resize-none"
                                            rows={3}
                                            placeholder="123 Example Street, Harare"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isReserving}
                                        className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition flex justify-center items-center mt-6"
                                    >
                                        {isReserving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue to Payment"}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div>
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
                            <h2 className="text-xl font-bold mb-6">Order Summary</h2>
                            <div className="space-y-4 max-h-60 overflow-y-auto pr-2 mb-6">
                                {cart.map(item => (
                                    <div key={item.lineId} className="flex gap-4">
                                        <img src={item.imageSnapshot} alt={item.nameSnapshot} className="w-16 h-16 rounded-lg object-cover" />
                                        <div className="flex-1">
                                            <h4 className="font-bold text-sm text-gray-900">{item.nameSnapshot}</h4>
                                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                        </div>
                                        <p className="font-bold text-sm text-green-700">${(item.priceSnapshot * item.quantity).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-gray-100 pt-4 space-y-3 font-medium text-gray-600">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span className="text-gray-900">${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Delivery ({area.name})</span>
                                    <span className="text-gray-900">${deliveryFee.toFixed(2)}</span>
                                </div>
                                <div className="border-t border-gray-100 pt-3 flex justify-between text-xl font-bold text-gray-900">
                                    <span>Total</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
