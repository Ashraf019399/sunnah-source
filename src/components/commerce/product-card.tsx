"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Heart, ShoppingCart, Zap } from "lucide-react";
import { Product, ProductVariant, CartItem } from "@/types/commerce.types";
import { useCartStore } from "@/store/use-cart-store";
import { useWishlistStore } from "@/store/use-wishlist-store";
import { fbAddToCart } from "@/lib/services/facebook-pixel";
import { formatBDT, cn } from "@/lib/utils";

export interface ProductCardProps {
  product: Product;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, className }) => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Safely resolve default variant with fallback if variants array is empty or undefined
  const defaultVariant: ProductVariant | undefined =
    product.variants?.find((v) => v.isDefault) || product.variants?.[0];

  // Explicitly allow ProductVariant | undefined in state to satisfy strictNullChecks
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    defaultVariant
  );

  // Avoid hydration mismatch from client-side persisted localStorage
  useEffect(() => {
    setMounted(true);
  }, []);

  const isWishlisted = useWishlistStore((state) =>
    state.items.some(
      (item) => String(item.id) === String(product.id) || item.slug === product.slug
    )
  );
  const active = mounted && isWishlisted;

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

  const buildCartItem = (): CartItem | null => {
    if (isOutOfStock || !activeVariant) return null;
    return {
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
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const cartItem = buildCartItem();
    if (!cartItem) return;

    useCartStore.getState().addItem(cartItem);
    useCartStore.getState().openDrawer();
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const cartItem = buildCartItem();
    if (!cartItem) return;

    useCartStore.getState().addItem(cartItem);
    fbAddToCart({
      id: product.id,
      name: product.titleBn || product.titleEn,
      price: currentPrice,
      quantity: 1,
    });
    router.push("/checkout");
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
      <div className="relative aspect-square w-full bg-white overflow-hidden select-none">
        <Link
          href={`/product/${product.slug}`}
          prefetch={true}
          className="block w-full h-full cursor-pointer"
          aria-label={`${product.titleBn} এর বিস্তারিত দেখুন`}
        >
          {product.images?.[0] ? (
            <Image
              src={product.images[0]}
              alt={product.titleBn || product.titleEn}
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

        {/* Discount Badge on Top-Left */}
        {hasDiscount && (
          <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none select-none">
            <span className="bg-accent-amber text-charcoal-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">
              {discountPercent}% ছাড়
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            useWishlistStore.getState().toggleWishlist(product);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 z-20 ${
            active
              ? 'bg-rose-50 text-rose-500 border border-rose-200 shadow-xs'
              : 'bg-white/90 hover:bg-white text-stone-400 hover:text-rose-500 shadow-xs'
          }`}
          aria-label={active ? "পছন্দের তালিকা থেকে সরান" : "পছন্দের তালিকায় যুক্ত করুন"}
        >
          <Heart
            className={`w-4 h-4 transition-all duration-200 ${
              active ? 'fill-rose-500 text-rose-500 scale-110' : 'text-stone-400'
            }`}
          />
        </button>
      </div>

      {/* Product Meta & Variant Selection */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <h3 className="font-bold text-charcoal-900 text-sm line-clamp-2 leading-snug mt-2 sm:mt-2.5">
            <Link
              href={`/product/${product.slug}`}
              prefetch={true}
              className="hover:text-brand-700 transition-colors"
            >
              {product.titleBn}
            </Link>
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

        {/* Pricing & Stock Status */}
        <div className="pt-2.5 border-t border-surface-border/60 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono font-bold text-brand-700 text-base sm:text-lg">
              {formatBDT(currentPrice)}
            </span>
            {hasDiscount && (
              <span className="font-mono text-[11px] text-stone-400 line-through">
                {formatBDT(regularPrice)}
              </span>
            )}
          </div>
          {isOutOfStock ? (
            <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200/80 px-2 py-0.5 rounded-full">
              স্টক শেষ
            </span>
          ) : (
            <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
              স্টকে আছে
            </span>
          )}
        </div>

        {/* Dual Action Buttons (Ghorer Bazar Style) */}
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mt-3 font-bengali">
          {/* Button 1: Add to Cart */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={cn(
              "flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1.5 sm:px-2.5 rounded-xl text-[11px] sm:text-xs font-semibold font-sans transition-all duration-200",
              isOutOfStock
                ? "bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed"
                : "bg-white text-emerald-800 border border-emerald-700/80 hover:bg-emerald-800 hover:text-white hover:border-emerald-800 shadow-sm active:scale-95 cursor-pointer"
            )}
            aria-label={isOutOfStock ? "পণ্যটি স্টকে নেই" : `${product.titleBn} Add to Cart`}
            title={isOutOfStock ? "স্টক শেষ" : "Add to Cart"}
          >
            <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Add to Cart</span>
          </button>

          {/* Button 2: Buy Now */}
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className={cn(
              "flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1.5 sm:px-2.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-200 shadow-xs hover:shadow-sm",
              isOutOfStock
                ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                : "bg-emerald-900 text-white hover:bg-emerald-950 active:scale-95 cursor-pointer"
            )}
            aria-label={isOutOfStock ? "পণ্যটি স্টকে নেই" : `${product.titleBn} এখনই কিনুন`}
            title={isOutOfStock ? "স্টক শেষ" : "এখনই কিনুন"}
          >
            <Zap className="w-3.5 h-3.5 shrink-0 fill-current" />
            <span className="truncate">এখনই কিনুন</span>
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
