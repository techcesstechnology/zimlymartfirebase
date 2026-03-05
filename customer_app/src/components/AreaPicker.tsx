"use client";

import { useState, useEffect } from "react";
import { Search, X, MapPin, Loader2 } from "lucide-react";
import { useLocationStore } from "@/store/useLocationStore";
import { DeliveryArea } from "@/types/commerce";
import { FirebaseCommerceService } from "@/services/FirebaseCommerceService";

interface AreaPickerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AreaPicker({ isOpen, onClose }: AreaPickerProps) {
    const { area: selectedArea, setArea } = useLocationStore();
    const [areas, setAreas] = useState<DeliveryArea[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            setError(null);
            const commerceService = new FirebaseCommerceService();
            commerceService.getDeliveryAreas()
                .then((data) => {
                    setAreas(data);
                    setLoading(false);
                })
                .catch((err) => {
                    console.error("Error fetching areas:", err);
                    setError("Failed to load delivery areas. The system is updating, please try again in a few minutes.");
                    setLoading(false);
                });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const filteredAreas = areas.filter((area) =>
        area.name.toLowerCase().includes(search.toLowerCase())
    );

    const groupedAreas = {
        high_density: filteredAreas.filter((a) => a.zoneGroup === "high_density"),
        central: filteredAreas.filter((a) => a.zoneGroup === "central"),
        north: filteredAreas.filter((a) => a.zoneGroup === "north"),
    };

    const handleSelect = async (area: DeliveryArea) => {
        await setArea(area);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
                    <h2 className="text-xl font-bold text-gray-900">Select Delivery Area</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        title="Close"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search suburb (e.g. Avondale, Budiriro...)"
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <Loader2 className="w-8 h-8 animate-spin mb-2" />
                            <p>Loading areas...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 px-6">
                            <p className="text-red-500 mb-4">{error}</p>
                            <button
                                onClick={() => {
                                    setLoading(true);
                                    setError(null);
                                    new FirebaseCommerceService().getDeliveryAreas()
                                        .then((data) => {
                                            setAreas(data);
                                            setLoading(false);
                                        })
                                        .catch(() => {
                                            setError("Failed to load delivery areas. Please try again.");
                                            setLoading(false);
                                        });
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-all"
                            >
                                Retry
                            </button>
                        </div>
                    ) : filteredAreas.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <p>No areas found for &quot;{search}&quot;</p>
                        </div>
                    ) : (
                        <>
                            {Object.entries(groupedAreas).map(([group, groupAreas]) =>
                                groupAreas.length > 0 && (
                                    <div key={group} className="space-y-1">
                                        <h3 className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                            {group.replace("_", " ")}
                                        </h3>
                                        {groupAreas.map((area) => (
                                            <button
                                                key={area.id}
                                                onClick={() => handleSelect(area)}
                                                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${selectedArea?.id === area.id
                                                    ? "bg-green-50 border-green-200 ring-1 ring-green-200"
                                                    : "hover:bg-gray-50"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${selectedArea?.id === area.id ? "bg-green-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                                                        <MapPin className="w-4 h-4" />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="font-semibold text-gray-900">{area.name}</p>
                                                        <p className="text-xs text-gray-500">{area.etaText}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-green-700">${area.fee.toFixed(2)}</p>
                                                    <p className="text-[10px] text-gray-400">Delivery Fee</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )
                            )}
                        </>
                    )}
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100">
                    <p className="text-center text-sm text-gray-500">
                        Currently only delivering to Harare.
                    </p>
                </div>
            </div>
        </div>
    );
}
