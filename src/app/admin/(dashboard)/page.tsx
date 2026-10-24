import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ShoppingBag,
  TrendingUp,
  Package,
  ShieldCheck,
  Clock,
  ArrowRight,
  ArrowUpRight,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Printer,
  Eye,
  FolderTree,
  Tag,
  Settings,
  Search,
  Truck,
  ShoppingCart,
  Activity,
  PackageCheck,
} from "lucide-react";
import {
  getAdminDashboardMetrics,
  getAdminOrders,
} from "@/lib/actions/admin-order-actions";
import { getAdminLowStockAlertsAction } from "@/lib/actions/admin-product-actions";
import { getStoreTrafficMetrics } from "@/lib/services/traffic-analytics";
import { TrafficAnalyticsClient } from "@/components/admin/traffic/traffic-analytics-client";
import { formatBDT, formatBanglaDateTime, toBanglaDigits } from "@/lib/utils";
import {
  ORDER_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
} from "@/types/orders.types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "অ্যাডমিন ড্যাশবোর্ড | Sunnah Source Admin",
  description:
    "সুন্নাহ সোর্স অ্যাডমিন এক্সিকিউটিভ ড্যাশবোর্ড - লাইভ সেলস, অর্ডার ও ইনভেন্টরি ট্র্যাকিং।",
};

