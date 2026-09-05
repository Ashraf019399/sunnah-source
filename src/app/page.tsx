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
        <section className="bg-brand-900 text-white py-12 md:py-20 px-4 border-b border-brand-800">
          <div className="container mx-auto max-w-7xl flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl space-y-4 text-center lg:text-left">
              <span className="inline-block bg-accent-amber/20 text-accent-amber border border-accent-amber/40 text-xs font-bold px-3 py-1 rounded-full">
                ১০০% খাঁটি ও প্রাকৃতিক গ্যারান্টি
              </span>
              <h1 className="text-3xl md:text-5xl font-black leading-tight">
                প্রকৃতির আসল বিশুদ্ধতা, <br />সুন্নাহর স্বাস্থ্যকর উপহার
              </h1>
              <p className="text-stone-300 text-sm md:text-base leading-relaxed">
                সুন্দরবনের গভীর জঙ্গলের কাঁচা মধু, প্রথাগত বিলোনা গাওয়া ঘি, কাঠের ঘানি ভাঙা ঝাঁঝালো সরিষার তেল ও মদিনার আজওয়া খেজুর।
              </p>
              <div className="pt-2 flex flex-wrap gap-3 justify-center lg:justify-start">
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
            <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-brand-800">
              <Image
                src="https://images.unsplash.com/photo-1587049352847-4a222e784d38?auto=format&fit=crop&w=800&q=80"
                alt="Sunnah Source Raw Honey"
                fill
                className="object-cover"
                priority
              />
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
          <div className="flex items-center justify-between pb-2 border-b border-surface-border">
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-charcoal-900">
                পণ্য ক্যাটাগরি (Categories)
              </h2>
              <p className="text-xs text-charcoal-500 mt-0.5">
                আপনার প্রয়োজনীয় খাঁটি খাদ্যপণ্য বেছে নিন।
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {CATEGORIES_DATA.map((cat) => (
              <Link
                key={cat.id}
                href={"/category/" + cat.slug}
                className="group p-4 bg-white rounded-2xl border border-surface-border hover:border-brand-700 hover:shadow-card transition-all text-center flex flex-col items-center justify-between"
              >
                <div className="relative w-16 h-16 rounded-full overflow-hidden mb-3 bg-surface-canvas">
                  <Image
                    src={cat.imageUrl}
                    alt={cat.nameBn}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-charcoal-900 group-hover:text-brand-700 transition-colors">
                    {cat.nameBn}
                  </h3>
                  <span className="text-[10px] text-charcoal-500 block mt-0.5 font-sans">
                    {cat.nameEn}
                  </span>
                </div>
              </Link>
            ))}
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
