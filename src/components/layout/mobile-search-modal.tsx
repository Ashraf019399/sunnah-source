"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, X, Sparkles, ChevronRight, TrendingUp } from "lucide-react";
import { useMobileSearchStore } from "@/store/use-mobile-search-store";
import { ALL_PRODUCTS } from "@/lib/data/products";
import { CATEGORIES_DATA } from "@/lib/data/categories";
import { formatBDT, toBanglaDigits, cn } from "@/lib/utils";

export const TRENDING_SEARCH_PILLS = [
  "সুন্দরবন মধু",
  "গাওয়া ঘি",
  "আজওয়া খেজুর",
  "কালোজিরা তেল",
  "চিয়া সিড",
  "কম্বো অফার",
] as const;

export interface MobileSearchModalProps {
  isOpen?: boolean;
  onClose?: () => void;
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

  // Escape key support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // Real-time product search matching
  const matchingProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    return ALL_PRODUCTS.filter((product) => {
      const titleBn = (product.titleBn || "").toLowerCase();
      const titleEn = (product.titleEn || "").toLowerCase();
      const shortDesc = (product.shortDescriptionBn || "").toLowerCase();
      const catSlug = (product.categorySlug || "").toLowerCase();

      return (
        titleBn.includes(query) ||
        titleEn.includes(query) ||
        shortDesc.includes(query) ||
        catSlug.includes(query)
      );
    }).slice(0, 8);
  }, [searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      handleClose();
      router.push(`/shop?q=${encodeURIComponent(query)}`);
    }
  };

  const handleSelectPill = (pill: string) => {
    setSearchQuery(pill);
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
        onClick={handleClose}
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out",
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

        {/* Modal Header */}
        <div className="px-4 py-2 border-b border-stone-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-700 animate-pulse" />
            <h3 className="text-sm font-bold text-charcoal-900 tracking-tight">
              তাৎক্ষণিক পণ্য অনুসন্ধান
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="বন্ধ করুন"
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-4 border-b border-stone-100/80 shrink-0 bg-stone-50/50">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <div className="relative flex items-center w-full bg-white rounded-2xl border-2 border-brand-700/80 shadow-xs focus-within:border-brand-800 focus-within:ring-2 focus-within:ring-brand-700/20 transition-all pl-3.5 pr-2 py-2">
              <Search className="w-4 h-4 text-brand-700 shrink-0 mr-2" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="খাঁটি মধু, ঘি, তেল ও অর্গানিক খাদ্য খুঁজুন..."
                aria-label="পণ্য খুঁজুন"
                className="w-full bg-transparent text-[13.5px] text-charcoal-900 placeholder:text-stone-400 focus:outline-none font-medium"
              />
              {/* Clear button [✕] */}
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClear}
                  aria-label="মুছে ফেলুন"
                  className="w-6 h-6 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition-colors shrink-0 mr-1.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {/* Submit search button */}
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-brand-800 hover:bg-brand-900 active:scale-95 text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs"
              >
                খুঁজুন
              </button>
            </div>
          </form>
        </div>

        {/* Scrollable Results & Trending Section */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Trending Pills Section */}
          <div className="px-4 py-3 bg-white border-b border-stone-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-charcoal-600 mb-2.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
              <span>জনপ্রিয় অনুসন্ধান (Trending)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {TRENDING_SEARCH_PILLS.map((pill) => (
                <button
                  key={pill}
                  type="button"
                  onClick={() => handleSelectPill(pill)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 border",
                    searchQuery === pill
                      ? "bg-brand-800 text-white border-brand-800 shadow-xs"
                      : "bg-stone-100 hover:bg-brand-50 hover:text-brand-800 hover:border-brand-300 text-charcoal-700 border-stone-200/80"
                  )}
                >
                  <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>{pill}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Live Search Suggestions */}
          {searchQuery.trim() ? (
            <div className="p-4">
              {matchingProducts.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100">
                    <span className="text-xs font-bold text-charcoal-500">
                      পণ্যসমূহ ({toBanglaDigits(matchingProducts.length)}টি ফলাফল)
                    </span>
                    <span className="text-[11px] text-brand-700 font-semibold">
                      লাইভ সাজেশন
                    </span>
                  </div>

                  <div className="divide-y divide-stone-100">
                    {matchingProducts.map((product) => {
                      const defaultVariant =
                        product.variants?.find((v) => v.isDefault) || product.variants?.[0];
                      const displayPrice = defaultVariant
                        ? defaultVariant.salePrice ?? defaultVariant.regularPrice
                        : 0;
                      const regularPrice = defaultVariant?.regularPrice;
                      const hasDiscount =
                        defaultVariant?.salePrice &&
                        defaultVariant.regularPrice > defaultVariant.salePrice;
                      const mainImage = product.images?.[0] || "/images/hero-honey.png";
                      const category = CATEGORIES_DATA.find(
                        (c) => c.slug === product.categorySlug
                      );
                      const subtitle = category?.nameBn || product.titleEn;

                      return (
                        <Link
                          key={product.id}
                          href={`/product/${product.slug}`}
                          prefetch={true}
                          onClick={handleClose}
                          className="group flex items-center justify-between py-3 hover:bg-brand-50/60 active:bg-brand-100/50 rounded-xl px-2 transition-all cursor-pointer"
                        >
                          {/* Thumbnail & Title */}
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
                              <h4 className="text-xs font-bold text-charcoal-900 group-hover:text-brand-800 transition-colors line-clamp-1">
                                {product.titleBn}
                              </h4>
                              <p className="text-[11px] text-charcoal-400 font-medium line-clamp-1 mt-0.5">
                                {subtitle}
                              </p>
                              {product.badge && (
                                <span className="inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100/80 text-amber-900 border border-amber-200/50 mt-1">
                                  {product.badge}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Price & Action */}
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
                    onClick={handleClose}
                    className="group flex items-center justify-center gap-1.5 text-center py-3 px-4 mt-3 text-xs font-bold text-brand-800 bg-brand-50 hover:bg-brand-100/80 active:bg-brand-200/70 rounded-xl border border-brand-200 transition-all cursor-pointer"
                  >
                    <span>সব ফলাফল দেখুন (&apos;{searchQuery.trim()}&apos;)</span>
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                </div>
              ) : (
                <div className="p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-stone-100 text-charcoal-400 flex items-center justify-center mx-auto">
                    <Search className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-charcoal-800">
                      দুঃখিত, &ldquo;{searchQuery.trim()}&rdquo; সম্পর্কিত কোনো পণ্য পাওয়া যায়নি
                    </p>
                    <p className="text-xs text-charcoal-500">
                      বানান পরিবর্তন করে চেষ্টা করুন অথবা নিচের জনপ্রিয় ক্যাটাগরিগুলো দেখুন
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link
                      href="/shop"
                      prefetch={true}
                      onClick={handleClose}
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
            <div className="p-4 space-y-4">
              {/* Quick Categories Guide */}
              <div className="text-xs font-bold text-charcoal-500 uppercase tracking-wider px-1">
                প্রধান ক্যাটাগরি সমূহ
              </div>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES_DATA.slice(0, 6).map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/category/${cat.slug}`}
                    prefetch={true}
                    onClick={handleClose}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-stone-50 hover:bg-brand-50 border border-stone-200/70 hover:border-brand-300 transition-all text-left group"
                  >
                    <div className="w-2 h-2 rounded-full bg-brand-700 shrink-0 group-hover:scale-125 transition-transform" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-charcoal-800 group-hover:text-brand-800 truncate">
                        {cat.nameBn}
                      </p>
                      <p className="text-[10px] text-charcoal-400 truncate font-sans">
                        {cat.nameEn}
                      </p>
                    </div>
                  </Link>
                ))}
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
