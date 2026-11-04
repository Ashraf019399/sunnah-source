"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Minus,
  Plus,
  Loader2,
  AlertCircle,
  Truck,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Product, ProductVariant, CartItem, OrderCreationPayload, DeliveryZone } from "@/types/commerce.types";
import { formatBanglaBDT, toBanglaDigits, isValidBDPhone, cn } from "@/lib/utils";
import { submitOrderServerAction } from "@/lib/actions/checkout-actions";
import { fbPurchase } from "@/lib/services/facebook-pixel";
import { formatVariantWeightLabel } from "./product-info";

export interface ExpressCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  selectedVariant: ProductVariant;
  initialQuantity?: number;
}

export function ExpressCheckoutModal({
  isOpen,
  onClose,
  product,
  selectedVariant,
  initialQuantity = 1,
}: ExpressCheckoutModalProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [quantity, setQuantity] = useState(initialQuantity);
  const [zone, setZone] = useState<DeliveryZone>("inside_dhaka");

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [fullAddress, setFullAddress] = useState("");

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderNumber: string;
    grandTotal: number;
    phone: string;
  } | null>(null);

  // Sync initialQuantity on open
  useEffect(() => {
    if (isOpen) {
      setQuantity(initialQuantity || 1);
      setErrorMessage(null);
      setConfirmedOrder(null);
    }
  }, [isOpen, initialQuantity]);

  // Client-side hydration for createPortal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!mounted || !isOpen) return null;

  // Pricing calculations
  const unitPrice =
    selectedVariant.salePrice &&
    selectedVariant.salePrice > 0 &&
    selectedVariant.salePrice < selectedVariant.regularPrice
      ? selectedVariant.salePrice
      : selectedVariant.regularPrice;

  const subtotal = unitPrice * quantity;
  const isFreeDelivery = subtotal >= 2000;
  const insideFee = isFreeDelivery ? 0 : 60;
  const outsideFee = isFreeDelivery ? 0 : 120;
  const deliveryFee = zone === "inside_dhaka" ? insideFee : outsideFee;
  const grandTotal = subtotal + deliveryFee;

  const handleDecreaseQty = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleIncreaseQty = () => {
    if (quantity < selectedVariant.stockQuantity) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    const trimmedName = fullName.trim();
    const cleanPhone = phone.replace(/\D/g, "");
    const trimmedAddress = fullAddress.trim();

    if (!trimmedName) {
      setErrorMessage("অনুগ্রহ করে আপনার সম্পূর্ণ নাম লিখুন।");
      return;
    }

    if (!isValidBDPhone(phone)) {
      setErrorMessage("সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।");
      return;
    }

    if (!trimmedAddress || trimmedAddress.length < 5) {
      setErrorMessage("অনুগ্রহ করে আপনার বিস্তারিত ডেলিভারি ঠিকানা লিখুন (বাসা/রোড/এলাকা/জেলা)।");
      return;
    }

    setIsSubmitting(true);

    try {
      const cartItem: CartItem = {
        id: `${product.id}-${selectedVariant.id}`,
        productId: product.id,
        variantId: selectedVariant.id,
        title: product.titleEn,
        titleBn: product.titleBn,
        variantName: selectedVariant.displayName,
        unitPrice,
        originalPrice:
          selectedVariant.salePrice && selectedVariant.salePrice < selectedVariant.regularPrice
            ? selectedVariant.regularPrice
            : undefined,
        image: product.images?.[0] || "",
        weightLabel: `${selectedVariant.weightValue} ${selectedVariant.weightUnit}`,
        quantity,
        maxStock: selectedVariant.stockQuantity,
      };

      const payload: OrderCreationPayload = {
        customer: {
          fullName: trimmedName,
          phone: cleanPhone.slice(-11),
          zone,
          district: zone === "inside_dhaka" ? "ঢাকা" : "ঢাকার বাইরে",
          thana: "",
          fullAddress: trimmedAddress,
        },
        items: [cartItem],
        subtotal,
        deliveryFee,
        discountAmount: 0,
        grandTotal,
        paymentMethod: "cod",
        idempotencyKey: crypto.randomUUID(),
      };

      const result = await submitOrderServerAction(payload);

      if (result.success && result.data?.orderNumber) {
        const orderNum = result.data.orderNumber;

        // 1. Meta Pixel Purchase event tracking
        fbPurchase({
          orderId: orderNum,
          total: grandTotal,
          numItems: quantity,
          items: [{ id: product.id, name: product.titleBn }],
        });

        // 2. Persist order in local customer history
        try {
          const rawHistory = localStorage.getItem("sunnah_customer_orders");
          const historyList = rawHistory ? JSON.parse(rawHistory) : [];
          const newOrderData = {
            orderNumber: orderNum,
            createdAt: new Date().toISOString(),
            grandTotal,
            fullName: trimmedName,
            phone: cleanPhone.slice(-11),
            shippingAddress: trimmedAddress,
            customerName: trimmedName,
            customerPhone: cleanPhone.slice(-11),
            address: trimmedAddress,
            zoneText: zone === "inside_dhaka" ? "ঢাকা সিটি" : "ঢাকার বাইরে",
            itemCount: quantity,
            items: [cartItem],
            subtotal,
            deliveryFee,
          };
          const updated = [
            newOrderData,
            ...historyList.filter((o: { orderNumber: string }) => o.orderNumber !== orderNum),
          ];
          localStorage.setItem("sunnah_customer_orders", JSON.stringify(updated));
        } catch (storageErr) {
          console.error("Local storage sync error:", storageErr);
        }

        // 3. Set confirmed order state
        setConfirmedOrder({
          orderNumber: orderNum,
          grandTotal,
          phone: cleanPhone.slice(-11),
        });
      } else {
        setErrorMessage(result.message || "অর্ডার সম্পন্ন করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
      }
    } catch (err) {
      console.error("[ExpressCheckoutModal] Order error:", err);
      setErrorMessage("সার্ভার এরর ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="express-checkout-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center font-bengali"
    >
      {/* Backdrop */}
      <div
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      {/* Slide-Up Drawer / Modal Card */}
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 max-h-[92vh] flex flex-col overflow-hidden animate-slide-up sm:animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-stone-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-800">
              <ShieldCheck className="w-5 h-5 text-brand-800" />
            </div>
            <div>
              <h2 id="express-checkout-title" className="text-base sm:text-lg font-black text-stone-900">
                ১-ক্লিক ক্যাশ অন ডেলিভারি
              </h2>
              <p className="text-[11px] text-stone-500">
                কোনো লগইন বা অগ্রিম পেমেন্ট ছাড়াই দ্রুত অর্ডার সম্পন্ন করুন
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-9 h-9 rounded-full bg-white hover:bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-5">
          {/* Confirmed Order State */}
          {confirmedOrder ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-brand-900">
                  আলহামদুলিল্লাহ, আপনার অর্ডার সম্পন্ন হয়েছে!
                </h3>
                <p className="text-xs sm:text-sm text-stone-600">
                  আমাদের প্রতিনিধি শীঘ্রই আপনার সাথে যোগাযোগ করবেন।
                </p>
              </div>

              {/* Order Number Box */}
              <div className="bg-brand-50/80 border border-brand-200 rounded-2xl p-4 max-w-sm mx-auto space-y-1">
                <span className="text-xs text-stone-500 block">অর্ডার নম্বর:</span>
                <span className="font-mono text-xl sm:text-2xl font-black text-brand-900 tracking-wider">
                  #{confirmedOrder.orderNumber}
                </span>
                <p className="text-xs font-bold text-stone-700 pt-1">
                  সর্বমোট প্রদেয়: {formatBanglaBDT(confirmedOrder.grandTotal)} (ক্যাশ অন ডেলিভারি)
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5 max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push(
                      `/order-success?orderNumber=${encodeURIComponent(
                        confirmedOrder.orderNumber
                      )}&phone=${encodeURIComponent(confirmedOrder.phone)}`
                    );
                  }}
                  className="w-full py-3 px-4 bg-brand-800 hover:bg-brand-900 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <span>অর্ডার মেমো ও বিস্তারিত</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-sm rounded-xl transition-colors cursor-pointer"
                >
                  আরও কেনাকাটা করুন
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 1. Top Summary: Thumbnail, Title, Variant & Quantity */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white border border-stone-200 shrink-0">
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.titleBn}
                      fill
                      sizes="64px"
                      className="object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-stone-400">
                      ছবি নেই
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-stone-900 truncate">
                    {product.titleBn}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-stone-600 mt-0.5">
                    <span className="bg-brand-50 text-brand-800 font-bold px-2 py-0.5 rounded-md border border-brand-200">
                      {formatVariantWeightLabel(selectedVariant)}
                    </span>
                    <span className="font-mono text-brand-800 font-bold">
                      {formatBanglaBDT(unitPrice)}
                    </span>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="inline-flex items-center border border-stone-300 rounded-lg bg-white overflow-hidden shrink-0">
                  <button
                    type="button"
                    onClick={handleDecreaseQty}
                    disabled={quantity <= 1 || isSubmitting}
                    className="w-8 h-8 flex items-center justify-center hover:bg-stone-100 text-stone-700 disabled:opacity-30 cursor-pointer"
                    aria-label="পরিমাণ কমান"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-mono text-xs font-bold text-stone-900">
                    {toBanglaDigits(quantity)}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncreaseQty}
                    disabled={quantity >= selectedVariant.stockQuantity || isSubmitting}
                    className="w-8 h-8 flex items-center justify-center hover:bg-stone-100 text-stone-700 disabled:opacity-30 cursor-pointer"
                    aria-label="পরিমাণ বাড়ান"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 2. Delivery Area Selector */}
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-bold text-stone-900 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-brand-700" />
                  <span>ডেলিভারি এরিয়া বেছে নিন:</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setZone("inside_dhaka")}
                    className={cn(
                      "py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                      zone === "inside_dhaka"
                        ? "border-2 border-brand-800 bg-brand-50/80 text-brand-900 shadow-xs scale-[1.01]"
                        : "border-stone-200 bg-white text-stone-700 hover:border-brand-300 hover:bg-stone-50"
                    )}
                  >
                    <CheckCircle2
                      className={cn(
                        "w-4 h-4 shrink-0",
                        zone === "inside_dhaka" ? "text-brand-800" : "text-stone-300"
                      )}
                    />
                    <span>ঢাকার ভেতরে ({isFreeDelivery ? "ফ্রি" : "৳৬০"})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setZone("outside_dhaka")}
                    className={cn(
                      "py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                      zone === "outside_dhaka"
                        ? "border-2 border-brand-800 bg-brand-50/80 text-brand-900 shadow-xs scale-[1.01]"
                        : "border-stone-200 bg-white text-stone-700 hover:border-brand-300 hover:bg-stone-50"
                    )}
                  >
                    <CheckCircle2
                      className={cn(
                        "w-4 h-4 shrink-0",
                        zone === "outside_dhaka" ? "text-brand-800" : "text-stone-300"
                      )}
                    />
                    <span>ঢাকার বাইরে ({isFreeDelivery ? "ফ্রি" : "৳১২০"})</span>
                  </button>
                </div>
              </div>

              {/* 3. Ultra-Simple Checkout Form */}
              <div className="space-y-3.5">
                {/* Full Name */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-stone-900 mb-1">
                    আপনার নাম <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="আপনার সম্পূর্ণ নাম লিখুন"
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-stone-300 bg-stone-50/50 focus:bg-white focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20 outline-none transition-all placeholder:text-stone-400"
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-stone-900 mb-1">
                    মোবাইল নম্বর <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="০১৭XXXXXXXX (১১ ডিজিটের মোবাইল নম্বর)"
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-stone-300 bg-stone-50/50 focus:bg-white focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20 outline-none transition-all placeholder:text-stone-400 font-mono"
                  />
                </div>

                {/* Delivery Address */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-stone-900 mb-1">
                    সম্পূর্ণ ঠিকানা <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    placeholder="বাসা নম্বর, রোড নম্বর, এলাকা, থানা ও জেলা লিখুন..."
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-stone-300 bg-stone-50/50 focus:bg-white focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20 outline-none transition-all placeholder:text-stone-400 resize-none"
                  />
                </div>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 4. Total Amount Breakdown */}
              <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 text-xs space-y-1.5">
                <div className="flex justify-between text-stone-600">
                  <span>পণ্যের মূল্য ({toBanglaDigits(quantity)}টি):</span>
                  <span className="font-mono font-bold text-stone-900">{formatBanglaBDT(subtotal)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>ডেলিভারি চার্জ:</span>
                  <span className="font-mono font-bold text-stone-900">
                    {deliveryFee === 0 ? "ফ্রি" : formatBanglaBDT(deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black text-brand-900 pt-1.5 border-t border-stone-200">
                  <span>সর্বমোট প্রদেয়:</span>
                  <span className="font-mono text-base">{formatBanglaBDT(grandTotal)}</span>
                </div>
              </div>

              {/* 5. Cash on Delivery Note */}
              <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">
                  পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন (ক্যাশ অন ডেলিভারি)
                </span>
              </div>

              {/* 6. Big CTA Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "w-full py-4 px-6 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 bg-gradient-to-r from-brand-700 via-brand-800 to-brand-900 hover:from-brand-800 hover:to-brand-950 text-white shadow-lg active:scale-[0.99] transition-all cursor-pointer ring-2 ring-brand-700/20",
                  isSubmitting && "opacity-80 cursor-wait"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>অর্ডার প্রসেস হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <span>ক্যাশ অন ডেলিভারিতে অর্ডার নিশ্চিত করুন ({formatBanglaBDT(grandTotal)})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

