"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { useLocationStore } from "@/store/useLocationStore";
import { MapPin, ArrowRight } from "lucide-react";
import AreaPicker from "@/components/AreaPicker";
import { FirebaseCommerceService } from "@/services/FirebaseCommerceService";
import { Bundle } from "@/types/commerce";
import BundleCard from "@/components/BundleCard";

export default function Home() {
  const { area } = useLocationStore();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadFeatured() {
      if (area) {
        setLoading(true);
        try {
          const commerceService = new FirebaseCommerceService();
          // Root homepage features Harare bundles by default if area selected
          const data = await commerceService.getBundles('harare');
          setBundles(data);
        } catch (error) {
          console.error("Error loading bundles:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setBundles([]);
      }
    }
    loadFeatured();
  }, [area]);

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {!area && (
        <div className="bg-green-600 text-white py-3 px-4 text-center text-sm font-medium flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top duration-500">
          <MapPin className="w-4 h-4" />
          <span>Select a delivery area in Harare to see accurate availability and checkout.</span>
          <button
            onClick={() => setIsPickerOpen(true)}
            className="ml-2 bg-white text-green-700 px-3 py-1 rounded-full text-xs font-bold hover:bg-green-50 transition-colors flex items-center gap-1"
          >
            Select Area <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      <section className="relative h-[60vh] flex items-center justify-center bg-green-50 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 tracking-tight">
            Zimbabwe&apos;s Diaspora <span className="text-green-600">Grocery Hub</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Safely buy groceries for your family in Zimbabwe. Currently delivering exclusively to <b>Harare</b>.
          </p>

          <div className="max-w-md mx-auto">
            {area ? (
              <div className="bg-white p-6 rounded-2xl shadow-xl border border-green-100 flex items-center justify-between">
                <div className="text-left">
                  <p className="text-xs text-gray-400 font-bold uppercase">Delivering to</p>
                  <p className="text-xl font-bold text-gray-900">{area.name}</p>
                  <p className="text-sm text-green-600">{area.etaText} delivery</p>
                </div>
                <button
                  onClick={() => setIsPickerOpen(true)}
                  className="text-sm font-bold text-green-600 hover:text-green-700 underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Choose Harare Area</h2>
                <button
                  onClick={() => setIsPickerOpen(true)}
                  className="w-full py-3 px-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                >
                  <MapPin className="w-5 h-5" />
                  Select Delivery Area
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Popular in Zimlymart</h2>
          {area && (
            <Link href={`/l/harare`} className="text-green-600 font-bold flex items-center gap-1 hover:underline">
              View All Groceries <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-50 h-64 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : area && bundles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {bundles.map((bundle: Bundle) => (
              <BundleCard key={bundle.id} bundle={bundle} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-3xl p-12 text-center border border-dashed border-gray-200">
            <p className="text-gray-500 font-medium mb-4 italic">
              {area
                ? "Checking for available bundles in your area..."
                : "Choose an area above to see popular bundles and groceries."}
            </p>
            {!area && (
              <button
                onClick={() => setIsPickerOpen(true)}
                className="text-green-600 font-bold hover:underline"
              >
                Choose Delivery Area
              </button>
            )}
          </div>
        )}
      </div>

      <AreaPicker isOpen={isPickerOpen} onClose={() => setIsPickerOpen(false)} />
    </main>
  );
}
