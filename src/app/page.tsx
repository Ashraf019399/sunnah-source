import React from "react";
import Link from "next/link";
import Image from "next/image";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { ALL_PRODUCTS } from "@/lib/data/products";
import { CATEGORIES_DATA } from "@/lib/data/categories";
import { ProductCard } from "@/components/commerce/product-card";
import { ShieldCheck, Truck, Clock, Award, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-canvas font-bengali">
      {/* ১. টপ অ্যানাউন্সমেন্ট বার */}
      <AnnouncementBar />

      {/* ২. মূল হেডার ও সার্চ বার */}
      <Header />

      {/* ৩. স্টোরফ্রন্ট বডি */}
      <main className="flex-1 space-y-12 pb-16 lg:pb-12">
        {/* হিরো ব্যানার সেকশন */}
        <section className="bg-brand-900 text-white py-12 md:py-16 lg:py-20 px-4 border-b border-brand-800">
          <div className="container mx-auto max-w-7xl flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 xl:gap-16">
            <div className="w-full lg:w-1/2 xl:flex-1 max-w-2xl lg:max-w-xl xl:max-w-2xl space-y-5 lg:space-y-6 text-center lg:text-left">
              <span className="inline-block bg-accent-amber/20 text-accent-amber border border-accent-amber/40 text-xs font-bold px-3 py-1 rounded-full">
                ১০০% খাঁটি ও প্রাকৃতিক গ্যারান্টি
              </span>
              <h1 className="text-3xl md:text-5xl font-black leading-tight lg:leading-[1.2]">
                প্রকৃতির আসল বিশুদ্ধতা, <br />সুন্নাহর স্বাস্থ্যকর উপহার
              </h1>
              <p className="text-stone-300 text-sm md:text-base leading-relaxed">
                সুন্দরবনের গভীর জঙ্গলের কাঁচা মধু, প্রথাগত বিলোনা গাওয়া ঘি, কাঠের ঘানি ভাঙা ঝাঁঝালো সরিষার তেল ও মদিনার আজওয়া খেজুর।
              </p>
              <div className="pt-2 sm:pt-3 flex flex-wrap gap-3 justify-center lg:justify-start">
                <Link
                  href="/shop"
                  className="bg-accent-amber hover:bg-accent-dark text-charcoal-900 font-extrabold px-6 py-3 rounded-xl text-sm transition-all shadow-card"
                >
                  পণ্যসমূহ দেখুন
                </Link>
                <Link
                  href="/combos"
                  className="bg-brand-800 hover:bg-brand-700 text-white font-bold px-6 py-3 rounded-xl text-sm border border-brand-700 transition-all"
                >
                  স্পেশাল কম্বো
                </Link>
              </div>
            </div>
            <div className="w-full lg:w-1/2 xl:flex-1 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-lg lg:max-w-[480px] xl:max-w-[540px] aspect-[1402/1122] rounded-3xl overflow-hidden shadow-2xl border-4 border-brand-800">
                <Image
                  src="/images/hero-honey.png"
                  alt="Sunnah Source Raw Honey"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 540px"
                  className="object-cover object-center"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* ৪টি ট্রাস্ট ফিচার ব্যাজ */}
        <section className="container mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-white rounded-2xl border border-surface-border shadow-subtle text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand-50 text-brand-700 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <strong className="block text-charcoal-900">১০০% নির্ভেজাল</strong>
                <span className="text-charcoal-500">ল্যাব টেস্ট সার্টিফাইড</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand-50 text-brand-700 rounded-xl">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <strong className="block text-charcoal-900">সারাদেশে ডেলিভারি</strong>
                <span className="text-charcoal-500">হোম ডেলিভারি ক্যাশ অন</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand-50 text-brand-700 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <strong className="block text-charcoal-900">দ্রুত ডেলিভারি</strong>
                <span className="text-charcoal-500">২৪-৪৮ ঘণ্টার মধ্যে</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand-50 text-brand-700 rounded-xl">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <strong className="block text-charcoal-900">৭ দিনের রিটার্ন</strong>
                <span className="text-charcoal-500">ঝুঁকিমুক্ত গ্যারান্টি</span>
              </div>
            </div>
          </div>
        </section>

        {/* ক্যাটাগরি তালিকা */}
        <section className="container mx-auto max-w-7xl px-4 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-surface-border">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-brand-700 bg-brand-50 border border-brand-200/60 px-2.5 py-0.5 rounded-full mb-1.5">
                খাঁটি পণ্যের সমাহার
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-charcoal-900 tracking-tight">
                পণ্য ক্যাটাগরি
              </h2>
              <p className="text-xs sm:text-sm text-charcoal-500 mt-0.5">
                আপনার প্রয়োজনীয় খাঁটি ও প্রাকৃতিক খাদ্যপণ্য বেছে নিন।
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-accent-dark transition-colors group self-start sm:self-auto"
            >
              <span>সব পণ্য দেখুন</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-5">
            {CATEGORIES_DATA.map((cat) => {
              const categoryImages: Record<string, string> = {
                honey: "/images/hero-honey.png",
                "ghee-oil": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80",
                dates: "https://images.unsplash.com/photo-1648288725055-5ba4063355b9?auto=format&fit=crop&w=800&q=80",
                "organic-seeds": "https://images.unsplash.com/photo-1514733670139-4d87a1941d55?auto=format&fit=crop&w=800&q=80",
                combos: "https://images.unsplash.com/photo-1777768785464-826af9f5d2e4?auto=format&fit=crop&w=800&q=80",
              };
              const imageSrc = categoryImages[cat.slug] || cat.imageUrl;

              return (
                <Link
                  key={cat.id}
                  href={"/category/" + cat.slug}
                  className="group p-3 sm:p-4 bg-white rounded-2xl border border-surface-border hover:border-brand-700/60 shadow-subtle hover:shadow-card transition-all duration-300 flex flex-col justify-between text-left"
                >
                  <div>
                    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-surface-canvas border border-surface-border/40">
                      <Image
                        src={imageSrc}
                        alt={cat.nameBn}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <h3 className="font-bold text-xs sm:text-sm text-charcoal-900 group-hover:text-brand-700 transition-colors leading-snug line-clamp-1">
                      {cat.nameBn}
                    </h3>
                    <span className="text-[11px] text-charcoal-500 block mt-0.5 font-sans line-clamp-1">
                      {cat.nameEn}
                    </span>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-surface-border/60 flex items-center justify-between text-[11px] font-bold text-brand-700 group-hover:text-accent-dark transition-colors">
                    <span>পণ্য দেখুন</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* সেরা বিক্রিত পণ্যসমূহ (প্রোডাক্ট গ্রিড) */}
        <section className="container mx-auto max-w-7xl px-4 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-surface-border">
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-charcoal-900">
                সেরা বিক্রিত পণ্যসমূহ (Best Sellers)
              </h2>
              <p className="text-xs text-charcoal-500 mt-0.5">
                সবচেয়ে জনপ্রিয় এবং খাঁটি প্রাকৃতিক খাদ্যপণ্য।
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:underline"
            >
              <span>সব দেখুন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ...ALL_PRODUCTS.map((prod) => {
                const productImages: Record<string, string> = {
                  "prod-h-1": "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=800&q=80",
                  "prod-g-1": "https://images.unsplash.com/photo-1624528733107-2571fc0a8434?auto=format&fit=crop&w=800&q=80",
                  "prod-o-1": "https://images.unsplash.com/photo-1552592074-ea7a91b851b3?auto=format&fit=crop&w=800&q=80",
                  "prod-d-1": "https://images.unsplash.com/photo-1648288725055-5ba4063355b9?auto=format&fit=crop&w=800&q=80",
                };
                const newImg = productImages[prod.id];
                return newImg ? { ...prod, images: [newImg, ...prod.images.slice(1)] } : prod;
              }),
              {
                id: "prod-s-1",
                categorySlug: "organic-seeds",
                titleEn: "Organic Chia Seeds & Superfoods",
                titleBn: "অর্গানিক চিয়া সিড ও সুপারফুড",
                slug: "organic-chia-seeds",
                badge: "১০০% অর্গানিক",
                originSource: "মেক্সিকো ও নাটোর, বাংলাদেশ",
                shortDescriptionBn: "উচ্চ পুষ্টিসমৃদ্ধ প্রিমিয়াম কোয়ালিটি অর্গানিক চিয়া সিড।",
                fullDescriptionBn: "ওমেগা-৩, ক্যালসিয়াম ও ফাইবার সমৃদ্ধ আমদানিকৃত ১০০% খাঁটি অর্গানিক চিয়া সিড। আন্তর্জাতিক মানসম্পন্ন ও ল্যাব টেস্ট উত্তীর্ণ।",
                ratingAverage: 4.9,
                reviewCount: 38,
                isFeatured: true,
                isActive: true,
                images: [
                  "https://images.unsplash.com/photo-1740998579390-389916f12e11?auto=format&fit=crop&w=800&q=80",
                ],
                variants: [
                  {
                    id: "var-s1-250",
                    sku: "SED-CHI-250G",
                    displayName: "২৫০ গ্রাম জার",
                    weightValue: 250,
                    weightUnit: "g",
                    regularPrice: 420,
                    salePrice: 380,
                    stockQuantity: 45,
                    lowStockThreshold: 10,
                    isDefault: true,
                  },
                  {
                    id: "var-s1-500",
                    sku: "SED-CHI-500G",
                    displayName: "৫০০ গ্রাম জার",
                    weightValue: 500,
                    weightUnit: "g",
                    regularPrice: 800,
                    salePrice: 720,
                    stockQuantity: 25,
                    lowStockThreshold: 5,
                    isDefault: false,
                  },
                ],
              },
            ].map((prod) => (
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
