"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  Truck,
  CheckCircle2,
  ShoppingBag,
  ArrowLeft,
  AlertCircle,
  Phone,
  MapPin,
  User,
  Banknote,
  Clock,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useCartStore } from "@/store/use-cart-store";
import { formatBDT, isValidBDPhone } from "@/lib/utils";
import { DeliveryZone, OrderCreationPayload } from "@/types/commerce.types";
import { submitOrderServerAction } from "@/lib/actions/checkout-actions";
import { BrandLogo } from "@/components/layout/brand-logo";

const DHAKA_THANAS = [
  "মিরপুর",
  "উত্তরা",
  "ধানমন্ডি",
  "গুলশান",
  "বনানী",
  "মোহাম্মদপুর",
  "বাড্ডা",
  "মতিঝিল",
  "যাত্রাবাড়ী",
  "খিলগাঁও",
  "রামপুরা",
  "মগবাজার",
  "তেজগাঁও",
  "পল্টন",
  "লালবাগ",
  "বসুন্ধরা আবাসিক এলাকা",
];

const POPULAR_DISTRICTS = [
  "ঢাকা",
  "চট্টগ্রাম",
  "রাজশাহী",
  "খুলনা",
  "বরিশাল",
  "সিলেট",
  "রংপুর",
  "ময়মনসিংহ",
  "কুমিল্লা",
  "বগুড়া",
  "গাজীপুর",
  "নারায়ণগঞ্জ",
  "নোয়াখালী",
  "ফরিদপুর",
  "যশোর",
  "কক্সবাজার",
];

