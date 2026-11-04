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
import { cn, formatVariantWeightLabel } from "@/lib/utils";

export { formatVariantWeightLabel };

/**
 * Formats variant weights into sleek, modern English units (e.g. 250g, 500g, 1kg, 1L, 5L)
 */
export function formatEnglishWeightLabel(variant?: Partial<ProductVariant>): string {
  if (!variant) return "";
  const { weightValue, weightUnit, displayName } = variant;

  if (weightValue && weightUnit) {
    const unit = weightUnit.toLowerCase().trim();
    if (unit === "g" || unit === "gram" || unit === "grams") {
      if (weightValue >= 1000 && weightValue % 1000 === 0) {
        return `${weightValue / 1000}kg`;
      }
      return `${weightValue}g`;
    }
    if (unit === "kg") {
      return `${weightValue}kg`;
    }
    if (unit === "ml") {
      if (weightValue >= 1000 && weightValue % 1000 === 0) {
        return `${weightValue / 1000}L`;
      }
      return `${weightValue}ml`;
    }
    if (unit === "l" || unit === "liter" || unit === "litre") {
      return `${weightValue}L`;
    }
    return `${weightValue}${unit}`;
  }

  // Fallback parsing from displayName if weightValue/unit not explicitly separated
  if (displayName) {
    const bnToEnMap: Record<string, string> = {
      "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
      "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
    };
    const normalized = displayName.replace(/[০-৯]/g, (d) => bnToEnMap[d] || d);
    const kgMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:কেজি|kg)/i);
    if (kgMatch) return `${kgMatch[1]}kg`;
    const gmMatch = normalized.match(/(\d+)\s*(?:গ্রাম|gm|g)/i);
    if (gmMatch) return `${gmMatch[1]}g`;
    const literMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:লিটার|l|liter)/i);
    if (literMatch) return `${literMatch[1]}L`;
    const mlMatch = normalized.match(/(\d+)\s*(?:মিলি|ml)/i);
    if (mlMatch) return `${mlMatch[1]}ml`;
    return displayName;
  }

  return "";
}

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

  // Price calculations in English currency format
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

  const selectedSizeLabel = formatEnglishWeightLabel(selectedVariant);

  const whatsappMsg = [
    "আসসালামু আলাইকুম, আমি সুন্নাহ সোর্স থেকে এই পণ্যটি অর্ডার করতে চাই:",
    "",
    `📦 পণ্য: ${product.titleBn}`,
    selectedSizeLabel ? `⚖️ সাইজ: ${selectedSizeLabel}` : null,
    `🔢 পরিমাণ: ${quantity}টি`,
    `💰 মোট মূল্য: ৳${totalPrice.toLocaleString("en-IN")}`,
    `🔗 লিংক: ${productUrl}`,
    "",
    "আমার নাম ও ডেলিভারি ঠিকানা:",
  ]
    .filter(Boolean)
    .join("\n");

  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMsg)}`;

  return (
    <div className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-8 shadow-sm space-y-6 sm:space-y-7">
      {/* 1. Header: Stock Status Badge & Subtle Controls */}
      <div className="flex items-center justify-between gap-3">
        {/* Stock Status Badge */}
        <div>
          {isOutOfStock ? (
            <span className="bg-rose-50 text-rose-700 border border-rose-200/80 text-xs font-semibold px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              <span>Out of Stock</span>
            </span>
          ) : isLowStock ? (
            <span className="bg-amber-50 text-amber-800 border border-amber-200/80 text-xs font-semibold px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span>Only {selectedVariant.stockQuantity} left</span>
            </span>
          ) : (
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/70 text-xs font-semibold px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>In Stock</span>
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
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart
                className={cn(
                  "w-3.5 h-3.5 transition-all duration-200",
                  isWishlisted ? "fill-rose-500 text-rose-500 scale-110" : "text-stone-400"
                )}
              />
              <span className="hidden sm:inline">
                {isWishlisted ? "Wishlisted" : "Wishlist"}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 transition-colors px-3 py-1.5 rounded-full border border-stone-200 bg-stone-50 hover:bg-stone-100 cursor-pointer"
            title="Share product link"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-stone-500" />
                <span className="hidden sm:inline">Share</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Product Title: Prominent Bengali with Clean Review Rating */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight leading-snug font-bengali">
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
                ({product.reviewCount} {product.reviewCount === 1 ? "review" : "reviews"})
              </span>
            </a>
          </div>
        )}
      </div>

      {/* 3. Price Display: English Currency Format (৳1,890) with Crossed-Out (৳2,090) & Clean Savings Pill */}
      <div className="flex flex-wrap items-baseline gap-3 pt-1">
        <span className="font-mono font-bold text-3xl sm:text-4xl text-stone-900 tracking-tight">
          ৳{currentPrice.toLocaleString("en-IN")}
        </span>

        {hasDiscount && (
          <span className="font-mono text-base sm:text-lg text-stone-400 line-through">
            ৳{regularPrice.toLocaleString("en-IN")}
          </span>
        )}

        {hasDiscount && (
          <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>Save ৳{Math.round(savings).toLocaleString("en-IN")}</span>
          </span>
        )}
      </div>

      {/* 4. Variant/Weight Selector: Sleek English Units (250g, 500g, 1kg, 1L, 5L) */}
      {product.variants && product.variants.length > 0 && (
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <label className="font-semibold text-stone-800">
              Select Size / Weight:
            </label>
            <span className="text-brand-900 font-medium">
              Selected: {formatEnglishWeightLabel(selectedVariant)}
            </span>
          </div>

          <div
            className="flex flex-wrap gap-2.5"
            role="radiogroup"
            aria-label="Select size or weight variant"
          >
            {product.variants.map((variant) => {
              const isSelected = selectedVariant?.id === variant.id;
              const pillLabel = formatEnglishWeightLabel(variant);
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
                  <span className="font-medium">{pillLabel}</span>
                  <span
                    className={cn(
                      "font-mono text-xs",
                      isSelected ? "text-brand-800 font-bold" : "text-stone-500"
                    )}
                  >
                    ৳{vPrice.toLocaleString("en-IN")}
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

      {/* 5. Quantity Selector: Clean Label "Quantity: [- 1 +]" */}
      <div className="space-y-2 pt-1">
        <label className="block text-xs sm:text-sm font-semibold text-stone-800">Quantity:</label>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center border border-stone-300 rounded-xl bg-stone-50/70 overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={handleDecreaseQty}
              disabled={quantity <= 1 || isOutOfStock}
              className="w-9 h-9 flex items-center justify-center hover:bg-white text-stone-700 transition-colors disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-10 text-center font-mono text-sm font-bold text-stone-900 select-none">
              {quantity}
            </span>
            <button
              type="button"
              onClick={handleIncreaseQty}
              disabled={Boolean(
                isOutOfStock || (selectedVariant && quantity >= selectedVariant.stockQuantity)
              )}
              className="w-9 h-9 flex items-center justify-center hover:bg-white text-stone-700 transition-colors disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {selectedVariant && selectedVariant.stockQuantity > 0 && selectedVariant.stockQuantity <= selectedVariant.lowStockThreshold && (
            <span className="text-xs text-amber-700 font-medium">
              (Only {selectedVariant.stockQuantity} remaining)
            </span>
          )}
        </div>
      </div>

      {/* 6. Sleek English Action Buttons */}
      <div className="pt-2 space-y-3">
        {/* Primary Buttons Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* [ ⚡ BUY NOW ]: Rich Sunnah emerald gradient, opens 1-Click Express Cash on Delivery modal directly */}
          <button
            type="button"
            onClick={onOrderNow}
            disabled={isOutOfStock}
            aria-label="BUY NOW (এখনই অর্ডার করুন)"
            className={cn(
              "bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 text-white font-bold rounded-xl h-12 shadow-sm flex-1 tracking-wide flex items-center justify-center gap-2 hover:shadow-brand-900/20 active:scale-[0.98] transition-all cursor-pointer",
              isOutOfStock && "opacity-40 cursor-not-allowed hover:shadow-none"
            )}
          >
            <Zap className="w-4 h-4 fill-amber-300 text-amber-300 shrink-0" />
            <span>BUY NOW</span>
          </button>

          {/* [ 🛒 ADD TO CART ]: Brand outline */}
          <button
            type="button"
            onClick={onAddToCart}
            disabled={isOutOfStock}
            aria-label="ADD TO CART (কার্টে যোগ করুন)"
            className={cn(
              "border-2 border-brand-800/80 bg-brand-50/20 text-brand-900 font-semibold rounded-xl h-12 flex-1 tracking-wide flex items-center justify-center gap-2 hover:bg-brand-50 transition-all cursor-pointer",
              isOutOfStock && "opacity-40 cursor-not-allowed hover:bg-transparent"
            )}
          >
            <ShoppingBag className="w-4 h-4 text-brand-800 shrink-0" />
            <span>ADD TO CART</span>
          </button>
        </div>

        {/* Quick Contact Strip (Sleek Twin Pills) */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* [ 💬 Order on WhatsApp ] */}
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
            <span>Order on WhatsApp</span>
          </a>

          {/* [ 📞 Call for Order ] */}
          <a
            href="tel:+8801914612007"
            className="bg-stone-100 text-stone-800 border border-stone-200 hover:bg-stone-200 rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5 text-stone-700 shrink-0" />
            <span>Call for Order</span>
          </a>
        </div>
      </div>

      {/* 7. Minimalist Trust Strip */}
      <div className="pt-3 border-t border-stone-200/80">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1.5 text-xs text-stone-500 font-medium">
          <span className="flex items-center gap-1">🌿 100% Pure & Natural</span>
          <span className="text-emerald-700 font-bold select-none">•</span>
          <span className="flex items-center gap-1">🛡️ Cash on Delivery</span>
          <span className="text-emerald-700 font-bold select-none">•</span>
          <span className="flex items-center gap-1">⚡ Fast Delivery</span>
        </div>
      </div>
    </div>
  );
}
