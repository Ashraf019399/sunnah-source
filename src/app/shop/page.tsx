import React, { Suspense } from "react";
import type { Metadata } from "next";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { ShopContent } from "./shop-content";

export const metadata: Metadata = {
  title: "সব পণ্য | Sunnah Source",
  description: "সুন্নাহ সোর্সের খাঁটি ও প্রাকৃতিক খাদ্যপণ্যসমূহ দেখুন।",
};

export default function ShopPage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-canvas font-bengali">
      {/* ১. টপ অ্যানাউন্সমেন্ট বার */}
      <AnnouncementBar />

      {/* ২. মূল হেডার ও সার্চ বার */}
      <Header />

      {/* ৩. শপ পেজের মূল কনটেন্ট */}
      <main className="flex-1 pb-16 lg:pb-12">
        <Suspense
          fallback={
            <div className="container mx-auto max-w-7xl px-4 py-8 space-y-6 animate-pulse">
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <div className="h-5 w-40 rounded bg-stone-200" />
                <div className="h-4 w-24 rounded bg-stone-100" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-surface-border overflow-hidden shadow-subtle p-3 space-y-3"
                  >
                    <div className="w-full aspect-square rounded-xl bg-stone-100" />
                    <div className="space-y-2 pt-1">
                      <div className="h-4 w-3/4 rounded bg-stone-200" />
                      <div className="h-3 w-1/2 rounded bg-stone-100" />
                      <div className="h-5 w-20 rounded bg-stone-200" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          }
        >
          <ShopContent />
        </Suspense>
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
