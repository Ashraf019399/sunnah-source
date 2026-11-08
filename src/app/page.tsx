import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { ALL_PRODUCTS } from "@/lib/data/products";
import { CATEGORIES_DATA, getCategoryDisplayImage } from "@/lib/data/categories";
import { ProductCard } from "@/components/commerce/product-card";
import { Product } from "@/types/commerce.types";
import { ShieldCheck, Truck, Clock, Award, ArrowRight } from "lucide-react";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturedCategoriesBubbleStrip } from "@/components/home/featured-categories-bubble-strip";
import { MobilePromoBanners } from "@/components/home/mobile-promo-banners";

// Top 8 Sunnah Source Best Selling products
const BEST_SELLER_SLUGS = [
  "sundarban-raw-wild-honey",
  "traditional-bilona-cow-ghee",
  "cold-pressed-mustard-oil",
  "madinah-vip-ajwa-dates",
  "sunnah-health-booster-combo",
  "khalisha-flower-raw-honey",
  "extra-virgin-black-seed-oil",
  "madinah-amber-dates",
];

export default function HomePage() {
  const bestSellingProducts: Product[] = [];
  for (const slug of BEST_SELLER_SLUGS) {
    const prod = ALL_PRODUCTS.find((p) => p.slug === slug);
    if (prod) {
      const isHotDeal =
        slug === "madinah-vip-ajwa-dates" ||
        slug === "sunnah-health-booster-combo" ||
        slug === "madinah-amber-dates";
      bestSellingProducts.push({
        ...prod,
        badge: isHotDeal ? "হট ডিল" : "বেস্টসেলার",
      });
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-canvas font-bengali">
      {/* মূল হেডার ও সার্চ বার */}
      <Header />

      {/* ৩. স্টোরফ্রন্ট বডি */}
      <main className="flex-1 pb-16 lg:pb-12 space-y-4 sm:space-y-6 lg:space-y-8">
        {/* ১. হিরো ব্যানার সেকশন — Sunnah Royal Split (ডেস্কটপে স্লাইডার ও ব্যানার পাশাপাশি, মোবাইলে শুধু মেইন স্লাইডার) */}
        <HeroSection />

        {/* ২. মোবাইল "জনপ্রিয় ক্যাটাগরি" বাবল স্ট্রিপ (Featured Categories Bubble Strip) */}
        <FeaturedCategoriesBubbleStrip />

        {/* ৩. ৪টি ট্রাস্ট ফিচার ব্যাজ (কমপ্যাক্ট ২x২ গ্রিড) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 w-full">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 px-4 py-3.5 sm:px-8 sm:py-5 lg:px-12 bg-white rounded-2xl border border-stone-200/80 shadow-xs text-xs">
            <div className="flex items-center justify-start sm:justify-center gap-2.5 sm:gap-3.5 w-full">
              <div className="p-2 sm:p-2.5 bg-brand-50 text-brand-700 rounded-xl shrink-0">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <strong className="block text-stone-900 text-[11px] sm:text-xs leading-tight">
                  100% Pure & Natural
                </strong>
                <span className="text-stone-500 text-[9.5px] sm:text-xs leading-tight block">
                  Lab Tested & Certified
                </span>
              </div>
            </div>
            <div className="flex items-center justify-start sm:justify-center gap-2.5 sm:gap-3.5 w-full">
              <div className="p-2 sm:p-2.5 bg-brand-50 text-brand-700 rounded-xl shrink-0">
                <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <strong className="block text-stone-900 text-[11px] sm:text-xs leading-tight">
                  Nationwide Delivery
                </strong>
                <span className="text-stone-500 text-[9.5px] sm:text-xs leading-tight block">
                  Cash on Delivery Available
                </span>
              </div>
            </div>
            <div className="flex items-center justify-start sm:justify-center gap-2.5 sm:gap-3.5 w-full">
              <div className="p-2 sm:p-2.5 bg-brand-50 text-brand-700 rounded-xl shrink-0">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <strong className="block text-stone-900 text-[11px] sm:text-xs leading-tight">
                  Fast Delivery
                </strong>
                <span className="text-stone-500 text-[9.5px] sm:text-xs leading-tight block">
                  Within 24-48 Hours
                </span>
              </div>
            </div>
            <div className="flex items-center justify-start sm:justify-center gap-2.5 sm:gap-3.5 w-full">
              <div className="p-2 sm:p-2.5 bg-brand-50 text-brand-700 rounded-xl shrink-0">
                <Award className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <strong className="block text-stone-900 text-[11px] sm:text-xs leading-tight">
                  7 Days Return
                </strong>
                <span className="text-stone-500 text-[9.5px] sm:text-xs leading-tight block">
                  Hassle-Free Guarantee
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ৪. Naturo & Ghorer Bazar Inspired "Best Selling Products" Showcase (পণ্য, মূল্য ও সরাসরি বাই নাও বাটন) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-16 w-full">
          {/* Header Section */}
          <div className="text-center max-w-xl mx-auto space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-black text-brand-900 tracking-tight leading-snug">
              Best Selling Products
            </h2>
            <p className="text-xs sm:text-sm tracking-normal text-stone-500 font-medium leading-relaxed">
              গ্রাহকদের সবচেয়ে পছন্দের ও সর্বাধিক বিক্রিত খাঁটি পণ্যসমূহ
            </p>
            <div className="w-16 h-1 bg-amber-500 rounded-full mx-auto mt-2.5" />
          </div>

          {/* Responsive Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mt-8">
            {bestSellingProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Bottom Action */}
          <div className="text-center mt-8 sm:mt-10">
            <Link
              href="/shop"
              prefetch={true}
              className="inline-flex items-center gap-2 px-6 h-11 rounded-xl border-2 border-brand-700 text-brand-800 hover:bg-brand-700 hover:text-white font-bold text-xs sm:text-sm transition-all shadow-xs group"
            >
              <span>সব পণ্য দেখুন</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>

        {/* ৫. সেকেন্ডারি প্রমোশনাল ব্যানার (অফার ব্যানার - মোবাইলে বেস্ট সেলিং সেকশনের নিচে) */}
        <MobilePromoBanners />

        {/* ৬. ক্যাটাগরি তালিকা */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-16 w-full space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-stone-200/80">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-brand-700 bg-brand-50 border border-brand-200/60 px-2.5 py-0.5 rounded-full mb-1.5">
                খাঁটি পণ্যের সমাহার
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-stone-900 tracking-tight leading-snug">
                পণ্য ক্যাটাগরি
              </h2>
              <p className="text-xs sm:text-sm tracking-normal text-stone-500 font-medium leading-relaxed mt-0.5">
                আপনার প্রয়োজনীয় খাঁটি ও প্রাকৃতিক খাদ্যপণ্য বেছে নিন।
              </p>
            </div>
            <Link
              href="/shop"
              prefetch={true}
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-accent-dark transition-colors group self-start sm:self-auto"
            >
              <span>সব পণ্য দেখুন</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-5">
            {CATEGORIES_DATA.map((cat) => {
              const imageSrc = getCategoryDisplayImage(cat.slug, cat.imageUrl);

              return (
                <Link
                  key={cat.id}
                  href={"/category/" + cat.slug}
                  prefetch={true}
                  className="group p-3 sm:p-4 bg-white rounded-2xl border border-stone-200/80 hover:border-brand-700/60 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between text-left"
                >
                  <div>
                    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-surface-canvas border border-stone-200/60">
                      <Image
                        src={imageSrc}
                        alt={cat.nameBn}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <h3 className="font-bold text-xs sm:text-sm text-stone-900 group-hover:text-brand-700 transition-colors leading-snug line-clamp-1">
                      {cat.nameBn}
                    </h3>
                    <span className="text-[11px] text-stone-500 block mt-0.5 font-sans line-clamp-1">
                      {cat.nameEn}
                    </span>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-stone-200/60 flex items-center justify-between text-[11px] font-bold text-brand-700 group-hover:text-accent-dark transition-colors">
                    <span>পণ্য দেখুন</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* গ্রাহকদের সন্তুষ্টি ও মতামত (What Our Customers Say - Review Slider) */}
        <TestimonialsSection />

        {/* সম্পূর্ণ ক্যাটালগ ও সকল খাঁটি পণ্যসমূহ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-16 w-full space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-stone-200/80">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full mb-1.5">
                সম্পূর্ণ ক্যাটালগ
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-stone-900 tracking-tight leading-snug">
                আমাদের সকল খাঁটি পণ্যসমূহ
              </h2>
              <p className="text-xs sm:text-sm tracking-normal text-stone-500 font-medium leading-relaxed mt-0.5">
                সুন্নাহ সোর্সের শতভাগ বিশুদ্ধ ও অর্গানিক খাদ্যপণ্যের সম্পূর্ণ সমাহার।
              </p>
            </div>
            <Link
              href="/shop"
              prefetch={true}
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-accent-dark transition-colors group self-start sm:self-auto"
            >
              <span>দোকানের সব পণ্য দেখুন</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {ALL_PRODUCTS.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      </main>

      {/* ৪. গ্লোবাল ফুটার */}
      <Footer />

      {/* ৫. মোবাইল বটম ন্যাভিগেশন বার */}
      <MobileBottomNav />

      {/* ৬. স্লাইড-ওভার শপিং কার্ট ড্রয়ার */}
      <CartDrawer />
    </div>
  );
}
