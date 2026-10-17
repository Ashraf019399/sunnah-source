import React from "react";
import type { Metadata } from "next";
import { Tag, AlertCircle } from "lucide-react";
import { getAdminCoupons } from "@/lib/actions/admin-coupon-actions";
import { CouponsManager } from "@/components/admin/coupons/coupons-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "কুপন ও অফার | Sunnah Source Admin",
  description: "সুন্নাহ সোর্স কুপন ও ডিসকাউন্ট কোড ব্যবস্থাপনা — তৈরি, এডিট ও নিয়ন্ত্রণ।",
};

export default async function AdminCouponsPage() {
  const result = await getAdminCoupons();
  const isUsingLiveDb = result.isFromLiveDb === true;

  return (
    <div className="space-y-6 font-bengali">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-xs font-bold mb-2">
            <Tag className="w-3.5 h-3.5" />
            <span>কুপন ও ডিসকাউন্ট ম্যানেজমেন্ট</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-charcoal-900 tracking-tight">
            কুপন ও অফার ব্যবস্থাপনা (Coupons & Discounts)
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500 mt-0.5">
            ডিসকাউন্ট কোড তৈরি, ব্যবহারের সীমা, মেয়াদ ও ন্যূনতম অর্ডার মূল্য নির্ধারণ করুন।
          </p>
        </div>
      </div>

      {/* Error State */}
      {!result.success ? (
        <div className="bg-white rounded-3xl p-8 border border-rose-200 shadow-subtle text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-rose-900">
            {result.message || "কুপন তালিকা লোড করা যায়নি।"}
          </h3>
          <p className="text-xs text-charcoal-500 max-w-sm mx-auto">
            ডেটা লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে পেজটি রিফ্রেশ করুন।
          </p>
        </div>
      ) : (
        <CouponsManager
          initialCoupons={result.data || []}
          isUsingLiveDb={isUsingLiveDb}
        />
      )}
    </div>
  );
}
