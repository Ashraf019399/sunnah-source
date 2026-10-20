import React from "react";

export default function RootStorefrontLoading() {
  return (
    <div
      className="min-h-screen flex flex-col bg-surface-canvas font-bengali animate-pulse"
      aria-busy="true"
      aria-label="স্টোরফ্রন্ট লোড হচ্ছে..."
    >
      <main className="flex-1 space-y-12 pb-16 lg:pb-12">
        {/* 1. Hero Banner Skeleton */}
        <section className="bg-brand-900 text-white py-12 md:py-16 lg:py-20 px-4 border-b border-brand-800">
          <div className="container mx-auto max-w-7xl flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 xl:gap-16">
            <div className="w-full lg:w-1/2 xl:flex-1 space-y-5 lg:space-y-6">
              <div className="h-6 w-44 rounded-full bg-brand-800/80 border border-brand-700/80" />
              <div className="space-y-3">
                <div className="h-10 sm:h-12 w-4/5 rounded-2xl bg-brand-800" />
                <div className="h-10 sm:h-12 w-3/5 rounded-2xl bg-brand-800" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full max-w-lg rounded-lg bg-brand-800/70" />
                <div className="h-4 w-4/5 max-w-md rounded-lg bg-brand-800/60" />
              </div>
              <div className="pt-2 sm:pt-3 flex gap-3">
                <div className="h-11 w-36 rounded-xl bg-accent-amber/40" />
                <div className="h-11 w-36 rounded-xl bg-brand-800 border border-brand-700" />
              </div>
            </div>
            <div className="w-full lg:w-1/2 xl:flex-1 flex justify-center lg:justify-end">
              <div className="w-full max-w-lg lg:max-w-[480px] xl:max-w-[540px] aspect-[1402/1122] rounded-3xl bg-brand-800/70 border-4 border-brand-800" />
            </div>
          </div>
        </section>

        {/* 2. Trust Feature Badges Skeleton */}
        <section className="container mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-white rounded-2xl border border-surface-border shadow-subtle">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-stone-100 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-20 rounded bg-stone-200" />
                  <div className="h-2.5 w-24 rounded bg-stone-100" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Category Showcase Grid Skeleton */}
        <section className="container mx-auto max-w-7xl px-4 space-y-6">
          <div className="flex items-end justify-between border-b border-surface-border pb-3">
            <div className="space-y-2">
              <div className="h-4 w-28 rounded-full bg-stone-200" />
              <div className="h-7 w-48 rounded-xl bg-stone-200" />
            </div>
            <div className="h-4 w-20 rounded bg-stone-200" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="p-3 sm:p-4 bg-white rounded-2xl border border-surface-border shadow-subtle space-y-3"
              >
                <div className="w-full aspect-[4/3] rounded-xl bg-stone-100" />
                <div className="space-y-1">
                  <div className="h-4 w-24 rounded bg-stone-200" />
                  <div className="h-3 w-16 rounded bg-stone-100" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Products Grid Skeleton */}
        <section className="container mx-auto max-w-7xl px-4 space-y-6">
          <div className="flex items-center justify-between border-b border-surface-border pb-2">
            <div className="space-y-1.5">
              <div className="h-6 w-48 rounded-xl bg-stone-200" />
              <div className="h-3 w-64 rounded bg-stone-100" />
            </div>
            <div className="h-4 w-20 rounded bg-stone-200" />
          </div>
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
        </section>
      </main>
    </div>
  );
}
