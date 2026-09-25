import React from "react";
import Link from "next/link";
import {
  ShoppingBag,
  TrendingUp,
  Package,
  Users,
  FolderTree,
  Tag,
  Settings,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  Info,
} from "lucide-react";
import { getAdminDashboardMetrics } from "@/lib/actions/admin-order-actions";
import { formatBDT, toBanglaDigits } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const metricsResult = await getAdminDashboardMetrics();
  const metrics = metricsResult.success ? metricsResult.data : null;

  return (
    <div className="space-y-6 sm:space-y-8 font-bengali">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 rounded-3xl p-6 sm:p-8 text-white border border-brand-800 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-amber/20 border border-accent-amber/40 text-accent-amber text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>সিস্টেম সক্রিয় ও সুরক্ষিত</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            অ্যাডমিন ড্যাশবোর্ড (Admin Dashboard)
          </h2>
          <p className="text-stone-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            সুন্নাহ সোর্স ই-কমার্স অ্যাডমিনিস্ট্রেটিভ কন্ট্রোল প্যানেলে স্বাগতম। অথেনটিকেশন ও কোর শেল সফলভাবে প্রস্তুত করা হয়েছে।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="px-4 py-2 rounded-2xl bg-brand-800/80 border border-brand-700/80 text-xs text-stone-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent-amber" />
            <span>লাইভ সেশন সক্রিয়</span>
          </div>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <section aria-label="ওভারভিউ মেট্রিক্স">
        <h3 className="text-sm sm:text-base font-bold text-charcoal-900 mb-3 sm:mb-4">
          সারসংক্ষেপ (Overview Metrics)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Orders */}
          <div className="bg-white rounded-2xl p-5 border border-surface-border shadow-subtle flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-charcoal-500">মোট অর্ডার</span>
              <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-black text-charcoal-900 font-sans tracking-tight">
                {metrics ? toBanglaDigits(metrics.totalOrders) : "--"}
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-charcoal-500 border-t border-surface-border/60 pt-2">
                <span>অর্ডার মডিউল</span>
                <Link
                  href="/admin/orders"
                  className="font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 px-2 py-0.5 rounded-full transition-colors"
                >
                  সক্রিয়
                </Link>
              </div>
            </div>
          </div>

          {/* 2. Total Revenue */}
          <div className="bg-white rounded-2xl p-5 border border-surface-border shadow-subtle flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-charcoal-500">মোট রাজস্ব</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-accent-dark flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-black text-charcoal-900 font-sans tracking-tight">
                {metrics ? formatBDT(metrics.totalRevenue) : "৳--"}
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-charcoal-500 border-t border-surface-border/60 pt-2">
                <span>সেলস হিসাব</span>
                <span className="font-semibold text-accent-dark bg-amber-50 px-2 py-0.5 rounded-full">
                  লাইভ
                </span>
              </div>
            </div>
          </div>

          {/* 3. Products */}
          <div className="bg-white rounded-2xl p-5 border border-surface-border shadow-subtle flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-charcoal-500">ক্যাটালগ পণ্য</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-brand-700 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-black text-charcoal-900 font-sans tracking-tight">
                ৪+
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-charcoal-500 border-t border-surface-border/60 pt-2">
                <span>ইনভেন্টরি ডাটা</span>
                <span className="font-semibold text-brand-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  সংরক্ষিত
                </span>
              </div>
            </div>
          </div>

          {/* 4. Customers */}
          <div className="bg-white rounded-2xl p-5 border border-surface-border shadow-subtle flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-charcoal-500">গ্রাহক সংখ্যা</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-black text-charcoal-900 font-sans tracking-tight">
                --
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-charcoal-500 border-t border-surface-border/60 pt-2">
                <span>গ্রাহক ডেটাবেজ</span>
                <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                  শীঘ্রই আসছে
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Management Modules Grid */}
      <section aria-label="ম্যানেজমেন্ট মডিউলসমূহ">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-charcoal-900">
              অ্যাডমিন ম্যানেজমেন্ট মডিউলসমূহ
            </h3>
            <p className="text-xs text-charcoal-500 mt-0.5">
              ই-কমার্সের প্রধান অপারেশনাল সেকশনসমূহ পরিচালনা করুন।
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Orders Module Card */}
          <Link
            href="/admin/orders"
            id="orders"
            className="p-5 rounded-2xl bg-white border border-surface-border shadow-subtle flex flex-col justify-between transition-all hover:border-brand-700 hover:shadow-md group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-brand-50 text-brand-700 group-hover:bg-brand-700 group-hover:text-white transition-colors">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                  সক্রিয়
                </span>
              </div>
              <h4 className="text-sm font-bold text-charcoal-900 group-hover:text-brand-900 mb-1 transition-colors">
                অর্ডার ব্যবস্থাপনা (Orders)
              </h4>
              <p className="text-xs text-charcoal-500 leading-relaxed">
                সকল কাস্টমার অর্ডার তালিকা, স্ট্যাটাস পরিবর্তন (Pending, Confirmed, Shipped, Delivered) ও বিস্তারিত বিবরণ।
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-border/60 text-xs font-semibold text-brand-800 flex items-center justify-between">
              <span>অর্ডারসমূহ পরিচালনা করুন</span>
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </Link>

          {/* Products Module Card */}
          <div
            id="products"
            className="p-5 rounded-2xl bg-white border border-surface-border shadow-subtle flex flex-col justify-between transition-all hover:border-brand-700/40"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-brand-700">
                  <Package className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-surface-canvas border border-surface-border text-charcoal-500">
                  পরবর্তী ধাপ
                </span>
              </div>
              <h4 className="text-sm font-bold text-charcoal-900 mb-1">
                পণ্য ব্যবস্থাপনা (Products)
              </h4>
              <p className="text-xs text-charcoal-500 leading-relaxed">
                পণ্য তালিকা, নতুন পণ্য যোগ, ছবি আপলোড, মূল্য ও স্টক কোয়ান্টিটি সমন্বয়।
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-border/60 text-xs font-semibold text-charcoal-400 flex items-center justify-between">
              <span>ক্যাটালগ স্ট্রাকচার প্রস্তুত</span>
              <span className="text-[11px]">মডিউল পেন্ডিং</span>
            </div>
          </div>

          {/* Categories Module Card */}
          <div
            id="categories"
            className="p-5 rounded-2xl bg-white border border-surface-border shadow-subtle flex flex-col justify-between transition-all hover:border-brand-700/40"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-amber-50 text-accent-dark">
                  <FolderTree className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-surface-canvas border border-surface-border text-charcoal-500">
                  পরবর্তী ধাপ
                </span>
              </div>
              <h4 className="text-sm font-bold text-charcoal-900 mb-1">
                ক্যাটাগরি ব্যবস্থাপনা (Categories)
              </h4>
              <p className="text-xs text-charcoal-500 leading-relaxed">
                পণ্য ক্যাটাগরি তৈরি, এডিট ও ডিসপ্লে অর্ডার সাজানোর প্যানেল।
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-border/60 text-xs font-semibold text-charcoal-400 flex items-center justify-between">
              <span>ক্যাটাগরি ডাটা প্রস্তুত</span>
              <span className="text-[11px]">মডিউল পেন্ডিং</span>
            </div>
          </div>

          {/* Coupons Module Card */}
          <div
            id="coupons"
            className="p-5 rounded-2xl bg-white border border-surface-border shadow-subtle flex flex-col justify-between transition-all hover:border-brand-700/40"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700">
                  <Tag className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-surface-canvas border border-surface-border text-charcoal-500">
                  পরবর্তী ধাপ
                </span>
              </div>
              <h4 className="text-sm font-bold text-charcoal-900 mb-1">
                কুপন ও ডিসকাউন্ট (Coupons)
              </h4>
              <p className="text-xs text-charcoal-500 leading-relaxed">
                ডিসকাউন্ট কোড জেনারেশন, মেয়াদ নির্ধারণ ও ব্যবহারের সীমা নিয়ন্ত্রণ।
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-border/60 text-xs font-semibold text-charcoal-400 flex items-center justify-between">
              <span>চেকআউট সাপোর্ট প্রস্তুত</span>
              <span className="text-[11px]">মডিউল পেন্ডিং</span>
            </div>
          </div>

          {/* Settings Module Card */}
          <div
            id="settings"
            className="p-5 rounded-2xl bg-white border border-surface-border shadow-subtle flex flex-col justify-between transition-all hover:border-brand-700/40 md:col-span-2 lg:col-span-2"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
                  <Settings className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-surface-canvas border border-surface-border text-charcoal-500">
                  পরবর্তী ধাপ
                </span>
              </div>
              <h4 className="text-sm font-bold text-charcoal-900 mb-1">
                সিস্টেম ও ইন্টিগ্রেশন সেটিংস (Settings)
              </h4>
              <p className="text-xs text-charcoal-500 leading-relaxed">
                পেমেন্ট গেটওয়ে (bKash, SSLCommerz), কুরিয়ার লজিস্টিকস (Steadfast Courier API) এবং এসএমএস গেটওয়ে (Greenweb) কনফিগারেশন।
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-border/60 text-xs font-semibold text-charcoal-400 flex items-center justify-between">
              <span>এনভায়রনমেন্ট ভ্যারিয়েবল সাপোর্ট প্রস্তুত</span>
              <span className="text-[11px]">মডিউল পেন্ডিং</span>
            </div>
          </div>
        </div>
      </section>

      {/* Foundation & Security Status Box */}
      <div className="p-4 sm:p-5 rounded-2xl bg-brand-50 border border-brand-200/80 text-brand-900 flex items-start gap-3">
        <Info className="w-5 h-5 text-brand-700 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <span className="font-bold block">
            অ্যাডমিন অথেনটিকেশন ও ড্যাশবোর্ড ভিত্তি সক্রিয়
          </span>
          <p className="text-brand-800 leading-relaxed">
            এই ড্যাশবোর্ডটি সম্পূর্ণ সার্ভার-সাইড সেশন এবং সুন্নাহ সোর্স ভিজ্যুয়াল ডিজাইনে চালিত। অননুমোদিত এক্সেস স্বয়ংক্রিয়ভাবে লগইন রুটে রিডাইরেক্ট হয় এবং কোনো সিক্রেট কি ক্লায়েন্ট ব্রাউজারে এক্সপোজ করা হয়নি।
          </p>
        </div>
      </div>
    </div>
  );
}
