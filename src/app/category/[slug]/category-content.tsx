"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  MapPin,
  ShieldCheck,
  ArrowUpDown,
} from "lucide-react";
import { Product } from "@/types/commerce.types";
import { Category, CATEGORIES_DATA } from "@/lib/data/categories";
import { ProductCard } from "@/components/commerce/product-card";

function toBengaliNumber(num: number): string {
  const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return num.toString().replace(/\d/g, (d) => bengaliDigits[Number(d)]);
}

type SortOption = "default" | "price_asc" | "price_desc";

export interface CategoryContentProps {
  category: Category;
  products: Product[];
}

export function CategoryContent({ category, products }: CategoryContentProps) {
  const [sortBy, setSortBy] = useState<SortOption>("default");

  // Helper to extract effective price of a product
  const getEffectivePrice = (prod: Product): number => {
    const variant = prod.variants?.find((v) => v.isDefault) || prod.variants?.[0];
    if (!variant) return 0;
    return variant.salePrice && variant.salePrice < variant.regularPrice
      ? variant.salePrice
      : variant.regularPrice;
  };

  // Sort products
  const sortedProducts = useMemo(() => {
    const prods = [...products];
    if (sortBy === "price_asc") {
      return prods.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    }
    if (sortBy === "price_desc") {
      return prods.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
    }
    return prods;
  }, [products, sortBy]);

  // Other categories for quick navigation
  const otherCategories = useMemo(() => {
    return CATEGORIES_DATA.filter((c) => c.slug !== category.slug);
  }, [category.slug]);

  return (
    <div className="space-y-8 font-bengali">
      {/* 1. Category Header & Breadcrumb Banner */}
      <section className="bg-white border-b border-surface-border py-8 px-4 shadow-subtle">
        <div className="container mx-auto max-w-7xl space-y-6">
          {/* Breadcrumb: হোম → ক্যাটাগরি → [ক্যাটাগরির নাম] */}
          <nav aria-label="ব্রেডক্রাম্ব" className="flex items-center gap-1.5 text-xs text-charcoal-500">
            <Link href="/" className="hover:text-brand-700 transition-colors font-medium">
              হোম
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <Link href="/shop" className="hover:text-brand-700 transition-colors font-medium">
              সব পণ্য
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span className="text-brand-900 font-bold truncate">{category.nameBn}</span>
          </nav>

          {/* Category Banner Card */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-10">
            {/* Left Content */}
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-1.5 bg-brand-50 border border-brand-200/80 text-brand-800 text-[11px] font-bold px-3 py-1 rounded-full">
                <Sparkles className="w-3 h-3 text-accent-amber" />
                <span>সান্নাহ সোর্স প্রিমিয়াম ক্যাটাগরি</span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-charcoal-900 tracking-tight leading-snug">
                  {category.nameBn}
                </h1>
                {category.nameEn && (
                  <p className="text-xs sm:text-sm text-charcoal-500 font-sans mt-0.5">
                    {category.nameEn}
                  </p>
                )}
              </div>

              {category.taglineBn && (
                <p className="text-xs sm:text-sm font-semibold text-brand-800">
                  {category.taglineBn}
                </p>
              )}

              {category.descriptionBn && (
                <p className="text-xs sm:text-sm text-charcoal-600 leading-relaxed max-w-2xl">
                  {category.descriptionBn}
                </p>
              )}

              {/* Sourcing & Purity Badges */}
              {(category.sourcingOriginBn || category.purityPromiseBn) && (
                <div className="flex flex-wrap gap-2.5 pt-1 text-xs">
                  {category.sourcingOriginBn && (
                    <div className="inline-flex items-center gap-1.5 bg-surface-canvas border border-surface-border text-charcoal-700 px-3 py-1.5 rounded-xl">
                      <MapPin className="w-3.5 h-3.5 text-brand-700 shrink-0" />
                      <span>
                        <strong>উৎস:</strong> {category.sourcingOriginBn}
                      </span>
                    </div>
                  )}
                  {category.purityPromiseBn && (
                    <div className="inline-flex items-center gap-1.5 bg-brand-50/60 border border-brand-100 text-brand-900 px-3 py-1.5 rounded-xl">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>
                        <strong>বিশুদ্ধতা:</strong> {category.purityPromiseBn}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Image Feature */}
            {category.imageUrl && (
              <div className="relative w-full sm:w-64 lg:w-72 aspect-[4/3] rounded-2xl overflow-hidden border-2 border-surface-border shadow-subtle shrink-0">
                <Image
                  src={category.imageUrl}
                  alt={category.nameBn}
                  fill
                  sizes="(max-width: 640px) 100vw, 288px"
                  priority
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Controls & Products Grid Section */}
      <section className="container mx-auto max-w-7xl px-4 space-y-6">
        {/* Filter Summary & Sorting Controls */}
        <div className="bg-white p-4 rounded-2xl border border-surface-border shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Dynamic Product Count */}
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-charcoal-900 font-mono">
              {toBengaliNumber(sortedProducts.length)}টি পণ্য
            </span>
            <span className="text-xs text-charcoal-500 font-medium">উপলব্ধ রয়েছে</span>
          </div>

          {/* Simple Sort Dropdown */}
          {products.length > 0 && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <label htmlFor="sort-select" className="text-xs text-charcoal-600 font-medium flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-brand-700" />
                <span>সাজান:</span>
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-10 px-3.5 pr-8 rounded-xl border border-surface-border bg-surface-canvas text-xs sm:text-sm text-charcoal-900 font-medium focus:bg-white focus:outline-none focus:border-brand-700 transition-colors shadow-xs cursor-pointer"
              >
                <option value="default">ডিফল্ট বিন্যাস</option>
                <option value="price_asc">দাম: কম থেকে বেশি</option>
                <option value="price_desc">দাম: বেশি থেকে কম</option>
              </select>
            </div>
          )}
        </div>

        {/* 3. Products Grid or Clean Empty State */}
        {sortedProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {sortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          /* Empty Category State */
          <div className="bg-white rounded-3xl border border-surface-border p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4 shadow-subtle my-8">
            <div className="w-16 h-16 bg-surface-canvas rounded-full flex items-center justify-center mx-auto text-charcoal-400">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg sm:text-xl font-black text-charcoal-900">
                এই ক্যাটাগরিতে বর্তমানে কোনো পণ্য নেই
              </h3>
              <p className="text-xs sm:text-sm text-charcoal-500 leading-relaxed">
                খুব শীঘ্রই &ldquo;{category.nameBn}&rdquo; ক্যাটাগরিতে নতুন ও ফ্রেশ পণ্যের কালেকশন যুক্ত করা হবে।
                আমাদের অন্যান্য খাঁটি খাদ্যপণ্য দেখতে শপ পেজে যান।
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center justify-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-card cursor-pointer"
              >
                <span>সব পণ্য দেখুন</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* 4. Other Categories Navigation Bar */}
        {otherCategories.length > 0 && (
          <div className="pt-8 border-t border-surface-border/80 space-y-3">
            <h3 className="text-xs sm:text-sm font-bold text-charcoal-700">
              অন্যান্য ক্যাটাগরি এক্সপ্লোর করুন:
            </h3>
            <div className="flex flex-wrap gap-2">
              {otherCategories.map((c) => (
                <Link
                  key={c.id}
                  href={`/category/${c.slug}`}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-brand-50 border border-surface-border hover:border-brand-300 text-xs font-medium text-charcoal-700 hover:text-brand-800 transition-all shadow-2xs"
                >
                  {c.nameBn}
                </Link>
              ))}
              <Link
                href="/shop"
                className="px-3.5 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 border border-brand-200 text-xs font-bold text-brand-800 transition-all"
              >
                সব পণ্য →
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
