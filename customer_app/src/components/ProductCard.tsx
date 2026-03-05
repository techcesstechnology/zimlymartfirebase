import Link from "next/link";
import { InventoryItem } from "@/types/commerce";

export default function ProductCard({ item, locationSlug }: { item: InventoryItem; locationSlug: string }) {
    return (
        <div className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100">
            <Link href={`/l/${locationSlug}/p/${item.slug}`} className="block">
                <div className="aspect-square bg-gray-50 overflow-hidden">
                    <img
                        src={(item.imageUrls && item.imageUrls.length > 0) ? item.imageUrls[0] : "/placeholder.png"}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                </div>
                <div className="p-3">
                    <h3 className="text-gray-900 font-medium truncate text-sm">{item.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{item.brand}</p>
                    <div className="mt-2 flex items-center justify-between">
                        <span className="text-base font-bold text-green-700">
                            ${item.price.toFixed(2)}
                        </span>
                        <div className="bg-green-50 p-1.5 rounded-lg group-hover:bg-green-600 transition-colors">
                            <span className="text-[10px] font-bold text-green-600 group-hover:text-white uppercase tracking-wider">View</span>
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
}
