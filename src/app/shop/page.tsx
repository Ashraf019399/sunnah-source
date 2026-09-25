import React, { Suspense } from "react";
import type { Metadata } from "next";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { ShopContent } from "./shop-content";
import { Loader2 } from "lucide-react";

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
            <div className="min-h-[50vh] flex items-center justify-center font-bengali">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-brand-700 animate-spin" />
                <p className="text-charcoal-700 text-sm font-medium">পণ্য লোড হচ্ছে...</p>
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
