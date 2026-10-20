import React, { Suspense } from "react";
import type { Metadata } from "next";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { TrackOrderContent } from "@/components/tracking/track-order-content";
import { trackOrderPublicAction, PublicSafeOrderDTO } from "@/lib/actions/order-tracking-actions";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "অর্ডার ট্র্যাকিং | Sunnah Source",
  description:
    "আপনার সুন্নাহ সোর্স অর্ডারের বর্তমান অবস্থা এবং ডেলিভারি ট্র্যাকিং জানুন। অর্ডার নম্বর ও মোবাইল নম্বর দিয়ে সহজে ট্র্যাক করুন।",
  keywords: ["Sunnah Source", "Order Tracking", "অর্ডার ট্র্যাকিং", "ডেলিভারি ট্র্যাকিং", "সুন্নাহ সোর্স"],
  openGraph: {
    title: "অর্ডার ট্র্যাকিং | Sunnah Source",
    description: "আপনার অর্ডারের বর্তমান অবস্থা ও ডেলিভারি অগ্রগতি এক ক্লিকেই জেনে নিন।",
  },
};

interface TrackOrderPageProps {
  searchParams: Promise<{
    orderNumber?: string;
    phone?: string;
  }>;
}

export default async function TrackOrderPage({ searchParams }: TrackOrderPageProps) {
  const resolved = await searchParams;
  const initialOrderNumber = (resolved.orderNumber || "").trim();
  const initialPhone = (resolved.phone || "").trim();

  let initialOrderData: PublicSafeOrderDTO | null = null;
  let initialError: string | null = null;

  // Server-side pre-fetch if both query parameters are present in URL
  if (initialOrderNumber && initialPhone) {
    const result = await trackOrderPublicAction(initialOrderNumber, initialPhone);
    if (result.success && result.data) {
      initialOrderData = result.data;
    } else {
      initialError = result.message || null;
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-canvas font-bengali">
      {/* 1. Announcement Bar */}
      <AnnouncementBar />

      {/* 2. Main Storefront Header */}
      <Header />

      {/* 3. Main Track Order Content */}
      <main className="flex-1 pb-16 lg:pb-12">
        <Suspense
          fallback={
            <div className="min-h-[50vh] flex items-center justify-center font-bengali">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-brand-700 animate-spin" />
                <p className="text-charcoal-700 text-sm font-medium">ট্র্যাকিং তথ্য লোড হচ্ছে...</p>
              </div>
            </div>
          }
        >
          <TrackOrderContent
            initialOrderNumber={initialOrderNumber}
            initialPhone={initialPhone}
            initialOrderData={initialOrderData}
            initialError={initialError}
          />
        </Suspense>
      </main>

      {/* 4. Footer & Storefront Shell Overlays */}
      <Footer />
      <MobileBottomNav />
      <CartDrawer />
    </div>
  );
}
