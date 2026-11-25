"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Storefront Error Boundary]:", error);
  }, [error]);

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-surface-canvas font-bengali">
      <div className="max-w-md w-full bg-white border border-surface-border rounded-3xl p-8 text-center shadow-sm space-y-5">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-charcoal-900">
            সাময়িক কারিগরি ত্রুটি হয়েছে
          </h1>
          <p className="text-sm text-charcoal-500 leading-relaxed">
            দুঃখিত, এই পেজটি লোড করতে গিয়ে একটি অনাকাঙ্ক্ষিত সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন অথবা হোমপেজে ফিরে যান।
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-sm font-bold transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>আবার চেষ্টা করুন</span>
          </button>
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-surface-border bg-surface-canvas hover:bg-surface-muted text-charcoal-900 text-sm font-bold transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>হোমপেজ</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
