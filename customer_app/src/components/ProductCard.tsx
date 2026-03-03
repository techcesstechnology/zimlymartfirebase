import { InventoryItem } from "@/types/commerce";

export default function ProductCard({ item }: { item: InventoryItem }) {
    return (
        <div className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100">
            <div className="aspect-square bg-gray-50 overflow-hidden">
                <img
                    src={item.imageUrls[0] || "/placeholder.png"}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
            </div>
            <div className="p-4">
                <h3 className="text-gray-900 font-medium truncate">{item.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{item.brand}</p>
                <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-green-700">
                        ${item.price.toFixed(2)}
                    </span>
                    <button className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 active:scale-95 transition-all">
                        Add
                    </button>
                </div>
            </div>
        </div>
    );
}
