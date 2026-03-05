import { FirebaseCommerceService } from "@/services/FirebaseCommerceService";
import ProductCard from "@/components/ProductCard";
import Header from "@/components/Header";

// Force dynamic rendering to ensure we always get fresh data and avoid build-time pre-render issues
export const dynamic = "force-dynamic";

export default async function LocationPage({ params }: { params: Promise<{ location: string }> }) {
    const { location: slug } = await params;
    const commerceService = new FirebaseCommerceService();

    let data;
    try {
        const locations = await commerceService.getLocations();
        const location = locations.find(l => l.slug === slug);

        // If not found, fallback to slug (backwards compat)
        const locationId = location ? location.id : slug;
        const products = await commerceService.getProductsByLocation(locationId);
        const displayName = location ? location.name : slug;
        data = { products, displayName };
    } catch (error) {
        console.error("Error loading location page:", error);
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-red-500 font-medium">Failed to load data. Please refresh or try again later.</p>
            </div>
        );
    }

    const { products, displayName } = data;

    return (
        <main className="min-h-screen bg-gray-50">
            <Header />
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 capitalize">
                        Groceries in {displayName}
                    </h1>
                    <span className="text-sm text-gray-500">{products.length} Items Found</span>
                </div>

                {products.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {products.map((item) => (
                            <ProductCard key={item.id} item={item} locationSlug={slug} />
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
