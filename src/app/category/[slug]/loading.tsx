import React from "react";

export default function CategoryLoading() {
  return (
    <div
      className="min-h-screen flex flex-col bg-surface-canvas font-bengali animate-pulse"
      aria-busy="true"
      aria-label="ক্যাটাগরি পেজ লোড হচ্ছে..."
    >
      {/* 1. Category Header & Breadcrumb Banner Skeleton */}
      <section className="bg-white border-b border-surface-border py-8 px-4 shadow-subtle">
        <div className="container mx-auto max-w-7xl space-y-6">
          {/* Breadcrumb Skeleton */}
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-10 rounded bg-stone-200" />
            <div className="h-3 w-3 rounded bg-stone-200" />
            <div className="h-3.5 w-14 rounded bg-stone-200" />
            <div className="h-3 w-3 rounded bg-stone-200" />
            <div className="h-3.5 w-24 rounded bg-stone-200" />
          </div>

          {/* Banner Card Skeleton */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-10">
            <div className="space-y-3 max-w-2xl flex-1">
              <div className="h-5 w-44 rounded-full bg-brand-50 border border-brand-200" />
              <div className="h-9 w-64 sm:w-80 rounded-2xl bg-stone-200" />
              <div className="h-4 w-full max-w-md rounded bg-stone-100" />
              <div className="h-4 w-3/4 max-w-sm rounded bg-stone-100" />
            </div>
            <div className="w-full lg:w-72 aspect-[4/3] rounded-2xl bg-stone-100 border border-surface-border shrink-0" />
          </div>
        </div>
      </section>

      {/* 2. Main Products Grid Section Skeleton */}
      <main className="flex-1 container mx-auto max-w-7xl px-4 py-8 space-y-6">
        {/* Controls Bar Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
          <div className="h-5 w-32 rounded bg-stone-200" />
          <div className="h-9 w-44 rounded-xl bg-white border border-surface-border" />
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
