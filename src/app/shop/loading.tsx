import React from "react";

export default function ShopLoading() {
  return (
    <div
      className="min-h-screen flex flex-col bg-surface-canvas font-bengali animate-pulse"
      aria-busy="true"
      aria-label="পণ্য ক্যাটালগ লোড হচ্ছে..."
    >
      {/* 1. Shop Header & Search Section Skeleton */}
      <section className="bg-white border-b border-surface-border py-6 sm:py-8 px-4 shadow-subtle">
        <div className="container mx-auto max-w-7xl space-y-6">
          {/* Breadcrumb Skeleton */}
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-10 rounded bg-stone-200" />
            <div className="h-3 w-3 rounded bg-stone-200" />
            <div className="h-3.5 w-20 rounded bg-stone-200" />
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-8 w-60 sm:w-80 rounded-2xl bg-stone-200" />
              <div className="h-4 w-48 sm:w-64 rounded bg-stone-100" />
            </div>

            {/* Search Input Skeleton */}
            <div className="w-full md:w-80 lg:w-96 h-11 rounded-full bg-surface-canvas border border-surface-border" />
          </div>

          {/* Horizontal Category Pill Tabs Skeleton */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-9 w-24 sm:w-28 rounded-full bg-stone-100 border border-surface-border shrink-0"
              />
            ))}
          </div>
        </div>
      </section>

      {/* 2. Main Product Catalog Grid Section Skeleton */}
      <main className="flex-1 container mx-auto max-w-7xl px-4 py-8 space-y-6">
        {/* Results Bar Skeleton */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="h-5 w-40 rounded bg-stone-200" />
          <div className="h-4 w-24 rounded bg-stone-100" />
        </div>

        {/* 4-Column Product Cards Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-surface-border overflow-hidden shadow-subtle p-3 space-y-3"
            >
              <div className="w-full aspect-square rounded-xl bg-stone-100" />
              <div className="space-y-2 pt-1">
                <div className="h-4 w-3/4 rounded bg-stone-200" />
                <div className="h-3 w-1/2 rounded bg-stone-100" />
                <div className="h-5 w-20 rounded bg-stone-200" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
