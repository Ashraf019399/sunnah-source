import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  ChevronRight,
  ShieldCheck,
  Award,
  Truck,
  HeartHandshake,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Leaf,
  Clock,
  Check,
} from "lucide-react";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { CartDrawer } from "@/components/cart/cart-drawer";

export const metadata: Metadata = {
  title: "About Us | Sunnah Source - Pure Nature, Sunnah Inspired",
  description:
    "Learn about Sunnah Source's mission to deliver 100% authentic, lab-tested, unadulterated organic food products inspired by prophetic Sunnah traditions across Bangladesh.",
  openGraph: {
    title: "About Us | Sunnah Source - Pure Nature, Sunnah Inspired",
    description:
      "Learn about Sunnah Source's mission to deliver 100% authentic, lab-tested, unadulterated organic food products inspired by prophetic Sunnah traditions across Bangladesh.",
    url: "https://sunnahsourcebd.com/about",
  },
};

export default function AboutPage() {
  const corePillars = [
    {
      id: "pillar-1",
      title: "100% Lab-Tested Purity",
      description:
        "Completely free from added sugar, adulterants, chemicals, or artificial preservatives. Each batch is rigorously tested to ensure authentic quality.",
      icon: ShieldCheck,
      badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
      iconColor: "text-emerald-700",
    },
    {
      id: "pillar-2",
      title: "Ethical & Traditional Sourcing",
      description:
        "Sourced directly from trusted beekeepers in the Sundarbans mangrove forests, generational dairy artisans, and verified orchards in Medina.",
      icon: HeartHandshake,
      badgeColor: "bg-brand-50 text-brand-800 border-brand-200",
      iconColor: "text-brand-700",
    },
    {
      id: "pillar-3",
      title: "Reliable Nationwide Delivery",
      description:
        "Swift, carefully packed door-to-door delivery with live tracking via Steadfast Courier across all 64 districts in Bangladesh.",
      icon: Truck,
      badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
      iconColor: "text-amber-700",
    },
    {
      id: "pillar-4",
      title: "7-Day 100% Money-Back Guarantee",
      description:
        "Rooted in trust, integrity, and uncompromising customer delight. If you are not satisfied with aroma or purity, enjoy an instant full refund.",
      icon: Award,
      badgeColor: "bg-rose-50 text-rose-800 border-rose-200",
      iconColor: "text-rose-700",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-surface-canvas font-sans text-charcoal-900">
      {/* 1. Announcement Bar */}
      <AnnouncementBar />

      {/* 2. Header */}
      <Header />

      {/* 3. Main About Us Page Content */}
      <main className="flex-1 py-8 sm:py-12">
        <div className="container mx-auto max-w-6xl px-4 space-y-12 sm:space-y-16">
          {/* Breadcrumb Navigation */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs text-charcoal-500 font-medium"
          >
            <Link
              href="/"
              className="hover:text-brand-700 transition-colors"
            >
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span className="text-charcoal-900 font-bold">About Us</span>
          </nav>

          {/* Hero Section */}
          <section className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-3.5 py-1 rounded-full text-xs font-bold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Our Brand Philosophy</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-charcoal-900 tracking-tight leading-tight">
              Pure Nature, Sunnah Inspired
            </h1>
            <p className="text-base sm:text-lg text-charcoal-700 leading-relaxed font-medium">
              Sunnah Source was founded with a profound mission: to revive healthy
              living by delivering 100% authentic, lab-tested, unadulterated
              organic foods inspired by prophetic Sunnah traditions to every
              household across Bangladesh.
            </p>
            <div className="w-20 h-1 bg-amber-500 rounded-full mx-auto mt-2" />
          </section>

          {/* Story & Vision Showcase (2 Columns) */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center bg-white p-6 sm:p-10 lg:p-12 rounded-3xl border border-stone-200/80 shadow-xs">
            {/* Visual / Image Side */}
            <div className="lg:col-span-5 relative">
              <div className="relative aspect-[4/3] sm:aspect-square w-full rounded-2xl overflow-hidden shadow-card border-4 border-surface-border">
                <Image
                  src="/images/hero-honey.png"
                  alt="Sunnah Source Raw Honey & Natural Foods"
                  fill
                  sizes="(max-width: 1024px) 100vw, 450px"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-brand-900 text-white p-4 rounded-2xl shadow-xl border border-brand-800 hidden sm:block max-w-[200px]">
                <p className="text-xs font-bold leading-snug">
                  Hand-harvested & artisanally crafted for pure wellness.
                </p>
              </div>
            </div>

            {/* Narrative Story Content */}
            <div className="lg:col-span-7 space-y-5">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-700">
                The Sunnah Source Story
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-charcoal-900 leading-snug">
                Bringing Purity and Peace of Mind Back to Your Dining Table
              </h2>
              <div className="space-y-4 text-xs sm:text-sm text-charcoal-600 leading-relaxed">
                <p>
                  In a modern food landscape compromised by industrial refining,
                  hidden syrups, artificial aromas, and chemical additives, finding
                  genuinely pure nutrition has become an exhausting challenge.
                  Families yearn for the wholesome nourishment that ancient
                  traditions cherished.
                </p>
                <p>
                  At <strong>Sunnah Source</strong>, we bridge that gap. We travel
                  directly to the wild honeycomb clusters of the Sundarbans mangrove
                  forests alongside experienced honey-collectors (Mawals). We
                  partner with traditional dairy craftsmen who prepare golden cow ghee
                  following the time-honored, slow-churned Bilona method.
                </p>
                <p>
                  Every drop of our cold-pressed Black Seed Oil and Mustard Oil is
                  milled through traditional wooden ghani presses at low
                  temperatures, ensuring that vital enzymes, antioxidants, and
                  nutritional potencies remain intact from farm to table.
                </p>
              </div>

              {/* Highlights Checkmarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-charcoal-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>No heat processing or micro-filtration</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-charcoal-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Fresh curd-churned Bilona cow ghee</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-charcoal-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Zero added sugar, glucose, or wax</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-charcoal-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Certified original Medina VIP dates</span>
                </div>
              </div>
            </div>
          </section>

          {/* 4 Core Pillars Section */}
          <section className="space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-charcoal-900 tracking-tight">
                Our Four Core Pillars
              </h2>
              <p className="text-xs sm:text-sm text-charcoal-500">
                The uncompromising commitments that define every single Sunnah
                Source product.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {corePillars.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div
                    key={pillar.id}
                    className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs hover:shadow-subtle hover:border-brand-700/50 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${pillar.badgeColor} shadow-2xs`}
                      >
                        <Icon className={`w-6 h-6 ${pillar.iconColor}`} />
                      </div>
                      <h3 className="text-base font-bold text-charcoal-900 leading-snug">
                        {pillar.title}
                      </h3>
                      <p className="text-xs text-charcoal-600 leading-relaxed">
                        {pillar.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center gap-1.5 text-[11px] font-bold text-brand-700">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Sunnah Source Promise</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* CTA Box */}
          <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900 text-white rounded-3xl p-8 sm:p-12 border border-brand-700 shadow-xl text-center max-w-4xl mx-auto space-y-6">
            <div className="max-w-2xl mx-auto space-y-3">
              <span className="inline-block bg-accent-amber/20 text-accent-amber border border-accent-amber/40 text-xs font-bold px-3 py-1 rounded-full">
                Begin Your Pure Nutrition Journey
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black leading-snug">
                Experience the Purity of Natural Living
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-stone-300 leading-relaxed">
                Order 100% pure raw honey, Bilona ghee, cold-pressed oils, and
                Medina dates today. Enjoy Cash on Delivery and complete peace of
                mind across Bangladesh.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/shop"
                prefetch={true}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-accent-amber hover:bg-accent-dark text-charcoal-900 font-extrabold text-sm transition-all shadow-card flex items-center justify-center gap-2"
              >
                <span>Shop All Pure Foods</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/combos"
                prefetch={true}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-all text-center"
              >
                Explore Special Combos
              </Link>
            </div>
          </section>
        </div>
      </main>

      {/* 4. Footer */}
      <Footer />

      {/* 5. Mobile Bottom Nav */}
      <MobileBottomNav />

      {/* 6. Cart Drawer */}
      <CartDrawer />
    </div>
  );
}
