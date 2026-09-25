"use client";

import React, { useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toBanglaDigits } from "@/lib/utils";

interface OrdersPaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
}

export function OrdersPagination({
  page,
  totalPages,
  totalCount,
  pageSize,
}: OrdersPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  if (totalCount === 0) return null;

  const navigateToPage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const fromCount = (page - 1) * pageSize + 1;
  const toCount = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2">
      {/* Information text */}
      <div className="text-xs sm:text-sm text-charcoal-500 font-bengali">
        <span>মোট </span>
        <span className="font-bold text-charcoal-900 font-sans">
          {toBanglaDigits(totalCount)}
        </span>
        <span> টি অর্ডারের মধ্যে </span>
        <span className="font-bold text-charcoal-900 font-sans">
          {toBanglaDigits(fromCount)}–{toBanglaDigits(toCount)}
        </span>
        <span> দেখানো হচ্ছে (পৃষ্ঠা </span>
        <span className="font-bold text-charcoal-900 font-sans">
          {toBanglaDigits(page)}
        </span>
        <span> / </span>
        <span className="font-bold text-charcoal-900 font-sans">
          {toBanglaDigits(totalPages)}
        </span>
        <span>)</span>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-2">
        {/* Previous Button (আগের) */}
        <button
          type="button"
          onClick={() => navigateToPage(page - 1)}
          disabled={!hasPrev || isPending}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-2xs ${
            hasPrev && !isPending
              ? "bg-white hover:bg-brand-50 border border-surface-border text-charcoal-900 cursor-pointer"
              : "bg-surface-canvas border border-surface-border/50 text-stone-400 cursor-not-allowed"
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>আগের</span>
        </button>

        {/* Next Button (পরের) */}
        <button
          type="button"
          onClick={() => navigateToPage(page + 1)}
          disabled={!hasNext || isPending}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-2xs ${
            hasNext && !isPending
              ? "bg-white hover:bg-brand-50 border border-surface-border text-charcoal-900 cursor-pointer"
              : "bg-surface-canvas border border-surface-border/50 text-stone-400 cursor-not-allowed"
          }`}
        >
          <span>পরের</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
