"use client";

import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Package,
  Truck,
  ArrowRight,
  Copy,
  Check,
  PhoneCall,
  Home,
  ShoppingBag,
} from "lucide-react";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber") || "";
  const phone = searchParams.get("phone") || "";
  const [copied, setCopied] = useState(false);

  const handleCopyOrderNumber = () => {
    if (orderNumber && typeof window !== "undefined") {
      navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16 text-center">
      {/* Success Badge */}
      <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm ring-8 ring-emerald-50">
        <CheckCircle2 className="w-12 h-12" />
      </div>

      {/* Main Title */}
      <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight mb-2">
        আলহামদুলিল্লাহ, আপনার অর্ডার সফল হয়েছে!
      </h1>
      <p className="text-sm sm:text-base text-stone-600 max-w-md mx-auto mb-8">
        সুন্নাহ সোর্স থেকে অর্ডার করার জন্য ধন্যবাদ। আমাদের কাস্টমার কেয়ার টিম শীঘ্রই ফোন করে অর্ডারটি কনফার্ম করবে।
      </p>

      {/* Order Number Card */}
      {orderNumber && (
        <div className="bg-white border-2 border-brand-200 rounded-3xl p-6 shadow-card max-w-md mx-auto mb-8 text-left space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              অর্ডার নম্বর
            </span>
            <button
              type="button"
              onClick={handleCopyOrderNumber}
              className="inline-flex items-center gap-1.5 text-xs text-brand-800 hover:text-brand-900 font-bold px-2.5 py-1 rounded-lg bg-brand-50 hover:bg-brand-100 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>কপি হয়েছে</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>কপি করুন</span>
                </>
              )}
            </button>
          </div>

          <div className="font-mono text-2xl font-black text-brand-900">
            #{orderNumber}
          </div>

          <div className="pt-2 text-xs text-stone-600 space-y-1.5 border-t border-stone-100">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-brand-700 shrink-0" />
              <span>পদ্ধতি: ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে মূল্য পরিশোধ)</span>
            </div>
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-brand-700 shrink-0" />
              <span>জরুরি প্রয়োজনে কল করুন: ০১৯১৪-৬১২০০৭</span>
            </div>
          </div>
        </div>
      )}

      {/* Action CTA Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
        {orderNumber && (
          <Link
            href={`/track-order?orderNumber=${encodeURIComponent(
              orderNumber
            )}&phone=${encodeURIComponent(phone)}`}
            className="w-full sm:w-auto flex-1 py-3.5 px-6 rounded-2xl bg-brand-800 hover:bg-brand-900 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Package className="w-4 h-4" />
            <span>অর্ডার ট্র্যাক করুন</span>
          </Link>
        )}
        <Link
          href="/shop"
          className="w-full sm:w-auto flex-1 py-3.5 px-6 rounded-2xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-800 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          <ShoppingBag className="w-4 h-4 text-brand-700" />
          <span>আরও কেনাকাটা করুন</span>
        </Link>
      </div>

      <div className="mt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-brand-800 transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span>হোম পেজে ফিরে যান</span>
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-canvas font-bengali">
      <AnnouncementBar />
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <Suspense
          fallback={
            <div className="py-20 text-center text-sm text-stone-500">
              লোড হচ্ছে...
            </div>
          }
        >
          <OrderSuccessContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