export default function CheckoutPage() {
  const [mounted, setMounted] = useState(false);

  // Cart store selectors
  const items = useCartStore((state) => state.items || []);
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const clearCart = useCartStore((state) => state.clearCart);
  const closeDrawer = useCartStore((state) => state.closeDrawer);

  // Customer Form State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [zone, setZone] = useState<DeliveryZone>("inside_dhaka");
  const [district, setDistrict] = useState("ঢাকা");
  const [thana, setThana] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [notes, setNotes] = useState("");

  // Validation & Submission State
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Successful Order State
  const [placedOrder, setPlacedOrder] = useState<{
    orderNumber: string;
    grandTotal: number;
    customerName: string;
    customerPhone: string;
    address: string;
    zoneText: string;
    itemCount: number;
  } | null>(null);

  // Avoid hydration mismatch from localStorage-backed Zustand store and close drawer
  useEffect(() => {
    setMounted(true);
    closeDrawer();
  }, [closeDrawer]);

  // Sync district when zone changes
  const handleZoneChange = (newZone: DeliveryZone) => {
    setZone(newZone);
    if (newZone === "inside_dhaka") {
      setDistrict("ঢাকা");
    } else if (district === "ঢাকা") {
      setDistrict("");
    }
  };

  // Subtotal calculation
  const subtotal = useMemo(() => {
    if (typeof getSubtotal === "function") {
      try {
        return getSubtotal();
      } catch {
        // Fallback
      }
    }
    return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [getSubtotal, items]);

  // Verified delivery fee logic
  const isFreeDelivery = subtotal >= 2000;
  const deliveryFee = isFreeDelivery ? 0 : zone === "inside_dhaka" ? 70 : 130;
  const grandTotal = subtotal + deliveryFee;

  // Phone validation status
  const isPhoneValid = useMemo(() => {
    if (!phone) return false;
    return isValidBDPhone(phone);
  }, [phone]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!fullName.trim()) {
      errors.fullName = "আপনার নাম লিখুন।";
    }

    if (!phone.trim()) {
      errors.phone = "১১ ডিজিটের মোবাইল নম্বর দিন।";
    } else if (!isValidBDPhone(phone)) {
      errors.phone = "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।";
    }

    if (!district.trim()) {
      errors.district = "জেলা নির্বাচন বা উল্লেখ করুন।";
    }

    if (!thana.trim()) {
      errors.thana = "থানা / উপজেলা লিখুন।";
    }

    if (!fullAddress.trim()) {
      errors.fullAddress = "সম্পূর্ণ ডেলিভারি ঠিকানা লিখুন।";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validateForm()) {
      return;
    }

    if (items.length === 0) {
      setServerError("আপনার কার্ট খালি! অনুগ্রহ করে পণ্য যুক্ত করুন।");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: OrderCreationPayload = {
        customer: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          zone,
          district: district.trim(),
          thana: thana.trim(),
          fullAddress: fullAddress.trim(),
          notes: notes.trim() || undefined,
        },
        items,
        subtotal,
        deliveryFee,
        discountAmount: 0,
        grandTotal,
        paymentMethod: "cod",
      };

      const result = await submitOrderServerAction(payload);

      if (result.success && result.data?.orderNumber) {
        setPlacedOrder({
          orderNumber: result.data.orderNumber,
          grandTotal,
          customerName: fullName.trim(),
          customerPhone: phone.trim(),
          address: `${fullAddress.trim()}, ${thana.trim()}, ${district.trim()}`,
          zoneText: zone === "inside_dhaka" ? "ঢাকা সিটি" : "ঢাকার বাইরে",
          itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
        });

        // Clear cart upon successful order
        if (typeof clearCart === "function") {
          clearCart();
        }
      } else {
        setServerError(
          result.message || "অর্ডার সম্পন্ন করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।"
        );
      }
    } catch (err: any) {
      setServerError(
        err?.message || "সার্ভার এরর ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন অথবা হোয়াটসঅ্যাপে যোগাযোগ করুন।"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pre-filled WhatsApp message for support or offline orders
  const whatsappHelpUrl = useMemo(() => {
    const text = encodeURIComponent(
      `আসসালামু আলাইকুম, আমি সান্নাহ সোর্স থেকে অর্ডার করতে সহায়তা চাচ্ছি।\nনাম: ${fullName || "গ্রাহক"}\nফোন: ${phone || ""}\nসাবটোটাল: ৳${subtotal}`
    );
    return `https://wa.me/8801914612007?text=${text}`;
  }, [fullName, phone, subtotal]);

  // 1. Loading Skeleton / Hydration Guard
  if (!mounted) {
    return (
      <div className="min-h-screen bg-surface-canvas flex items-center justify-center font-bengali">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-700 animate-spin" />
          <p className="text-charcoal-700 text-sm font-medium">চেকআউট পেজ লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  // 2. Order Success Screen
  if (placedOrder) {
    return (
      <div className="min-h-screen bg-surface-canvas font-bengali py-10 px-4">
        <div className="max-w-xl mx-auto bg-white rounded-3xl border border-surface-border shadow-card p-6 sm:p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-subtle">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="inline-block bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-3.5 py-1 rounded-full">
              অর্ডার সফলভাবে গৃহীত হয়েছে
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-charcoal-900">
              ধন্যবাদ! আপনার অর্ডারটি নিশ্চিত হয়েছে
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-500 leading-relaxed">
              আলহামদুলিল্লাহ, আমাদের প্রতিনিধি দ্রুত আপনার সাথে ফোনে যোগাযোগ করে অর্ডার কনফার্ম করবেন।
            </p>
          </div>

          {/* Order Summary Details */}
          <div className="bg-surface-canvas rounded-2xl p-5 border border-surface-border text-left space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between items-center pb-2 border-b border-surface-border/60">
              <span className="text-charcoal-500 font-medium">অর্ডার নম্বর:</span>
              <span className="font-mono font-bold text-brand-800 text-base">
                {placedOrder.orderNumber}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-charcoal-500 font-medium">গ্রাহকের নাম:</span>
              <span className="font-bold text-charcoal-900">{placedOrder.customerName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-charcoal-500 font-medium">মোবাইল নম্বর:</span>
              <span className="font-mono font-bold text-charcoal-900">
                {placedOrder.customerPhone}
              </span>
            </div>
            <div className="flex justify-between items-start gap-4">
              <span className="text-charcoal-500 font-medium shrink-0">ডেলিভারি ঠিকানা:</span>
              <span className="text-right text-charcoal-900 leading-relaxed font-medium">
                {placedOrder.address}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-charcoal-500 font-medium">পেমেন্ট মেথড:</span>
              <span className="font-bold text-emerald-700">ক্যাশ অন ডেলিভারি (COD)</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-surface-border/60 text-sm sm:text-base font-bold">
              <span className="text-charcoal-900">মোট প্রদেয় মূল্য:</span>
              <span className="font-mono text-brand-700 font-extrabold">
                {formatBDT(placedOrder.grandTotal)}
              </span>
            </div>
          </div>

          <div className="p-4 bg-brand-50 rounded-2xl border border-brand-200/80 text-left flex items-start gap-3">
            <Clock className="w-5 h-5 text-brand-700 shrink-0 mt-0.5" />
            <div className="text-xs text-charcoal-700 leading-relaxed">
              <strong className="block text-brand-900 mb-0.5">ডেলিভারি সময়সীমা:</strong>
              ঢাকা সিটির ভিতরে ২৪-৪৮ ঘণ্টার মধ্যে এবং ঢাকা সিটির বাইরে ২-৩ কার্যদিবসের মধ্যে পণ্য পৌঁছে দেওয়া হবে।
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/"
              className="flex-1 bg-brand-700 hover:bg-brand-800 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-card"
            >
              আরও কেনাকাটা করুন
            </Link>
            <a
              href={`https://wa.me/8801914612007?text=${encodeURIComponent(
                `আসসালামু আলাইকুম, আমি অর্ডার নম্বর ${placedOrder.orderNumber} সম্পর্কে জানতে চাচ্ছি।`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm transition-all"
            >
              <span>হোয়াটসঅ্যাপ সাপোর্ট</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 3. Empty Cart Screen
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-surface-canvas font-bengali flex flex-col">
        {/* Simple Header */}
        <header className="bg-white border-b border-surface-border py-4 px-4 shadow-subtle">
          <div className="container mx-auto max-w-7xl flex items-center justify-between">
            <BrandLogo />
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>হোমে ফিরুন</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl border border-surface-border shadow-card p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-surface-canvas rounded-full flex items-center justify-center mx-auto text-charcoal-400">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-black text-charcoal-900">আপনার কার্ট বর্তমানে খালি</h1>
            <p className="text-xs sm:text-sm text-charcoal-500 leading-relaxed">
              চেকআউট সম্পন্ন করার পূর্বে অনুগ্রহ করে আপনার পছন্দের খাঁটি খাদ্যপণ্য কার্টে যুক্ত করুন।
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 bg-accent-amber hover:bg-accent-dark text-charcoal-900 font-extrabold px-6 py-3 rounded-xl text-sm transition-all shadow-card"
            >
              <span>পণ্যসমূহ দেখুন</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // 4. Main Checkout Form & Summary
  return (
    <div className="min-h-screen bg-surface-canvas font-bengali flex flex-col">
      {/* Checkout Dedicated Header */}
      <header className="bg-white border-b border-surface-border py-3.5 px-4 sticky top-0 z-30 shadow-subtle">
        <div className="container mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BrandLogo />
            <span className="hidden sm:inline-block h-5 w-px bg-surface-border" />
            <span className="hidden sm:inline-block text-xs font-bold text-charcoal-700">
              নিরাপদ ও সহজ চেকআউট
            </span>
          </div>
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <ShieldCheck className="w-4 h-4" />
            <span>১০০% নিরাপদ ক্যাশ অন ডেলিভারি</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-charcoal-900">
                অর্ডার ও ডেলিভারি তথ্য
              </h1>
              <p className="text-xs sm:text-sm text-charcoal-500 mt-1">
                পণ্য হাতে পেয়ে মূল্য পরিশোধ করতে নিচের তথ্যগুলো সঠিকভাবে পূরণ করুন।
              </p>
            </div>
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-accent-dark transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>কেনাকাটা চালিয়ে যান</span>
            </Link>
          </div>

          {serverError && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-subtle">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
                <span>{serverError}</span>
              </div>
              <a
                href={whatsappHelpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shrink-0"
              >
                <span>হোয়াটসঅ্যাপে দ্রুত অর্ডার করুন</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Customer Form (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <form id="checkout-form" onSubmit={handleOrderSubmit} className="space-y-6">
                {/* 1. Customer Information Card */}
                <section className="bg-white rounded-2xl border border-surface-border p-5 sm:p-6 shadow-subtle space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-surface-border">
                    <User className="w-5 h-5 text-brand-700" />
                    <h2 className="font-extrabold text-charcoal-900 text-base sm:text-lg">
                      ১. আপনার ব্যক্তিগত তথ্য
                    </h2>
                  </div>

                  <div className="space-y-4 text-xs sm:text-sm">
                    <div>
                      <label className="block font-bold text-charcoal-900 mb-1.5">
                        আপনার পূর্ণ নাম <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (formErrors.fullName) {
                            setFormErrors((prev) => ({ ...prev, fullName: "" }));
                          }
                        }}
                        placeholder="যেমন: মোঃ আশরাফুল ইসলাম"
                        className={`w-full h-11 px-4 rounded-xl border bg-surface-canvas text-charcoal-900 focus:bg-white focus:outline-none transition-colors ${
                          formErrors.fullName
                            ? "border-red-500 focus:border-red-600"
                            : "border-surface-border focus:border-brand-700"
                        }`}
                      />
                      {formErrors.fullName && (
                        <p className="text-red-600 text-[11px] mt-1 font-semibold">
                          {formErrors.fullName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block font-bold text-charcoal-900 mb-1.5">
                        ১১ ডিজিটের মোবাইল নম্বর <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value);
                            setPhoneTouched(true);
                            if (formErrors.phone) {
                              setFormErrors((prev) => ({ ...prev, phone: "" }));
                            }
                          }}
                          onBlur={() => setPhoneTouched(true)}
                          placeholder="01XXXXXXXXX"
                          className={`w-full h-11 pl-11 pr-4 rounded-xl border font-mono bg-surface-canvas text-charcoal-900 focus:bg-white focus:outline-none transition-colors ${
                            formErrors.phone || (phoneTouched && phone && !isPhoneValid)
                              ? "border-red-500 focus:border-red-600"
                              : isPhoneValid
                              ? "border-emerald-600 focus:border-emerald-700"
                              : "border-surface-border focus:border-brand-700"
                          }`}
                        />
                        <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-charcoal-400 pointer-events-none" />
                      </div>
                      {formErrors.phone ? (
                        <p className="text-red-600 text-[11px] mt-1 font-semibold">
                          {formErrors.phone}
                        </p>
                      ) : phoneTouched && phone && !isPhoneValid ? (
                        <p className="text-amber-700 text-[11px] mt-1 font-semibold">
                          সঠিক ১১ ডিজিটের বাংলাদেশি নম্বর লিখুন (যেমন: 01712345678)
                        </p>
                      ) : (
                        <p className="text-charcoal-500 text-[11px] mt-1">
                          অর্ডারের অগ্রগতি ও ডেলিভারি সংক্রান্ত আপডেটের জন্য সক্রিয় নম্বর দিন।
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                {/* 2. Delivery Address & Zone Card */}
                <section className="bg-white rounded-2xl border border-surface-border p-5 sm:p-6 shadow-subtle space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-surface-border">
                    <MapPin className="w-5 h-5 text-brand-700" />
                    <h2 className="font-extrabold text-charcoal-900 text-base sm:text-lg">
                      ২. ডেলিভারি এলাকা ও সম্পূর্ণ ঠিকানা
                    </h2>
                  </div>

                  {/* Delivery Zone Radio Cards */}
                  <div className="space-y-2">
                    <label className="block font-bold text-charcoal-900 text-xs sm:text-sm">
                      ডেলিভারি এরিয়া বেছে নিন <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => handleZoneChange("inside_dhaka")}
                        className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                          zone === "inside_dhaka"
                            ? "border-brand-700 bg-brand-50/70 shadow-xs"
                            : "border-surface-border hover:border-brand-200 bg-surface-canvas"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="delivery_zone"
                            checked={zone === "inside_dhaka"}
                            onChange={() => handleZoneChange("inside_dhaka")}
                            className="w-4 h-4 text-brand-700 focus:ring-brand-700"
                          />
                          <div>
                            <strong className="block text-xs sm:text-sm text-charcoal-900">
                              ঢাকা সিটির ভিতরে
                            </strong>
                            <span className="text-[11px] text-charcoal-500">হোম ডেলিভারি (২৪-৪৮ ঘণ্টা)</span>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-xs sm:text-sm text-brand-700">
                          {isFreeDelivery ? (
                            <span className="text-emerald-700 font-extrabold">ফ্রি!</span>
                          ) : (
                            "৳৭০"
                          )}
                        </span>
                      </div>

                      <div
                        onClick={() => handleZoneChange("outside_dhaka")}
                        className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                          zone === "outside_dhaka"
                            ? "border-brand-700 bg-brand-50/70 shadow-xs"
                            : "border-surface-border hover:border-brand-200 bg-surface-canvas"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="delivery_zone"
                            checked={zone === "outside_dhaka"}
                            onChange={() => handleZoneChange("outside_dhaka")}
                            className="w-4 h-4 text-brand-700 focus:ring-brand-700"
                          />
                          <div>
                            <strong className="block text-xs sm:text-sm text-charcoal-900">
                              ঢাকা সিটির বাইরে
                            </strong>
                            <span className="text-[11px] text-charcoal-500">সারাদেশে ডেলিভারি (২-৩ দিন)</span>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-xs sm:text-sm text-brand-700">
                          {isFreeDelivery ? (
                            <span className="text-emerald-700 font-extrabold">ফ্রি!</span>
                          ) : (
                            "৳১৩০"
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* District and Thana Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm pt-2">
                    <div>
                      <label className="block font-bold text-charcoal-900 mb-1.5">
                        জেলা <span className="text-red-500">*</span>
                      </label>
                      {zone === "inside_dhaka" ? (
                        <input
                          type="text"
                          value="ঢাকা"
                          readOnly
                          className="w-full h-11 px-4 rounded-xl border border-surface-border bg-stone-100 text-charcoal-700 font-medium cursor-not-allowed"
                        />
                      ) : (
                        <>
                          <input
                            type="text"
                            list="district-list"
                            value={district}
                            onChange={(e) => {
                              setDistrict(e.target.value);
                              if (formErrors.district) {
                                setFormErrors((prev) => ({ ...prev, district: "" }));
                              }
                            }}
                            placeholder="যেমন: চট্টগ্রাম বা রাজশাহী"
                            className={`w-full h-11 px-4 rounded-xl border bg-surface-canvas text-charcoal-900 focus:bg-white focus:outline-none transition-colors ${
                              formErrors.district
                                ? "border-red-500 focus:border-red-600"
                                : "border-surface-border focus:border-brand-700"
                            }`}
                          />
                          <datalist id="district-list">
                            {POPULAR_DISTRICTS.map((d) => (
                              <option key={d} value={d} />
                            ))}
                          </datalist>
                        </>
                      )}
                      {formErrors.district && (
                        <p className="text-red-600 text-[11px] mt-1 font-semibold">
                          {formErrors.district}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block font-bold text-charcoal-900 mb-1.5">
                        থানা / উপজেলা <span className="text-red-500">*</span>
                      </label>
                      {zone === "inside_dhaka" ? (
                        <>
                          <input
                            type="text"
                            list="dhaka-thana-list"
                            value={thana}
                            onChange={(e) => {
                              setThana(e.target.value);
                              if (formErrors.thana) {
                                setFormErrors((prev) => ({ ...prev, thana: "" }));
                              }
                            }}
                            placeholder="যেমন: মিরপুর, উত্তরা বা ধানমন্ডি"
                            className={`w-full h-11 px-4 rounded-xl border bg-surface-canvas text-charcoal-900 focus:bg-white focus:outline-none transition-colors ${
                              formErrors.thana
                                ? "border-red-500 focus:border-red-600"
                                : "border-surface-border focus:border-brand-700"
                            }`}
                          />
                          <datalist id="dhaka-thana-list">
                            {DHAKA_THANAS.map((t) => (
                              <option key={t} value={t} />
                            ))}
                          </datalist>
                        </>
                      ) : (
                        <input
                          type="text"
                          value={thana}
                          onChange={(e) => {
                            setThana(e.target.value);
                            if (formErrors.thana) {
                              setFormErrors((prev) => ({ ...prev, thana: "" }));
                            }
                          }}
                          placeholder="আপনার থানা বা উপজেলা লিখুন"
                          className={`w-full h-11 px-4 rounded-xl border bg-surface-canvas text-charcoal-900 focus:bg-white focus:outline-none transition-colors ${
                            formErrors.thana
                              ? "border-red-500 focus:border-red-600"
                              : "border-surface-border focus:border-brand-700"
                          }`}
                        />
                      )}
                      {formErrors.thana && (
                        <p className="text-red-600 text-[11px] mt-1 font-semibold">
                          {formErrors.thana}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Full Delivery Address */}
                  <div className="text-xs sm:text-sm pt-2">
                    <label className="block font-bold text-charcoal-900 mb-1.5">
                      সম্পূর্ণ ঠিকানা (বাসা/রোড/এলাকা) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={fullAddress}
                      onChange={(e) => {
                        setFullAddress(e.target.value);
                        if (formErrors.fullAddress) {
                          setFormErrors((prev) => ({ ...prev, fullAddress: "" }));
                        }
                      }}
                      placeholder="বাসা নম্বর, ফ্ল্যাট নম্বর, রোড নম্বর বা নাম, সুনির্দিষ্ট এলাকা বা ল্যান্ডমার্ক বিস্তারিত লিখুন..."
                      className={`w-full p-3.5 rounded-xl border bg-surface-canvas text-charcoal-900 focus:bg-white focus:outline-none transition-colors resize-none ${
                        formErrors.fullAddress
                          ? "border-red-500 focus:border-red-600"
                          : "border-surface-border focus:border-brand-700"
                      }`}
                    />
                    {formErrors.fullAddress && (
                      <p className="text-red-600 text-[11px] mt-1 font-semibold">
                        {formErrors.fullAddress}
                      </p>
                    )}
                  </div>

                  {/* Optional Notes */}
                  <div className="text-xs sm:text-sm pt-1">
                    <label className="block font-medium text-charcoal-700 mb-1.5">
                      ডেলিভারি নির্দেশনা (ঐচ্ছিক)
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="যেমন: অফিসের ঠিকানায় ২টার পর ডেলিভারি দিন..."
                      className="w-full h-10 px-4 rounded-xl border border-surface-border bg-surface-canvas text-charcoal-900 focus:bg-white focus:border-brand-700 focus:outline-none transition-colors text-xs"
                    />
                  </div>
                </section>

                {/* 3. Payment Method Card (COD Only) */}
                <section className="bg-white rounded-2xl border border-surface-border p-5 sm:p-6 shadow-subtle space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-surface-border">
                    <Banknote className="w-5 h-5 text-brand-700" />
                    <h2 className="font-extrabold text-charcoal-900 text-base sm:text-lg">
                      ৩. পেমেন্ট পদ্ধতি
                    </h2>
                  </div>

                  <div className="p-4 rounded-2xl border-2 border-brand-700 bg-brand-50/60 flex items-start gap-3.5">
                    <div className="p-2 bg-brand-700 text-white rounded-xl shrink-0 mt-0.5">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm sm:text-base text-brand-900">
                          ক্যাশ অন ডেলিভারি (Cash on Delivery)
                        </strong>
                        <span className="bg-brand-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          সক্রিয়
                        </span>
                      </div>
                      <p className="text-xs text-charcoal-600 leading-relaxed">
                        কোনো অগ্রিম পেমেন্টের প্রয়োজন নেই। ডেলিভারিম্যান থেকে পণ্যটি বুঝে নিয়ে ও চেক করে সম্পূর্ণ মূল্য পরিশোধ করুন।
                      </p>
                    </div>
                  </div>
                </section>
              </form>
            </div>

            {/* Right Column: Order Summary & Cart Items (5 cols) */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
              <div className="bg-white rounded-2xl border border-surface-border p-5 sm:p-6 shadow-subtle space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                  <h3 className="font-extrabold text-charcoal-900 text-base sm:text-lg">
                    অর্ডার সারসংক্ষেপ ({items.reduce((sum, item) => sum + item.quantity, 0)})
                  </h3>
                  <span className="text-xs text-brand-700 font-bold bg-brand-50 px-2.5 py-1 rounded-full">
                    {items.length}টি পণ্য
                  </span>
                </div>

                {/* Free Delivery Meter in Summary */}
                <div className="p-3 bg-brand-50 rounded-xl border border-brand-200/80 text-xs">
                  {isFreeDelivery ? (
                    <div className="flex items-center gap-2 text-emerald-800 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>অভিনন্দন! আপনার জন্য ডেলিভারি সম্পূর্ণ ফ্রি!</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-charcoal-700">
                      <Truck className="w-4 h-4 text-brand-700 shrink-0" />
                      <span>
                        ৳২,০০০ বা তার বেশি অর্ডারে সারাদেশে ফ্রি ডেলিভারি! আর{" "}
                        <strong className="font-mono text-brand-700 font-bold">
                          {formatBDT(Math.max(0, 2000 - subtotal))}
                        </strong>{" "}
                        টাকার পণ্য যোগ করলেই পাচ্ছেন ফ্রি ডেলিভারি।
                      </span>
                    </div>
                  )}
                </div>

                {/* Cart Items List */}
                <div className="max-h-72 overflow-y-auto divide-y divide-surface-border/60 pr-1">
                  {items.map((item) => (
                    <div key={item.id || item.variantId} className="py-3 flex items-center gap-3 first:pt-0">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-surface-canvas border border-surface-border shrink-0">
                        <Image
                          src={item.image}
                          alt={item.titleBn || item.title}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-charcoal-900 truncate">
                          {item.titleBn || item.title}
                        </h4>
                        <p className="text-[11px] text-charcoal-500">
                          {item.variantName} • পরিমাণ: <strong className="font-mono">{item.quantity}</strong>
                        </p>
                        <span className="font-mono font-bold text-xs text-brand-700 block mt-0.5">
                          {formatBDT(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Financial Breakdown */}
                <div className="pt-3 border-t border-surface-border space-y-2.5 text-xs sm:text-sm">
                  <div className="flex justify-between items-center text-charcoal-600">
                    <span>পণ্যের উপমোট (Subtotal):</span>
                    <span className="font-mono font-bold text-charcoal-900">{formatBDT(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-charcoal-600">
                    <span>
                      ডেলিভারি চার্জ ({zone === "inside_dhaka" ? "ঢাকা সিটি" : "ঢাকার বাইরে"}):
                    </span>
                    <span className="font-mono font-bold">
                      {isFreeDelivery ? (
                        <span className="text-emerald-700 font-extrabold">৳০ (ফ্রি ডেলিভারি)</span>
                      ) : (
                        <span className="text-charcoal-900">{formatBDT(deliveryFee)}</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-surface-border/80 text-base sm:text-lg font-black text-charcoal-900">
                    <span>সর্বমোট প্রদেয়:</span>
                    <span className="font-mono text-brand-700 text-xl font-black">
                      {formatBDT(grandTotal)}
                    </span>
                  </div>
                </div>

                {/* Submit Action Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    form="checkout-form"
                    disabled={isSubmitting}
                    className={`w-full py-3.5 px-6 rounded-xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-card transition-all ${
                      isSubmitting
                        ? "bg-brand-800/80 text-stone-200 cursor-not-allowed"
                        : "bg-brand-700 hover:bg-brand-800 active:scale-[0.99] text-white"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>অর্ডার প্রসেস হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <span>অর্ডার নিশ্চিত করুন</span>
                        <span className="font-mono">• {formatBDT(grandTotal)}</span>
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-center text-charcoal-500 mt-2">
                    ক্যাশ অন ডেলিভারি — পণ্য গ্রহণের সময় মূল্য পরিশোধ করুন।
                  </p>
                </div>

                {/* Trust Badges */}
                <div className="pt-3 border-t border-surface-border/60 space-y-2 text-[11px] text-charcoal-600">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-brand-700 shrink-0" />
                    <span>১০০% খাঁটি ও নির্ভেজাল প্রাকৃতিক পণ্যের নিশ্চয়তা</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-brand-700 shrink-0" />
                    <span>অর্ডারের পর প্রতিনিধি ফোন করে ডেলিভারি কনফার্ম করবেন</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
