"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Plus, Check, CheckCircle2, Sparkles, Truck } from "lucide-react";
import { Product, ProductVariant, CartItem } from "@/types/commerce.types";
import { ALL_PRODUCTS } from "@/lib/data/products";
import { useCartStore } from "@/store/use-cart-store";
import { formatBDT, toBanglaDigits } from "@/lib/utils";
import { fbAddToCart } from "@/lib/services/facebook-pixel";

interface FrequentlyBoughtTogetherProps {
  mainProduct: Product;
}

/**
 * Complementary pairing logic based on product category & characteristics
 */
export function getComplementaryProduct(mainProduct: Product): Product | null {
  const isHoney =
    mainProduct.categorySlug === "honey" ||
    mainProduct.slug.includes("honey");

  const isGheeOrOil =
    mainProduct.categorySlug === "ghee-oil" ||
    mainProduct.slug.includes("ghee") ||
    mainProduct.slug.includes("mustard") ||
    mainProduct.slug.includes("oil");

  let targetSlug = "sundarban-raw-wild-honey";

  if (isHoney) {
    // If Raw Honey / Kholisa Honey: pair with Black Seed Oil or Traditional Bilona Cow Ghee
    if (mainProduct.slug === "khalisha-flower-raw-honey") {
      targetSlug = "traditional-bilona-cow-ghee";
    } else {
      targetSlug = "extra-virgin-black-seed-oil";
    }
  } else if (isGheeOrOil) {
    // If Ghee / Mustard Oil: pair with Sundarban Raw Wild Honey
    targetSlug = "sundarban-raw-wild-honey";
  } else {
    // Dates, Seeds, Combos, or others: pair with best-selling Raw Honey
    targetSlug = "sundarban-raw-wild-honey";
  }

  // Find candidate product that is active and distinct from mainProduct
  let found: Product | null =
    ALL_PRODUCTS.find(
      (p) => p.slug === targetSlug && p.id !== mainProduct.id && p.isActive !== false
    ) || null;

  // Fallback to alternatives if identical or not found
  if (!found) {
    if (isHoney) {
      found =
        ALL_PRODUCTS.find(
          (p) =>
            (p.slug === "traditional-bilona-cow-ghee" ||
              p.slug === "extra-virgin-black-seed-oil") &&
            p.id !== mainProduct.id &&
            p.isActive !== false
        ) || null;
    } else {
      found =
        ALL_PRODUCTS.find(
          (p) =>
            p.slug === "sundarban-raw-wild-honey" &&
            p.id !== mainProduct.id &&
            p.isActive !== false
        ) ||
        ALL_PRODUCTS.find(
          (p) =>
            p.slug === "extra-virgin-black-seed-oil" &&
            p.id !== mainProduct.id &&
            p.isActive !== false
        ) ||
        null;
    }
  }

  if (!found) {
    found = ALL_PRODUCTS.find((p) => p.id !== mainProduct.id && p.isActive !== false) || null;
  }

  return found;
}

