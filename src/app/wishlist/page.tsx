"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Heart,
  ShoppingBag,
  Trash2,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  PackageCheck,
} from "lucide-react";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { useWishlistStore } from "@/lib/stores/use-wishlist-store";
import { useCartStore } from "@/store/use-cart-store";
import { Product, CartItem } from "@/types/commerce.types";
import { formatBDT, toBanglaDigits } from "@/lib/utils";

const CATEGORY_NAMES: Record<string, string> = {
  honey: "প্রাকৃতিক মধু",
  "ghee-oil": "গাওয়া ঘি ও তেল",
  dates: "প্রিমিয়াম খেজুর",
  seeds: "অর্গানিক সিডস",
  combos: "কম্বো অফার",
};

export default function WishlistPage() {
  const [mounted, setMounted] = useState(false);
  const items = useWishlistStore((state) => state.items || []);
  const removeFromWishlist = useWishlistStore((state) => state.removeFromWishlist);
  const clearWishlist = useWishlistStore((state) => state.clearWishlist);

  const addItem = useCartStore((state) => state.addItem);
  const openDrawer = useCartStore((state) => state.openDrawer);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAddToCart = (product: Product, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const variant =
      product.variants?.find((v) => v.isDefault) || product.variants?.[0];
    if (!variant || variant.stockQuantity <= 0) return;

    const price =
      variant.salePrice !== undefined && variant.salePrice < variant.regularPrice
        ? variant.salePrice
        : variant.regularPrice;
    const originalPrice =
      variant.salePrice !== undefined && variant.salePrice < variant.regularPrice
        ? variant.regularPrice
        : undefined;

    const cartItem: CartItem = {
      id: `${product.id}-${variant.id}`,
      productId: product.id,
      variantId: variant.id,
      title: product.titleEn,
      titleBn: product.titleBn,
      variantName: variant.displayName,
      unitPrice: price,
      originalPrice,
      image: product.images?.[0] || "/images/hero-honey.png",
      weightLabel: `${variant.weightValue} ${variant.weightUnit}`,
      quantity: 1,
      maxStock: variant.stockQuantity,
    };

    if (typeof addItem === "function") {
      addItem(cartItem);
    }
    if (typeof openDrawer === "function") {
      openDrawer();
    }
  };

  const handleAddAllToCart = () => {
    let addedCount = 0;
    for (const product of items) {
      const variant =
        product.variants?.find((v) => v.isDefault) || product.variants?.[0];
      if (variant && variant.stockQuantity > 0) {
        const price =
          variant.salePrice !== undefined && variant.salePrice < variant.regularPrice
            ? variant.salePrice
            : variant.regularPrice;
        const originalPrice =
          variant.salePrice !== undefined && variant.salePrice < variant.regularPrice
            ? variant.regularPrice
            : undefined;

        const cartItem: CartItem = {
          id: `${product.id}-${variant.id}`,
          productId: product.id,
          variantId: variant.id,
          title: product.titleEn,
          titleBn: product.titleBn,
          variantName: variant.displayName,
          unitPrice: price,
          originalPrice,
          image: product.images?.[0] || "/images/hero-honey.png",
          weightLabel: `${variant.weightValue} ${variant.weightUnit}`,
          quantity: 1,
          maxStock: variant.stockQuantity,
        };

        if (typeof addItem === "function") {
          addItem(cartItem);
          addedCount++;
        }
      }
    }

    if (addedCount > 0 && typeof openDrawer === "function") {
      openDrawer();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-canvas font-bengali">
      {/* 1. Top Navigation */}
      <AnnouncementBar />
      <Header />

      {/* 2. Main Wishlist Container */}
      <main className="flex-1 py-8 sm:py-12 px-4">
        <div className="container mx-auto max-w-6xl space-y-8">
          {/* Breadcrumb Bar */}
          <nav aria-label="ব্রেডক্রাম্ব" className="flex items-center gap-1.5 text-xs text-charcoal-500">
            <Link href="/" className="hover:text-brand-700 transition-colors font-medium">
              হোম
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <Link href="/shop" className="hover:text-brand-700 transition-colors font-medium">
              দোকান
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span className="text-brand-900 font-bold">পছন্দের তালিকা</span>
          </nav>

          {/* Header Card */}
          <div className="bg-white rounded-3xl border border-surface-border p-6 sm:p-8 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 border border-rose-100">
                  <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-black text-charcoal-900 tracking-tight">
                      আমার পছন্দের তালিকা (Wishlist)
                    </h1>
                    {mounted && items.length > 0 && (
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full shadow-2xs">
                        {toBanglaDigits(items.length)}টি পণ্য
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-charcoal-500 pt-0.5">
                    আপনার সংরক্ষিত খাঁটি খাদ্যপণ্যসমূহ এখান থেকে সহজেই কার্টে যুক্ত করুন।
                  </p>
                </div>
              </div>
            </div>

            {/* Bulk Action Buttons */}
            {mounted && items.length > 1 && (
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={clearWishlist}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-stone-500 hover:text-rose-600 border border-stone-200 hover:bg-rose-50/50 transition-colors cursor-pointer"
                  title="সম্পূর্ণ তালিকা খালি করুন"
                >
                  তালিকা খালি করুন
                </button>
                <button
                  type="button"
                  onClick={handleAddAllToCart}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs sm:text-sm shadow-card transition-all active:scale-[0.99] cursor-pointer"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>সবগুলো পণ্য একসাথে কার্টে নিন</span>
                </button>
              </div>
            )}
          </div>

          {/* Loading Skeleton */}
          {!mounted && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-4 border border-stone-200/70 shadow-xs space-y-3 animate-pulse"
                >
                  <div className="aspect-square bg-stone-100 rounded-xl" />
                  <div className="h-4 bg-stone-100 rounded w-3/4" />
                  <div className="h-4 bg-stone-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {mounted && items.length === 0 && (
            <div className="bg-white rounded-3xl border border-surface-border p-8 sm:p-14 text-center space-y-6 shadow-card max-w-2xl mx-auto">
              <div className="w-24 h-24 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center mx-auto border border-rose-100 shadow-inner">
                <Heart className="w-12 h-12 stroke-[1.5]" />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h2 className="text-xl sm:text-2xl font-black text-charcoal-900">
                  আপনার পছন্দের তালিকাটি বর্তমানে খালি আছে
                </h2>
                <p className="text-xs sm:text-sm text-charcoal-500 leading-relaxed">
                  আপনার প্রিয় খাঁটি মধু, গাওয়া ঘি বা প্রিমিয়াম খেজুর পছন্দ করে জমিয়ে রাখতে পারেন এবং যেকোনো সময় এক ক্লিকে অর্ডার করতে পারেন।
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-sm shadow-card transition-all active:scale-[0.99] group"
                >
                  <ShoppingBag className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span>পণ্যসমূহ দেখুন (Explore Shop)</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          )}

          {/* Product Grid */}
          {mounted && items.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {items.map((product) => {
                const defaultVariant =
                  product.variants?.find((v) => v.isDefault) || product.variants?.[0];
                const isOutOfStock = !defaultVariant || defaultVariant.stockQuantity <= 0;

                const regularPrice = defaultVariant?.regularPrice ?? 0;
                const salePrice = defaultVariant?.salePrice;
                const hasDiscount = Boolean(
                  salePrice !== undefined && salePrice < regularPrice
                );
                const currentPrice =
                  hasDiscount && salePrice !== undefined ? salePrice : regularPrice;

                const categoryLabel =
                  CATEGORY_NAMES[product.categorySlug] || "খাঁটি পণ্য";

                return (
                  <article
                    key={product.id}
                    className="bg-white rounded-2xl p-4 border border-stone-200/70 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative"
                  >
                    {/* Top Section: Image & Remove Button */}
                    <div>
                      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white border border-stone-100 mb-3 select-none">
                        <Link
                          href={`/product/${product.slug}`}
                          className="block w-full h-full cursor-pointer"
                        >
                          {product.images?.[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.titleBn}
                              fill
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                              quality={95}
                              className="object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-charcoal-400 text-xs">
                              ছবি নেই
                            </div>
                          )}
                        </Link>

                        {/* Remove from Wishlist Button */}
                        <button
                          type="button"
                          onClick={() => removeFromWishlist(product.id)}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 hover:bg-rose-50 text-stone-400 hover:text-rose-600 flex items-center justify-center shadow-xs transition-colors z-10 cursor-pointer"
                          aria-label={`${product.titleBn} পছন্দের তালিকা থেকে সরান`}
                          title="পছন্দের তালিকা থেকে সরান"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Meta: Category & Title */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-semibold text-brand-800 bg-brand-50 px-2 py-0.5 rounded-md">
                            {categoryLabel}
                          </span>

                          {/* In-Stock Indicator Badge */}
                          {isOutOfStock ? (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                              স্টক শেষ
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              <span>স্টকে আছে</span>
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-charcoal-900 text-xs sm:text-sm line-clamp-2 leading-snug">
                          <Link
                            href={`/product/${product.slug}`}
                            className="hover:text-brand-700 transition-colors"
                          >
                            {product.titleBn}
                          </Link>
                        </h3>

                        {defaultVariant?.displayName && (
                          <p className="text-[11px] text-charcoal-400 font-sans">
                            {defaultVariant.displayName}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bottom Section: Price & Action */}
                    <div className="pt-3 mt-3 border-t border-stone-100 space-y-2.5">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-mono font-bold text-brand-700 text-sm sm:text-base">
                          {formatBDT(currentPrice)}
                        </span>
                        {hasDiscount && (
                          <span className="font-mono text-[11px] text-stone-400 line-through">
                            {formatBDT(regularPrice)}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleAddToCart(product, e)}
                        disabled={isOutOfStock}
                        className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                          isOutOfStock
                            ? "bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed"
                            : "bg-brand-50 hover:bg-brand-700 text-brand-700 hover:text-white border border-brand-200 active:scale-95 cursor-pointer"
                        }`}
                        aria-label={`${product.titleBn} কার্টে যোগ করুন`}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{isOutOfStock ? "স্টক শেষ" : "কার্টে যোগ করুন"}</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* 3. Footer & Mobile Navigation Elements */}
      <Footer />
      <MobileBottomNav />
      <CartDrawer />
    </div>
  );
}
