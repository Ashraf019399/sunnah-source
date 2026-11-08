"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, X, ChevronRight } from "lucide-react";
import { useMobileSearchStore } from "@/store/use-mobile-search-store";
import { ALL_PRODUCTS } from "@/lib/data/products";
import { CATEGORIES_DATA } from "@/lib/data/categories";
import { formatBDT, toBanglaDigits, cn } from "@/lib/utils";

export const TRENDING_SEARCH_PILLS = [
  "🍯 সুন্দরবন মধু",
  "🧈 গাওয়া ঘি",
  "🌴 আজওয়া খেজুর",
  "🌱 কালোজিরা তেল",
  "✨ চিয়া সিড",
  "🎁 কম্বো",
] as const;

export interface MobileSearchModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

/**
 * Normalizes Bengali text for fuzzy search:
 * Handles Unicode NFC composition and unifies decomposed Nukta characters (য়/য়, ড়/ড়, ঢ়/ঢ়).
 */
function normalizeBengali(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFC")
    .replace(/\u09af\u09bc/g, "\u09df") // ya + nukta -> yya
    .replace(/\u09a1\u09bc/g, "\u09dc") // dda + nukta -> rra
    .replace(/\u09a2\u09bc/g, "\u09dd") // ddha + nukta -> rha
    .toLowerCase();
}

