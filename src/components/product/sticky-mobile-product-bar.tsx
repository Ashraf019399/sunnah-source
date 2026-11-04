"use client";

import React from "react";
import { ShoppingBag, Zap } from "lucide-react";
import { Product, ProductVariant } from "@/types/commerce.types";
import { formatBanglaBDT, toBanglaDigits } from "@/lib/utils";
import { formatVariantWeightLabel } from "./product-info";

export interface StickyMobileProductBarProps {
  product: Product;
  selectedVariant: ProductVariant;
  onAddToCart: () => void;
  onOrderNow: () => void;
  isOutOfStock: boolean;
}

export function StickyMobileProductBar({
  product,
  selectedVariant,
  onAddToCart,
  onOrderNow,
  isOutOfStock,
}: StickyMobileProductBarProps) {
  // Price calculations
  const regularPrice = selectedVariant?.regularPrice ?? 0;
  const salePrice = selectedVariant?.salePrice;
  const hasDiscount = Boolean(
    salePrice !== undefined && salePrice > 0 && salePrice < regularPrice
  );
  const currentPrice = hasDiscount && salePrice !== undefined ? salePrice : regularPrice;
  const savings = hasDiscount ? regularPrice - currentPrice : 0;
  const variantLabel = formatVariantWeightLabel(selectedVariant);

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-45 bg-white/95 backdrop-blur-md border-t border-stone-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-3.5 py-2.5 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] font-bengali">
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        {/* Left Side: Variant & Dynamic Price */}
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] text-stone-500 font-medium truncate max-w-[140px]">
            {variantLabel}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono font-black text-lg text-brand-800 leading-none">
              {formatBanglaBDT(currentPrice)}
            </span>
            {hasDiscount && (
              <span className="font-mono text-xs text-stone-400 line-through">
                {formatBanglaBDT(regularPrice)}
              </span>
            )}
          </div>
          {hasDiscount && (
            <span className="text-[10px] text-amber-800 font-bold leading-none mt-0.5">
              ৳{toBanglaDigits(Math.round(savings).toLocaleString("en-IN"))} সাশ্রয়!
            </span>
          )}
        </div>

        {/* Right Side: Quick Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Add to Cart Button */}
          <button
            type="button"
            onClick={onAddToCart}
            disabled={isOutOfStock}
            className={`p-2.5 rounded-xl border border-brand-700 bg-brand-50 hover:bg-brand-100 text-brand-800 transition-all active:scale-95 cursor-pointer flex items-center justify-center ${
              isOutOfStock ? "opacity-40 cursor-not-allowed" : ""
            }`}
            aria-label="কার্টে যোগ করুন"
            title="কার্টে যোগ করুন"
          >
            <ShoppingBag className="w-5 h-5" />
          </button>

          {/* 1-Click Express Checkout CTA Button */}
          <button
            type="button"
            onClick={onOrderNow}
            disabled={isOutOfStock}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer ${
              isOutOfStock
                ? "bg-stone-300 text-stone-500 cursor-not-allowed"
                : "bg-gradient-to-r from-brand-700 via-brand-800 to-brand-900 hover:from-brand-800 hover:to-brand-950 text-white ring-1 ring-brand-700/20"
            }`}
          >
            <Zap className="w-4 h-4 fill-amber-300 text-amber-300 shrink-0" />
            <span>এখনই অর্ডার করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
}

