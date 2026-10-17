import React from "react";
import type { Metadata } from "next";
import { FolderTree, AlertCircle } from "lucide-react";
import { getAdminCategories } from "@/lib/actions/admin-category-actions";
import { CategoriesManager } from "@/components/admin/categories/categories-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ক্যাটাগরি | Sunnah Source Admin",
  description: "সুন্নাহ সোর্স পণ্য ক্যাটাগরি ব্যবস্থাপনা — যোগ, এডিট ও ডিলিট।",
};

export default async function AdminCategoriesPage() {
  const result = await getAdminCategories();

  // Determine if data came from live DB or static catalog
  const isUsingLiveDb = result.isFromLiveDb === true;

  return (
    <div className="space-y-6 font-bengali">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold mb-2">
            <FolderTree className="w-3.5 h-3.5" />
            <span>ক্যাটাগরি ম্যানেজমেন্ট</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-charcoal-900 tracking-tight">
            ক্যাটাগরি ব্যবস্থাপনা (Categories)
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500 mt-0.5">
            পণ্য ক্যাটাগরি তৈরি, সম্পাদনা ও পরিচালনা করুন। ডিসপ্লে অর্ডার ও
            সক্রিয়তা নিয়ন্ত্রণ করুন।
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
            {result.message || "ক্যাটাগরি তালিকা লোড করা যায়নি।"}
          </h3>
          <p className="text-xs text-charcoal-500 max-w-sm mx-auto">
            ডেটা লোড করতে সমস্যা হয়েছে। পেজটি রিফ্রেশ করুন।
          </p>
        </div>
      ) : (
        <CategoriesManager
          initialCategories={result.data || []}
          isUsingLiveDb={isUsingLiveDb}
        />
      )}
    </div>
  );
}
