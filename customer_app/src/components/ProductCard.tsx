import Link from "next/link";
import { InventoryItem } from "@/types/commerce";
import { ArrowUpRight } from "lucide-react";

export default function ProductCard({ item, locationSlug }: { item: InventoryItem; locationSlug: string }) {
    return (
        <Link href={`/l/${locationSlug}/p/${item.slug}`} className="block group">
            <div className="relative bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-green-200 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 cursor-pointer">

                {/* Image */}
                <div className="aspect-square bg-gray-50 overflow-hidden">
                    <img
                        src={
                            item.imageUrls && item.imageUrls.length > 0
                                ? item.imageUrls[0]
                                : "/placeholder.png"
                        }
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                    />
                </div>

                {/* Info */}
                <div className="p-3">
                    <h3 className="text-gray-900 font-bold truncate text-sm leading-tight">
                        {item.name}
                    </h3>
                    {item.brand && (
                        <p className="text-[11px] text-gray-400 font-medium mt-0.5 truncate">
                            {item.brand}
                        </p>
                    )}

                    <div className="mt-2.5 flex items-center justify-between">
                        <span className="text-sm font-black text-green-700">
                            ${item.price.toFixed(2)}
                        </span>
                        <span className="text-[10px] font-bold text-green-600 bg-green-50 group-hover:bg-green-600 group-hover:text-white px-2 py-1 rounded-lg transition-colors flex items-center gap-0.5">
                            View <ArrowUpRight className="w-2.5 h-2.5" />
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
