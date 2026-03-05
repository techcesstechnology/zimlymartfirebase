import { FirebaseCommerceService } from "@/services/FirebaseCommerceService";
import Header from "@/components/Header";
import ProductDetailsClient from "./ProductDetailsClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProductPage({
    params
}: {
    params: Promise<{ location: string; slug: string }>
}) {
    const { location: locationSlug, slug } = await params;
    const commerceService = new FirebaseCommerceService();

    try {
        const locations = await commerceService.getLocations();
        const location = locations.find(l => l.slug === locationSlug);

        if (!location) return notFound();

        const product = await commerceService.getProductBySlug(slug, location.id);

        if (!product) return notFound();

        return (
            <main className="min-h-screen bg-white">
                <Header />
                <ProductDetailsClient
                    item={product}
                    locationSlug={locationSlug}
                    locationName={location.name}
                />
            </main>
        );
    } catch (error) {
        console.error("Error loading product page:", error);
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-red-500 font-medium text-lg">
                    Something went wrong. Please try again.
                </p>
            </div>
        );
    }
}
