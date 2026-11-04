"use client";

import React, { useState } from "react";
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
  Phone,
  MessageCircle,
} from "lucide-react";
import { Product, ProductVariant } from "@/types/commerce.types";
import { Category } from "@/lib/data/categories";
import { formatBanglaBDT, toBanglaDigits, cn, formatVariantWeightLabel } from "@/lib/utils";

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

  // WhatsApp order message URL
  const cleanPhone = "8801914612007";
  const totalPrice = currentPrice * quantity;
  const productUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://sunnahsourcebd.com/product/${product.slug}`;

  const whatsappMsg = [
    "আসসালামু আলাইকুম, আমি সুন্নাহ সোর্স থেকে এই পণ্যটি অর্ডার করতে চাই:",
    "",
    `📦 পণ্য: ${product.titleBn}`,
    selectedVariant?.displayName ? `⚖️ সাইজ: ${selectedVariant.displayName}` : null,
    `🔢 পরিমাণ: ${toBanglaDigits(quantity)}টি`,
    `💰 মোট মূল্য: ${formatBanglaBDT(totalPrice)}`,
    `🔗 লিংক: ${productUrl}`,
    "",
    "আমার নাম ও ডেলিভারি ঠিকানা:",
  ]
    .filter(Boolean)
    .join("\n");

  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMsg)}`;

  return (
    <div className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-8 shadow-sm space-y-6 sm:space-y-7 font-bengali">
      {/* 1. Header: Stock Status Badge & Subtle Action Controls */}
      <div className="flex items-center justify-between gap-3">
        {/* Stock Status Badge */}
        <div>
          {isOutOfStock ? (
            <span className="bg-rose-50 text-rose-700 border border-rose-200/80 text-xs font-semibold px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              <span>স্টক শেষ (Out of Stock)</span>
            </span>
          ) : isLowStock ? (
            <span className="bg-amber-50 text-amber-800 border border-amber-200/80 text-xs font-semibold px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span>সীমিত স্টক (আর মাত্র {toBanglaDigits(selectedVariant.stockQuantity)}টি বাকি)</span>
            </span>
          ) : (
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/70 text-xs font-semibold px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>স্টকে আছে (In Stock)</span>
            </span>
          )}
        </div>

        {/* Wishlist & Share Buttons */}
        <div className="flex items-center gap-2">
          {onToggleWishlist && (
            <button
              type="button"
              onClick={onToggleWishlist}
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all cursor-pointer",
                isWishlisted
                  ? "bg-rose-50 text-rose-600 border-rose-200 shadow-2xs"
                  : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100 hover:text-stone-900"
              )}
              aria-label={isWishlisted ? "পছন্দের তালিকা থেকে সরান" : "পছন্দের তালিকায় রাখুন"}
            >
              <Heart
                className={cn(
                  "w-3.5 h-3.5 transition-all duration-200",
                  isWishlisted ? "fill-rose-500 text-rose-500 scale-110" : "text-stone-400"
                )}
              />
              <span className="hidden sm:inline">
                {isWishlisted ? "পছন্দের তালিকায় আছে" : "পছন্দ করুন"}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 transition-colors px-3 py-1.5 rounded-full border border-stone-200 bg-stone-50 hover:bg-stone-100 cursor-pointer"
            title="লিংক কপি করুন"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-medium">কপি হয়েছে!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-stone-500" />
                <span className="hidden sm:inline">শেয়ার</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Product Title & Rating */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight leading-snug">
          {product.titleBn}
        </h1>
        {product.reviewCount > 0 && (
          <div className="flex items-center gap-2 pt-0.5">
            <a
              href="#product-reviews"
              className="flex items-center gap-1.5 text-xs hover:underline cursor-pointer group"
            >
              <div className="flex items-center text-amber-500">
                <Star className="w-3.5 h-3.5 fill-current" />
              </div>
              <span className="font-mono font-bold text-stone-800">
                {product.ratingAverage.toFixed(1)}
              </span>
              <span className="text-stone-400">
                ({toBanglaDigits(product.reviewCount)}টি রিভিউ)
              </span>
            </a>
          </div>
        )}
      </div>

      {/* 3. Price Section: Prominent Offer Price, Subtle Crossed-out Regular Price & Amber-Gold Savings Badge */}
      <div className="flex flex-wrap items-baseline gap-3 pt-1">
        <span className="font-mono font-bold text-3xl sm:text-4xl text-stone-900 tracking-tight">
          {formatBanglaBDT(currentPrice)}
        </span>

        {hasDiscount && (
          <span className="font-mono text-base sm:text-lg text-stone-400 line-through">
            {formatBanglaBDT(regularPrice)}
          </span>
        )}

        {hasDiscount && (
          <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>(৳{toBanglaDigits(Math.round(savings).toLocaleString("en-IN"))} সাশ্রয়!)</span>
          </span>
        )}
      </div>

      {/* 4. Variant Selector: Clean Rounded Weight Pills with Soft Emerald Active State */}
      {product.variants && product.variants.length > 0 && (
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <label className="font-semibold text-stone-800">
              ওজন / সাইজ নির্বাচন করুন:
            </label>
            <span className="text-brand-900 font-medium">
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

      {/* 5. Quantity Counter: Compact, Smooth [- 1 +] with Rounded Corners */}
      <div className="space-y-2 pt-1">
        <label className="block text-xs sm:text-sm font-semibold text-stone-800">পরিমাণ:</label>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center border border-stone-300 rounded-xl bg-stone-50/70 overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={handleDecreaseQty}
              disabled={quantity <= 1 || isOutOfStock}
              className="w-9 h-9 flex items-center justify-center hover:bg-white text-stone-700 transition-colors disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
              aria-label="পরিমাণ কমান"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-10 text-center font-mono text-sm font-bold text-stone-900 select-none">
              {toBanglaDigits(quantity)}
            </span>
            <button
              type="button"
              onClick={handleIncreaseQty}
              disabled={Boolean(
                isOutOfStock || (selectedVariant && quantity >= selectedVariant.stockQuantity)
              )}
              className="w-9 h-9 flex items-center justify-center hover:bg-white text-stone-700 transition-colors disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
              aria-label="পরিমাণ বাড়ান"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {selectedVariant && selectedVariant.stockQuantity > 0 && selectedVariant.stockQuantity <= selectedVariant.lowStockThreshold && (
            <span className="text-xs text-amber-700 font-medium">
              (আর মাত্র {toBanglaDigits(selectedVariant.stockQuantity)}টি বাকি আছে)
            </span>
          )}
        </div>
      </div>

      {/* 6. Harmonious Brand Action Buttons */}
      <div className="pt-2 space-y-3">
        {/* Primary Action Row (Cohesive Royal Emerald Theme) */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* [ ⚡ এখনই অর্ডার করুন ]: Opens 1-Click Express Cash on Delivery modal directly */}
          <button
            type="button"
            onClick={onOrderNow}
            disabled={isOutOfStock}
            className={cn(
              "bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 text-white font-bold rounded-xl shadow-sm hover:shadow-brand-900/20 active:scale-[0.98] transition-all flex-1 h-12 flex items-center justify-center gap-2 cursor-pointer",
              isOutOfStock && "opacity-40 cursor-not-allowed hover:shadow-none"
            )}
          >
            <Zap className="w-4 h-4 fill-amber-300 text-amber-300 shrink-0" />
            <span>এখনই অর্ডার করুন</span>
          </button>

          {/* [ 🛒 কার্টে যোগ করুন ]: Elegant brand outline */}
          <button
            type="button"
            onClick={onAddToCart}
            disabled={isOutOfStock}
            className={cn(
              "border-2 border-brand-800/80 bg-brand-50/30 text-brand-900 font-semibold rounded-xl hover:bg-brand-50 transition-all flex-1 h-12 flex items-center justify-center gap-2 cursor-pointer",
              isOutOfStock && "opacity-40 cursor-not-allowed hover:bg-transparent"
            )}
          >
            <ShoppingBag className="w-4 h-4 text-brand-800 shrink-0" />
            <span>কার্টে যোগ করুন</span>
          </button>
        </div>

        {/* Quick Assistance Row (Sleek Twin Contact Pill) */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* [ 💬 WhatsApp-এ অর্ডার ]: Soft emerald tint */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100 rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer",
              isOutOfStock && "pointer-events-none opacity-50"
            )}
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>WhatsApp-এ অর্ডার</span>
          </a>

          {/* [ 📞 সরাসরি কল করুন ]: Soft stone/slate tint */}
          <a
            href="tel:+8801914612007"
            className="bg-stone-100 text-stone-800 border border-stone-200 hover:bg-stone-200 rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5 text-stone-700 shrink-0" />
            <span>সরাসরি কল করুন</span>
          </a>
        </div>
      </div>

      {/* 7. Minimalist 1-Line Sunnah Purity Seal */}
      <div className="pt-3 border-t border-stone-200/80">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1.5 text-xs text-stone-500 font-medium">
          <span className="flex items-center gap-1">🌿 ১০০% প্রাকৃতিক ও বিশুদ্ধ</span>
          <span className="text-emerald-700 font-bold select-none">•</span>
          <span className="flex items-center gap-1">🛡️ ক্যাশ অন ডেলিভারি</span>
          <span className="text-emerald-700 font-bold select-none">•</span>
          <span className="flex items-center gap-1">⚡ ২৪-৪৮ ঘণ্টায় হোম ডেলিভারি</span>
        </div>
      </div>
    </div>
  );
}
