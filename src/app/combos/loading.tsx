import React from "react";

export default function CombosLoading() {
  return (
    <div
      className="min-h-screen flex flex-col bg-surface-canvas font-bengali animate-pulse"
      aria-busy="true"
      aria-label="কম্বো অফার লোড হচ্ছে..."
    >
      {/* 1. Header Banner Skeleton */}
      <section className="bg-white border-b border-surface-border py-8 px-4 shadow-subtle">
        <div className="container mx-auto max-w-7xl space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-10 rounded bg-stone-200" />
            <div className="h-3 w-3 rounded bg-stone-200" />
            <div className="h-3.5 w-20 rounded bg-stone-200" />
          </div>

          <div className="space-y-2">
            <div className="h-5 w-32 rounded-full bg-amber-100" />
            <div className="h-8 w-64 rounded-2xl bg-stone-200" />
            <div className="h-4 w-96 max-w-full rounded bg-stone-100" />
          </div>
        </div>
      </section>

      {/* 2. Combos Product Grid Skeleton */}
      <main className="flex-1 container mx-auto max-w-7xl px-4 py-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
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
