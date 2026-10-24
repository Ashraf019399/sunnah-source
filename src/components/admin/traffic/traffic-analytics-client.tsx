"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Eye,
  ShoppingCart,
  ShoppingBag,
  PackageCheck,
  Activity,
  Settings,
  ArrowRight,
  BarChart3,
  Sparkles,
  Calendar,
  Flame,
} from "lucide-react";
import { toBanglaDigits } from "@/lib/utils";
import type {
  TrafficTimeframe,
  StoreTrafficMetrics,
  DailyBreakdownItem,
} from "@/lib/services/traffic-analytics";

interface TrafficAnalyticsClientProps {
  data: StoreTrafficMetrics;
}

const TIMEFRAME_OPTIONS: Array<{
  id: TrafficTimeframe;
  label: string;
  sublabel: string;
}> = [
  { id: "today", label: "আজ", sublabel: "আজকের লাইভ" },
  { id: "last7days", label: "গত ৭ দিন", sublabel: "বিগত এক সপ্তাহ" },
  { id: "thisMonth", label: "এই মাস", sublabel: "চলতি মাস" },
  { id: "allTime", label: "সর্বমোট", sublabel: "লাইফটাইম" },
];

export function TrafficAnalyticsClient({ data }: TrafficAnalyticsClientProps) {
  const [selectedTimeframe, setSelectedTimeframe] =
    useState<TrafficTimeframe>("last7days");
  const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null);

  // Active timeframe metrics
  const activeMetrics =
    data.timeframes[selectedTimeframe] || data.timeframes.last7days;

  // Mini-bar chart calculations
  const breakdown: DailyBreakdownItem[] = data.dailyBreakdown || [];
  const maxViews = Math.max(...breakdown.map((d) => d.views), 1);
  const total7DayViews = breakdown.reduce((acc, curr) => acc + curr.views, 0);

  // Active hovered or default selected day for tooltip (default to today / last item)
  const activeDayIndex =
    hoveredDayIndex !== null ? hoveredDayIndex : breakdown.length - 1;
  const activeDay = breakdown[activeDayIndex] || breakdown[breakdown.length - 1];

  return (
    <section
      aria-label="লাইভ ট্রাফিক ও ই-কমার্স অ্যাক্টিভিটি"
      className="bg-white rounded-3xl p-5 sm:p-7 border border-surface-border shadow-subtle space-y-6"
    >
      {/* 1. Header Bar with Timeframe Pills and Pixel Link */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-surface-border">
        {/* Title and Live Status Indicator */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-700 border border-brand-100 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <Activity className="w-5 h-5 text-brand-700" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-charcoal-900">
                লাইভ ট্রাফিক ও ই-কমার্স অ্যাক্টিভিটি (Live Traffic & Store Activity)
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-brand-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>লাইভ ট্র্যাকিং</span>
              </span>
            </div>
            <p className="text-xs text-charcoal-500 mt-0.5">
              মেটা পিক্সেল ও ই-কমার্স সেলস ফানেল ইভেন্টের সময়ভিত্তিক বিশ্লেষণ ({activeMetrics.periodLabel})
            </p>
          </div>
        </div>

        {/* Filter Pills & Actions */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Timeframe Filter Pills: [আজ], [গত ৭ দিন], [এই মাস], [সর্বমোট] */}
          <div
            role="tablist"
            aria-label="সময়সীমা ফিল্টার"
            className="inline-flex items-center p-1 bg-stone-100/80 rounded-2xl border border-stone-200/80 gap-1 text-xs"
          >
            {TIMEFRAME_OPTIONS.map((tf) => {
              const isActive = selectedTimeframe === tf.id;
              return (
                <button
                  key={tf.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedTimeframe(tf.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs flex items-center gap-1.5 ${
                    isActive
                      ? "bg-brand-900 text-white shadow-xs border border-brand-800"
                      : "text-charcoal-600 hover:text-charcoal-900 hover:bg-white/70"
                  }`}
                >
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-amber animate-pulse" />
                  )}
                  <span>{tf.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick link to marketing & pixel settings */}
          <Link
            href="/admin/settings"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-surface-canvas hover:bg-surface-muted border border-surface-border text-xs font-bold text-charcoal-700 transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-accent-dark" />
            <span className="hidden sm:inline">পিক্সেল সেটিংস</span>
            <ArrowRight className="w-3.5 h-3.5 text-charcoal-400" />
          </Link>
        </div>
      </div>

      {/* 2. Four Interactive Analytics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: মোট পেজ ভিউ (PageView) with Distinct "Today's Views" badge */}
        <div className="p-4 sm:p-5 rounded-2xl bg-brand-50/40 border border-brand-200/60 flex flex-col justify-between hover:border-brand-600/50 transition-all shadow-xs group">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-charcoal-700 flex items-center gap-1.5">
                <span>👁️ মোট পেজ ভিউ</span>
              </span>
              <span className="text-[10px] text-charcoal-400 block mt-0.5">
                {activeMetrics.badgeLabel}
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-white border border-brand-200 text-brand-700 flex items-center justify-center shadow-2xs group-hover:bg-brand-50 transition-colors">
              <Eye className="w-4 h-4 text-brand-700" />
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <div className="text-2xl sm:text-3xl font-black text-charcoal-900 font-sans tracking-tight">
                {toBanglaDigits(activeMetrics.totalPageViews)}
              </div>
            </div>

            {/* Distinct Highlight Badge: আজকের ভিউ (Today's Views) */}
            <div className="pt-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-amber/15 border border-accent-amber/40 text-accent-dark text-[11px] font-bold shadow-2xs">
                <Flame className="w-3 h-3 text-accent-dark fill-accent-amber" />
                <span>আজকের ভিউ: +{toBanglaDigits(data.todayViews)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-charcoal-500 border-t border-brand-200/60 pt-2">
              <span>স্টোরফ্রন্ট ভিজিটরস</span>
              <span className="font-bold text-brand-800 bg-white px-2 py-0.5 rounded-full border border-brand-200 shadow-2xs">
                PageView
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: কার্ট অ্যাক্টিভিটি (AddToCart) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/40 border border-amber-200/60 flex flex-col justify-between hover:border-amber-400/70 transition-all shadow-xs group">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-charcoal-700 flex items-center gap-1.5">
                <span>🛒 কার্ট অ্যাক্টিভিটি</span>
              </span>
              <span className="text-[10px] text-charcoal-400 block mt-0.5">
                {activeMetrics.badgeLabel}
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-white border border-amber-200 text-accent-dark flex items-center justify-center shadow-2xs group-hover:bg-amber-50 transition-colors">
              <ShoppingCart className="w-4 h-4 text-accent-dark" />
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <div className="text-2xl sm:text-3xl font-black text-charcoal-900 font-sans tracking-tight">
                {toBanglaDigits(activeMetrics.addToCartCount)}
              </div>
            </div>

            <div className="pt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-amber-200 text-charcoal-700 text-[11px] font-semibold shadow-2xs">
                <span>ভিউ থেকে কার্ট:</span>
                <strong className="text-accent-dark font-sans">
                  {toBanglaDigits(
                    activeMetrics.totalPageViews > 0
                      ? (
                          (activeMetrics.addToCartCount /
                            activeMetrics.totalPageViews) *
                          100
                        ).toFixed(1)
                      : 0
                  )}
                  %
                </strong>
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-charcoal-500 border-t border-amber-200/60 pt-2">
              <span>ব্যাগে পণ্য যুক্তকরণ</span>
              <span className="font-bold text-accent-dark bg-white px-2 py-0.5 rounded-full border border-amber-200 shadow-2xs">
                AddToCart
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: চেকআউট শুরু (InitiateCheckout) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/40 border border-emerald-200/60 flex flex-col justify-between hover:border-emerald-400/70 transition-all shadow-xs group">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-charcoal-700 flex items-center gap-1.5">
                <span>🛍️ চেকআউট শুরু</span>
              </span>
              <span className="text-[10px] text-charcoal-400 block mt-0.5">
                {activeMetrics.badgeLabel}
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-white border border-emerald-200 text-brand-700 flex items-center justify-center shadow-2xs group-hover:bg-emerald-50 transition-colors">
              <ShoppingBag className="w-4 h-4 text-brand-700" />
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <div className="text-2xl sm:text-3xl font-black text-charcoal-900 font-sans tracking-tight">
                {toBanglaDigits(activeMetrics.initiateCheckoutCount)}
              </div>
            </div>

            <div className="pt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-emerald-200 text-charcoal-700 text-[11px] font-semibold shadow-2xs">
                <span>কার্ট থেকে চেকআউট:</span>
                <strong className="text-brand-800 font-sans">
                  {toBanglaDigits(activeMetrics.cartToCheckoutRate)}%
                </strong>
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-charcoal-500 border-t border-emerald-200/60 pt-2">
              <span>চেকআউটে প্রবেশ</span>
              <span className="font-bold text-brand-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                InitiateCheckout
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: সফল অর্ডার ও রূপান্তর হার (Purchase / Conversion) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900 border border-brand-800 text-white flex flex-col justify-between shadow-subtle group">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-emerald-100 flex items-center gap-1.5">
                <span>📦 সফল অর্ডার ও রূপান্তর</span>
              </span>
              <span className="text-[10px] text-emerald-200/70 block mt-0.5">
                {activeMetrics.badgeLabel}
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-brand-800/90 border border-brand-700 text-accent-amber flex items-center justify-center shadow-2xs">
              <PackageCheck className="w-4 h-4 text-accent-amber" />
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-black text-white font-sans tracking-tight">
                {toBanglaDigits(activeMetrics.conversionRate)}%
              </div>
              <span className="text-xs text-accent-amber font-bold">
                কনভার্সন রেট
              </span>
            </div>

            <div className="pt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-950/70 border border-brand-700 text-emerald-200 text-[11px] font-semibold">
                <span>চেকআউট রূপান্তর:</span>
                <strong className="text-accent-amber font-sans">
                  {toBanglaDigits(activeMetrics.checkoutConversionRate)}%
                </strong>
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-emerald-200/80 border-t border-brand-700/80 pt-2">
              <span>{toBanglaDigits(activeMetrics.totalOrders)}টি নিশ্চিত অর্ডার</span>
              <span className="font-bold text-accent-amber bg-brand-950/80 px-2 py-0.5 rounded-full border border-brand-700">
                Purchase
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Sleek Visual Daily Breakdown Mini-Bar Chart (গত ৭ দিনের প্রতিদিনের ভিউ ও অ্যাক্টিভিটি) */}
      <div className="rounded-2xl border border-surface-border bg-gradient-to-b from-stone-50/70 via-white to-stone-50/50 p-4 sm:p-6 space-y-4">
        {/* Chart Header & Active Tooltip Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-100/80 text-brand-800 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-brand-800" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-charcoal-900">
                গত ৭ দিনের প্রতিদিনের ভিউ ও অ্যাক্টিভিটি (7-Day Daily Breakdown)
              </h3>
            </div>
            <p className="text-xs text-charcoal-500">
              প্রতিদিনের বারের ওপর মাউস বা স্পর্শ করে দৈনিক পেজ ভিউ, কার্ট ও নিশ্চিত অর্ডার পর্যবেক্ষণ করুন
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 border border-brand-200/80 text-brand-900 text-xs font-bold shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-brand-700" />
              <span>৭ দিনে মোট: {toBanglaDigits(total7DayViews)} ভিউ</span>
            </div>
          </div>
        </div>

        {/* Live Hover Detail Pill */}
        {activeDay && (
          <div className="bg-white rounded-xl p-3 border border-brand-200/70 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-charcoal-900 bg-stone-100 px-2.5 py-1 rounded-lg">
                📅 {activeDay.dayName} ({activeDay.date})
              </span>
              {activeDayIndex === breakdown.length - 1 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-amber/20 text-accent-dark border border-accent-amber/40">
                  আজকের দিন
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-700" />
                <span className="text-charcoal-500">পেজ ভিউ:</span>
                <strong className="text-charcoal-900 font-sans">
                  {toBanglaDigits(activeDay.views)}
                </strong>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent-amber" />
                <span className="text-charcoal-500">কার্ট:</span>
                <strong className="text-charcoal-900 font-sans">
                  {toBanglaDigits(activeDay.carts)}
                </strong>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span className="text-charcoal-500">অর্ডার:</span>
                <strong className="text-charcoal-900 font-sans">
                  {toBanglaDigits(activeDay.orders)}
                </strong>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-charcoal-500">দৈনিক রূপান্তর:</span>
                <strong className="text-brand-800 font-sans">
                  {toBanglaDigits(
                    activeDay.views > 0
                      ? ((activeDay.orders / activeDay.views) * 100).toFixed(1)
                      : 0
                  )}
                  %
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* The 7-Day Visual Mini-Bar Columns */}
        <div className="pt-2">
          <div className="h-44 sm:h-52 w-full grid grid-cols-7 gap-2 sm:gap-4 items-end pb-2 pt-6 border-b border-stone-200">
            {breakdown.map((item, idx) => {
              const isToday = idx === breakdown.length - 1;
              const isHovered = activeDayIndex === idx;
              const heightPercent = Math.max(
                14,
                Math.round((item.views / maxViews) * 100)
              );

              return (
                <div
                  key={item.date}
                  tabIndex={0}
                  role="button"
                  aria-label={`${item.dayName} ${item.date}: ${item.views} ভিউ`}
                  onMouseEnter={() => setHoveredDayIndex(idx)}
                  onMouseLeave={() => setHoveredDayIndex(null)}
                  onClick={() => setHoveredDayIndex(idx)}
                  className="group relative flex flex-col items-center h-full justify-end cursor-pointer outline-none select-none"
                >
                  {/* Floating Micro-Badge above bar */}
                  <div
                    className={`absolute -top-7 text-[11px] font-sans font-bold px-1.5 py-0.5 rounded-md transition-all pointer-events-none whitespace-nowrap shadow-2xs ${
                      isHovered
                        ? "bg-brand-900 text-white scale-110 opacity-100 z-20"
                        : "text-charcoal-600 opacity-0 group-hover:opacity-100 z-10"
                    }`}
                  >
                    {toBanglaDigits(item.views)}
                  </div>

                  {/* Vertical Bar Cylinder */}
                  <div className="w-full max-w-[48px] h-full flex items-end">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-xl transition-all duration-300 relative overflow-hidden ${
                        isToday
                          ? isHovered
                            ? "bg-gradient-to-t from-brand-900 via-emerald-600 to-accent-amber ring-2 ring-accent-amber shadow-md"
                            : "bg-gradient-to-t from-brand-900 via-brand-700 to-accent-amber border-t-2 border-accent-amber shadow-xs"
                          : isHovered
                          ? "bg-gradient-to-t from-brand-900 via-brand-800 to-emerald-600 ring-2 ring-brand-700 shadow-md scale-y-[1.02]"
                          : "bg-gradient-to-t from-brand-900/90 via-brand-800 to-brand-700 hover:brightness-110"
                      }`}
                    >
                      {/* Subtle light shimmer line */}
                      <div className="absolute inset-x-0 top-0 h-1 bg-white/40" />

                      {/* Small order indicator dot inside bar if orders > 0 */}
                      {item.orders > 0 && (
                        <div className="absolute bottom-1.5 inset-x-0 flex justify-center">
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-accent-amber shadow-xs"
                            title={`${toBanglaDigits(item.orders)}টি অর্ডার`}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Under-bar labels: Bengali Day Name, Date, and Today Tag */}
          <div className="grid grid-cols-7 gap-2 sm:gap-4 pt-2.5 text-center">
            {breakdown.map((item, idx) => {
              const isToday = idx === breakdown.length - 1;
              const isHovered = activeDayIndex === idx;

              return (
                <div
                  key={item.date}
                  onClick={() => setHoveredDayIndex(idx)}
                  className={`cursor-pointer transition-colors ${
                    isHovered ? "text-brand-900" : "text-charcoal-600"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span
                      className={`text-xs sm:text-sm font-bold ${
                        isToday
                          ? "text-brand-900 font-black underline decoration-accent-amber decoration-2 underline-offset-2"
                          : ""
                      }`}
                    >
                      {item.dayName}
                    </span>
                  </div>
                  <div className="text-[10px] text-charcoal-400 font-sans mt-0.5">
                    {item.date.slice(5).replace("-", "/")}
                  </div>
                  {isToday && (
                    <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-accent-amber/20 text-accent-dark">
                      আজ
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] text-charcoal-500 border-t border-stone-200/60">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-t from-brand-900 to-brand-700" />
              <span>দৈনিক পেজ ভিউ</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-t from-brand-900 to-accent-amber border-t border-accent-amber" />
              <span>আজকের গতিবিধি (Live Today)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-amber" />
              <span>অর্ডার সম্পন্ন হয়েছে</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-charcoal-400">
            <Sparkles className="w-3.5 h-3.5 text-accent-dark" />
            <span>স্বয়ংক্রিয় লাইভ সিঙ্ক</span>
          </div>
        </div>
      </div>
    </section>
  );
}
