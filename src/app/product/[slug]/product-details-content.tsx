"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Heart,
  ArrowRight,
  Info,
} from "lucide-react";
import { Product, ProductVariant, CartItem } from "@/types/commerce.types";
import { Category } from "@/lib/data/categories";
import { useCartStore } from "@/store/use-cart-store";
import { useWishlistStore } from "@/store/use-wishlist-store";
import { ProductCard } from "@/components/commerce/product-card";
import { ProductReviews } from "@/components/commerce/product-reviews";
import { FrequentlyBoughtTogether } from "@/components/product/frequently-bought-together";
import { fbViewContent, fbAddToCart } from "@/lib/services/facebook-pixel";
import { ProductInfo } from "@/components/product/product-info";
import { StickyMobileProductBar } from "@/components/product/sticky-mobile-product-bar";
import { ExpressCheckoutModal } from "@/components/product/express-checkout-modal";

export interface ProductDetailsContentProps {
  product: Product;
  category?: Category;
  relatedProducts?: Product[];
  frequentlyBoughtTogether?: React.ReactNode;
}

export function ProductDetailsContent({
  product,
  category,
  relatedProducts = [],
  frequentlyBoughtTogether,
}: ProductDetailsContentProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Safely resolve default variant
  const defaultVariant: ProductVariant =
    product.variants?.find((v) => v.isDefault) ||
    product.variants?.[0] || {
      id: "default",
      sku: product.id,
      displayName: product.titleBn,
      weightValue: 0,
      weightUnit: "",
      regularPrice: 0,
      stockQuantity: 0,
      lowStockThreshold: 0,
    };

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(defaultVariant);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isExpressModalOpen, setIsExpressModalOpen] = useState(false);

  // Store accessors
  const addItem = useCartStore((state) => state.addItem);
  const openDrawer = useCartStore((state) => state.openDrawer);

  const activeVariant = selectedVariant ?? defaultVariant;
  const isOutOfStock = !activeVariant || activeVariant.stockQuantity <= 0;

  // Price calculations
  const regularPrice = activeVariant?.regularPrice ?? 0;
  const salePrice = activeVariant?.salePrice;
  const hasDiscount = Boolean(salePrice !== undefined && salePrice > 0 && salePrice < regularPrice);
  const currentPrice = hasDiscount && salePrice !== undefined ? salePrice : regularPrice;
  const discountPercent =
    hasDiscount && regularPrice > 0 && salePrice !== undefined
      ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
      : 0;

  useEffect(() => {
    setMounted(true);
    fbViewContent({
      id: product.id,
      name: product.titleBn || product.titleEn,
      category: category?.nameBn || category?.nameEn,
      price: currentPrice,
    });
  }, [product.id, product.titleBn, product.titleEn, category?.nameBn, category?.nameEn, currentPrice]);

  const isWishlisted = useWishlistStore((state) =>
    state.items.some(
      (item) => String(item.id) === String(product.id) || item.slug === product.slug
    )
  );
  const active = mounted && isWishlisted;

  // Handle variant selection
  const handleVariantChange = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    // Reset quantity if current quantity exceeds new variant's stock
    if (quantity > variant.stockQuantity && variant.stockQuantity > 0) {
      setQuantity(1);
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
    fbAddToCart({
      id: product.id,
      name: product.titleBn || product.titleEn,
      price: currentPrice,
      quantity,
    });
    if (typeof openDrawer === "function") {
      openDrawer();
    }
  };

  // Wishlist Action
  const handleToggleWishlist = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    useWishlistStore.getState().toggleWishlist(product);
  };

  const images = product.images && product.images.length > 0 ? product.images : [];
  const currentImage = images[selectedImageIndex] || images[0] || "";

  return (
    <div className="space-y-10 font-bengali pb-14 lg:pb-0">
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

      {/* 2. Main Product Showcase */}
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
                  quality={95}
                  className="object-contain transition-all duration-300"
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
                className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-card transition-all z-10 active:scale-95 cursor-pointer ${
                  active
                    ? "bg-rose-50 text-rose-500 border border-rose-200"
                    : "bg-white/95 hover:bg-white text-stone-400 hover:text-stone-700"
                }`}
                aria-label={active ? "পছন্দের তালিকা থেকে সরান" : "পছন্দের তালিকায় রাখুন"}
                title={active ? "পছন্দের তালিকা থেকে সরান" : "পছন্দের তালিকায় রাখুন"}
              >
                <Heart
                  className={`w-5 h-5 transition-all duration-200 ${
                    active ? "fill-rose-500 text-rose-500 scale-110" : "text-stone-400 hover:text-stone-700"
                  }`}
                />
              </button>
            </div>

            {/* Thumbnail Strip */}
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
                      quality={90}
                      className="object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Upgraded Product Info & Variant Selectors (7 cols on lg) */}
          <div className="lg:col-span-7">
            <ProductInfo
              product={product}
              category={category}
              selectedVariant={activeVariant}
              onVariantChange={handleVariantChange}
              quantity={quantity}
              onQuantityChange={setQuantity}
              onAddToCart={handleAddToCart}
              onOrderNow={() => setIsExpressModalOpen(true)}
              isOutOfStock={isOutOfStock}
              isWishlisted={active}
              onToggleWishlist={handleToggleWishlist}
            />
          </div>
        </div>
      </section>

      {/* 2.5 Frequently Bought Together Cross-Sell Bundle */}
      <section className="container mx-auto max-w-7xl px-4">
        {frequentlyBoughtTogether ?? <FrequentlyBoughtTogether mainProduct={product} />}
      </section>

      {/* 3. Detailed Product Information */}
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

      {/* 4. Customer Reviews, Ratings & Social Proof Section */}
      <ProductReviews product={product} />

      {/* 5. Related Products Section */}
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

      {/* 6. Mobile Sticky Action Bar Sync */}
      <StickyMobileProductBar
        product={product}
        selectedVariant={activeVariant}
        onAddToCart={handleAddToCart}
        onOrderNow={() => setIsExpressModalOpen(true)}
        isOutOfStock={isOutOfStock}
      />

      {/* 7. 1-Click Express Cash on Delivery Checkout Modal */}
      <ExpressCheckoutModal
        isOpen={isExpressModalOpen}
        onClose={() => setIsExpressModalOpen(false)}
        product={product}
        selectedVariant={activeVariant}
        initialQuantity={quantity}
      />
    </div>
  );
}
