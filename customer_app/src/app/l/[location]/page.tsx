import { FirebaseCommerceService } from "@/services/FirebaseCommerceService";
import ProductCard from "@/components/ProductCard";
import Header from "@/components/Header";

// This enables ISR: Revalidates the page every hour
export const revalidate = 3600;

export default async function LocationPage({ params }: { params: { location: string } }) {
    const commerceService = new FirebaseCommerceService();

    // In a real app, we'd lookup the ID from the slug
    // For implementation, we assume slug matches ID or we have a map
    const locationId = params.location;
    const products = await commerceService.getProductsByLocation(locationId);

    return (
        <main className="min-h-screen bg-gray-50">
            <Header />
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 capitalize">
                        Groceries in {locationId}
                    </h1>
                    <span className="text-sm text-gray-500">{products.length} Items Found</span>
                </div>

                {products.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {products.map((item) => (
                            <ProductCard key={item.id} item={item} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-dashed border-gray-200">
                        <h2 className="text-xl font-medium text-gray-400">No products available in this location yet.</h2>
                        <p className="text-gray-400 mt-2">Try switching to a different city.</p>
                    </div>
                )}
            </div>
        </main>
    );
}
