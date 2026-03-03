import Header from "@/components/Header";
import LocationSelector from "@/components/LocationSelector";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <section className="relative h-[60vh] flex items-center justify-center bg-green-50 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 tracking-tight">
            Zimbabwe's Diaspora <span className="text-green-600">Grocery Hub</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Safely buy groceries for your family in Zimbabwe. Select a delivery location to start browsing.
          </p>
          <div className="max-w-md mx-auto bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Choose Location</h2>
            <LocationSelector />
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8">Popular in Zimlymart</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {/* Featured items would be SSG'd here */}
        </div>
      </div>
    </main>
  );
}
