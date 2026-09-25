"use client";

import React, { useState, useEffect, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  ChevronRight,
  Search,
  X,
  ShoppingBag,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import { ALL_PRODUCTS } from "@/lib/data/products";
import { CATEGORIES_DATA } from "@/lib/data/categories";
import { ProductCard } from "@/components/commerce/product-card";

function toBengaliNumber(num: number): string {
  const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return num.toString().replace(/\d/g, (d) => bengaliDigits[Number(d)]);
}

export function ShopContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const categoryParam = searchParams.get("category") || "all";
  const queryParam = searchParams.get("q") || "";

  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);
  const [searchInput, setSearchInput] = useState<string>(queryParam);

  // Sync state if URL query params change (e.g. browser back/forward or external link)
  useEffect(() => {
    setSelectedCategory(categoryParam);
  }, [categoryParam]);

  useEffect(() => {
    setSearchInput(queryParam);
  }, [queryParam]);

  // Synchronize URL query parameters
  const updateUrl = (newCategory: string, newQuery: string) => {
    const params = new URLSearchParams();
    if (newCategory && newCategory !== "all") {
      params.set("category", newCategory);
    }
    if (newQuery.trim()) {
      params.set("q", newQuery.trim());
    }
    const queryString = params.toString();
    startTransition(() => {
      router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    });
  };

  const handleCategorySelect = (slug: string) => {
    setSelectedCategory(slug);
    updateUrl(slug, searchInput);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl(selectedCategory, searchInput);
  };

  const handleSearchInputChange = (val: string) => {
    setSearchInput(val);
    if (val === "") {
      updateUrl(selectedCategory, "");
    }
  };

  const handleClearAllFilters = () => {
    setSelectedCategory("all");
    setSearchInput("");
    updateUrl("all", "");
  };

  // Find active category object if selected
  const activeCategoryObj = useMemo(() => {
    if (!selectedCategory || selectedCategory === "all") return null;
    return CATEGORIES_DATA.find((c) => c.slug === selectedCategory) || null;
  }, [selectedCategory]);

  // Filter products based on category and search query
  const filteredProducts = useMemo(() => {
    return ALL_PRODUCTS.filter((product) => {
      // 1. Category Filter
      if (selectedCategory && selectedCategory !== "all") {
        if (product.categorySlug !== selectedCategory) {
          return false;
        }
      }

      // 2. Search Query Filter (case-insensitive across titleBn, titleEn, shortDescriptionBn, categorySlug)
      if (searchInput.trim()) {
        const q = searchInput.toLowerCase().trim();
        const matchTitleBn = product.titleBn.toLowerCase().includes(q);
        const matchTitleEn = product.titleEn.toLowerCase().includes(q);
        const matchDesc = product.shortDescriptionBn
          ? product.shortDescriptionBn.toLowerCase().includes(q)
          : false;
        const matchCat = product.categorySlug.toLowerCase().includes(q);

        if (!matchTitleBn && !matchTitleEn && !matchDesc && !matchCat) {
          return false;
        }
      }

      return true;
    });
  }, [selectedCategory, searchInput]);

  // Product counts per category from actual data
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: ALL_PRODUCTS.length };
    for (const cat of CATEGORIES_DATA) {
      counts[cat.slug] = ALL_PRODUCTS.filter((p) => p.categorySlug === cat.slug).length;
    }
    return counts;
  }, []);

  const hasActiveFilters = selectedCategory !== "all" || searchInput.trim() !== "";

  return (
    <div className="space-y-8 font-bengali">
      {/* 1. Shop Header & Breadcrumb Section */}
      <section className="bg-white border-b border-surface-border py-8 px-4 shadow-subtle">
        <div className="container mx-auto max-w-7xl space-y-4">
          {/* Breadcrumb: হোম → সব পণ্য */}
          <nav aria-label="ব্রেডক্রাম্ব" className="flex items-center gap-1.5 text-xs text-charcoal-500">
            <Link
              href="/"
              className="hover:text-brand-700 transition-colors inline-flex items-center gap-1 font-medium"
            >
              <span>হোম</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
            <Link
              href="/shop"
              onClick={(e) => {
                if (!hasActiveFilters) e.preventDefault();
                else handleClearAllFilters();
              }}
              className={`transition-colors font-medium ${
                !activeCategoryObj ? "text-brand-800 font-bold" : "hover:text-brand-700"
              }`}
            >
              সব পণ্য
            </Link>
            {activeCategoryObj && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                <span className="text-brand-800 font-bold truncate">
                  {activeCategoryObj.nameBn}
                </span>
              </>
            )}
          </nav>

          {/* Title & Description */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 bg-brand-50 border border-brand-200/80 text-brand-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full mb-1">
                <Sparkles className="w-3 h-3 text-accent-amber" />
                <span>১০০% খাঁটি ও প্রাকৃতিক পণ্যের সমাহার</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-charcoal-900 tracking-tight">
                {activeCategoryObj ? activeCategoryObj.nameBn : "সব পণ্য"}
              </h1>
              <p className="text-xs sm:text-sm text-charcoal-500 leading-relaxed">
                {activeCategoryObj?.taglineBn ||
                  "সুন্নাহ সোর্সের খাঁটি ও প্রাকৃতিক খাদ্যপণ্যসমূহ দেখুন। আপনার পছন্দের খাঁটি খাদ্যপণ্যটি সহজেই বেছে নিন।"}
              </p>
            </div>

            {/* In-page Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="w-full md:w-72 lg:w-80 relative shrink-0"
              role="search"
            >
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                placeholder="পণ্য খুঁজুন..."
                className="w-full h-11 pl-10 pr-9 rounded-xl border border-surface-border bg-surface-canvas text-xs sm:text-sm text-charcoal-900 placeholder:text-charcoal-400 focus:bg-white focus:outline-none focus:border-brand-700 transition-colors shadow-xs"
              />
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-charcoal-400 pointer-events-none" />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => handleSearchInputChange("")}
                  className="absolute right-3 top-3.5 text-stone-400 hover:text-charcoal-700 transition-colors p-0.5"
                  aria-label="সার্চ ক্লিয়ার করুন"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* 2. Category Filter & Controls Section */}
      <section className="container mx-auto max-w-7xl px-4 space-y-6">
        {/* Horizontal Category Filter */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-charcoal-700 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-brand-700" />
              <span>ক্যাটাগরি ফিল্টার:</span>
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>সব ফিল্টার মুছুন</span>
              </button>
            )}
          </div>

          {/* Horizontally scrollable category pill container */}
          <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex items-center gap-2 pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
            {/* All Products Tab */}
            <button
              type="button"
              onClick={() => handleCategorySelect("all")}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-brand-700 text-white font-bold shadow-card"
                  : "bg-white hover:bg-brand-50/80 text-charcoal-700 border border-surface-border font-medium hover:border-brand-200"
              }`}
            >
              <span>সব পণ্য</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                  selectedCategory === "all"
                    ? "bg-brand-800 text-white"
                    : "bg-surface-canvas text-charcoal-500"
                }`}
              >
                {toBengaliNumber(categoryCounts.all || 0)}
              </span>
            </button>

            {/* Individual Categories from CATEGORIES_DATA */}
            {CATEGORIES_DATA.map((cat) => {
              const isSelected = selectedCategory === cat.slug;
              const count = categoryCounts[cat.slug] || 0;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.slug)}
                  className={`shrink-0 px-4 py-2 rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? "bg-brand-700 text-white font-bold shadow-card"
                      : "bg-white hover:bg-brand-50/80 text-charcoal-700 border border-surface-border font-medium hover:border-brand-200"
                  }`}
                >
                  <span>{cat.nameBn}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      isSelected
                        ? "bg-brand-800 text-white"
                        : "bg-surface-canvas text-charcoal-500"
                    }`}
                  >
                    {toBengaliNumber(count)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Summary & Product Count Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 pb-1 border-b border-surface-border/60">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-charcoal-900 font-mono">
              {toBengaliNumber(filteredProducts.length)}টি পণ্য
            </span>
            <span className="text-xs text-charcoal-500 font-medium">প্রদর্শিত হচ্ছে</span>
          </div>

          {/* Active filter badges */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2">
              {selectedCategory !== "all" && activeCategoryObj && (
                <span className="inline-flex items-center gap-1.5 text-[11px] bg-brand-50 border border-brand-200 text-brand-800 font-bold px-2.5 py-1 rounded-lg">
                  <span>ক্যাটাগরি: {activeCategoryObj.nameBn}</span>
                  <button
                    type="button"
                    onClick={() => handleCategorySelect("all")}
                    className="hover:text-red-600 transition-colors"
                    aria-label="ক্যাটাগরি ফিল্টার মুছুন"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {searchInput.trim() && (
                <span className="inline-flex items-center gap-1.5 text-[11px] bg-accent-amber/15 border border-accent-amber/40 text-charcoal-900 font-bold px-2.5 py-1 rounded-lg">
                  <span>অনুসন্ধান: &ldquo;{searchInput.trim()}&rdquo;</span>
                  <button
                    type="button"
                    onClick={() => handleSearchInputChange("")}
                    className="hover:text-red-600 transition-colors"
                    aria-label="সার্চ ফিল্টার মুছুন"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* 3. Products Grid or Empty State */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-3xl border border-surface-border p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4 shadow-subtle my-8">
            <div className="w-16 h-16 bg-surface-canvas rounded-full flex items-center justify-center mx-auto text-charcoal-400">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg sm:text-xl font-black text-charcoal-900">
                কোনো পণ্য পাওয়া যায়নি
              </h3>
              <p className="text-xs sm:text-sm text-charcoal-500 leading-relaxed">
                আপনার বর্তমান অনুসন্ধান বা ফিল্টারের সাথে মিলে এমন কোনো পণ্য খুঁজে পাওয়া যায়নি।
                অনুগ্রহ করে অন্য কোনো কিওয়ার্ড দিয়ে চেষ্টা করুন অথবা ফিল্টার পরিবর্তন করুন।
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="inline-flex items-center justify-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-card cursor-pointer"
              >
                <span>সব পণ্য দেখুন</span>
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
