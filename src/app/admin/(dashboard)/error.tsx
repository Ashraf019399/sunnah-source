"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, LayoutDashboard } from "lucide-react";

export default function AdminDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Admin Panel Error Boundary]:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4 font-bengali">
      <div className="max-w-md w-full bg-white border border-surface-border rounded-3xl p-7 text-center shadow-sm space-y-5">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-charcoal-900">
            এডমিন প্যানেল লোড করতে সমস্যা হয়েছে
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-500 leading-relaxed">
            ডেটাবেস সংযোগ বা সার্ভার থেকে তথ্য আনার সময় একটি ত্রুটি ঘটেছে। পুনরায় লোড করে চেষ্টা করুন।
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs sm:text-sm font-bold transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>পুনরায় চেষ্টা করুন</span>
          </button>
          <Link
            href="/admin"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-surface-border bg-surface-canvas hover:bg-surface-muted text-charcoal-900 text-xs sm:text-sm font-bold transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>ড্যাশবোর্ড</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
