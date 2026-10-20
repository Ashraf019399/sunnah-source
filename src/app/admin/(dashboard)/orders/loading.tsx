import React from "react";

export default function AdminOrdersLoading() {
  return (
    <div
      className="space-y-6 font-bengali animate-pulse"
      aria-busy="true"
      aria-label="অর্ডার তালিকা লোড হচ্ছে..."
    >
      {/* 1. Page Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border/70 pb-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-stone-100" />
            <div className="h-7 w-56 sm:w-72 rounded-xl bg-stone-200" />
          </div>
          <div className="h-4 w-72 sm:w-96 rounded-lg bg-stone-100" />
        </div>
      </div>

      {/* 2. Filter & Search Bar Skeleton */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Box Skeleton */}
          <div className="h-10 w-full max-w-xl rounded-xl bg-white border border-surface-border" />

          {/* Filter Dropdowns Skeleton */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="h-10 w-32 rounded-xl bg-white border border-surface-border" />
            <div className="h-10 w-36 rounded-xl bg-white border border-surface-border" />
          </div>
        </div>

        {/* Status Pill Tabs Skeleton */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[1, 2, 3, 4, 5, 6, 7].map((tab) => (
            <div
              key={tab}
              className="h-8 w-20 rounded-xl bg-stone-100 border border-surface-border/60 shrink-0"
            />
          ))}
        </div>
      </div>

      {/* 3. Orders Table Skeleton */}
      <div className="bg-white rounded-3xl border border-surface-border shadow-subtle overflow-hidden">
        {/* Table Header */}
        <div className="hidden lg:grid grid-cols-12 gap-4 h-12 bg-surface-canvas/60 border-b border-surface-border px-5 items-center">
          <div className="col-span-2 h-3.5 w-20 rounded bg-stone-200" />
          <div className="col-span-2 h-3.5 w-16 rounded bg-stone-200" />
          <div className="col-span-2 h-3.5 w-16 rounded bg-stone-200" />
          <div className="col-span-2 h-3.5 w-20 rounded bg-stone-200" />
          <div className="col-span-1 h-3.5 w-14 rounded bg-stone-200" />
          <div className="col-span-1 h-3.5 w-14 rounded bg-stone-200" />
          <div className="col-span-1 h-3.5 w-14 rounded bg-stone-200" />
          <div className="col-span-1 h-3.5 w-12 rounded bg-stone-200 ml-auto" />
        </div>

        {/* Table Rows Skeleton */}
        <div className="divide-y divide-surface-border/70">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
            <div
              key={row}
              className="py-4 px-5 flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-4 items-start lg:items-center"
            >
              <div className="lg:col-span-2 space-y-1">
                <div className="h-4 w-24 rounded bg-stone-200" />
                <div className="h-2.5 w-16 rounded bg-stone-100" />
              </div>
              <div className="lg:col-span-2 h-4 w-28 rounded bg-stone-200" />
              <div className="lg:col-span-2 h-4 w-24 rounded bg-stone-100" />
              <div className="lg:col-span-2 h-4 w-20 rounded bg-stone-100" />
              <div className="lg:col-span-1 h-4 w-16 rounded bg-stone-200" />
              <div className="lg:col-span-1 h-5 w-16 rounded-full bg-stone-100" />
              <div className="lg:col-span-1 h-6 w-20 rounded-full bg-stone-100" />
              <div className="lg:col-span-1 h-8 w-20 rounded-xl bg-stone-100 lg:ml-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Pagination Skeleton */}
      <div className="flex items-center justify-between pt-2">
        <div className="h-4 w-36 rounded bg-stone-200" />
        <div className="flex items-center gap-1">
          <div className="h-8 w-8 rounded-lg bg-stone-100" />
          <div className="h-8 w-8 rounded-lg bg-stone-200" />
          <div className="h-8 w-8 rounded-lg bg-stone-100" />
        </div>
      </div>
    </div>
  );
}
