import React from "react";

export default function AdminCategoriesLoading() {
  return (
    <div
      className="space-y-6 font-bengali animate-pulse"
      aria-busy="true"
      aria-label="ক্যাটাগরি ডেটা লোড হচ্ছে..."
    >
      {/* 1. Page Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-36 rounded-full bg-amber-50 border border-amber-200/60" />
          <div className="h-7 w-64 sm:w-80 rounded-2xl bg-stone-200" />
          <div className="h-4 w-72 sm:w-96 rounded bg-stone-100" />
        </div>
      </div>

      {/* 2. Green Data Source Alert Placeholder */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/80">
        <div className="w-4 h-4 rounded-full bg-emerald-200 shrink-0 mt-0.5" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3.5 w-48 rounded bg-emerald-200/80" />
          <div className="h-3 w-4/5 max-w-xl rounded bg-emerald-200/50" />
        </div>
      </div>

      {/* 3. Categories Table Card Skeleton */}
      <div className="bg-white rounded-3xl border border-surface-border shadow-subtle overflow-hidden">
        {/* Table Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <div className="space-y-1">
            <div className="h-4 w-32 rounded bg-stone-200" />
            <div className="h-3 w-28 rounded bg-stone-100" />
          </div>
          <div className="h-8 w-28 rounded-xl bg-brand-900/60" />
        </div>

        {/* Table Rows Skeleton (5 rows) */}
        <div className="divide-y divide-surface-border/70">
          <div className="bg-surface-canvas/60 px-4 py-2.5 flex items-center justify-between border-b border-surface-border text-xs">
            <div className="h-3 w-10 rounded bg-stone-200" />
            <div className="h-3 w-10 rounded bg-stone-200" />
            <div className="h-3 w-24 rounded bg-stone-200" />
            <div className="h-3 w-16 rounded bg-stone-200 hidden md:block" />
            <div className="h-3 w-12 rounded bg-stone-200" />
            <div className="h-3 w-12 rounded bg-stone-200" />
          </div>

          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="px-4 py-3.5 flex items-center justify-between gap-3"
            >
              <div className="w-12 flex flex-col items-center gap-1">
                <div className="h-3 w-4 rounded bg-stone-200" />
                <div className="h-3 w-4 rounded bg-stone-100" />
              </div>
              <div className="w-12 h-10 rounded-xl bg-stone-100 border border-surface-border shrink-0" />
              <div className="flex-1 min-w-0 space-y-1.5 pl-2">
                <div className="h-3.5 w-32 sm:w-44 rounded bg-stone-200" />
                <div className="h-2.5 w-24 sm:w-36 rounded bg-stone-100" />
              </div>
              <div className="w-24 hidden md:block">
                <div className="h-5 w-20 rounded-lg bg-stone-100 border border-surface-border" />
              </div>
              <div className="w-20">
                <div className="h-5 w-16 rounded-full bg-emerald-50 border border-emerald-200" />
              </div>
              <div className="w-16 flex items-center justify-end gap-2">
                <div className="w-6 h-6 rounded bg-stone-100" />
                <div className="w-6 h-6 rounded bg-stone-100" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Bottom KPI Summary Cards Skeleton (4 cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl p-4 border border-surface-border bg-white shadow-subtle flex flex-col gap-2"
          >
            <div className="h-3 w-20 rounded bg-stone-200" />
            <div className="h-6 w-12 rounded bg-stone-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
