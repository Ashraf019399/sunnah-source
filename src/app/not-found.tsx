import React from "react";
import Link from "next/link";
import { SearchX, Home, ShoppingBag } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-surface-canvas font-bengali">
      <div className="max-w-lg w-full bg-white border border-surface-border rounded-3xl p-8 sm:p-10 text-center shadow-sm space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center">
          <SearchX className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-accent-dark bg-surface-muted px-3 py-1 rounded-full">
            404 • পেজটি পাওয়া যায়নি
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-charcoal-900 pt-1">
            দুঃখিত, আপনি যে পেজটি খুঁজছেন তা নেই
          </h1>
          <p className="text-sm text-charcoal-500 leading-relaxed">
            লিংকটি ভুল হতে পারে অথবা পণ্য/পাতাটি সরিয়ে ফেলা হয়েছে। নিচের বাটনগুলো থেকে আমাদের খাঁটি সুন্নাহ পণ্যের ভান্ডারে ফিরে যেতে পারেন।
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-sm font-bold transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>হোমপেজে ফিরে যান</span>
          </Link>
          <Link
            href="/shop"
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-surface-border bg-surface-canvas hover:bg-surface-muted text-charcoal-900 text-sm font-bold transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>সব পণ্য দেখুন</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
