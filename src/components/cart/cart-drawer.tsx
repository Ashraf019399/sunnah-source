"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCartStore } from "@/store/use-cart-store";
import { formatBDT } from "@/lib/utils";
import { CartItem } from "@/types/commerce.types";

export const CartDrawer: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  // Store selectors and actions
  const items = useCartStore((state) => state.items || []);
  const isDrawerOpen = useCartStore((state) => Boolean(state.isDrawerOpen));
  const closeDrawer = useCartStore((state) => state.closeDrawer);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const getSubtotal = useCartStore((state) => state.getSubtotal);

  // Prevent hydration mismatch between server-rendered null and localStorage state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background body scrolling when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  // Handle keyboard accessibility (Escape key to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDrawerOpen) {
        closeDrawer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  // Calculate subtotal using store method if present, with direct reduction fallback
  const subtotal = useMemo(() => {
    if (typeof getSubtotal === "function") {
      try {
        return getSubtotal();
      } catch {
        // Fallback if store method encounters unexpected state
      }
    }
    return items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
  }, [getSubtotal, items]);

  // Verified free delivery threshold from repository commerce rules (৳২,০০০)
  const freeThreshold = 2000;
  const remainingForFree = Math.max(0, freeThreshold - subtotal);
  const freePercent = Math.min(100, Math.round((subtotal / freeThreshold) * 100));

  if (!mounted || !isDrawerOpen) return null;

  const handleDecrease = (item: CartItem) => {
    if (item.quantity > 1) {
      if (typeof updateQuantity === "function") {
        updateQuantity(item.variantId, item.quantity - 1);
      }
    } else {
      if (typeof removeItem === "function") {
        removeItem(item.variantId);
      }
    }
  };

  const handleIncrease = (item: CartItem) => {
    if (!item.maxStock || item.quantity < item.maxStock) {
      if (typeof updateQuantity === "function") {
        updateQuantity(item.variantId, item.quantity + 1);
      }
    }
  };

  const handleRemove = (variantId: string) => {
    if (typeof removeItem === "function") {
      removeItem(variantId);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="শপিং ব্যাগ"
      className="fixed inset-0 z-50 flex justify-end font-bengali"
    >
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-charcoal-900/60 backdrop-blur-xs transition-opacity"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Drawer slide-over container */}
      <div className="relative w-full max-w-md bg-white h-full shadow-drawer flex flex-col z-10">
        {/* Header */}
        <div className="p-4 border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-brand-700" />
            <h2 className="font-bold text-charcoal-900 text-base">
              শপিং ব্যাগ ({items.reduce((count, item) => count + item.quantity, 0)})
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {typeof clearCart === "function" && items.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-[11px] text-stone-400 hover:text-red-600 transition-colors px-1 py-0.5"
                aria-label="সম্পূর্ণ কার্ট খালি করুন"
              >
                সব মুছুন
              </button>
            )}
            <button
              type="button"
              onClick={closeDrawer}
              className="p-1 text-charcoal-500 hover:text-charcoal-900 rounded-lg transition-colors"
              aria-label="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Free delivery progress meter */}
        <div className="p-3 bg-brand-50 border-b border-brand-100 text-xs">
          {remainingForFree > 0 ? (
            <p className="text-charcoal-700">
              আর{" "}
              <span className="font-mono font-bold text-brand-700">
                {formatBDT(remainingForFree)}
              </span>{" "}
              টাকার পণ্য যোগ করলেই পাচ্ছেন{" "}
              <strong className="text-brand-700">ফ্রি ডেলিভারি!</strong>
            </p>
          ) : (
            <p className="text-emerald-700 font-bold">
              অভিনন্দন! আপনি ফ্রি ডেলিভারি আনলক করেছেন!
            </p>
          )}
          <div className="w-full h-2 bg-brand-200 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-accent-amber transition-all duration-300"
              style={{ width: `${freePercent}%` }}
              role="progressbar"
              aria-valuenow={freePercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-surface-border/60">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id || item.variantId} className="py-3.5 flex gap-3 first:pt-0">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-surface-canvas border border-surface-border shrink-0">
                  <Image
                    src={item.image}
                    alt={item.titleBn || item.title}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-charcoal-900 truncate">
                    {item.titleBn || item.title}
                  </h4>
                  <p className="text-[11px] text-charcoal-500 mt-0.5">{item.variantName}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="inline-flex items-center border border-surface-border rounded-lg bg-surface-canvas">
                      <button
                        type="button"
                        onClick={() => handleDecrease(item)}
                        className="p-1 hover:bg-white rounded-l-lg transition-colors"
                        aria-label="পরিমাণ কমান"
                      >
                        <Minus className="w-3 h-3 text-charcoal-700" />
                      </button>
                      <span className="w-6 text-center font-mono text-xs font-bold text-charcoal-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleIncrease(item)}
                        disabled={Boolean(item.maxStock && item.quantity >= item.maxStock)}
                        className="p-1 hover:bg-white rounded-r-lg transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                        aria-label="পরিমাণ বাড়ান"
                      >
                        <Plus className="w-3 h-3 text-charcoal-700" />
                      </button>
                    </div>
                    <span className="font-mono font-bold text-xs text-brand-700">
                      {formatBDT(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(item.variantId)}
                  className="text-stone-400 hover:text-red-600 self-start p-1 transition-colors"
                  aria-label="পণ্যটি মুছে ফেলুন"
                  title="পণ্যটি মুছে ফেলুন"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-surface-canvas flex items-center justify-center text-charcoal-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="font-bold text-sm text-charcoal-900">আপনার শপিং ব্যাগ খালি</p>
              <p className="text-xs text-charcoal-500 max-w-xs leading-relaxed">
                আপনার পছন্দের খাঁটি ও প্রাকৃতিক খাদ্যপণ্য কার্টে যুক্ত করুন।
              </p>
              <button
                type="button"
                onClick={closeDrawer}
                className="mt-2 bg-brand-50 text-brand-700 hover:bg-brand-100 font-bold px-4 py-2 rounded-xl text-xs transition-colors"
              >
                কেনাকাটা চালিয়ে যান
              </button>
            </div>
          )}
        </div>

        {/* Footer Subtotal & Action */}
        {items.length > 0 && (
          <div className="p-4 border-t border-surface-border bg-surface-canvas space-y-3">
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-charcoal-900">সাবটোটাল:</span>
              <span className="font-mono text-base text-brand-700">{formatBDT(subtotal)}</span>
            </div>

            <div className="space-y-1.5">
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="w-full bg-brand-700/60 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-sm cursor-not-allowed"
                title="চেকআউট পেজ এখনও রিপোজিটরিতে যুক্ত হয়নি"
              >
                <span>অর্ডার সম্পন্ন করুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[10px] text-center text-charcoal-500">
                চেকআউট পেজ এখনও রিপোজিটরিতে যুক্ত হয়নি।
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
