"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Truck,
  ExternalLink,
  X,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package,
  MapPin,
  Phone,
  User,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import type { AdminOrder } from "@/types/orders.types";
import {
  bookOrderToSteadfast,
  checkSteadfastConfigAction,
} from "@/lib/actions/admin-courier-actions";
import { getSteadfastTrackingUrl } from "@/lib/services/steadfast-courier";
import { formatBDT } from "@/lib/utils";

interface SteadfastBookingModalProps {
  order: AdminOrder;
  variant?: "button" | "compact";
  onSuccess?: (trackingCode: string) => void;
}

export function SteadfastBookingModal({
  order,
  variant = "button",
  onSuccess,
}: SteadfastBookingModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [resultMessage, setResultMessage] = useState<{
    type: "success" | "error";
    text: string;
    trackingCode?: string;
  } | null>(null);

  const existingTracking =
    order.courier_tracking_code || order.tracking_code || null;
  const isSteadfast =
    (order.courier_partner?.toLowerCase() === "steadfast" ||
      order.courier_name?.toLowerCase() === "steadfast") &&
    Boolean(existingTracking);

  // Check Steadfast configuration status when modal opens
  useEffect(() => {
    if (isOpen && isConfigured === null) {
      checkSteadfastConfigAction().then((res) => {
        setIsConfigured(res.isConfigured);
      });
    }
  }, [isOpen, isConfigured]);

  // Derived shipment info
  const shipping = (order.shipping_address || {}) as Record<string, any>;
  const recipientName = order.guest_name || shipping.fullName || "—";
  const recipientPhone = order.guest_phone || shipping.phone || "—";
  const fullAddress =
    [shipping.fullAddress, shipping.thana, shipping.district]
      .filter(Boolean)
      .join(", ") || "ঠিকানা দেওয়া হয়নি";

  const isPaid = order.payment_status === "paid";
  const codAmount = isPaid ? 0 : Number(order.grand_total) || 0;

  const handleBooking = () => {
    setResultMessage(null);
    startTransition(async () => {
      const res = await bookOrderToSteadfast(order.id);
      if (res.success && res.trackingCode) {
        setResultMessage({
          type: "success",
          text: res.message,
          trackingCode: res.trackingCode,
        });
        onSuccess?.(res.trackingCode);
        router.refresh();
      } else {
        setResultMessage({
          type: "error",
          text: res.message || "বুকিং প্রক্রিয়াকরণে সমস্যা হয়েছে।",
        });
      }
    });
  };

  // 1. If already booked to Steadfast, render the Courier Tracking Badge
  if (isSteadfast && existingTracking) {
    const trackingUrl = getSteadfastTrackingUrl(existingTracking);
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs font-bold shadow-2xs font-bengali">
        <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
        <div className="flex items-center gap-1.5">
          <span className="text-emerald-700 font-semibold">Steadfast:</span>
          <span className="font-mono text-emerald-950 font-bold">
            #{existingTracking}
          </span>
        </div>
        <a
          href={trackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 rounded-lg hover:bg-emerald-100 text-emerald-700 hover:text-emerald-900 transition-colors"
          title="Steadfast পোর্টালে ট্র্যাক করুন"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  // 2. If order is cancelled or returned, disable courier booking
  if (order.order_status === "cancelled" || order.order_status === "returned") {
    return null;
  }

  return (
    <>
      {/* Trigger Button */}
      {variant === "compact" ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors cursor-pointer shadow-2xs font-bengali whitespace-nowrap"
          title="Steadfast-এ ১-ক্লিক বুক করুন"
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Steadfast</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer font-bengali"
        >
          <Truck className="w-4 h-4" />
          <span>Steadfast-এ বুক করুন</span>
        </button>
      )}

      {/* Confirmation & Dispatch Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-bengali">
          <div
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-surface-border overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-900 via-brand-900 to-teal-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                  <Truck className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Steadfast Courier ১-ক্লিক বুকিং
                  </h3>
                  <p className="text-xs text-emerald-200/80 font-mono">
                    অর্ডার #{order.order_number}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-emerald-100 hover:text-white transition-colors cursor-pointer"
                aria-label="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Unconfigured Alert Banner */}
              {isConfigured === false && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Steadfast API Credentials প্রয়োজন</span>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    বুকিং চালু করতে আপনার প্রজেক্টের{" "}
                    <code className="font-mono bg-amber-100/90 text-amber-950 px-1 py-0.5 rounded font-bold">
                      .env.local
                    </code>{" "}
                    ফাইলে <code className="font-mono">STEADFAST_API_KEY</code> ও{" "}
                    <code className="font-mono">STEADFAST_SECRET_KEY</code> যোগ
                    করুন।
                  </p>
                </div>
              )}

              {/* Status/Error Messages */}
              {resultMessage && (
                <div
                  className={`p-4 rounded-2xl text-xs space-y-2 border ${
                    resultMessage.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-rose-50 border-rose-200 text-rose-900"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {resultMessage.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{resultMessage.text}</span>
                  </div>

                  {resultMessage.trackingCode && (
                    <div className="pt-1 flex items-center justify-between border-t border-emerald-200">
                      <span className="font-mono font-bold text-xs text-emerald-800">
                        ট্র্যাকিং কোড: #{resultMessage.trackingCode}
                      </span>
                      <a
                        href={getSteadfastTrackingUrl(
                          resultMessage.trackingCode
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline"
                      >
                        <span>Steadfast পোর্টালে দেখুন</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Shipment Details Card */}
              <div className="bg-surface-canvas rounded-2xl p-4 border border-surface-border space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-surface-border pb-2">
                  <span className="font-bold text-charcoal-700 uppercase tracking-wider text-[11px]">
                    পার্সেল প্রেরণের তথ্য (Shipment Details)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-800 border border-brand-200">
                    ইনভয়েস: #{order.order_number}
                  </span>
                </div>

                {/* Recipient */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-charcoal-500 block">
                      প্রাপকের নাম:
                    </span>
                    <span className="font-bold text-charcoal-900">
                      {recipientName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-charcoal-500 block">
                      মোবাইল নম্বর:
                    </span>
                    <span className="font-mono font-bold text-charcoal-900">
                      {recipientPhone}
                    </span>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <span className="text-[11px] text-charcoal-500 block">
                    সম্পূর্ণ ডেলিভারি ঠিকানা:
                  </span>
                  <p className="font-medium text-charcoal-800 bg-white p-2.5 rounded-xl border border-surface-border mt-0.5 leading-relaxed">
                    {fullAddress}
                  </p>
                </div>

                {/* Collectible COD Amount & Payment */}
                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-surface-border/70">
                  <div>
                    <span className="text-[11px] text-charcoal-500 block">
                      কালেকশনযোগ্য COD মূল্য:
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-base font-black text-brand-900 font-sans">
                        {formatBDT(codAmount)}
                      </span>
                      {isPaid && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                          অনলাইন পেইড
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-charcoal-500 block">
                      ডেলিভারি এলাকা:
                    </span>
                    <span className="font-semibold text-charcoal-800 block mt-0.5">
                      {shipping.zone === "inside_dhaka"
                        ? "ঢাকা সিটি (Inside Dhaka)"
                        : "ঢাকার বাইরে (Outside Dhaka)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Transition Notice */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 text-[11px] text-blue-900 leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  বুকিং সফল হলে অর্ডারের স্ট্যাটাস স্বয়ংক্রিয়ভাবে{" "}
                  <strong>&quot;কুরিয়ারে পাঠানো হয়েছে (shipped)&quot;</strong> অবস্থায়
                  পরিবর্তিত হবে এবং ট্র্যাকিং কোড সংরক্ষিত হবে।
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-surface-canvas border-t border-surface-border flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="px-4 py-2 rounded-xl border border-surface-border bg-white text-xs font-bold text-charcoal-700 hover:bg-surface-canvas transition-colors cursor-pointer disabled:opacity-50"
              >
                {resultMessage?.type === "success" ? "বন্ধ করুন" : "বাতিল"}
              </button>

              {resultMessage?.type !== "success" && (
                <button
                  type="button"
                  onClick={handleBooking}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Steadfast-এ পাঠানো হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Truck className="w-4 h-4" />
                      <span>বুকিং নিশ্চিত করুন</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
