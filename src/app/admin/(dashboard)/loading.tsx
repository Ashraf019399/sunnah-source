import React from "react";

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6 sm:space-y-8 font-bengali animate-pulse" aria-busy="true" aria-label="ড্যাশবোর্ড লোড হচ্ছে...">
      {/* 1. Top Welcome Banner Skeleton */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 rounded-3xl p-6 sm:p-8 text-white border border-brand-800 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3 flex-1">
          <div className="h-6 w-44 rounded-full bg-brand-800/80 border border-brand-700/80" />
          <div className="h-8 w-72 sm:w-96 rounded-xl bg-brand-800/90" />
          <div className="h-4 w-full max-w-xl rounded-lg bg-brand-800/60" />
        </div>
        <div className="h-9 w-36 rounded-2xl bg-brand-800/80 border border-brand-700/80 shrink-0" />
      </div>

      {/* 2. Action Banner Skeleton */}
      <div className="h-20 rounded-2xl bg-amber-500/10 border border-amber-200/50 p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-200/60 shrink-0" />
          <div className="space-y-2">
            <div className="h-4 w-64 sm:w-80 rounded bg-amber-200/70" />
            <div className="h-3 w-48 sm:w-60 rounded bg-amber-200/50" />
          </div>
        </div>
        <div className="h-9 w-28 rounded-xl bg-amber-300/60 shrink-0 hidden sm:block" />
      </div>

      {/* 3. Four Executive Metric Cards Skeleton */}
      <section aria-label="মেট্রিক্স লোডিং">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 border border-surface-border shadow-subtle flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-20 rounded bg-stone-200" />
                <div className="w-9 h-9 rounded-xl bg-stone-100" />
              </div>
              <div className="mt-4 space-y-3">
                <div className="h-7 w-28 rounded-lg bg-stone-200" />
                <div className="flex items-center justify-between border-t border-surface-border/60 pt-2">
                  <div className="h-3 w-16 rounded bg-stone-100" />
                  <div className="h-4 w-14 rounded-full bg-stone-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Two-Column Split Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
        {/* Left Column (2/3 width): Recent Orders Table Skeleton */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-5 w-48 rounded bg-stone-200" />
              <div className="h-3 w-64 rounded bg-stone-100" />
            </div>
            <div className="h-4 w-28 rounded bg-stone-200 hidden sm:block" />
          </div>

          <div className="bg-white rounded-3xl border border-surface-border shadow-subtle overflow-hidden">
            <div className="h-11 bg-surface-canvas/60 border-b border-surface-border px-5 flex items-center justify-between">
              <div className="h-3 w-20 rounded bg-stone-200" />
              <div className="h-3 w-16 rounded bg-stone-200 hidden md:block" />
              <div className="h-3 w-14 rounded bg-stone-200 hidden md:block" />
              <div className="h-3 w-16 rounded bg-stone-200 hidden md:block" />
              <div className="h-3 w-16 rounded bg-stone-200" />
            </div>

            <div className="divide-y divide-surface-border/70">
              {[1, 2, 3, 4, 5].map((row) => (
                <div
                  key={row}
                  className="py-4 px-5 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 w-32">
                    <div className="h-4 w-24 rounded bg-stone-200" />
                    <div className="h-3 w-16 rounded bg-stone-100" />
                  </div>
                  <div className="space-y-1.5 w-32 hidden md:block">
                    <div className="h-4 w-28 rounded bg-stone-200" />
                    <div className="h-3 w-20 rounded bg-stone-100" />
                  </div>
                  <div className="h-5 w-16 rounded-full bg-stone-100 hidden md:block" />
                  <div className="space-y-1 w-20 hidden md:block">
                    <div className="h-4 w-16 rounded bg-stone-200" />
                    <div className="h-3 w-10 rounded bg-stone-100" />
                  </div>
                  <div className="h-6 w-20 rounded-full bg-stone-100" />
                  <div className="h-8 w-20 rounded-xl bg-stone-100 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right Column (1/3 width): Low-Stock Watchlist & Shortcuts Skeleton */}
        <div className="lg:col-span-1 space-y-6">
          {/* Low-Stock Box Skeleton */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-surface-border shadow-subtle space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border/70">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-stone-100" />
                <div className="space-y-1">
                  <div className="h-4 w-24 rounded bg-stone-200" />
                  <div className="h-2.5 w-16 rounded bg-stone-100" />
                </div>
              </div>
              <div className="h-5 w-14 rounded-full bg-stone-100" />
            </div>

            <div className="space-y-2.5">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="p-3 rounded-2xl bg-surface-canvas/80 border border-surface-border/80 flex items-center justify-between gap-3"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 w-28 rounded bg-stone-200" />
                    <div className="h-2.5 w-20 rounded bg-stone-100" />
                  </div>
                  <div className="h-5 w-16 rounded-full bg-stone-100" />
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-surface-border/70">
              <div className="h-9 w-full rounded-xl bg-stone-100" />
            </div>
          </div>

          {/* Quick Shortcuts Skeleton */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-surface-border shadow-subtle space-y-4">
            <div className="space-y-1">
              <div className="h-4 w-28 rounded bg-stone-200" />
              <div className="h-2.5 w-40 rounded bg-stone-100" />
            </div>

            <div className="space-y-2.5">
              {[1, 2, 3, 4].map((shortcut) => (
                <div
                  key={shortcut}
                  className="p-3 rounded-2xl bg-surface-canvas/60 border border-surface-border flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-stone-100" />
                    <div className="space-y-1">
                      <div className="h-3.5 w-24 rounded bg-stone-200" />
                      <div className="h-2.5 w-32 rounded bg-stone-100" />
                    </div>
                  </div>
                  <div className="w-4 h-4 rounded bg-stone-100" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