export default async function AdminDashboardPage() {
  // Concurrently fetch all executive dashboard data
  const [metricsRes, ordersRes, lowStockRes] = await Promise.all([
    getAdminDashboardMetrics(),
    getAdminOrders({ page: 1, pageSize: 5 }),
    getAdminLowStockAlertsAction(5),
  ]);

  const metrics =
    metricsRes.success && metricsRes.data
      ? metricsRes.data
      : {
          totalOrders: 0,
          totalRevenue: 0,
          pendingOrders: 0,
          deliveredOrders: 0,
        };

  const recentOrders =
    ordersRes.success && ordersRes.data ? ordersRes.data.orders : [];

  const lowStockAlerts =
    lowStockRes.success && lowStockRes.data ? lowStockRes.data : [];

  const trafficMetrics = await getStoreTrafficMetrics(metrics.totalOrders);

  return (
    <div className="space-y-6 sm:space-y-8 font-bengali">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 rounded-3xl p-6 sm:p-8 text-white border border-brand-800 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-amber/20 border border-accent-amber/40 text-accent-amber text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>অ্যাডমিনিস্ট্রেটিভ এক্সিকিউটিভ কন্ট্রোল</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            অ্যাডমিন ড্যাশবোর্ড (Executive Dashboard)
          </h1>
          <p className="text-stone-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            সুন্নাহ সোর্স ই-কমার্স কন্ট্রোল প্যানেলে স্বাগতম। লাইভ সেলস, গ্রাহকের অপেক্ষমাণ অর্ডার ও ইনভেন্টরি স্টক সতর্কতার সারসংক্ষেপ।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="px-4 py-2 rounded-2xl bg-brand-800/80 border border-brand-700/80 text-xs text-stone-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent-amber" />
            <span>লাইভ ডেটা সক্রিয়</span>
          </div>
        </div>
      </div>

      {/* 2. Conditional Action Banners */}
      <div className="space-y-3">
        {/* Amber Pending Orders Alert Banner */}
        {metrics.pendingOrders > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-subtle transition-all">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-sm sm:text-base font-bold text-amber-950 flex items-center gap-1.5">
                  ⚠️ {toBanglaDigits(metrics.pendingOrders)}টি নতুন অর্ডার গ্রাহকের ফোন কনফার্মেশনের অপেক্ষায় রয়েছে
                </h2>
                <p className="text-xs text-amber-800 leading-relaxed">
                  গ্রাহকদের সাথে ফোনে যোগাযোগ করে অর্ডার ভেরিফিকেশন ও ডেলিভারি প্রস্তুত করুন।
                </p>
              </div>
            </div>
            <Link
              href="/admin/orders?status=pending"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shrink-0 shadow-xs active:scale-[0.98]"
            >
              <span>অর্ডার কনফার্ম করুন</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Rose Low-Stock Alert Banner */}
        {lowStockAlerts.length > 0 && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-subtle transition-all">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
                <AlertOctagon className="w-5 h-5 text-rose-600" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-sm sm:text-base font-bold text-rose-950 flex items-center gap-1.5">
                  🚨 {toBanglaDigits(lowStockAlerts.length)}টি পণ্যের স্টক সংকটজনক (৫ বা তার কম অবশিষ্ট)!
                </h2>
                <p className="text-xs text-rose-800 leading-relaxed">
                  গ্রাহকদের নিরবচ্ছিন্ন অর্ডার নিশ্চিত করতে অবিলম্বে পণ্যের ইনভেন্টরি রিস্টক করুন।
                </p>
              </div>
            </div>
            <Link
              href="/admin/products"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shrink-0 shadow-xs active:scale-[0.98]"
            >
              <span>ইনভেন্টরি রিস্টক করুন</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      {/* 3. Four Executive Metric Cards */}
      <section aria-label="এক্সিকিউটিভ মেট্রিক্স">
        <h2 className="sr-only">সারসংক্ষেপ মেট্রিক্স</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: মোট রাজস্ব (Realized Revenue) */}
          <div className="bg-white rounded-2xl p-5 border border-surface-border shadow-subtle flex flex-col justify-between hover:border-brand-600/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-charcoal-500">মোট রাজস্ব</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-accent-dark flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-black text-charcoal-900 font-sans tracking-tight">
                {formatBDT(metrics.totalRevenue)}
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-charcoal-500 border-t border-surface-border/60 pt-2">
                <span>আদায়কৃত নিট বিক্রয়</span>
                <span className="font-semibold text-accent-dark bg-amber-50 px-2 py-0.5 rounded-full">
                  লাইভ
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: অপেক্ষমাণ অর্ডার (Pending Orders) */}
          <div className="bg-white rounded-2xl p-5 border border-surface-border shadow-subtle flex flex-col justify-between hover:border-amber-400 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-charcoal-500">অপেক্ষমাণ অর্ডার</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-black text-charcoal-900 font-sans tracking-tight">
                {toBanglaDigits(metrics.pendingOrders)}
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-charcoal-500 border-t border-surface-border/60 pt-2">
                <span>কনফার্মেশন বাকি</span>
                <Link
                  href="/admin/orders?status=pending"
                  className={`font-semibold px-2 py-0.5 rounded-full transition-colors ${
                    metrics.pendingOrders > 0
                      ? "text-amber-800 bg-amber-100 hover:bg-amber-200"
                      : "text-brand-700 bg-emerald-50 hover:bg-emerald-100"
                  }`}
                >
                  {metrics.pendingOrders > 0 ? "অ্যাকশন প্রয়োজন" : "সব ঠিক আছে"}
                </Link>
              </div>
            </div>
          </div>

          {/* Card 3: সফল ডেলিভারি (Delivered Orders) */}
          <div className="bg-white rounded-2xl p-5 border border-surface-border shadow-subtle flex flex-col justify-between hover:border-emerald-400 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-charcoal-500">সফল ডেলিভারি</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-brand-700 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-black text-charcoal-900 font-sans tracking-tight">
                {toBanglaDigits(metrics.deliveredOrders)}
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-charcoal-500 border-t border-surface-border/60 pt-2">
                <span>গ্রাহক কর্তৃক গৃহীত</span>
                <span className="font-semibold text-brand-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  মোট {toBanglaDigits(metrics.totalOrders)}টির মধ্যে
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: ইনভেন্টরি অবস্থা (Low-Stock Warning Indicator) */}
          <div className="bg-white rounded-2xl p-5 border border-surface-border shadow-subtle flex flex-col justify-between hover:border-rose-400 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-charcoal-500">ইনভেন্টরি অবস্থা</span>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  lowStockAlerts.length > 0
                    ? "bg-rose-50 text-rose-700"
                    : "bg-emerald-50 text-brand-700"
                }`}
              >
                <Package className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div
                className={`text-2xl font-black font-sans tracking-tight ${
                  lowStockAlerts.length > 0
                    ? "text-rose-600"
                    : "text-charcoal-900"
                }`}
              >
                {lowStockAlerts.length > 0
                  ? `${toBanglaDigits(lowStockAlerts.length)}টি সংকটজনক`
                  : "পর্যাপ্ত স্টক"}
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-charcoal-500 border-t border-surface-border/60 pt-2">
                <span>থ্রেশহোল্ড (≤ ৫)</span>
                <Link
                  href="/admin/products"
                  className={`font-semibold px-2 py-0.5 rounded-full transition-colors ${
                    lowStockAlerts.length > 0
                      ? "text-rose-800 bg-rose-100 hover:bg-rose-200"
                      : "text-brand-700 bg-emerald-50 hover:bg-emerald-100"
                  }`}
                >
                  {lowStockAlerts.length > 0 ? "রিস্টক প্রয়োজন" : "স্বাভাবিক"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Live Traffic & Store Activity Analytics with Timeframe Filtering & 7-Day Breakdown */}
      <TrafficAnalyticsClient data={trafficMetrics} />

      {/* 5. Two-Column Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
        {/* Left Column (2/3 width): Recent Orders Table */}
        <section
          aria-label="সাম্প্রতিক অর্ডারসমূহ"
          className="lg:col-span-2 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-charcoal-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-brand-700" />
                <span>সাম্প্রতিক অর্ডারসমূহ (Recent Orders)</span>
              </h2>
              <p className="text-xs text-charcoal-500 mt-0.5">
                সর্বশেষ ৫টি কাস্টমার অর্ডার এবং তৎক্ষণাৎ চালান (Invoice) প্রিন্ট লিঙ্ক।
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-brand-800 hover:text-brand-900 flex items-center gap-1 hover:underline"
            >
              <span>সকল অর্ডার দেখুন ({toBanglaDigits(metrics.totalOrders)})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Recent Orders Container */}
          {recentOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 border border-surface-border text-center shadow-subtle flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-charcoal-900">
                  এখনও কোনো অর্ডার পাওয়া যায়নি
                </h3>
                <p className="text-xs text-charcoal-500 max-w-sm">
                  গ্রাহক চেকআউট সম্পন্ন করলে সর্বশেষ অর্ডারগুলো এখানে সাথে সাথে প্রদর্শিত হবে।
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-surface-border shadow-subtle overflow-hidden">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-surface-border bg-surface-canvas/60 text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                      <th className="py-3.5 px-5">অর্ডার নম্বর</th>
                      <th className="py-3.5 px-4">গ্রাহক</th>
                      <th className="py-3.5 px-3">আইটেম</th>
                      <th className="py-3.5 px-4">মোট মূল্য</th>
                      <th className="py-3.5 px-4">স্ট্যাটাস</th>
                      <th className="py-3.5 px-5 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border/70 text-xs sm:text-sm">
                    {recentOrders.map((order) => {
                      const statusCfg =
                        ORDER_STATUS_CONFIG[order.order_status] ||
                        ORDER_STATUS_CONFIG.pending;
                      const paymentCfg =
                        PAYMENT_STATUS_CONFIG[order.payment_status] ||
                        PAYMENT_STATUS_CONFIG.unpaid;

                      return (
                        <tr
                          key={order.id}
                          className="hover:bg-brand-50/30 transition-colors group"
                        >
                          {/* Order Number */}
                          <td className="py-4 px-5">
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="font-mono font-bold text-brand-800 hover:text-brand-900 hover:underline flex items-center gap-1.5"
                            >
                              <span>{order.order_number}</span>
                            </Link>
                            <span className="text-[11px] text-charcoal-400 block mt-0.5">
                              {formatBanglaDateTime(order.created_at)}
                            </span>
                          </td>

                          {/* Customer */}
                          <td className="py-4 px-4">
                            <div className="font-semibold text-charcoal-900 truncate max-w-[140px]">
                              {order.guest_name || "—"}
                            </div>
                            <div className="font-mono text-xs text-charcoal-500">
                              {order.guest_phone || "—"}
                            </div>
                          </td>

                          {/* Items Count */}
                          <td className="py-4 px-3 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-charcoal-700 border border-stone-200">
                              {toBanglaDigits(order.items_count ?? 1)}টি পণ্য
                            </span>
                          </td>

                          {/* Grand Total */}
                          <td className="py-4 px-4 font-bold text-brand-900 whitespace-nowrap">
                            <div>{formatBDT(order.grand_total)}</div>
                            <span
                              className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold border mt-0.5 ${paymentCfg.badgeClass}`}
                            >
                              {paymentCfg.labelBn}
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusCfg.badgeClass}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotClass}`}
                              />
                              <span>{statusCfg.labelBn}</span>
                            </span>
                          </td>

                          {/* Actions: View and Print Invoice */}
                          <td className="py-4 px-5 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-2">
                              {/* Invoice Button */}
                              <Link
                                href={`/admin/invoice/${order.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="প্রিন্ট চালান (A4 Invoice)"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-all shadow-2xs"
                              >
                                <Printer className="w-3.5 h-3.5 text-amber-700" />
                                <span>চালান</span>
                              </Link>

                              {/* View Details Button */}
                              <Link
                                href={`/admin/orders/${order.id}`}
                                title="অর্ডারের বিস্তারিত দেখুন"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-surface-canvas hover:bg-brand-700 hover:text-white border border-surface-border text-charcoal-700 text-xs font-bold transition-all shadow-2xs"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>বিস্তারিত</span>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View (md:hidden) */}
              <div className="md:hidden divide-y divide-surface-border">
                {recentOrders.map((order) => {
                  const statusCfg =
                    ORDER_STATUS_CONFIG[order.order_status] ||
                    ORDER_STATUS_CONFIG.pending;
                  const paymentCfg =
                    PAYMENT_STATUS_CONFIG[order.payment_status] ||
                    PAYMENT_STATUS_CONFIG.unpaid;

                  return (
                    <div key={order.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-mono font-bold text-sm text-brand-800"
                        >
                          {order.order_number}
                        </Link>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${statusCfg.badgeClass}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotClass}`}
                          />
                          <span>{statusCfg.labelBn}</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-charcoal-700">
                        <div>
                          <div className="font-semibold text-charcoal-900">
                            {order.guest_name || "—"}
                          </div>
                          <div className="text-[11px] text-charcoal-500 font-mono">
                            {order.guest_phone || "—"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-brand-900 text-sm">
                            {formatBDT(order.grand_total)}
                          </div>
                          <span className="text-[11px] text-charcoal-500">
                            {toBanglaDigits(order.items_count ?? 1)}টি পণ্য
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-surface-border/60 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-charcoal-400">
                          {formatBanglaDateTime(order.created_at)}
                        </span>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/invoice/${order.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>চালান</span>
                          </Link>
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-canvas text-charcoal-700 border border-surface-border text-xs font-bold"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>বিস্তারিত</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Right Column (1/3 width): Low-Stock Watchlist + Quick Shortcuts */}
        <div className="lg:col-span-1 space-y-6">
          {/* Low-Stock Watchlist Box */}
          <section
            aria-label="লো-স্টক সতর্কতা"
            className="bg-white rounded-3xl p-5 sm:p-6 border border-surface-border shadow-subtle space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-surface-border/70">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    lowStockAlerts.length > 0
                      ? "bg-rose-50 text-rose-700"
                      : "bg-emerald-50 text-brand-700"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-charcoal-900">
                    লো-স্টক সতর্কতা
                  </h3>
                  <span className="text-[11px] text-charcoal-500">
                    অবশিষ্ট স্টক ≤ ৫
                  </span>
                </div>
              </div>

              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  lowStockAlerts.length > 0
                    ? "bg-rose-50 text-rose-800 border-rose-200"
                    : "bg-emerald-50 text-brand-700 border-emerald-200"
                }`}
              >
                {toBanglaDigits(lowStockAlerts.length)}টি পণ্য
              </span>
            </div>

            {lowStockAlerts.length === 0 ? (
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-center space-y-1.5">
                <CheckCircle2 className="w-6 h-6 text-brand-700 mx-auto" />
                <h4 className="text-xs font-bold text-brand-900">
                  ইনভেন্টরি সম্পূর্ণ সুরক্ষিত
                </h4>
                <p className="text-[11px] text-brand-800 leading-relaxed">
                  সকল পণ্যের স্টক সন্তোষজনক! কোনো পণ্যের স্টক ৫ বা তার কম নেই।
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {lowStockAlerts.slice(0, 6).map((item) => {
                  const isOutOfStock = item.stockQuantity === 0;
                  return (
                    <div
                      key={item.variantId || item.sku}
                      className="p-3 rounded-2xl bg-surface-canvas/80 border border-surface-border/80 hover:border-brand-500/40 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="text-xs font-bold text-charcoal-900 truncate">
                          {item.productTitle}
                        </div>
                        <div className="text-[11px] text-charcoal-500 flex items-center gap-1.5">
                          <span className="text-charcoal-700 font-semibold">
                            {item.variantDisplayName}
                          </span>
                          <span>•</span>
                          <span className="font-mono text-[10px] text-charcoal-400">
                            {item.sku}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isOutOfStock
                              ? "bg-rose-100 text-rose-800 border-rose-300"
                              : item.stockQuantity <= 2
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {isOutOfStock
                            ? "স্টক শেষ (০)"
                            : `${toBanglaDigits(item.stockQuantity)}টি বাকি`}
                        </span>
                        <Link
                          href="/admin/products"
                          className="text-[10px] font-bold text-brand-700 hover:text-brand-900 hover:underline flex items-center gap-0.5"
                        >
                          <span>রিস্টক</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-2 border-t border-surface-border/70">
              <Link
                href="/admin/products"
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-surface-canvas hover:bg-brand-50 hover:text-brand-900 border border-surface-border text-xs font-bold text-charcoal-700 transition-colors"
              >
                <span>সকল পণ্য ও ইনভেন্টরি ম্যানেজ করুন</span>
                <ArrowRight className="w-3.5 h-3.5 text-brand-700" />
              </Link>
            </div>
          </section>

          {/* Quick Navigation Shortcuts */}
          <section
            aria-label="কুইক নেভিগেশন শর্টকাট"
            className="bg-white rounded-3xl p-5 sm:p-6 border border-surface-border shadow-subtle space-y-4"
          >
            <div>
              <h3 className="text-sm font-bold text-charcoal-900">
                দ্রুত অ্যাক্সেস (Shortcuts)
              </h3>
              <p className="text-[11px] text-charcoal-500">
                প্রয়োজনীয় অ্যাডমিন মডিউলসমূহে দ্রুত নেভিগেশন করুন।
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <Link
                href="/admin/products"
                className="p-3 rounded-2xl bg-surface-canvas/60 hover:bg-emerald-50 border border-surface-border hover:border-emerald-300 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100/70 text-brand-700 flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-charcoal-900 group-hover:text-brand-900 block">
                      পণ্য ক্যাটালগ ও স্টক
                    </span>
                    <span className="text-[10px] text-charcoal-500">
                      ইনভেন্টরি আপডেট ও নতুন পণ্য
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-charcoal-400 group-hover:text-brand-800 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>

              <Link
                href="/admin/coupons"
                className="p-3 rounded-2xl bg-surface-canvas/60 hover:bg-purple-50 border border-surface-border hover:border-purple-300 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-100/70 text-purple-700 flex items-center justify-center">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-charcoal-900 group-hover:text-purple-900 block">
                      কুপন ও ডিসকাউন্ট
                    </span>
                    <span className="text-[10px] text-charcoal-500">
                      প্রোমোশন ও ভাউচার পরিচালনা
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-charcoal-400 group-hover:text-purple-800 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>

              <Link
                href="/admin/categories"
                className="p-3 rounded-2xl bg-surface-canvas/60 hover:bg-amber-50 border border-surface-border hover:border-amber-300 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100/70 text-accent-dark flex items-center justify-center">
                    <FolderTree className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-charcoal-900 group-hover:text-brand-900 block">
                      ক্যাটাগরি কনফিগারেশন
                    </span>
                    <span className="text-[10px] text-charcoal-500">
                      ক্যাটাগরি সাজানো ও এডিট
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-charcoal-400 group-hover:text-brand-800 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>

              <Link
                href="/admin/settings"
                className="p-3 rounded-2xl bg-surface-canvas/60 hover:bg-slate-100 border border-surface-border hover:border-slate-300 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-200/80 text-slate-700 flex items-center justify-center">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-charcoal-900 group-hover:text-slate-900 block">
                      সিস্টেম সেটিংস
                    </span>
                    <span className="text-[10px] text-charcoal-500">
                      স্টোর প্রোফাইল ও ডেলিভারি রুলস
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-charcoal-400 group-hover:text-slate-800 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>

              <Link
                href="/track-order"
                target="_blank"
                className="p-3 rounded-2xl bg-surface-canvas/60 hover:bg-blue-50 border border-surface-border hover:border-blue-300 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-100/70 text-blue-700 flex items-center justify-center">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-charcoal-900 group-hover:text-blue-900 block">
                      পাবলিক অর্ডার ট্র্যাকিং
                    </span>
                    <span className="text-[10px] text-charcoal-500">
                      গ্রাহক ট্র্যাকিং পোর্টাল ভিউ
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-charcoal-400 group-hover:text-blue-800 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