export function FrequentlyBoughtTogether({ mainProduct }: FrequentlyBoughtTogetherProps) {
  const addItem = useCartStore((state) => state.addItem);
  const openDrawer = useCartStore((state) => state.openDrawer);

  const bundleProduct = useMemo(() => getComplementaryProduct(mainProduct), [mainProduct]);

  // Main Product Variants & Selection
  const defaultMainVariant = useMemo(
    () => mainProduct.variants.find((v) => v.isDefault) || mainProduct.variants[0],
    [mainProduct]
  );
  const [selectedMainVariantId, setSelectedMainVariantId] = useState<string>(
    defaultMainVariant?.id || ""
  );

  // Bundle Product Variants & Selection
  const defaultBundleVariant = useMemo(
    () =>
      bundleProduct
        ? bundleProduct.variants.find((v) => v.isDefault) || bundleProduct.variants[0]
        : undefined,
    [bundleProduct]
  );
  const [selectedBundleVariantId, setSelectedBundleVariantId] = useState<string>(
    defaultBundleVariant?.id || ""
  );

  // Checkbox State (Both checked by default)
  const [mainChecked, setMainChecked] = useState<boolean>(true);
  const [bundleChecked, setBundleChecked] = useState<boolean>(true);

  // Feedback State
  const [isAdded, setIsAdded] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Variant resolution
  const activeMainVariant =
    mainProduct.variants.find((v) => v.id === selectedMainVariantId) || defaultMainVariant;

  const activeBundleVariant = bundleProduct
    ? bundleProduct.variants.find((v) => v.id === selectedBundleVariantId) || defaultBundleVariant
    : undefined;

  // Price Calculation Helpers
  const mainPrice = activeMainVariant
    ? typeof activeMainVariant.salePrice === "number" && activeMainVariant.salePrice > 0
      ? activeMainVariant.salePrice
      : activeMainVariant.regularPrice
    : 0;
  const mainRegularPrice = activeMainVariant ? activeMainVariant.regularPrice : 0;
  const mainHasDiscount = Boolean(
    activeMainVariant?.salePrice && activeMainVariant.salePrice < mainRegularPrice
  );

  const bundlePrice = activeBundleVariant
    ? typeof activeBundleVariant.salePrice === "number" && activeBundleVariant.salePrice > 0
      ? activeBundleVariant.salePrice
      : activeBundleVariant.regularPrice
    : 0;
  const bundleRegularPrice = activeBundleVariant ? activeBundleVariant.regularPrice : 0;
  const bundleHasDiscount = Boolean(
    activeBundleVariant?.salePrice && activeBundleVariant.salePrice < bundleRegularPrice
  );

  // Totals based on checkboxes
  const combinedTotal =
    (mainChecked ? mainPrice : 0) + (bundleChecked ? bundlePrice : 0);
  const combinedRegularTotal =
    (mainChecked ? mainRegularPrice : 0) + (bundleChecked ? bundleRegularPrice : 0);
  const totalSavings = combinedRegularTotal - combinedTotal;
  const selectedCount = (mainChecked ? 1 : 0) + (bundleChecked ? 1 : 0);
  const isFreeShipping = combinedTotal >= 2000;

  // Add to Cart Action
  const handleAddToCart = () => {
    if (selectedCount === 0) return;

    const itemsToAdd: CartItem[] = [];

    if (mainChecked && activeMainVariant) {
      itemsToAdd.push({
        id: activeMainVariant.id,
        productId: mainProduct.id,
        variantId: activeMainVariant.id,
        title: mainProduct.titleEn,
        titleBn: mainProduct.titleBn,
        variantName: activeMainVariant.displayName,
        unitPrice: mainPrice,
        originalPrice: mainHasDiscount ? mainRegularPrice : undefined,
        image: mainProduct.images?.[0] || "",
        weightLabel: `${activeMainVariant.weightValue} ${activeMainVariant.weightUnit}`,
        quantity: 1,
        maxStock: activeMainVariant.stockQuantity,
      });
    }

    if (bundleChecked && bundleProduct && activeBundleVariant) {
      itemsToAdd.push({
        id: activeBundleVariant.id,
        productId: bundleProduct.id,
        variantId: activeBundleVariant.id,
        title: bundleProduct.titleEn,
        titleBn: bundleProduct.titleBn,
        variantName: activeBundleVariant.displayName,
        unitPrice: bundlePrice,
        originalPrice: bundleHasDiscount ? bundleRegularPrice : undefined,
        image: bundleProduct.images?.[0] || "",
        weightLabel: `${activeBundleVariant.weightValue} ${activeBundleVariant.weightUnit}`,
        quantity: 1,
        maxStock: activeBundleVariant.stockQuantity,
      });
    }

    // Add items into cart store and track via Meta Pixel
    itemsToAdd.forEach((item) => {
      addItem(item);
      fbAddToCart({
        id: item.productId,
        name: item.titleBn || item.title,
        price: item.unitPrice,
        quantity: item.quantity,
      });
    });

    // Open Cart Drawer
    openDrawer();

    // Trigger feedback notification
    setIsAdded(true);
    const feedbackText =
      selectedCount === 2
        ? "উভয় পণ্য সফলভাবে কার্টে যোগ করা হয়েছে!"
        : "নির্বাচিত পণ্য কার্টে যোগ করা হয়েছে!";
    setToastMessage(feedbackText);

    setTimeout(() => {
      setIsAdded(false);
    }, 2500);

    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // If no complementary product found, omit section cleanly
  if (!bundleProduct) {
    return null;
  }

  return (
    <section
      aria-label="প্রায়শই একসাথে কেনা হয়"
      className="bg-white rounded-2xl p-6 border border-surface-border shadow-xs mt-12 font-bengali"
    >
      {/* 1. Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-surface-border/80">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-lg sm:text-xl font-black text-charcoal-900 tracking-tight">
              প্রায়শই একসাথে কেনা হয়
            </h3>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>স্পেশাল কম্বো অফার</span>
            </span>
          </div>
          <p className="text-xs text-charcoal-500">
            গ্রাহকেরা সর্বোচ্চ স্বাস্থ্য সুরক্ষায় এই দুটি খাঁটি পণ্য একসাথে পছন্দ করেন।
          </p>
        </div>
      </div>

      {/* 2. Visual Row & Pricing CTA Layout */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
        {/* Visual Product Pair Row (Cols 1-7 on LG) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
          {/* Main Product Card */}
          <div
            className={`relative flex-1 w-full bg-white rounded-xl p-3.5 sm:p-4 border transition-all duration-200 ${
              mainChecked
                ? "border-emerald-500/60 ring-1 ring-emerald-500/20 shadow-xs"
                : "border-surface-border opacity-60 bg-stone-50/50"
            }`}
          >
            <div className="flex items-start gap-3">
              <label className="relative flex items-center cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={mainChecked}
                  onChange={(e) => setMainChecked(e.target.checked)}
                  className="w-5 h-5 rounded-md text-emerald-600 focus:ring-emerald-500 border-stone-300 accent-emerald-600 cursor-pointer"
                  aria-label={`${mainProduct.titleBn} নির্বাচন করুন`}
                />
              </label>

              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-surface-border bg-white shrink-0">
                {mainProduct.images?.[0] ? (
                  <Image
                    src={mainProduct.images[0]}
                    alt={mainProduct.titleBn}
                    fill
                    sizes="(max-width: 640px) 64px, 80px"
                    quality={95}
                    className="object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-400">
                    ছবি নেই
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <span className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  বর্তমান পণ্য
                </span>
                <h4
                  className="text-xs sm:text-sm font-bold text-charcoal-900 line-clamp-1"
                  title={mainProduct.titleBn}
                >
                  {mainProduct.titleBn}
                </h4>

                {/* Variant Selector or Display */}
                {mainProduct.variants.length > 1 ? (
                  <select
                    value={selectedMainVariantId}
                    onChange={(e) => setSelectedMainVariantId(e.target.value)}
                    disabled={!mainChecked}
                    className="text-[11px] font-medium text-charcoal-700 bg-white border border-stone-200 rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-600 max-w-full cursor-pointer disabled:opacity-50"
                    aria-label="ভ্যারিয়েন্ট নির্বাচন করুন"
                  >
                    {mainProduct.variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.displayName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-[11px] text-charcoal-500 truncate">
                    {activeMainVariant?.displayName}
                  </p>
                )}

                {/* Price Display */}
                <div className="flex items-baseline gap-2 pt-0.5">
                  <span className="font-mono text-sm sm:text-base font-black text-brand-800">
                    {formatBDT(mainPrice)}
                  </span>
                  {mainHasDiscount && (
                    <span className="font-mono text-xs text-stone-400 line-through">
                      {formatBDT(mainRegularPrice)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Plus Icon (+) */}
          <div className="shrink-0 flex items-center justify-center my-1 sm:my-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-50 text-emerald-800 border-2 border-emerald-200/90 flex items-center justify-center shadow-xs">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
          </div>

          {/* Bundle Complementary Product Card */}
          <div
            className={`relative flex-1 w-full bg-white rounded-xl p-3.5 sm:p-4 border transition-all duration-200 ${
              bundleChecked
                ? "border-emerald-500/60 ring-1 ring-emerald-500/20 shadow-xs"
                : "border-surface-border opacity-60 bg-stone-50/50"
            }`}
          >
            <div className="flex items-start gap-3">
              <label className="relative flex items-center cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={bundleChecked}
                  onChange={(e) => setBundleChecked(e.target.checked)}
                  className="w-5 h-5 rounded-md text-emerald-600 focus:ring-emerald-500 border-stone-300 accent-emerald-600 cursor-pointer"
                  aria-label={`${bundleProduct.titleBn} নির্বাচন করুন`}
                />
              </label>

              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-surface-border bg-white shrink-0">
                {bundleProduct.images?.[0] ? (
                  <Image
                    src={bundleProduct.images[0]}
                    alt={bundleProduct.titleBn}
                    fill
                    sizes="(max-width: 640px) 64px, 80px"
                    quality={95}
                    className="object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-400">
                    ছবি নেই
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <span className="inline-block text-[10px] font-bold text-brand-800 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                  রেকমেন্ডেড কম্বো
                </span>
                <Link
                  href={`/product/${bundleProduct.slug}`}
                  className="block text-xs sm:text-sm font-bold text-charcoal-900 line-clamp-1 hover:text-brand-800 transition-colors"
                  title={bundleProduct.titleBn}
                >
                  {bundleProduct.titleBn}
                </Link>

                {/* Variant Selector or Display */}
                {bundleProduct.variants.length > 1 ? (
                  <select
                    value={selectedBundleVariantId}
                    onChange={(e) => setSelectedBundleVariantId(e.target.value)}
                    disabled={!bundleChecked}
                    className="text-[11px] font-medium text-charcoal-700 bg-white border border-stone-200 rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-600 max-w-full cursor-pointer disabled:opacity-50"
                    aria-label="ভ্যারিয়েন্ট নির্বাচন করুন"
                  >
                    {bundleProduct.variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.displayName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-[11px] text-charcoal-500 truncate">
                    {activeBundleVariant?.displayName}
                  </p>
                )}

                {/* Price Display */}
                <div className="flex items-baseline gap-2 pt-0.5">
                  <span className="font-mono text-sm sm:text-base font-black text-brand-800">
                    {formatBDT(bundlePrice)}
                  </span>
                  {bundleHasDiscount && (
                    <span className="font-mono text-xs text-stone-400 line-through">
                      {formatBDT(bundleRegularPrice)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Summary & High-Converting CTA Box (Cols 8-12 on LG) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-surface-canvas/60 rounded-xl p-5 border border-surface-border space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-charcoal-600 font-medium">
              <span>কম্বো মোট মূল্য ({toBanglaDigits(selectedCount)}টি পণ্য):</span>
              {totalSavings > 0 && selectedCount > 0 && (
                <span className="text-[11px] font-bold text-accent-dark bg-accent-amber/20 px-2 py-0.5 rounded-full border border-accent-amber/40">
                  সাশ্রয় {formatBDT(totalSavings)}
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2.5">
              <span className="font-mono text-2xl sm:text-3xl font-black text-brand-800">
                {formatBDT(combinedTotal)}
              </span>
              {totalSavings > 0 && selectedCount > 0 && (
                <span className="font-mono text-sm sm:text-base text-stone-400 line-through">
                  {formatBDT(combinedRegularTotal)}
                </span>
              )}
            </div>
          </div>

          {/* Free Shipping Badge when combined total >= ৳2,000 */}
          {isFreeShipping && selectedCount > 0 ? (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300/80 rounded-xl p-3 text-xs font-bold text-emerald-900 flex items-center gap-2 shadow-xs animate-in fade-in duration-300">
              <span className="text-base shrink-0">🎉</span>
              <span className="leading-tight">
                এই কম্বোতে পাচ্ছেন সারা দেশে ফ্রি ডেলিভারি!
              </span>
            </div>
          ) : selectedCount > 0 ? (
            <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-2.5 text-[11px] text-charcoal-600 flex items-center gap-2">
              <Truck className="w-4 h-4 text-brand-700 shrink-0" />
              <span>
                আর মাত্র {formatBDT(Math.max(0, 2000 - combinedTotal))} যোগ করলেই সারা দেশে ফ্রি ডেলিভারি!
              </span>
            </div>
          ) : null}

          {/* High-Converting CTA Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={selectedCount === 0}
            className={`w-full py-3.5 px-4 rounded-xl font-black text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-[0.99] cursor-pointer ${
              selectedCount === 0
                ? "bg-stone-200 text-stone-400 cursor-not-allowed shadow-none"
                : isAdded
                ? "bg-emerald-700 text-white"
                : "bg-brand-700 hover:bg-brand-800 text-white hover:shadow-lg"
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-5 h-5 text-emerald-200 stroke-[3]" />
                <span>কার্টে যোগ হয়েছে!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-5 h-5" />
                <span>
                  {selectedCount === 2
                    ? "উভয় পণ্য একসাথে কার্টে যোগ করুন"
                    : selectedCount === 1
                    ? "নির্বাচিত পণ্য কার্টে যোগ করুন"
                    : "কমপক্ষে একটি পণ্য বেছে নিন"}
                </span>
              </>
            )}
          </button>

          {/* Subtle Notification Toast */}
          {toastMessage && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          <div className="pt-1 text-[11px] text-center text-charcoal-500 flex items-center justify-center gap-3">
            <span>✓ ক্যাশ অন ডেলিভারি</span>
            <span>•</span>
            <span>✓ ১০০% খাঁটি পণ্য</span>
            <span>•</span>
            <span>✓ সহজ রিটার্ন</span>
          </div>
        </div>
      </div>
    </section>
  );
}
