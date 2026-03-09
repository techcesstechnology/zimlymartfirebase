"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import Header from "@/components/Header";
import { useLocationStore } from "@/store/useLocationStore";
import {
  MapPin, ArrowRight, Package, Shield, Zap, ChevronRight,
  Star, Heart, Globe, CheckCircle, Quote
} from "lucide-react";
import AreaPicker from "@/components/AreaPicker";
import { FirebaseCommerceService } from "@/services/FirebaseCommerceService";
import { Bundle } from "@/types/commerce";
import BundleCard from "@/components/BundleCard";

/* ─── Static Data ──────────────────────────────────────────────────────── */

const FOOD_EMOJIS = ["🥦", "🍅", "🥕", "🌽", "🍞", "🥚", "🧀", "🍗", "🛒", "🥩", "🧅", "🍋"];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: MapPin,
    title: "Pick Your Suburb",
    desc: "Choose any Harare suburb. We cover central, high-density, and northern zones.",
    color: "from-green-500 to-emerald-600",
    bg: "bg-green-50",
  },
  {
    step: "02",
    icon: Package,
    title: "Choose a Bundle",
    desc: "Browse our curated grocery bundles — packed with the essentials your family needs.",
    color: "from-amber-500 to-orange-500",
    bg: "bg-amber-50",
  },
  {
    step: "03",
    icon: Zap,
    title: "Fast Delivery",
    desc: "We handle everything. Fresh, quality groceries delivered to your family the same day.",
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50",
  },
];

const TRUST_STATS = [
  { value: 500, suffix: "+", label: "Deliveries Made", icon: "🚚" },
  { value: 4.9, suffix: "★", label: "Customer Rating", icon: "⭐" },
  { value: 100, suffix: "%", label: "Secure Payments", icon: "🔒" },
  { value: 24, suffix: "hr", label: "Delivery Window", icon: "⚡" },
];

const TESTIMONIALS = [
  {
    name: "Tatenda M.",
    location: "London, UK",
    flag: "🇬🇧",
    text: "My mum in Kuwadzana was so surprised. I ordered from work and by evening she had all her groceries. Zimlymart is a blessing.",
    rating: 5,
  },
  {
    name: "Chido K.",
    location: "Johannesburg, SA",
    flag: "🇿🇦",
    text: "Finally a service that actually works for Zimbabwe. The bundles are well-priced and delivery is always on time.",
    rating: 5,
  },
  {
    name: "Farai N.",
    location: "Toronto, Canada",
    flag: "🇨🇦",
    text: "I send groceries to my siblings every month. The process is so simple and they always have fresh produce waiting.",
    rating: 5,
  },
];

