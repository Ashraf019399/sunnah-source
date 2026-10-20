import React from "react";

export default function AdminProductsLoading() {
  return (
    <div
      className="space-y-6 font-bengali animate-pulse"
      aria-busy="true"
      aria-label="পণ্য তালিকা লোড হচ্ছে..."
    >
      {/* 1. Page Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-36 rounded-full bg-brand-50 border border-brand-200/60" />
          <div className="h-7 w-64 sm:w-80 rounded-2xl bg-stone-200" />
          <div className="h-4 w-72 sm:w-96 rounded bg-stone-100" />
        </div>
      </div>

      {/* 2. Live Inventory Status Banner Placeholder */}
      <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-emerald-50/80 border border-emerald-200">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <div className="h-3.5 w-64 rounded bg-emerald-200/80" />
        </div>
        <div className="h-3 w-48 rounded bg-emerald-200/60 hidden sm:block" />
      </div>

      {/* 3. Quick Stats Metric Cards Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-4 sm:p-5 border border-surface-border shadow-subtle flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-18 rounded bg-stone-200" />
              <div className="w-8 h-8 rounded-xl bg-stone-100" />
            </div>
            <div className="space-y-1">
              <div className="h-7 w-16 rounded-lg bg-stone-200" />
              <div className="h-3 w-20 rounded bg-stone-100" />
            </div>
          </div>
        ))}
      </div>

      {/* 4. Filter & Search Control Bar Skeleton */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-surface-border shadow-subtle space-y-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
          <div className="h-10 flex-1 rounded-xl bg-surface-canvas border border-surface-border" />
          <div className="h-10 w-full md:w-48 rounded-xl bg-surface-canvas border border-surface-border" />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-8 w-24 rounded-xl bg-stone-100 border border-surface-border/60 shrink-0"
            />
          ))}
        </div>
      </div>

      {/* 5. Products Table Skeleton */}
      <div className="bg-white rounded-3xl border border-surface-border shadow-subtle overflow-hidden">
        <div className="h-11 bg-surface-canvas/60 border-b border-surface-border px-5 flex items-center justify-between">
          <div className="h-3.5 w-24 rounded bg-stone-200" />
          <div className="h-3.5 w-16 rounded bg-stone-200 hidden md:block" />
          <div className="h-3.5 w-24 rounded bg-stone-200 hidden lg:block" />
          <div className="h-3.5 w-20 rounded bg-stone-200 hidden sm:block" />
          <div className="h-3.5 w-16 rounded bg-stone-200" />
        </div>

        <div className="divide-y divide-surface-border/70">
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div
              key={row}
              className="p-4 sm:px-5 sm:py-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-stone-100 border border-surface-border shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="h-4 w-40 sm:w-56 rounded bg-stone-200" />
                  <div className="h-3 w-28 sm:w-40 rounded bg-stone-100" />
                </div>
              </div>
              <div className="w-24 hidden md:block">
                <div className="h-5 w-20 rounded-full bg-stone-100" />
              </div>
              <div className="w-32 hidden lg:block space-y-1">
                <div className="h-4 w-24 rounded bg-stone-200" />
                <div className="h-3 w-16 rounded bg-stone-100" />
              </div>
              <div className="w-24 hidden sm:block">
                <div className="h-4 w-16 rounded bg-stone-200" />
              </div>
              <div className="w-20 flex justify-end">
                <div className="h-8 w-16 rounded-xl bg-stone-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
