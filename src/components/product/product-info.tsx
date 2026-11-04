"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Heart,
  Share2,
  Check,
  Star,
  CheckCircle2,
  Minus,
  Plus,
  ShoppingBag,
  Zap,
  Sparkles,
  Truck,
  Clock,
  MessageCircle,
} from "lucide-react";
import { Product, ProductVariant } from "@/types/commerce.types";
import { Category } from "@/lib/data/categories";
import { formatBanglaBDT, toBanglaDigits, cn, formatVariantWeightLabel } from "@/lib/utils";
import { WhatsappOrderButton } from "@/components/commerce/whatsapp-order-button";

export { formatVariantWeightLabel };

export interface ProductInfoProps {
  product: Product;
  category?: Category;
  selectedVariant: ProductVariant;
  onVariantChange: (variant: ProductVariant) => void;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  onAddToCart: () => void;
  onOrderNow: () => void;
  isOutOfStock: boolean;
  isWishlisted?: boolean;
  onToggleWishlist?: (e?: React.MouseEvent) => void;
}

export function ProductInfo({
  product,
  category,
  selectedVariant,
  onVariantChange,
  quantity,
  onQuantityChange,
  onAddToCart,
  onOrderNow,
  isOutOfStock,
  isWishlisted = false,
  onToggleWishlist,
}: ProductInfoProps) {
  const [copiedLink, setCopiedLink] = useState(false);

  // Price calculations
  const regularPrice = selectedVariant?.regularPrice ?? 0;
  const salePrice = selectedVariant?.salePrice;
  const hasDiscount = Boolean(
    salePrice !== undefined && salePrice > 0 && salePrice < regularPrice
  );
  const currentPrice = hasDiscount && salePrice !== undefined ? salePrice : regularPrice;
  const savings = hasDiscount ? regularPrice - currentPrice : 0;

  const isLowStock = Boolean(
    selectedVariant &&
      selectedVariant.stockQuantity > 0 &&
      selectedVariant.stockQuantity <= selectedVariant.lowStockThreshold
  );

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleDecreaseQty = () => {
    if (quantity > 1) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncreaseQty = () => {
    if (selectedVariant && quantity < selectedVariant.stockQuantity) {
      onQuantityChange(quantity + 1);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-surface-border p-6 sm:p-8 shadow-card space-y-6 font-bengali">
      {/* 1. Header: Category Badge & Origin */}
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
            <span className="bg-surface-canvas text-stone-600 border border-surface-border text-xs px-3 py-1 rounded-full">
              উৎস: {product.originSource}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onToggleWishlist && (
            <button
              type="button"
              onClick={onToggleWishlist}
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                isWishlisted
                  ? "bg-rose-50 text-rose-500 border-rose-200 shadow-xs"
                  : "bg-surface-canvas text-stone-600 border-surface-border hover:bg-stone-100 hover:text-stone-900"
              }`}
              aria-label={isWishlisted ? "পছন্দের তালিকা থেকে সরান" : "পছন্দের তালিকায় রাখুন"}
            >
              <Heart
                className={`w-3.5 h-3.5 transition-all duration-200 ${
                  isWishlisted ? "fill-rose-500 text-rose-500 scale-110" : "text-stone-400"
                }`}
              />
              <span>{isWishlisted ? "পছন্দের তালিকায় আছে" : "পছন্দ করুন"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-brand-700 transition-colors px-2.5 py-1.5 rounded-full border border-surface-border bg-surface-canvas hover:bg-stone-100 cursor-pointer"
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
      </div>

      {/* 2. Product Title */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight leading-snug">
          {product.titleBn}
        </h1>
        {product.titleEn && (
          <p className="text-sm text-stone-500 font-sans">{product.titleEn}</p>
        )}
      </div>

      {/* 3. Ratings & Stock Status */}
      <div className="flex flex-wrap items-center gap-4 pt-1 pb-3 border-b border-surface-border/80">
        {product.reviewCount > 0 && (
          <a
            href="#product-reviews"
            className="flex items-center gap-1.5 text-accent-amber text-xs sm:text-sm hover:underline cursor-pointer group"
          >
            <Star className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
            <span className="font-mono font-bold text-stone-900">
              {product.ratingAverage.toFixed(1)}
            </span>
            <span className="text-stone-500 group-hover:text-brand-700 transition-colors">
              ({toBanglaDigits(product.reviewCount)}টি কাস্টমার রিভিউ)
            </span>
          </a>
        )}

        {isOutOfStock ? (
          <span className="bg-red-50 text-red-700 border border-red-200 text-xs font-bold px-3 py-1 rounded-full">
            স্টক শেষ (Out of Stock)
          </span>
        ) : isLowStock ? (
          <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold px-3 py-1 rounded-full">
            সীমিত স্টক (আর মাত্র {toBanglaDigits(selectedVariant.stockQuantity)}টি বাকি)
          </span>
        ) : (
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>স্টকে আছে (In Stock)</span>
          </span>
        )}
      </div>

      {/* 4. Price Section (Ghorer Bazar Style Prominent Pricing & Savings Badge) */}
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-baseline gap-3">
          {/* Prominent offer price in bold Bengali numerals */}
          <span className="font-mono font-black text-3xl sm:text-4xl text-brand-800 tracking-tight">
            {formatBanglaBDT(currentPrice)}
          </span>

          {/* Strikethrough regular price */}
          {hasDiscount && (
            <span className="font-mono text-base sm:text-lg text-stone-400 line-through">
              {formatBanglaBDT(regularPrice)}
            </span>
          )}

          {/* Eye-catching Savings Badge */}
          {hasDiscount && (
            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>(৳{toBanglaDigits(Math.round(savings).toLocaleString("en-IN"))} সাশ্রয়!)</span>
            </span>
          )}
        </div>
        <p className="text-[11px] text-stone-500 font-medium">
          ভ্যাট ও ট্যাক্স অন্তর্ভুক্ত। কোনো অগ্রিম পেমেন্টের প্রয়োজন নেই।
        </p>
      </div>

      {/* 5. Short Description */}
      {product.shortDescriptionBn && (
        <div className="text-xs sm:text-sm text-stone-700 leading-relaxed bg-surface-canvas p-4 rounded-2xl border border-surface-border">
          {product.shortDescriptionBn}
        </div>
      )}

      {/* 6. Interactive Weight/Variant Selector Pills (Naturo Style) */}
      {product.variants && product.variants.length > 0 && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <label className="block text-xs sm:text-sm font-bold text-stone-900">
              ওজন / প্যাক সাইজ বেছে নিন:
            </label>
            <span className="text-xs text-brand-800 font-medium">
              নির্বাচিত: {formatVariantWeightLabel(selectedVariant)}
            </span>
          </div>

          <div
            className="flex flex-wrap gap-2.5"
            role="radiogroup"
            aria-label="ভ্যারিয়েন্ট নির্বাচন করুন"
          >
            {product.variants.map((variant) => {
              const isSelected = selectedVariant?.id === variant.id;
              const pillLabel = formatVariantWeightLabel(variant);
              const vPrice =
                variant.salePrice && variant.salePrice > 0 && variant.salePrice < variant.regularPrice
                  ? variant.salePrice
                  : variant.regularPrice;

              return (
                <button
                  key={variant.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onVariantChange(variant)}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-all",
                    isSelected
                      ? "border-2 border-brand-800 bg-brand-50/70 text-brand-900 font-bold shadow-xs scale-[1.02]"
                      : "border border-stone-200 bg-white text-stone-700 hover:border-brand-300 hover:bg-stone-50"
                  )}
                >
                  <span>{pillLabel}</span>
                  <span
                    className={cn(
                      "font-mono text-xs",
                      isSelected ? "text-brand-800 font-bold" : "text-stone-500"
                    )}
                  >
                    {formatBanglaBDT(vPrice)}
                  </span>
                  {isSelected && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-800 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. Quantity Selector */}
      <div className="space-y-2.5 pt-1">
        <label className="block text-xs sm:text-sm font-bold text-stone-900">পরিমাণ:</label>
        <div className="flex items-center gap-4">
          <div className="inline-flex items-center border-2 border-surface-border rounded-xl bg-surface-canvas overflow-hidden">
            <button
              type="button"
              onClick={handleDecreaseQty}
              disabled={quantity <= 1 || isOutOfStock}
              className="w-10 h-10 flex items-center justify-center hover:bg-white text-stone-700 transition-colors disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
              aria-label="পরিমাণ কমান"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-12 text-center font-mono text-sm sm:text-base font-bold text-stone-900 select-none">
              {toBanglaDigits(quantity)}
            </span>
            <button
              type="button"
              onClick={handleIncreaseQty}
              disabled={Boolean(
                isOutOfStock || (selectedVariant && quantity >= selectedVariant.stockQuantity)
              )}
              className="w-10 h-10 flex items-center justify-center hover:bg-white text-stone-700 transition-colors disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
              aria-label="পরিমাণ বাড়ান"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {selectedVariant && selectedVariant.stockQuantity > 0 && (
            <span className="text-xs text-stone-500">
              (সর্বোচ্চ {toBanglaDigits(selectedVariant.stockQuantity)}টি অর্ডার করা যাবে)
            </span>
          )}
        </div>
      </div>

      {/* 8. CTA Buttons: 1-Click Order Now & Add to Cart */}
      <div className="pt-2 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Add to Cart */}
          <button
            type="button"
            onClick={onAddToCart}
            disabled={isOutOfStock}
            className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 border-2 transition-all cursor-pointer ${
              isOutOfStock
                ? "bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed"
                : "bg-brand-50 hover:bg-brand-100 text-brand-800 border-brand-700 active:scale-[0.99]"
            }`}
          >
            <ShoppingBag className="w-5 h-5 text-brand-800" />
            <span>কার্টে যোগ করুন</span>
          </button>

          {/* 1-Click Express Checkout CTA: এখনই অর্ডার করুন */}
          <button
            type="button"
            onClick={onOrderNow}
            disabled={isOutOfStock}
            className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
              isOutOfStock
                ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                : "bg-gradient-to-r from-brand-700 via-brand-800 to-brand-900 hover:from-brand-800 hover:to-brand-950 text-white active:scale-[0.99] hover:shadow-lg ring-2 ring-brand-700/20"
            }`}
          >
            <Zap className="w-5 h-5 fill-amber-300 text-amber-300 shrink-0 animate-pulse" />
            <span>এখনই অর্ডার করুন</span>
          </button>
        </div>

        {/* 1-Click WhatsApp Order Button */}
        <WhatsappOrderButton
          productTitle={product.titleBn}
          variantName={selectedVariant?.displayName}
          unitPrice={currentPrice}
          quantity={quantity}
          productSlug={product.slug}
          disabled={isOutOfStock}
        />
      </div>

      {/* 9. Delivery & Purity Perks */}
      <div className="pt-4 border-t border-surface-border space-y-2.5 text-xs text-stone-700">
        <div className="flex items-start gap-2.5">
          <Truck className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
          <div>
            <strong className="text-stone-900 block font-bold">ডেলিভারি চার্জ:</strong>
            ঢাকার ভেতরে ৳৬০, ঢাকার বাইরে ৳১২০।{" "}
            <strong className="text-brand-800 font-bold">
              ৳২,০০০ বা তার বেশি অর্ডারে সারাদেশে ফ্রি ডেলিভারি!
            </strong>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
          <div>
            <strong className="text-stone-900 block font-bold">ক্যাশ অন ডেলিভারি (COD):</strong>
            পণ্য হাতে পেয়ে দেখে মূল্য পরিশোধের শতভাগ নিশ্চয়তা।
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong className="text-stone-900 block font-bold">হোয়াটসঅ্যাপ সাপোর্ট:</strong>
            পণ্য সম্পর্কে জানতে বা সরাসরি কথা বলতে মেসেজ দিন:{" "}
            <a
              href="https://wa.me/8801914612007"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 font-bold hover:underline"
            >
              ০১৯১৪-৬১২০০৭
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
