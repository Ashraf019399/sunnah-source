"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Package,
  Search,
  ExternalLink,
  Tag,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FolderTree,
  Boxes,
  MapPin,
  Layers,
  X,
  Database,
} from "lucide-react";
import { AdminProductView } from "@/lib/actions/admin-product-actions";
import { CATEGORIES_DATA } from "@/lib/data/categories";
import { formatBDT, toBanglaDigits } from "@/lib/utils";

interface ProductsListProps {
  products: AdminProductView[];
  hasLiveInventory?: boolean;
}

function ProductThumbnail({ src, alt }: { src?: string; alt: string }) {
  const [hasError, setHasError] = useState(false);

  React.useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center text-charcoal-300 bg-surface-canvas">
        <Package className="w-6 h-6" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
      sizes="64px"
      onError={() => setHasError(true)}
    />
  );
}

export function ProductsList({ products, hasLiveInventory = false }: ProductsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStockFilter, setSelectedStockFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");

  // Global metric calculations
  const metrics = useMemo(() => {
    let totalVariants = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const prod of products) {
      for (const v of prod.variants) {
        totalVariants++;
        if (v.stockQuantity <= 0) {
          outOfStockCount++;
        } else if (v.stockQuantity <= v.lowStockThreshold) {
          lowStockCount++;
        }
      }
    }

    return {
      totalProducts: products.length,
      totalVariants,
      lowStockCount,
      outOfStockCount,
    };
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return products.filter((prod) => {
      // 1. Category filter
      if (selectedCategory !== "all" && prod.categorySlug !== selectedCategory) {
        return false;
      }

      // 2. Stock status filter across variants
      if (selectedStockFilter === "out_of_stock") {
        const hasOut = prod.variants.some((v) => v.stockQuantity <= 0);
        if (!hasOut) return false;
      } else if (selectedStockFilter === "low_stock") {
        const hasLow = prod.variants.some(
          (v) => v.stockQuantity > 0 && v.stockQuantity <= v.lowStockThreshold
        );
        if (!hasLow) return false;
      } else if (selectedStockFilter === "in_stock") {
        const allInStock = prod.variants.some((v) => v.stockQuantity > 0);
        if (!allInStock) return false;
      }

      // 3. Search query filter (title, slug, SKU, variant name)
      if (q) {
        const matchesTitleBn = prod.titleBn.toLowerCase().includes(q);
        const matchesTitleEn = prod.titleEn.toLowerCase().includes(q);
        const matchesOrigin = (prod.originSource || "").toLowerCase().includes(q);
        const matchesSku = prod.variants.some((v) => v.sku.toLowerCase().includes(q));
        const matchesVariant = prod.variants.some((v) =>
          v.displayName.toLowerCase().includes(q)
        );

        if (
          !matchesTitleBn &&
          !matchesTitleEn &&
          !matchesOrigin &&
          !matchesSku &&
          !matchesVariant
        ) {
          return false;
        }
      }

      return true;
    });
  }, [products, selectedCategory, selectedStockFilter, searchQuery]);

  return (
    <div className="space-y-6 font-bengali">
      {/* Live Inventory Connection Status Banner */}
      {hasLiveInventory ? (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-800">
          <div className="flex items-center gap-2 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>লাইভ ডাটাবেজ ইনভেন্টরি সক্রিয় (public.product_variants)</span>
          </div>
          <span className="text-[11px] font-medium text-emerald-700 hidden sm:inline">
            প্রতিটি অর্ডার ও ক্যান্সেলেশনের সাথে স্টক স্বয়ংক্রিয়ভাবে আপডেট হয়
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-semibold">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
          <div className="leading-relaxed">
            <strong>সতর্কতা:</strong> ডাটাবেজের লাইভ ভ্যারিয়েন্ট স্টক রিড করা সম্ভব হয়নি। নিচের স্টক সংখ্যাগুলো ক্যাটালগ ব্যাকআপ থেকে প্রদর্শিত হচ্ছে (লাইভ ডাটাবেজ স্টক নয়)।
          </div>
        </div>
      )}

      {/* 1. Quick Stats Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Products */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-surface-border shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-charcoal-500">মোট পণ্য</span>
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-charcoal-900 font-sans tracking-tight">
              {toBanglaDigits(metrics.totalProducts)}
            </div>
            <p className="text-[11px] text-charcoal-500 mt-0.5">অ্যাক্টিভ ক্যাটালগ</p>
          </div>
        </div>

        {/* Total Variants */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-surface-border shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-charcoal-500">মোট ভ্যারিয়েন্ট</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-charcoal-900 font-sans tracking-tight">
              {toBanglaDigits(metrics.totalVariants)}
            </div>
            <p className="text-[11px] text-charcoal-500 mt-0.5">সাইজ ও প্যাকেজিং</p>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-surface-border shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700">কম স্টক সতর্কতা</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-amber-700 font-sans tracking-tight">
              {toBanglaDigits(metrics.lowStockCount)}
            </div>
            <p className="text-[11px] text-amber-600 mt-0.5">রিঅর্ডার প্রয়োজন</p>
          </div>
        </div>

        {/* Out of Stock */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-surface-border shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700">স্টক শেষ</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-rose-700 font-sans tracking-tight">
              {toBanglaDigits(metrics.outOfStockCount)}
            </div>
            <p className="text-[11px] text-rose-600 mt-0.5">বিক্রি বন্ধ</p>
          </div>
        </div>
      </div>

      {/* 2. Filter & Search Control Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-surface-border shadow-subtle space-y-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="পণ্যের নাম বা SKU দিয়ে খুঁজুন..."
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-surface-canvas border border-surface-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 font-medium placeholder:text-charcoal-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-700"
                aria-label="সার্চ ক্লিয়ার করুন"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <div className="w-full sm:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="ক্যাটাগরি ফিল্টার"
                className="w-full sm:w-48 bg-surface-canvas border border-surface-border rounded-xl px-3 py-2.5 text-xs sm:text-sm font-bold text-charcoal-800 focus:outline-none focus:ring-2 focus:ring-brand-700/20 cursor-pointer"
              >
                <option value="all">সকল ক্যাটাগরি</option>
                {CATEGORIES_DATA.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.nameBn}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock Status Dropdown */}
            <div className="w-full sm:w-auto">
              <select
                value={selectedStockFilter}
                onChange={(e) =>
                  setSelectedStockFilter(
                    e.target.value as "all" | "in_stock" | "low_stock" | "out_of_stock"
                  )
                }
                aria-label="স্টক ফিল্টার"
                className="w-full sm:w-40 bg-surface-canvas border border-surface-border rounded-xl px-3 py-2.5 text-xs sm:text-sm font-bold text-charcoal-800 focus:outline-none focus:ring-2 focus:ring-brand-700/20 cursor-pointer"
              >
                <option value="all">সকল স্টক অবস্থা</option>
                <option value="in_stock">স্টকে আছে</option>
                <option value="low_stock">কম স্টক (&le; থ্রেশহোল্ড)</option>
                <option value="out_of_stock">স্টক শেষ (০)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-charcoal-500 pt-2 border-t border-surface-border/60">
          <span>
            প্রদর্শিত হচ্ছে: <strong className="text-charcoal-900 font-bold">{toBanglaDigits(filteredProducts.length)}</strong> টি পণ্য
          </span>
          {(searchQuery || selectedCategory !== "all" || selectedStockFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedStockFilter("all");
              }}
              className="text-brand-700 hover:text-brand-900 font-bold hover:underline"
            >
              ফিল্টার রিসেট করুন
            </button>
          )}
        </div>
      </div>

      {/* 3. Products List */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-surface-border text-center shadow-subtle space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-charcoal-900">কোনো পণ্য পাওয়া যায়নি</h3>
          <p className="text-xs text-charcoal-500 max-w-sm mx-auto">
            আপনার অনুসন্ধান বা ফিল্টার শর্ত অনুযায়ী কোনো পণ্য খুঁজে পাওয়া যায়নি। ফিল্টার রিসেট করে আবার চেষ্টা করুন।
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((product) => {
            return (
              <div
                key={product.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-surface-border shadow-subtle hover:border-brand-700/30 transition-all space-y-4"
              >
                {/* Product Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border/70">
                  <div className="flex items-start sm:items-center gap-3.5">
                    {/* Thumbnail */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-surface-canvas border border-surface-border relative shrink-0">
                      <ProductThumbnail src={product.images?.[0]} alt={product.titleBn} />
                    </div>

                    {/* Titles & Category */}
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-800 border border-brand-200">
                          {product.categoryNameBn}
                        </span>
                        {product.badge && (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            {product.badge}
                          </span>
                        )}
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          সক্রিয়
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-charcoal-900">
                        {product.titleBn}
                      </h3>
                      <p className="text-xs text-charcoal-500 font-sans">{product.titleEn}</p>
                    </div>
                  </div>

                  {/* Sourcing Origin & Storefront Preview */}
                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    {product.originSource && (
                      <span className="text-[11px] text-charcoal-600 bg-surface-canvas border border-surface-border px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-brand-700 shrink-0" />
                        <span className="truncate max-w-[200px]">{product.originSource}</span>
                      </span>
                    )}

                    <Link
                      href={`/product/${product.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-xl transition-colors"
                      title="নতুন ট্যাবে স্টোরফ্রন্ট প্রিভিউ দেখুন"
                    >
                      <span>স্টোরফ্রন্ট প্রিভিউ</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Variants Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-surface-border text-charcoal-500 uppercase tracking-wider text-[11px] font-bold">
                        <th className="py-2.5 pr-4 font-bold">ভ্যারিয়েন্ট</th>
                        <th className="py-2.5 px-4 font-bold">SKU</th>
                        <th className="py-2.5 px-4 font-bold">রেগুলার মূল্য</th>
                        <th className="py-2.5 px-4 font-bold">অফার মূল্য</th>
                        <th className="py-2.5 px-4 font-bold text-center">স্টক পরিমাণ</th>
                        <th className="py-2.5 pl-4 font-bold text-right">স্টক অবস্থা</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border/60">
                      {product.variants.map((variant) => {
                        const isOutOfStock = variant.stockQuantity <= 0;
                        const isLowStock =
                          !isOutOfStock && variant.stockQuantity <= variant.lowStockThreshold;

                        return (
                          <tr key={variant.id} className="hover:bg-surface-canvas/50 transition-colors">
                            {/* Variant Name & Default Badge */}
                            <td className="py-3 pr-4 font-semibold text-charcoal-900">
                              <div className="flex items-center gap-2">
                                <span>{variant.displayName}</span>
                                {variant.isDefault && (
                                  <span className="text-[10px] font-bold bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md border border-stone-200">
                                    ডিফল্ট
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* SKU */}
                            <td className="py-3 px-4 font-mono text-[11px] text-charcoal-600">
                              {variant.sku}
                            </td>

                            {/* Regular Price */}
                            <td className="py-3 px-4 font-semibold text-charcoal-700">
                              {formatBDT(variant.regularPrice)}
                            </td>

                            {/* Sale Price */}
                            <td className="py-3 px-4">
                              {variant.salePrice && variant.salePrice < variant.regularPrice ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-brand-900">
                                    {formatBDT(variant.salePrice)}
                                  </span>
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                    {toBanglaDigits(
                                      Math.round(
                                        ((variant.regularPrice - variant.salePrice) /
                                          variant.regularPrice) *
                                          100
                                      )
                                    )}
                                    % ছাড়
                                  </span>
                                </div>
                              ) : (
                                <span className="text-charcoal-400">--</span>
                              )}
                            </td>

                            {/* Stock Quantity with Live vs Fallback tag */}
                            <td className="py-3 px-4 text-center">
                              <div className="inline-flex flex-col items-center">
                                <span className="font-bold text-sm text-charcoal-900 font-sans">
                                  {toBanglaDigits(variant.stockQuantity)}
                                </span>
                                {variant.isLiveStock ? (
                                  <span className="text-[9px] font-semibold text-emerald-700 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                    লাইভ
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-semibold text-amber-700">
                                    (ক্যাটালগ ব্যাকআপ)
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Status Badge */}
                            <td className="py-3 pl-4 text-right">
                              {isOutOfStock ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>স্টক শেষ</span>
                                </span>
                              ) : isLowStock ? (
                                <span
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200"
                                  title={`কম স্টক সতর্কবার্তা থ্রেশহোল্ড: ${variant.lowStockThreshold}`}
                                >
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>কম স্টক ({toBanglaDigits(variant.stockQuantity)})</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>পর্যাপ্ত স্টক</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
