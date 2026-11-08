"use client";

import React from "react";
import {
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
import { cn, formatVariantWeightLabel, formatEnglishWeightLabel } from "@/lib/utils";

export { formatVariantWeightLabel, formatEnglishWeightLabel };

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
}: ProductInfoProps) {
  // Price calculations in English currency format
  const regularPrice = selectedVariant?.regularPrice ?? 0;
  const salePrice = selectedVariant?.salePrice;
  const hasDiscount = Boolean(
    salePrice !== undefined && salePrice > 0 && salePrice < regularPrice
  );
  const currentPrice = hasDiscount && salePrice !== undefined ? salePrice : regularPrice;
  const savings = hasDiscount ? regularPrice - currentPrice : 0;

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

  // English & Bengali Titles
  const englishTitle =
    product.titleEn || (product as any).name || (product as any).title || product.titleBn;
  const bengaliSubtitle =
    product.titleBn && product.titleBn !== englishTitle ? product.titleBn : null;

  // WhatsApp order message URL
  const cleanPhone = "8801914612007";
  const totalPrice = currentPrice * quantity;
  const productUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://sunnahsourcebd.com/product/${product.slug}`;

  const selectedSizeLabel = formatEnglishWeightLabel(selectedVariant);

  const whatsappMsg = [
    "Assalamu Alaikum, I would like to order from Sunnah Source:",
    "",
    `📦 Product: ${englishTitle}${bengaliSubtitle ? ` (${bengaliSubtitle})` : ""}`,
    selectedSizeLabel ? `⚖️ Size: ${selectedSizeLabel}` : null,
    `🔢 Quantity: ${quantity}`,
    `💰 Total Price: ৳${totalPrice.toLocaleString("en-IN")}`,
    `🔗 Link: ${productUrl}`,
    "",
    "My Name & Delivery Address:",
  ]
    .filter(Boolean)
    .join("\n");

  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMsg)}`;

  return (
    <div className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-8 shadow-sm space-y-6 sm:space-y-7 font-sans">
      {/* Element 1: Title & Rating */}
      <div className="space-y-2">
        <div>
          <h1 className="font-bold text-2xl sm:text-3xl text-stone-900 tracking-tight leading-snug font-sans">
            {englishTitle}
          </h1>
          {bengaliSubtitle && (
            <span className="block text-sm sm:text-base font-medium text-stone-500 font-hind tracking-normal mt-1">
              ({bengaliSubtitle})
            </span>
          )}
        </div>
        {product.reviewCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-stone-600">
            <span className="text-amber-500 text-sm leading-none">★</span>
            <span className="font-semibold text-stone-800">
              {product.ratingAverage.toFixed(1)}
            </span>
            <span className="text-stone-400">({product.reviewCount})</span>
          </div>
        )}
      </div>

      {/* Element 2: Price & Savings */}
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="font-mono font-extrabold text-3xl sm:text-4xl text-stone-900 tracking-tight">
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

      {/* Element 3: Clean Size Selector & Quantity */}
      <div className="space-y-5">
        {/* Weight / Size Selector Pills */}
        {product.variants && product.variants.length > 0 && (
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-semibold text-stone-800">
              Select Size:
            </label>

            <div
              className="flex flex-wrap gap-2.5"
              role="radiogroup"
              aria-label="Select size variant"
            >
              {product.variants.map((variant) => {
                const isSelected = selectedVariant?.id === variant.id;
                const pillLabel = formatEnglishWeightLabel(variant);

                return (
                  <button
                    key={variant.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => onVariantChange(variant)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs sm:text-sm font-medium cursor-pointer transition-all",
                      isSelected
                        ? "border-2 border-brand-800 bg-brand-50/70 text-brand-900 font-bold shadow-xs scale-[1.02]"
                        : "border border-stone-200 bg-white text-stone-700 hover:border-brand-300 hover:bg-stone-50"
                    )}
                  >
                    {pillLabel}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quantity Selector: Compact [- 1 +] */}
        <div className="space-y-2">
          <label className="block text-xs sm:text-sm font-semibold text-stone-800">
            Quantity:
          </label>
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
        </div>
      </div>

      {/* Element 4: Action Buttons */}
      <div className="pt-2 space-y-3">
        {/* Primary Row: BUY NOW & ADD TO CART */}
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

        {/* Quick Assistance Row: Twin Contact Pills */}
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
    </div>
  );
}
