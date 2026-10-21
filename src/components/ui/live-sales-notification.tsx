"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import {
  LiveSaleItem,
  isLiveSalesRestrictedRoute,
  generateRandomSaleItem,
} from "@/lib/services/live-sales";

export type { LiveSaleItem };
export {
  isLiveSalesRestrictedRoute,
  generateRandomSaleItem,
  BUYER_NAMES,
  LOCATIONS,
  RELATIVE_TIMES,
} from "@/lib/services/live-sales";

export function LiveSalesNotification() {
  const pathname = usePathname();
  const [notification, setNotification] = useState<LiveSaleItem | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const showTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const nextTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastProductIdRef = useRef<string | undefined>(undefined);

  const isRestricted = isLiveSalesRestrictedRoute(pathname);

  const clearAllTimers = useCallback(() => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (nextTimerRef.current) {
      clearTimeout(nextTimerRef.current);
      nextTimerRef.current = null;
    }
  }, []);

  const triggerNotification = useCallback(() => {
    const nextItem = generateRandomSaleItem(lastProductIdRef.current);
    lastProductIdRef.current = nextItem.id;
    setNotification(nextItem);
    setIsVisible(true);

    // Visible for 6 seconds
    hideTimerRef.current = setTimeout(() => {
      setIsVisible(false);

      // Interval between toasts: 25 to 35 seconds
      const nextInterval = Math.floor(Math.random() * (35000 - 25000 + 1)) + 25000;
      nextTimerRef.current = setTimeout(() => {
        triggerNotification();
      }, nextInterval);
    }, 6000);
  }, []);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    // Schedule next notification after 25 to 35 seconds
    const nextInterval = Math.floor(Math.random() * (35000 - 25000 + 1)) + 25000;
    nextTimerRef.current = setTimeout(() => {
      triggerNotification();
    }, nextInterval);
  }, [triggerNotification]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (isRestricted) {
      setIsVisible(false);
      clearAllTimers();
      return;
    }

    // Initial appearance: 8 seconds after page load
    showTimerRef.current = setTimeout(() => {
      triggerNotification();
    }, 8000);

    return () => {
      clearAllTimers();
    };
  }, [isMounted, isRestricted, clearAllTimers, triggerNotification]);

  if (!isMounted || isRestricted || !isVisible || !notification) {
    return null;
  }

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed bottom-20 sm:bottom-5 left-4 sm:left-5 z-40 max-w-[calc(100%-2rem)] sm:max-w-sm w-full pointer-events-auto"
    >
      <Link
        href={`/product/${notification.productSlug}`}
        className="group relative bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-2xl border border-surface-border ring-1 ring-black/5 flex items-center gap-3.5 animate-in slide-in-from-bottom-4 duration-300 font-bengali hover:border-brand-600/40 hover:shadow-brand-900/10 transition-all cursor-pointer block"
      >
        {/* Left: Product Thumbnail */}
        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-stone-200 bg-surface-canvas">
          <Image
            src={notification.productImage}
            alt={notification.productTitle}
            width={48}
            height={48}
            className="w-12 h-12 object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* Center: Content */}
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-xs font-bold text-charcoal-900 truncate">
            {notification.customerName}, {notification.location}
          </p>
          <p className="text-[11px] text-charcoal-600 line-clamp-1">
            এইমাত্র <span className="font-semibold text-brand-700">{notification.productTitle}</span> অর্ডার করেছেন
          </p>
          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-[10px] text-stone-400">{notification.timeAgo}</span>
            <span className="text-[10px] font-semibold text-emerald-600">✓ ভেরিফায়েড ক্রেতা</span>
          </div>
        </div>

        {/* Right: Dismiss Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDismiss();
          }}
          className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100 transition-colors shrink-0 cursor-pointer self-start -mr-1 -mt-1"
          aria-label="বিজ্ঞপ্তিটি বন্ধ করুন"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </Link>
    </aside>
  );
}
