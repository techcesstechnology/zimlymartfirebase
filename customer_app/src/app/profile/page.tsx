"use client";

import Header from "@/components/Header";
import { User, Package, MapPin, LogOut, ChevronRight } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const router = useRouter();
    const user = auth.currentUser;

    const handleLogout = async () => {
        await auth.signOut();
        router.push("/");
    };

    return (
        <main className="min-h-screen bg-gray-50">
            <Header />
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                        <div className="bg-green-600 h-32 relative">
                            <div className="absolute -bottom-10 left-8">
                                <div className="w-24 h-24 bg-white rounded-full p-1 shadow-lg">
                                    <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center">
                                        <User className="w-12 h-12 text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="pt-14 pb-8 px-8">
                            <h1 className="text-3xl font-bold text-gray-900">{user?.displayName || "Zimlymart User"}</h1>
                            <p className="text-gray-500">{user?.email || "Shopper"}</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-gray-900 px-2 uppercase tracking-wider text-sm opacity-50">Account</h2>
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                            <Package className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <span className="font-bold text-gray-700">Order History</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-300" />
                                </button>
                                <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                                            <MapPin className="w-5 h-5 text-orange-600" />
                                        </div>
                                        <span className="font-bold text-gray-700">Saved Addresses</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-300" />
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-red-50 transition-colors text-red-600 group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-red-50 group-hover:bg-red-100 rounded-xl flex items-center justify-center transition-colors">
                                            <LogOut className="w-5 h-5" />
                                        </div>
                                        <span className="font-bold">Log Out</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-red-200" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-gray-900 px-2 uppercase tracking-wider text-sm opacity-50">Settings</h2>
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <User className="w-8 h-8 text-gray-300" />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">Account under construction</h3>
                                <p className="text-sm text-gray-500">We&apos;re working on making your profile more powerful soon!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
