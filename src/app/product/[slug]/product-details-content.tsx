"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ShoppingBag,
  Heart,
  Star,
  Plus,
  Minus,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Share2,
  Check,
  Info,
} from "lucide-react";
import { Product, ProductVariant, CartItem } from "@/types/commerce.types";
import { Category } from "@/lib/data/categories";
import { useCartStore } from "@/store/use-cart-store";
import { useWishlistStore } from "@/store/use-wishlist-store";
import { formatBDT } from "@/lib/utils";
import { ProductCard } from "@/components/commerce/product-card";

function toBengaliNumber(num: number): string {
  const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return num.toString().replace(/\d/g, (d) => bengaliDigits[Number(d)]);
}

export interface ProductDetailsContentProps {
  product: Product;
  category?: Category;
  relatedProducts?: Product[];
}

export function ProductDetailsContent({
  product,
  category,
  relatedProducts = [],
}: ProductDetailsContentProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Safely resolve default variant
  const defaultVariant: ProductVariant | undefined =
    product.variants?.find((v) => v.isDefault) || product.variants?.[0];

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    defaultVariant
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [copiedLink, setCopiedLink] = useState(false);

  // Store accessors
  const addItem = useCartStore((state) => state.addItem);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);
  const isInWishlist = useWishlistStore((state) => state.isInWishlist);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeVariant = selectedVariant ?? defaultVariant;
  const isOutOfStock = !activeVariant || activeVariant.stockQuantity <= 0;
  const isLowStock = Boolean(
    activeVariant &&
      activeVariant.stockQuantity > 0 &&
      activeVariant.stockQuantity <= activeVariant.lowStockThreshold
  );

  // Price calculations
  const regularPrice = activeVariant?.regularPrice ?? 0;
  const salePrice = activeVariant?.salePrice;
  const hasDiscount = Boolean(salePrice !== undefined && salePrice < regularPrice);
  const currentPrice = hasDiscount && salePrice !== undefined ? salePrice : regularPrice;
  const discountPercent =
    hasDiscount && regularPrice > 0 && salePrice !== undefined
      ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
      : 0;

  const isWishlisted =
    mounted && typeof isInWishlist === "function" ? isInWishlist(product.id) : false;

  // Handle variant selection
  const handleVariantChange = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    // Reset quantity if current quantity exceeds new variant's stock
    if (quantity > variant.stockQuantity && variant.stockQuantity > 0) {
      setQuantity(1);
    }
  };

  // Quantity controls
  const handleDecreaseQty = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleIncreaseQty = () => {
    if (activeVariant && quantity < activeVariant.stockQuantity) {
      setQuantity((prev) => prev + 1);
    }
  };

  // Add to Cart Action
  const handleAddToCart = () => {
    if (isOutOfStock || !activeVariant) return;

    const cartItem: CartItem = {
      id: `${product.id}-${activeVariant.id}`,
      productId: product.id,
      variantId: activeVariant.id,
      title: product.titleEn,
      titleBn: product.titleBn,
      variantName: activeVariant.displayName,
      unitPrice: currentPrice,
      originalPrice: hasDiscount ? regularPrice : undefined,
      image: product.images?.[0] || "",
      weightLabel: `${activeVariant.weightValue} ${activeVariant.weightUnit}`,
      quantity,
      maxStock: activeVariant.stockQuantity,
    };

    if (typeof addItem === "function") {
      addItem(cartItem);
    }
    if (typeof openDrawer === "function") {
      openDrawer();
    }
  };

  // Buy Now Action
  const handleBuyNow = () => {
    if (isOutOfStock || !activeVariant) return;

    const cartItem: CartItem = {
      id: `${product.id}-${activeVariant.id}`,
      productId: product.id,
      variantId: activeVariant.id,
      title: product.titleEn,
      titleBn: product.titleBn,
      variantName: activeVariant.displayName,
      unitPrice: currentPrice,
      originalPrice: hasDiscount ? regularPrice : undefined,
      image: product.images?.[0] || "",
      weightLabel: `${activeVariant.weightValue} ${activeVariant.weightUnit}`,
      quantity,
      maxStock: activeVariant.stockQuantity,
    };

    if (typeof addItem === "function") {
      addItem(cartItem);
    }
    router.push("/checkout");
  };

  // Wishlist Action
  const handleToggleWishlist = () => {
    if (typeof toggleWishlist === "function") {
      toggleWishlist({
        id: product.id,
        title: product.titleEn,
        titleBn: product.titleBn,
        slug: product.slug,
        image: product.images?.[0] || "",
        regularPrice: activeVariant ? activeVariant.regularPrice : 0,
        salePrice: activeVariant?.salePrice,
      });
    }
  };

  // Share Link Action
  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const images = product.images && product.images.length > 0 ? product.images : [];
  const currentImage = images[selectedImageIndex] || images[0] || "";

  return (
    <div className="space-y-10 font-bengali">
      {/* 1. Breadcrumb Bar */}
      <section className="bg-white border-b border-surface-border py-4 px-4 shadow-subtle">
        <div className="container mx-auto max-w-7xl">
          <nav aria-label="ব্রেডক্রাম্ব" className="flex items-center flex-wrap gap-1.5 text-xs text-charcoal-500">
            <Link href="/" className="hover:text-brand-700 transition-colors font-medium">
              হোম
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <Link href="/shop" className="hover:text-brand-700 transition-colors font-medium">
              সব পণ্য
            </Link>
            {category && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <Link
                  href={`/shop?category=${category.slug}`}
                  className="hover:text-brand-700 transition-colors font-medium"
                >
                  {category.nameBn}
                </Link>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span className="text-brand-900 font-bold truncate max-w-xs sm:max-w-md">
              {product.titleBn}
            </span>
          </nav>
        </div>
      </section>

      {/* 2. Main Product Showcase (Side-by-Side on Desktop, Stacked on Mobile) */}
      <section className="container mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Product Gallery (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square w-full bg-white rounded-3xl border border-surface-border overflow-hidden shadow-card select-none">
              {currentImage ? (
                <Image
                  src={currentImage}
                  alt={product.titleBn}
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  priority
                  className="object-cover transition-all duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-charcoal-400 text-sm">
                  ছবি পাওয়া যায়নি
                </div>
              )}

              {/* Badges on Top-Left */}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10 pointer-events-none">
                {product.badge && (
                  <span className="bg-brand-700 text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                    {product.badge}
                  </span>
                )}
                {hasDiscount && (
                  <span className="bg-accent-amber text-charcoal-900 text-xs font-extrabold px-3 py-1 rounded-full shadow-xs">
                    {discountPercent}% ছাড়
                  </span>
                )}
              </div>

              {/* Floating Wishlist Button on Top-Right */}
              <button
                type="button"
                onClick={handleToggleWishlist}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/95 hover:bg-white text-charcoal-700 hover:text-red-500 flex items-center justify-center shadow-card transition-all z-10 active:scale-95 cursor-pointer"
                aria-label={isWishlisted ? "পছন্দের তালিকা থেকে সরান" : "পছন্দের তালিকায় রাখুন"}
                title={isWishlisted ? "পছন্দের তালিকা থেকে সরান" : "পছন্দের তালিকায় রাখুন"}
              >
                <Heart
                  className={`w-5 h-5 transition-colors ${
                    isWishlisted ? "fill-red-500 text-red-500" : "text-charcoal-700"
                  }`}
                />
              </button>
            </div>

            {/* Thumbnail Strip (if multiple images) */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none]">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 bg-white shrink-0 transition-all cursor-pointer ${
                      selectedImageIndex === idx
                        ? "border-brand-700 ring-2 ring-brand-700/20 shadow-xs"
                        : "border-surface-border hover:border-brand-300 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.titleBn} thumbnail ${idx + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Quick Trust Signals Below Gallery */}
            <div className="p-4 bg-white rounded-2xl border border-surface-border shadow-subtle grid grid-cols-2 gap-3 text-xs text-charcoal-700">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-brand-50 text-brand-700 rounded-xl shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-charcoal-900 leading-tight">১০০% নির্ভেজাল</strong>
                  <span className="text-[11px] text-charcoal-500">ল্যাব সার্টিফাইড</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-brand-50 text-brand-700 rounded-xl shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-charcoal-900 leading-tight">সারাদেশে হোম ডেলিভারি</strong>
                  <span className="text-[11px] text-charcoal-500">ক্যাশ অন ডেলিভারি</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Product Info & Purchase Controls (7 cols on lg) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-surface-border p-6 sm:p-8 shadow-card space-y-6">
            {/* Header: Category Badge & Origin */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {category && (
                  <Link
                    href={`/shop?category=${category.slug}`}
                    className="bg-brand-50 hover:bg-brand-100/80 text-brand-800 border border-brand-200 text-xs font-bold px-3 py-1 rounded-full transition-colors"
                  >
                    {category.nameBn}
                  </Link>
                )}
                {product.originSource && (
                  <span className="bg-surface-canvas text-charcoal-600 border border-surface-border text-xs px-3 py-1 rounded-full">
                    উৎস: {product.originSource}
                  </span>
                )}
              </div>

              {/* Share Button */}
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 text-xs text-charcoal-500 hover:text-brand-700 transition-colors px-2 py-1 rounded-lg hover:bg-surface-canvas cursor-pointer"
                title="লিংক কপি করুন"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">কপি হয়েছে!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>শেয়ার</span>
                  </>
                )}
              </button>
            </div>

            {/* Product Title */}
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black text-charcoal-900 tracking-tight leading-snug">
                {product.titleBn}
              </h1>
              {product.titleEn && (
                <p className="text-sm text-charcoal-500 font-sans">{product.titleEn}</p>
              )}
            </div>

            {/* Ratings & Stock Status */}
            <div className="flex flex-wrap items-center gap-4 pt-1 pb-3 border-b border-surface-border/80">
              {product.reviewCount > 0 && (
                <div className="flex items-center gap-1.5 text-accent-amber text-xs sm:text-sm">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="font-mono font-bold text-charcoal-900">
                    {product.ratingAverage.toFixed(1)}
                  </span>
                  <span className="text-charcoal-500">
                    ({toBengaliNumber(product.reviewCount)}টি কাস্টমার রিভিউ)
                  </span>
                </div>
              )}

              {/* Stock Status Badge */}
              {isOutOfStock ? (
                <span className="bg-red-50 text-red-700 border border-red-200 text-xs font-bold px-3 py-1 rounded-full">
                  স্টক শেষ (Out of Stock)
                </span>
              ) : isLowStock ? (
                <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold px-3 py-1 rounded-full">
                  সীমিত স্টক (আর মাত্র {toBengaliNumber(activeVariant.stockQuantity)}টি বাকি)
                </span>
              ) : (
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>স্টকে আছে (In Stock)</span>
                </span>
              )}
            </div>

            {/* Price Display */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="font-mono font-black text-3xl sm:text-4xl text-brand-700">
                  {formatBDT(currentPrice)}
                </span>
                {hasDiscount && (
                  <span className="font-mono text-base sm:text-lg text-stone-400 line-through">
                    {formatBDT(regularPrice)}
                  </span>
                )}
                {hasDiscount && (
                  <span className="bg-accent-amber/20 text-accent-dark border border-accent-amber/40 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                    {formatBDT(regularPrice - currentPrice)} সাশ্রয়!
                  </span>
                )}
              </div>
              <p className="text-[11px] text-charcoal-500">
                ভ্যাট ও ট্যাক্স অন্তর্ভুক্ত। কোনো অগ্রিম পেমেন্টের প্রয়োজন নেই।
              </p>
            </div>

            {/* Short Description */}
            {product.shortDescriptionBn && (
              <div className="text-xs sm:text-sm text-charcoal-700 leading-relaxed bg-surface-canvas p-4 rounded-2xl border border-surface-border">
                {product.shortDescriptionBn}
              </div>
            )}

            {/* Variant Selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <label className="block text-xs sm:text-sm font-bold text-charcoal-900">
                  প্যাক সাইজ / ভ্যারিয়েন্ট বেছে নিন:
                </label>
                <div
                  className="flex flex-wrap gap-2.5"
                  role="radiogroup"
                  aria-label="ভ্যারিয়েন্ট নির্বাচন করুন"
                >
                  {product.variants.map((variant) => {
                    const isSelected = activeVariant?.id === variant.id;
                    const vPrice =
                      variant.salePrice && variant.salePrice < variant.regularPrice
                        ? variant.salePrice
                        : variant.regularPrice;

                    return (
                      <button
                        key={variant.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => handleVariantChange(variant)}
                        className={`px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? "bg-brand-700 text-white border-brand-700 shadow-card font-bold"
                            : "bg-surface-canvas text-charcoal-800 border-surface-border hover:border-brand-300 hover:bg-white"
                        }`}
                      >
                        <span>{variant.displayName}</span>
                        <span
                          className={`font-mono text-xs ${
                            isSelected ? "text-stone-200" : "text-brand-700 font-bold"
                          }`}
                        >
                          {formatBDT(vPrice)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector & Stock Indicator */}
            <div className="space-y-2.5 pt-2">
              <label className="block text-xs sm:text-sm font-bold text-charcoal-900">পরিমাণ:</label>
              <div className="flex items-center gap-4">
                <div className="inline-flex items-center border-2 border-surface-border rounded-xl bg-surface-canvas overflow-hidden">
                  <button
                    type="button"
                    onClick={handleDecreaseQty}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="w-10 h-10 flex items-center justify-center hover:bg-white text-charcoal-700 transition-colors disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                    aria-label="পরিমাণ কমান"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-mono text-sm sm:text-base font-bold text-charcoal-900 select-none">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncreaseQty}
                    disabled={Boolean(
                      isOutOfStock || (activeVariant && quantity >= activeVariant.stockQuantity)
                    )}
                    className="w-10 h-10 flex items-center justify-center hover:bg-white text-charcoal-700 transition-colors disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                    aria-label="পরিমাণ বাড়ান"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {activeVariant && activeVariant.stockQuantity > 0 && (
                  <span className="text-xs text-charcoal-500">
                    (সর্বোচ্চ {toBengaliNumber(activeVariant.stockQuantity)}টি অর্ডার করা যাবে)
                  </span>
                )}
              </div>
            </div>

            {/* CTA Buttons: Add to Cart & Buy Now */}
            <div className="pt-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Add to Cart */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 border-2 transition-all cursor-pointer ${
                    isOutOfStock
                      ? "bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed"
                      : "bg-brand-50 hover:bg-brand-100 text-brand-700 border-brand-700 active:scale-[0.99]"
                  }`}
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>কার্টে যোগ করুন</span>
                </button>

                {/* Buy Now */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-card cursor-pointer ${
                    isOutOfStock
                      ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                      : "bg-brand-700 hover:bg-brand-800 text-white active:scale-[0.99] hover:shadow-lg"
                  }`}
                >
                  <span>এখনই কিনুন</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Wishlist Button Row (For Mobile & Desktop Accessibility) */}
              <button
                type="button"
                onClick={handleToggleWishlist}
                className="w-full py-2.5 px-4 rounded-xl border border-surface-border hover:bg-surface-canvas text-xs font-semibold text-charcoal-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Heart
                  className={`w-4 h-4 transition-colors ${
                    isWishlisted ? "fill-red-500 text-red-500" : "text-charcoal-600"
                  }`}
                />
                <span>
                  {isWishlisted
                    ? "পণ্যটি পছন্দের তালিকায় যুক্ত রয়েছে"
                    : "পছন্দের তালিকায় যুক্ত করুন"}
                </span>
              </button>
            </div>

            {/* Delivery & Purity Perks */}
            <div className="pt-4 border-t border-surface-border space-y-2.5 text-xs text-charcoal-700">
              <div className="flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-charcoal-900 block">ডেলিভারি চার্জ:</strong>
                  ঢাকা সিটিতে ৳৭০ (২৪-৪৮ ঘণ্টা), ঢাকার বাইরে ৳১৩০ (২-৩ দিন)।{" "}
                  <strong className="text-brand-800">৳২,০০০ বা তার বেশি অর্ডারে সারাদেশে ফ্রি ডেলিভারি!</strong>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-charcoal-900 block">ক্যাশ অন ডেলিভারি (COD):</strong>
                  পণ্য হাতে পেয়ে দেখে মূল্য পরিশোধের শতভাগ নিশ্চয়তা।
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Detailed Product Information (Full Description, Origin, Storage, Ingredients) */}
      {(product.fullDescriptionBn || product.ingredients || product.storageInfo) && (
        <section className="container mx-auto max-w-7xl px-4">
          <div className="bg-white rounded-3xl border border-surface-border p-6 sm:p-10 shadow-card space-y-6">
            <div className="pb-4 border-b border-surface-border flex items-center gap-2">
              <Info className="w-5 h-5 text-brand-700" />
              <h2 className="text-xl sm:text-2xl font-black text-charcoal-900">
                পণ্যের বিস্তারিত বিবরণ ও উপকারিতা
              </h2>
            </div>

            {/* Full Bengali Description */}
            {product.fullDescriptionBn && (
              <div className="prose prose-stone max-w-none text-xs sm:text-sm text-charcoal-700 leading-relaxed space-y-4">
                <p className="whitespace-pre-line">{product.fullDescriptionBn}</p>
              </div>
            )}

            {/* Sourcing & Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-surface-border/60 text-xs sm:text-sm">
              {product.originSource && (
                <div className="p-4 bg-surface-canvas rounded-2xl border border-surface-border space-y-1">
                  <strong className="text-brand-900 block font-bold">সংগ্রহের উৎস:</strong>
                  <p className="text-charcoal-600">{product.originSource}</p>
                </div>
              )}

              {product.ingredients && product.ingredients.length > 0 && (
                <div className="p-4 bg-surface-canvas rounded-2xl border border-surface-border space-y-1">
                  <strong className="text-brand-900 block font-bold">উপাদানসমূহ:</strong>
                  <p className="text-charcoal-600">{product.ingredients.join(", ")}</p>
                </div>
              )}

              {product.storageInfo && (
                <div className="p-4 bg-surface-canvas rounded-2xl border border-surface-border space-y-1">
                  <strong className="text-brand-900 block font-bold">সংরক্ষণ পদ্ধতি:</strong>
                  <p className="text-charcoal-600">{product.storageInfo}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 4. Related Products Section */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section className="container mx-auto max-w-7xl px-4 space-y-6 pt-4">
          <div className="flex items-center justify-between pb-2 border-b border-surface-border">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-charcoal-900">
                সম্পর্কিত অন্যান্য পণ্য (Related Products)
              </h2>
              <p className="text-xs text-charcoal-500 mt-0.5">
                গ্রাহকদের আরও পছন্দের খাঁটি ও প্রাকৃতিক খাবারসমূহ।
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:underline"
            >
              <span>সব পণ্য দেখুন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.slice(0, 4).map((relProduct) => (
              <ProductCard key={relProduct.id} product={relProduct} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
