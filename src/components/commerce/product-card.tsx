"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ShoppingBag, Heart, Star } from "lucide-react";
import { Product, ProductVariant, CartItem } from "@/types/commerce.types";
import { useCartStore } from "@/store/use-cart-store";
import { useWishlistStore } from "@/store/use-wishlist-store";
import { formatBDT, cn } from "@/lib/utils";

export interface ProductCardProps {
  product: Product;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, className }) => {
  const [mounted, setMounted] = useState(false);

  // Safely resolve default variant with fallback if variants array is empty or undefined
  const defaultVariant: ProductVariant | undefined =
    product.variants?.find((v) => v.isDefault) || product.variants?.[0];

  // Explicitly allow ProductVariant | undefined in state to satisfy strictNullChecks
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    defaultVariant
  );

  // Store accessors
  const addItem = useCartStore((state) => state.addItem);
  const openDrawer = useCartStore((state) => state.openDrawer);

  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);
  const isInWishlist = useWishlistStore((state) => state.isInWishlist);

  // Avoid hydration mismatch from client-side persisted localStorage
  useEffect(() => {
    setMounted(true);
  }, []);

  const activeVariant = selectedVariant ?? defaultVariant;
  const isOutOfStock = !activeVariant || activeVariant.stockQuantity <= 0;

  // Price and discount resolution with safe fallbacks
  const regularPrice = activeVariant?.regularPrice ?? 0;
  const salePrice = activeVariant?.salePrice;
  const hasDiscount = Boolean(salePrice !== undefined && salePrice < regularPrice);
  const currentPrice = hasDiscount && salePrice !== undefined ? salePrice : regularPrice;
  const discountPercent =
    hasDiscount && regularPrice > 0 && salePrice !== undefined
      ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
      : 0;

  // Wishlist check guarded for SSR hydration
  const isWishlisted =
    mounted && typeof isInWishlist === "function" ? isInWishlist(product.id) : false;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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
      quantity: 1,
      maxStock: activeVariant.stockQuantity,
    };

    if (typeof addItem === "function") {
      addItem(cartItem);
    }
    if (typeof openDrawer === "function") {
      openDrawer();
    }
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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

  return (
    <article
      aria-label={product.titleBn}
      className={cn(
        "bg-white rounded-2xl border border-surface-border overflow-hidden hover:shadow-card transition-all flex flex-col justify-between group font-bengali",
        className
      )}
    >
      {/* Product Image & Badges */}
      <div className="relative aspect-square w-full bg-surface-canvas overflow-hidden select-none">
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.titleBn || product.titleEn}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-charcoal-400 text-xs">
            ছবি নেই
          </div>
        )}

        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none">
          {product.badge && (
            <span className="bg-brand-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
              {product.badge}
            </span>
          )}
          {hasDiscount && (
            <span className="bg-accent-amber text-charcoal-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">
              {discountPercent}% ছাড়
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleToggleWishlist}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-charcoal-700 hover:text-red-500 flex items-center justify-center shadow-xs transition-colors z-10"
          aria-label={isWishlisted ? "পছন্দের তালিকা থেকে সরান" : "পছন্দের তালিকায় রাখুন"}
          title={isWishlisted ? "পছন্দের তালিকা থেকে সরান" : "পছন্দের তালিকায় রাখুন"}
        >
          <Heart
            className={cn(
              "w-4 h-4 transition-colors",
              isWishlisted ? "fill-red-500 text-red-500" : "text-charcoal-700"
            )}
          />
        </button>
      </div>

      {/* Product Meta & Variant Selection */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          {product.reviewCount > 0 && (
            <div className="flex items-center gap-1 text-accent-amber text-xs">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="font-mono font-bold text-charcoal-900">
                {product.ratingAverage.toFixed(1)}
              </span>
              <span className="text-[10px] text-charcoal-500 font-mono">
                ({product.reviewCount})
              </span>
            </div>
          )}

          <h3 className="font-bold text-charcoal-900 text-sm line-clamp-2 leading-snug">
            {product.titleBn}
          </h3>

          {activeVariant?.displayName && (
            <p className="text-[11px] text-charcoal-500 font-medium">
              {activeVariant.displayName}
            </p>
          )}

          {product.variants && product.variants.length > 1 && (
            <div
              className="flex flex-wrap gap-1.5 pt-1"
              role="radiogroup"
              aria-label="ওজন বা ভ্যারিয়েন্ট নির্বাচন করুন"
            >
              {product.variants.map((variant) => {
                const isSelected = activeVariant?.id === variant.id;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedVariant(variant);
                    }}
                    className={cn(
                      "px-2 py-0.5 text-[10px] font-semibold rounded-lg border transition-all",
                      isSelected
                        ? "bg-brand-700 text-white border-brand-700 shadow-xs"
                        : "bg-surface-canvas text-charcoal-700 border-surface-border hover:border-brand-300"
                    )}
                  >
                    {variant.weightValue} {variant.weightUnit}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Pricing & Cart Action */}
        <div className="pt-2 border-t border-surface-border/60 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono font-bold text-brand-700 text-base">
                {formatBDT(currentPrice)}
              </span>
              {hasDiscount && (
                <span className="font-mono text-[11px] text-stone-400 line-through">
                  {formatBDT(regularPrice)}
                </span>
              )}
            </div>
            {isOutOfStock && (
              <span className="text-[10px] font-bold text-red-600 block mt-0.5">
                স্টক শেষ
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={cn(
              "p-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5",
              isOutOfStock
                ? "bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed"
                : "bg-brand-50 hover:bg-brand-700 text-brand-700 hover:text-white border border-brand-200 active:scale-95"
            )}
            aria-label={
              isOutOfStock
                ? "পণ্যটি বর্তমানে স্টকে নেই"
                : `${product.titleBn} কার্টে যোগ করুন`
            }
            title={isOutOfStock ? "স্টক শেষ" : "কার্টে যোগ করুন"}
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
};
