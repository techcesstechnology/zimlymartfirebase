"use client";

import { useCommerceStore } from "@/store/useCommerceStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FirebaseCommerceService } from "@/services/FirebaseCommerceService";
import { Location } from "@/types/commerce";

export default function LocationSelector() {
    const { setLocation, location: selectedLocation } = useCommerceStore();
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const commerceService = new FirebaseCommerceService();

    useEffect(() => {
        commerceService.getLocations().then(data => {
            setLocations(data);
            setLoading(false);
        });
    }, []);

    const handleSelect = (loc: Location) => {
        setLocation(loc);
        router.push(`/l/${loc.slug}`);
    };

    if (loading) return <div className="animate-pulse h-10 w-48 bg-gray-200 rounded"></div>;

    return (
        <div className="flex gap-2 overflow-x-auto py-2">
            {locations.map(loc => (
                <button
                    key={loc.id}
                    onClick={() => handleSelect(loc)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedLocation?.id === loc.id
                            ? "bg-green-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                >
                    {loc.name}
                </button>
            ))}
        </div>
    );
}
