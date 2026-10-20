import React from "react";

export default function ProductDetailsLoading() {
  return (
    <div
      className="min-h-screen flex flex-col bg-surface-canvas font-bengali animate-pulse"
      aria-busy="true"
      aria-label="পণ্য বিবরণী লোড হচ্ছে..."
    >
      {/* 1. Breadcrumb Bar Skeleton */}
      <div className="bg-white border-b border-surface-border py-4 px-4 shadow-subtle">
        <div className="container mx-auto max-w-7xl flex items-center gap-2">
          <div className="h-3.5 w-10 rounded bg-stone-200" />
          <div className="h-3 w-3 rounded bg-stone-200" />
          <div className="h-3.5 w-14 rounded bg-stone-200" />
          <div className="h-3 w-3 rounded bg-stone-200" />
          <div className="h-3.5 w-24 rounded bg-stone-200" />
        </div>
      </div>

      {/* 2. Main Product Showcase Skeleton */}
      <main className="flex-1 container mx-auto max-w-7xl px-4 py-8 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Gallery Skeleton (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="aspect-square w-full bg-white rounded-3xl border border-surface-border shadow-card p-4 flex items-center justify-center">
              <div className="w-full h-full rounded-2xl bg-stone-100" />
            </div>
            <div className="flex gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-20 h-20 rounded-2xl bg-white border border-surface-border p-1 shrink-0"
                >
                  <div className="w-full h-full rounded-xl bg-stone-100" />
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Details Skeleton (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-5 w-20 rounded-full bg-brand-50 border border-brand-200" />
                <div className="h-5 w-24 rounded-full bg-stone-100" />
              </div>
              <div className="h-8 w-4/5 rounded-2xl bg-stone-200" />
              <div className="flex items-center gap-2 pt-1">
                <div className="h-4 w-28 rounded bg-amber-100" />
                <div className="h-4 w-16 rounded bg-stone-100" />
              </div>
            </div>

            {/* Price Box Skeleton */}
            <div className="p-5 rounded-2xl bg-white border border-surface-border shadow-subtle space-y-2">
              <div className="h-8 w-36 rounded-lg bg-stone-200" />
              <div className="h-4 w-48 rounded bg-stone-100" />
            </div>

            {/* Variant Selector Skeleton */}
            <div className="space-y-2">
              <div className="h-4 w-24 rounded bg-stone-200" />
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-9 w-20 rounded-xl bg-white border border-surface-border"
                  />
                ))}
              </div>
            </div>

            {/* Action Buttons Skeleton */}
            <div className="space-y-3 pt-2">
              <div className="flex gap-3">
                <div className="h-12 w-28 rounded-xl bg-stone-100 border border-surface-border" />
                <div className="h-12 flex-1 rounded-xl bg-brand-800" />
              </div>
              <div className="h-12 w-full rounded-xl bg-accent-amber/50" />
            </div>

            {/* Trust Features Skeleton */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-surface-border/60">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 rounded-xl bg-white border border-surface-border space-y-2">
                  <div className="w-6 h-6 rounded-lg bg-stone-100" />
                  <div className="h-3 w-16 rounded bg-stone-200" />
                  <div className="h-2 w-20 rounded bg-stone-100" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