const WHY_US = [
  {
    icon: Globe,
    title: "Order from Anywhere",
    desc: "Pay securely from the UK, USA, SA, Canada — any currency, any time zone.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Heart,
    title: "Handpicked Quality",
    desc: "Every product is sourced from trusted Harare suppliers. No substitutions, no surprises.",
    color: "text-rose-500",
    bg: "bg-rose-50",
  },
  {
    icon: Shield,
    title: "Safe & Secure",
    desc: "End-to-end encrypted payments. Your family's address is protected at all times.",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    icon: Zap,
    title: "Same-Day Delivery",
    desc: "Order before noon, delivered by evening. Your family doesn't wait long.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
];

/* ─── Counter ──────────────────────────────────────────────────────────── */
function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 1400;
    const steps = 40;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current * 10) / 10);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {Number.isInteger(target) ? Math.round(count) : count.toFixed(1)}
      {suffix}
    </span>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────── */
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
          const data = await commerceService.getBundles(area.id);
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
    <main className="min-h-screen bg-white overflow-x-hidden">
      <Header />

      {/* Location nudge banner */}
      {!area && (
        <div className="bg-amber-500 text-white py-2.5 px-4 text-center text-sm font-semibold flex items-center justify-center gap-2">
          <MapPin className="w-4 h-4 shrink-0" />
          <span>Choose a Harare delivery suburb to see prices and availability.</span>
          <button
            onClick={() => setIsPickerOpen(true)}
            className="ml-2 bg-white/20 hover:bg-white/30 px-3 py-0.5 rounded-full text-xs font-bold transition-colors"
          >
            Pick Area
          </button>
        </div>
      )}

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-green-950 via-green-900 to-emerald-800">
        {/* Blobs */}
        <div className="absolute -top-48 -right-48 w-[700px] h-[700px] bg-emerald-500 rounded-full opacity-[0.07] blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-24 w-[500px] h-[500px] bg-green-300 rounded-full opacity-[0.07] blur-3xl pointer-events-none" />
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "30px 30px" }}
        />

        {/* Floating food emojis — desktop only */}
        {FOOD_EMOJIS.map((emoji, i) => (
          <motion.div
            key={i}
            className="absolute hidden lg:block text-3xl select-none pointer-events-none"
            style={{
              top: `${10 + ((i * 73) % 80)}%`,
              left: `${55 + ((i * 37) % 40)}%`,
              opacity: 0.18,
            }}
            animate={{ y: [0, -12, 0], rotate: [0, i % 2 === 0 ? 6 : -6, 0] }}
            transition={{ duration: 3.5 + (i % 4) * 0.7, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
          >
            {emoji}
          </motion.div>
        ))}

        <div className="container mx-auto px-4 relative z-10 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">

            {/* Left — copy */}
            <div>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-green-200 text-xs font-bold px-4 py-2 rounded-full mb-6 backdrop-blur-sm">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Now delivering across Harare suburbs
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.08 }}
                className="text-5xl md:text-6xl xl:text-7xl font-black text-white mb-6 leading-[1.05] tracking-tight"
              >
                Groceries for your
                <span className="block bg-gradient-to-r from-green-300 via-emerald-200 to-teal-200 bg-clip-text text-transparent">
                  family back home.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.18 }}
                className="text-lg text-green-100/70 mb-10 max-w-lg leading-relaxed"
              >
                Send quality groceries from anywhere in the world — delivered directly to your loved ones
                in Harare. Fast, safe, and truly affordable.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.26 }}
                className="max-w-sm"
              >
                {area ? (
                  <div className="bg-white/10 backdrop-blur-md border border-white/25 p-5 rounded-2xl">
                    <p className="text-[10px] text-green-300 font-black uppercase tracking-widest mb-1">Delivering to</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-black text-white">{area.name}</p>
                        <p className="text-sm text-green-300/80">{area.etaText}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button onClick={() => setIsPickerOpen(true)} className="text-xs font-bold text-white/50 hover:text-white underline underline-offset-2 transition-colors">
                          Change
                        </button>
                        <Link href="/l/harare" className="bg-white text-green-900 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-green-50 transition-all flex items-center gap-1.5 shadow-lg shadow-black/20">
                          Shop Now <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/10 backdrop-blur-md border border-white/25 p-6 rounded-2xl">
                    <p className="text-green-200/80 text-sm font-medium mb-4">Choose your delivery suburb in Harare to get started</p>
                    <button
                      onClick={() => setIsPickerOpen(true)}
                      className="w-full bg-white text-green-900 py-3.5 px-6 rounded-xl font-black hover:bg-green-50 transition-all flex items-center justify-center gap-2 shadow-xl shadow-black/20 active:scale-[0.98]"
                    >
                      <MapPin className="w-5 h-5" />
                      Select Delivery Area
                    </button>
                  </div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-wrap items-center gap-4 mt-8 text-green-300/50 text-xs font-semibold"
              >
                <div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Secure Payments</div>
                <div className="w-1 h-1 bg-green-800 rounded-full" />
                <div className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Same-Day Delivery</div>
                <div className="w-1 h-1 bg-green-800 rounded-full" />
                <div className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5" /> Quality Assured</div>
              </motion.div>
            </div>

            {/* Right — visual card grid */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="hidden lg:grid grid-cols-2 gap-4"
            >
              {[
                { emoji: "🥦🥕🌽", label: "Fresh Produce", sub: "Direct from farms" },
                { emoji: "🍗🥩🐟", label: "Meat & Protein", sub: "Chilled & fresh" },
                { emoji: "🍞🧀🥚", label: "Dairy & Bakery", sub: "Daily baked" },
                { emoji: "🧴🧹🛒", label: "Household", sub: "Everyday essentials" },
              ].map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 + i * 0.1 }}
                  className={`bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-5 hover:bg-white/15 transition-colors cursor-default ${i === 1 ? "mt-6" : ""} ${i === 3 ? "-mt-6" : ""}`}
                >
                  <div className="text-3xl mb-3">{card.emoji}</div>
                  <div className="text-white font-bold text-sm">{card.label}</div>
                  <div className="text-green-300/60 text-xs mt-0.5">{card.sub}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Trust Stats Bar ───────────────────────────────────────── */}
      <section className="bg-green-950 border-b border-green-900/60">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-green-900/50">
            {TRUST_STATS.map(({ value, suffix, label, icon }) => (
              <div key={label} className="py-6 px-4 text-center">
                <div className="text-xs mb-1">{icon}</div>
                <div className="text-2xl font-black text-green-300">
                  <AnimatedCounter target={value} suffix={suffix} />
                </div>
                <div className="text-[11px] text-green-600 font-medium mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Zimlymart ─────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <p className="text-xs font-black text-green-600 uppercase tracking-widest mb-2">Built for the diaspora</p>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">Why families choose Zimlymart</h2>
            <p className="text-gray-500 mt-3 text-sm max-w-md mx-auto leading-relaxed">
              We make it effortless to care for loved ones in Zimbabwe, no matter where you are.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {WHY_US.map(({ icon: Icon, title, desc, color, bg }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                className="group bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-transparent"
              >
                <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <h3 className="font-black text-gray-900 mb-2 text-[15px]">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50 border-y border-gray-100">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-xs font-black text-green-600 uppercase tracking-widest mb-2">Simple process</p>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">Order in 3 easy steps</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-green-200 via-amber-200 to-blue-200 z-0" />

            {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc, color, bg }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="relative z-10 bg-white rounded-2xl p-7 border border-gray-100 hover:border-green-100 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group text-center"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-[10px] font-black text-gray-300 tracking-widest mb-2">{step}</div>
                <h3 className="font-black text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Popular Bundles ───────────────────────────────────────── */}
      <section className="py-20 container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-10"
        >
          <div>
            <p className="text-xs font-black text-green-600 uppercase tracking-widest mb-1.5">Curated for Zimbabwe</p>
            <h2 className="text-3xl font-black text-gray-900">Popular bundles</h2>
          </div>
          {area && (
            <Link href="/l/harare" className="text-green-600 font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all pb-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-100 h-80 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : area && bundles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bundles.map((bundle: Bundle) => (
              <BundleCard key={bundle.id} bundle={bundle} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-3xl p-16 text-center border-2 border-dashed border-gray-200">
            <div className="text-5xl mb-4">🛒</div>
            <p className="text-gray-700 font-bold mb-1">
              {area ? "Checking for bundles in your area..." : "Choose your Harare suburb to see popular bundles"}
            </p>
            {!area && (
              <button
                onClick={() => setIsPickerOpen(true)}
                className="mt-4 bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-green-700 transition-all"
              >
                Select Delivery Area
              </button>
            )}
          </div>
        )}
      </section>

      {/* ── Testimonials ──────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50 border-y border-gray-100">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-xs font-black text-green-600 uppercase tracking-widest mb-2">Real families, real stories</p>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">Loved by the diaspora</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {TESTIMONIALS.map(({ name, location, flag, text, rating }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              >
                <Quote className="w-7 h-7 text-green-200 mb-4" />
                <p className="text-gray-700 text-sm leading-relaxed mb-5 italic">&ldquo;{text}&rdquo;</p>
                <div className="flex items-center gap-3 mt-auto pt-4 border-t border-gray-50">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center text-lg font-black text-green-700 shrink-0">
                    {name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-900 text-sm">{name}</p>
                    <p className="text-xs text-gray-400">{flag} {location}</p>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: rating }).map((_, j) => (
                      <Star key={j} className="w-3 h-3 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className="relative py-20 px-4 overflow-hidden bg-gradient-to-br from-green-950 via-green-900 to-emerald-800">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-emerald-500 rounded-full opacity-[0.08] blur-3xl pointer-events-none" />

        <div className="container mx-auto text-center relative z-10 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-4xl mb-4">🇿🇼</div>
            <p className="text-green-400 text-xs font-black uppercase tracking-widest mb-3">Your family deserves the best</p>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
              Send love home,<br />
              <span className="bg-gradient-to-r from-green-300 to-emerald-200 bg-clip-text text-transparent">one basket at a time.</span>
            </h2>
            <p className="text-green-300/70 mb-8 text-sm max-w-md mx-auto leading-relaxed">
              Join hundreds of diaspora families already using Zimlymart. It only takes two minutes to place your first order.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setIsPickerOpen(true)}
                className="bg-white text-green-900 font-black py-3.5 px-10 rounded-xl hover:bg-green-50 transition-all shadow-xl shadow-black/20 text-sm active:scale-[0.98]"
              >
                Get Started — It&apos;s Free
              </button>
              <Link
                href="/l/harare"
                className="border border-white/25 text-white font-bold py-3.5 px-10 rounded-xl hover:bg-white/10 transition-all text-sm flex items-center justify-center gap-2"
              >
                Browse Groceries <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-4 mt-8 text-green-400/60 text-xs font-semibold">
              {["No subscription required", "Cancel anytime", "Trusted by 500+ families"].map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> {t}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <AreaPicker isOpen={isPickerOpen} onClose={() => setIsPickerOpen(false)} />
    </main>
  );
}
