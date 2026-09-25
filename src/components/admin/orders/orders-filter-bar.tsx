"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X, Filter, RotateCcw } from "lucide-react";
import {
  ORDER_STATUS_CONFIG,
  ORDER_STATUS_LIST,
  PAYMENT_STATUS_CONFIG,
  DELIVERY_ZONE_CONFIG,
} from "@/types/orders.types";
import { OrderStatus, DeliveryZone } from "@/types/commerce.types";

interface OrdersFilterBarProps {
  currentQuery?: string;
  currentStatus?: string;
  currentPaymentStatus?: string;
  currentZone?: string;
}

export function OrdersFilterBar({
  currentQuery = "",
  currentStatus = "all",
  currentPaymentStatus = "all",
  currentZone = "all",
}: OrdersFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchInput, setSearchInput] = useState(currentQuery);

  // Sync internal state when URL parameter changes externally
  useEffect(() => {
    setSearchInput(currentQuery);
  }, [currentQuery]);

  // Debounced search input handler
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== currentQuery) {
        updateFilter({ q: searchInput.trim() || undefined, page: "1" });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const updateFilter = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleClearSearch = () => {
    setSearchInput("");
    updateFilter({ q: undefined, page: "1" });
  };

  const handleResetAll = () => {
    setSearchInput("");
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasActiveFilters =
    Boolean(currentQuery) ||
    (currentStatus && currentStatus !== "all") ||
    (currentPaymentStatus && currentPaymentStatus !== "all") ||
    (currentZone && currentZone !== "all");

  return (
    <div className="space-y-4">
      {/* Top Bar: Search Input and Secondary Dropdowns */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search Input Box */}
        <div className="relative flex-1 max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="অর্ডার নম্বর, নাম বা ফোন দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-surface-border rounded-xl text-sm text-charcoal-900 placeholder:text-charcoal-500 focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 transition-all shadow-2xs"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="অনুসন্ধান মুছুন"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-charcoal-500 hover:text-charcoal-900"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdowns & Reset */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Payment Status Dropdown */}
          <div className="relative">
            <select
              value={currentPaymentStatus}
              onChange={(e) =>
                updateFilter({ payment: e.target.value, page: "1" })
              }
              aria-label="পেমেন্ট স্ট্যাটাস ফিল্টার"
              className="appearance-none bg-white border border-surface-border text-charcoal-700 text-xs sm:text-sm font-semibold rounded-xl px-3.5 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 shadow-2xs cursor-pointer"
            >
              <option value="all">পেমেন্ট: সকল</option>
              <option value="paid">{PAYMENT_STATUS_CONFIG.paid.labelBn}</option>
              <option value="unpaid">{PAYMENT_STATUS_CONFIG.unpaid.labelBn}</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-charcoal-500">
              <Filter className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Delivery Zone Dropdown */}
          <div className="relative">
            <select
              value={currentZone}
              onChange={(e) =>
                updateFilter({ zone: e.target.value, page: "1" })
              }
              aria-label="ডেলিভারি এরিয়া ফিল্টার"
              className="appearance-none bg-white border border-surface-border text-charcoal-700 text-xs sm:text-sm font-semibold rounded-xl px-3.5 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 shadow-2xs cursor-pointer"
            >
              <option value="all">এরিয়া: সকল এলাকা</option>
              <option value="inside_dhaka">
                {DELIVERY_ZONE_CONFIG.inside_dhaka.shortBn}
              </option>
              <option value="outside_dhaka">
                {DELIVERY_ZONE_CONFIG.outside_dhaka.shortBn}
              </option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-charcoal-500">
              <Filter className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Reset Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetAll}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-surface-border bg-surface-canvas hover:bg-stone-200/60 text-xs sm:text-sm font-semibold text-charcoal-700 transition-colors shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>রিসেট</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Quick Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
        <button
          type="button"
          onClick={() => updateFilter({ status: "all", page: "1" })}
          className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            currentStatus === "all"
              ? "bg-brand-900 text-white shadow-xs"
              : "bg-white border border-surface-border text-charcoal-700 hover:bg-stone-50"
          }`}
        >
          সব অর্ডার
        </button>

        {ORDER_STATUS_LIST.map((statusKey) => {
          const cfg = ORDER_STATUS_CONFIG[statusKey];
          const isSelected = currentStatus === statusKey;
          return (
            <button
              key={statusKey}
              type="button"
              onClick={() => updateFilter({ status: statusKey, page: "1" })}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isSelected
                  ? "bg-brand-900 text-white shadow-xs"
                  : "bg-white border border-surface-border text-charcoal-700 hover:bg-stone-50"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${cfg.dotClass}`}
                aria-hidden="true"
              />
              <span>{cfg.labelBn}</span>
            </button>
          );
        })}
      </div>

      {isPending && (
        <div className="h-0.5 w-full bg-brand-100 overflow-hidden rounded-full">
          <div className="h-full bg-brand-700 animate-pulse w-1/3" />
        </div>
      )}
    </div>
  );
}