export const MobileSearchModal: React.FC<MobileSearchModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
}) => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const storeIsOpen = useMobileSearchStore((state) => state.isOpen);
  const storeCloseSearch = useMobileSearchStore((state) => state.closeSearch);
  const initialQuery = useMobileSearchStore((state) => state.initialQuery);

  const isOpen = propIsOpen !== undefined ? propIsOpen : storeIsOpen;
  const handleClose = propOnClose || storeCloseSearch;

  const [searchQuery, setSearchQuery] = useState("");
  const isHistoryPoppedRef = useRef(false);

  // Sync initial query when opened
  useEffect(() => {
    if (isOpen) {
      if (initialQuery) {
        setSearchQuery(initialQuery);
      }
    } else {
      setSearchQuery("");
    }
  }, [isOpen, initialQuery]);

  // Client mounting hydration protection
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and autofocus input
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 75);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = "";
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen]);

  // Clean close handler that pops history if modal state is active, then closes
  const closeModal = useCallback(() => {
    if (
      !isHistoryPoppedRef.current &&
      typeof window !== "undefined" &&
      window.history.state?.modal === "mobile-search"
    ) {
      isHistoryPoppedRef.current = true;
      window.history.back();
    }
    handleClose();
  }, [handleClose]);

  // Hardware & Gesture Back Button Handling (Critical Mobile UX) + Escape Key
  useEffect(() => {
    if (!isOpen) return;

    // Reset popped flag and push browser history state
    isHistoryPoppedRef.current = false;
    if (typeof window !== "undefined") {
      window.history.pushState({ modal: "mobile-search" }, "");
    }

    const handlePopState = () => {
      // Hardware / gesture back pressed: browser already popped the state
      isHistoryPoppedRef.current = true;
      handleClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModal();
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("keydown", handleKeyDown);
      // Clean up history state if closed via unmount or tag/route change
      if (
        !isHistoryPoppedRef.current &&
        typeof window !== "undefined" &&
        window.history.state?.modal === "mobile-search"
      ) {
        isHistoryPoppedRef.current = true;
        window.history.back();
      }
    };
  }, [isOpen, handleClose, closeModal]);

  // Real-time fuzzy product search matching
  const matchingProducts = useMemo(() => {
    const rawQuery = searchQuery.trim();
    if (!rawQuery) return [];

    // Strip emoji and pictorial icons for text token matching
    const cleanQuery = rawQuery
      .replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, " ")
      .trim();
    const normQuery = normalizeBengali(cleanQuery);
    const tokens = normQuery.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return [];

    const scored = ALL_PRODUCTS.map((product) => {
      const category = CATEGORIES_DATA.find((c) => c.slug === product.categorySlug);
      const titleBnNorm = normalizeBengali(product.titleBn || "");
      const titleEnNorm = (product.titleEn || "").toLowerCase();
      const catBnNorm = normalizeBengali(category?.nameBn || "");
      const catEnNorm = (category?.nameEn || "").toLowerCase();
      const shortDescNorm = normalizeBengali(product.shortDescriptionBn || "");
      const catSlugNorm = (product.categorySlug || "").toLowerCase();
      const badgeNorm = normalizeBengali(product.badge || "");

      const haystack = `${titleBnNorm} ${titleEnNorm} ${catBnNorm} ${catEnNorm} ${shortDescNorm} ${catSlugNorm} ${badgeNorm}`;

      // Check if all search tokens match in haystack
      const allTokensMatch = tokens.every((token) => haystack.includes(token));
      if (!allTokensMatch) return null;

      // Calculate relevance score
      let score = 0;
      if (titleBnNorm.includes(normQuery) || titleEnNorm.includes(cleanQuery.toLowerCase())) {
        score += 100;
      } else if (tokens.every((t) => titleBnNorm.includes(t))) {
        score += 60;
      } else if (catBnNorm.includes(normQuery) || catSlugNorm.includes(cleanQuery.toLowerCase())) {
        score += 40;
      } else {
        score += 20;
      }

      return { product, category, score };
    }).filter(Boolean) as {
      product: (typeof ALL_PRODUCTS)[number];
      category?: (typeof CATEGORIES_DATA)[number];
      score: number;
    }[];

    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => ({ product: s.product, category: s.category })).slice(0, 8);
  }, [searchQuery]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      closeModal();
      router.push(`/shop?q=${encodeURIComponent(query)}`);
    } else {
      inputRef.current?.focus();
    }
  };

  const handleSelectPill = (pill: string) => {
    // Extract clean keyword text from pill (e.g. "সুন্দরবন মধু" from "🍯 সুন্দরবন মধু")
    const cleanText = pill
      .replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, "")
      .trim();
    setSearchQuery(cleanText);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setSearchQuery("");
    inputRef.current?.focus();
  };

  if (!mounted) return null;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="মোবাইল সার্চ মডাল"
      className={cn(
        "fixed inset-0 z-50 transition-opacity duration-300 font-bengali",
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}
    >
      {/* 1. Backdrop */}
      <div
        role="button"
        tabIndex={-1}
        aria-label="সার্চ মডাল বন্ধ করুন"
        onClick={closeModal}
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out cursor-pointer",
          isOpen ? "opacity-100" : "opacity-0"
        )}
      />

      {/* 2. Slide-up Search Sheet */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 max-h-[92vh] h-[88vh] z-50 bg-white rounded-t-3xl shadow-2xl flex flex-col transition-transform duration-300 ease-out pb-safe",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Drag handle pill */}
        <div className="pt-3 pb-1 shrink-0 flex justify-center">
          <div className="w-12 h-1.5 bg-stone-300 rounded-full" />
        </div>

        {/* Top Search Flex Row: Input Container + "খুঁজুন" Button + Close Button */}
        <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-stone-100 shrink-0">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            {/* Left Input Container (flex-1 relative) */}
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-brand-700 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="পণ্য খুঁজুন (মধু, ঘি, খেজুর)..."
                aria-label="পণ্য খুঁজুন"
                className="w-full h-12 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-brand-600 text-stone-900 font-medium text-[16px] pl-11 pr-9 outline-none transition-colors placeholder:text-stone-400"
              />
              {/* Soft clear [✕] button */}
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClear}
                  aria-label="মুছে ফেলুন"
                  className="w-6 h-6 rounded-full bg-stone-200/80 hover:bg-stone-300 active:bg-stone-400 text-stone-600 flex items-center justify-center absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Right "খুঁজুন" Button (shrink-0) */}
            <button
              type="submit"
              className="h-12 shrink-0 bg-brand-700 hover:bg-brand-800 active:scale-95 text-white font-semibold rounded-xl text-sm px-4 shadow-xs flex items-center justify-center transition-all cursor-pointer"
            >
              খুঁজুন
            </button>

            {/* Close Button [✕] */}
            <button
              type="button"
              onClick={closeModal}
              aria-label="বন্ধ করুন"
              className="w-9 h-9 shrink-0 rounded-full bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-600 flex items-center justify-center ml-1 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Single clean horizontal-scrolling row of trending tag pills */}
        <div className="px-3.5 py-2.5 bg-stone-50/70 border-b border-stone-100 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {TRENDING_SEARCH_PILLS.map((pill) => {
              const cleanPill = pill
                .replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, "")
                .trim();
              const isSelected =
                searchQuery.trim() === pill ||
                searchQuery.trim() === cleanPill;

              return (
                <button
                  key={pill}
                  type="button"
                  onClick={() => handleSelectPill(pill)}
                  className={cn(
                    "shrink-0 px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer active:scale-95 border flex items-center gap-1.5 whitespace-nowrap",
                    isSelected
                      ? "bg-brand-700 text-white border-brand-700 shadow-xs font-semibold"
                      : "bg-white text-stone-700 border-stone-200/90 hover:border-brand-300 hover:text-brand-800 hover:bg-brand-50/50 font-medium"
                  )}
                >
                  {pill}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Results Section */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {searchQuery.trim() ? (
            <div className="p-4">
              {matchingProducts.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100">
                    <span className="text-xs font-bold text-stone-500">
                      পণ্যসমূহ ({toBanglaDigits(matchingProducts.length)}টি ফলাফল)
                    </span>
                    <span className="text-[11px] text-brand-700 font-semibold">
                      লাইভ সাজেশন
                    </span>
                  </div>

                  <div className="divide-y divide-stone-100">
                    {matchingProducts.map(({ product, category }) => {
                      const defaultVariant =
                        product.variants?.find((v) => v.isDefault) || product.variants?.[0];
                      const displayPrice = defaultVariant
                        ? defaultVariant.salePrice ?? defaultVariant.regularPrice
                        : 0;
                      const regularPrice = defaultVariant?.regularPrice;
                      const hasDiscount =
                        defaultVariant?.salePrice &&
                        defaultVariant.regularPrice > defaultVariant.salePrice;
                      const mainImage = product.images?.[0] || "/images/products/sundarbans-raw-honey.png";
                      const categoryName = category?.nameBn || product.titleEn;

                      return (
                        <Link
                          key={product.id}
                          href={`/product/${product.slug}`}
                          prefetch={true}
                          onClick={closeModal}
                          className="group flex items-center justify-between py-3 hover:bg-brand-50/60 active:bg-brand-100/50 rounded-xl px-2 transition-all cursor-pointer"
                        >
                          {/* Thumbnail & Title & Category */}
                          <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                            <div className="w-12 h-12 rounded-xl object-contain border border-stone-200/80 bg-stone-50 shrink-0 relative overflow-hidden p-1">
                              <Image
                                src={mainImage}
                                alt={product.titleBn}
                                fill
                                sizes="48px"
                                className="object-contain group-hover:scale-105 transition-transform"
                                unoptimized={mainImage.startsWith("/")}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-stone-900 group-hover:text-brand-800 transition-colors line-clamp-1">
                                {product.titleBn}
                              </h4>
                              <p className="text-[11px] text-stone-500 font-medium line-clamp-1 mt-0.5">
                                {categoryName}
                              </p>
                              {product.badge && (
                                <span className="inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100/80 text-amber-900 border border-amber-200/50 mt-1">
                                  {product.badge}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Price in BDT & Arrow Action */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right">
                              <div className="font-mono text-xs font-black text-brand-700">
                                {formatBDT(displayPrice)}
                              </div>
                              {hasDiscount && (
                                <div className="text-[10px] text-stone-400 line-through font-mono">
                                  ৳{regularPrice}
                                </div>
                              )}
                            </div>
                            <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-brand-700 transition-colors shrink-0" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  {/* See all search results link */}
                  <Link
                    href={`/shop?q=${encodeURIComponent(searchQuery.trim())}`}
                    prefetch={true}
                    onClick={closeModal}
                    className="group flex items-center justify-center gap-1.5 text-center py-3 px-4 mt-3 text-xs font-bold text-brand-800 bg-brand-50 hover:bg-brand-100/80 active:bg-brand-200/70 rounded-xl border border-brand-200 transition-all cursor-pointer"
                  >
                    <span>সব ফলাফল দেখুন (&apos;{searchQuery.trim()}&apos;)</span>
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                </div>
              ) : (
                <div className="p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                    <Search className="w-6 h-6 text-stone-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-stone-800">
                      দুঃখিত, &ldquo;{searchQuery.trim()}&rdquo; সম্পর্কিত কোনো পণ্য পাওয়া যায়নি
                    </p>
                    <p className="text-xs text-stone-500">
                      বানান পরিবর্তন করে চেষ্টা করুন অথবা উপরের ট্রেন্ডিং পণ্যগুলো দেখুন
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link
                      href="/shop"
                      prefetch={true}
                      onClick={closeModal}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-800 text-white text-xs font-bold hover:bg-brand-900 transition-colors shadow-xs"
                    >
                      <span>সকল পণ্য দেখুন</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6 text-brand-700" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-stone-800">
                  পণ্য খুঁজতে উপরে লিখুন অথবা ট্রেন্ডিং ট্যাগে ট্যাপ করুন
                </p>
                <p className="text-xs text-stone-500">
                  সুন্দরবনের খাঁটি মধু, গাওয়া ঘি, আজওয়া খেজুর ও সুপারফুড
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/shop"
                  prefetch={true}
                  onClick={closeModal}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800 transition-colors"
                >
                  <span>সকল পণ্য ব্রাউজ করুন</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default MobileSearchModal;
