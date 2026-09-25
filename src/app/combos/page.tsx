import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { ALL_PRODUCTS } from "@/lib/data/products";
import { ProductCard } from "@/components/commerce/product-card";
import {
  ChevronRight,
  Gift,
  ArrowRight,
  Percent,
  Truck,
  PackageCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "কম্বো অফার | Sunnah Source",
  description: "সুন্নাহ সোর্সের সাশ্রয়ী মূল্যের বিশেষ কম্বো প্যাক ও গিফট বক্স। খাঁটি মধু, ঘি, তেল ও খেজুরের অসাধারণ সমাহার।",
};

function toBengaliNumber(num: number): string {
  const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return num.toString().replace(/\d/g, (d) => bengaliDigits[Number(d)]);
}

export default function CombosPage() {
  // Filter products actually marked as combo products in the existing data
  const comboProducts = ALL_PRODUCTS.filter(
    (product) => product.isCombo === true || product.categorySlug === "combos"
  );

  return (
    <div className="min-h-screen flex flex-col bg-surface-canvas font-bengali">
      {/* ১. টপ অ্যানাউন্সমেন্ট বার */}
      <AnnouncementBar />

      {/* ২. মূল হেডার ও সার্চ বার */}
      <Header />

      {/* ৩. কম্বো অফার মূল কনটেন্ট */}
      <main className="flex-1 pb-16 lg:pb-12 space-y-8">
        {/* Breadcrumb & Header Banner */}
        <section className="bg-white border-b border-surface-border py-8 px-4 shadow-subtle">
          <div className="container mx-auto max-w-7xl space-y-4">
            {/* Breadcrumb: হোম → কম্বো অফার */}
            <nav aria-label="ব্রেডক্রাম্ব" className="flex items-center gap-1.5 text-xs text-charcoal-500">
              <Link href="/" className="hover:text-brand-700 transition-colors font-medium">
                হোম
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span className="text-brand-900 font-bold">কম্বো অফার</span>
            </nav>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 bg-accent-amber/15 border border-accent-amber/40 text-charcoal-900 text-[11px] font-bold px-3 py-1 rounded-full mb-1">
                  <Gift className="w-3.5 h-3.5 text-accent-dark" />
                  <span>সাশ্রয়ী মূল্যে প্রিমিয়াম কম্বো ও গিফট প্যাকেজ</span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-charcoal-900 tracking-tight leading-snug">
                  কম্বো অফার
                </h1>
                <p className="text-xs sm:text-sm text-charcoal-500 leading-relaxed">
                  সুন্নাহ সোর্সের খাঁটি খাদ্যপণ্যের বিশেষ কম্বো প্যাকেজ। সাশ্রয়ী মূল্যে খাঁটি মধু, বিলোনা ঘি, ঘানি ভাঙা সরিষার তেল ও আজওয়া খেজুরের অসাধারণ বান্ডেল।
                </p>
              </div>

              {comboProducts.length > 0 && (
                <div className="flex items-center gap-2 self-start sm:self-auto bg-surface-canvas border border-surface-border px-3.5 py-1.5 rounded-xl">
                  <span className="text-xs sm:text-sm font-bold text-charcoal-900 font-mono">
                    {toBengaliNumber(comboProducts.length)}টি কম্বো
                  </span>
                  <span className="text-xs text-charcoal-500">উপলব্ধ</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Content Section: Product Grid OR Polished Empty State */}
        <section className="container mx-auto max-w-7xl px-4 space-y-8">
          {comboProducts.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-surface-border">
                <span className="text-xs sm:text-sm font-bold text-charcoal-900 font-mono">
                  {toBengaliNumber(comboProducts.length)}টি কম্বো অফার প্রদর্শিত হচ্ছে
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {comboProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          ) : (
            /* Polished Coming Soon / Empty State */
            <div className="space-y-8">
              <div className="bg-white rounded-3xl border border-surface-border p-8 sm:p-12 text-center max-w-xl mx-auto space-y-5 shadow-card my-4">
                <div className="w-16 h-16 bg-brand-50 border border-brand-200/80 rounded-2xl flex items-center justify-center mx-auto text-brand-700 shadow-xs">
                  <Gift className="w-8 h-8" />
                </div>
                
                <div className="space-y-2">
                  <span className="inline-block bg-accent-amber/15 text-accent-dark border border-accent-amber/40 text-xs font-bold px-3 py-1 rounded-full">
                    শীঘ্রই উন্মুক্ত হচ্ছে
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-charcoal-900">
                    বিশেষ কম্বো প্যাক শীঘ্রই আসছে!
                  </h2>
                  <p className="text-xs sm:text-sm text-charcoal-600 leading-relaxed max-w-md mx-auto">
                    আমরা আপনাদের জন্য তৈরি করছি সাশ্রয়ী মূল্যের বিশেষ সান্নাহ কম্বো প্যাক ও উপহার দেওয়ার মতো আকর্ষণীয় গিফট বক্স।
                    খুব শীঘ্রই নতুন কম্বো অফারগুলো এখানে উন্মুক্ত করা হবে।
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    href="/shop"
                    className="inline-flex items-center justify-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold px-6 py-3 rounded-xl text-xs sm:text-sm transition-all shadow-card cursor-pointer"
                  >
                    <span>সব পণ্য দেখুন</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Combo Features / Value Props */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto pt-2 text-xs">
                <div className="p-4 bg-white rounded-2xl border border-surface-border shadow-subtle flex items-start gap-3">
                  <div className="p-2 bg-brand-50 text-brand-700 rounded-xl shrink-0 mt-0.5">
                    <Percent className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-charcoal-900 text-sm font-bold mb-0.5">
                      সর্বোচ্চ মূল্য সাশ্রয়
                    </strong>
                    <span className="text-charcoal-500 leading-relaxed">
                      আলাদা কেনার চেয়ে কম্বো প্যাকেজে পাবেন আকর্ষণীয় ছাড় ও সাশ্রয়ী বান্ডেল অফার।
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-surface-border shadow-subtle flex items-start gap-3">
                  <div className="p-2 bg-brand-50 text-brand-700 rounded-xl shrink-0 mt-0.5">
                    <PackageCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-charcoal-900 text-sm font-bold mb-0.5">
                      আকর্ষণীয় গিফট বক্স
                    </strong>
                    <span className="text-charcoal-500 leading-relaxed">
                      প্রিয়জনকে স্বাস্থ্যকর প্রাকৃতিক খাবার উপহার দিতে স্পেশাল ক্রাফট বক্স প্যাকেজিং।
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-surface-border shadow-subtle flex items-start gap-3">
                  <div className="p-2 bg-brand-50 text-brand-700 rounded-xl shrink-0 mt-0.5">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-charcoal-900 text-sm font-bold mb-0.5">
                      ফ্রি ডেলিভারি সুবিধা
                    </strong>
                    <span className="text-charcoal-500 leading-relaxed">
                      ৳২,০০০ বা তার বেশি মূল্যের কম্বো অর্ডারে পাচ্ছেন সারাদেশব্যাপী ফ্রি ডেলিভারি।
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
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
