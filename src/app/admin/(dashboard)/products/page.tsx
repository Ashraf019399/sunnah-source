import React from "react";
import type { Metadata } from "next";
import { Package, AlertCircle } from "lucide-react";
import { getAdminProducts } from "@/lib/actions/admin-product-actions";
import { ProductsList } from "@/components/admin/products/products-list";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "পণ্যসমূহ | Sunnah Source Admin",
  description: "সুন্নাহ সোর্স ক্যাটালগ পণ্য, ভ্যারিয়েন্ট এবং লাইভ স্টক তালিকা।",
};

export default async function AdminProductsPage() {
  const result = await getAdminProducts();

  return (
    <div className="space-y-6 font-bengali">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-800 text-xs font-bold mb-2">
            <Package className="w-3.5 h-3.5" />
            <span>ক্যাটালগ ও ইনভেন্টরি</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-charcoal-900 tracking-tight">
            পণ্য ব্যবস্থাপনা (Products)
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500 mt-0.5">
            সকল ক্যাটালগ পণ্য, সাইজ/ভ্যারিয়েন্ট, নিয়মিত ও অফার মূল্য এবং লাইভ স্টক মনিটর করুন।
          </p>
        </div>
      </div>

      {/* Error State if data fetch failed */}
      {!result.success ? (
        <div className="bg-white rounded-3xl p-8 border border-rose-200 shadow-subtle text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-rose-900">
            {result.message || "পণ্য তালিকা লোড করা যায়নি।"}
          </h3>
          <p className="text-xs text-charcoal-500 max-w-sm mx-auto">
            ডাটাবেজ বা সার্ভার থেকে পণ্য সংক্রান্ত তথ্য লোড করতে সমস্যা হয়েছে। দয়া করে পেজটি রিফ্রেশ করুন।
          </p>
        </div>
      ) : (
        <ProductsList
          products={result.data || []}
          hasLiveInventory={result.hasLiveInventory}
        />
      )}
    </div>
  );
}
