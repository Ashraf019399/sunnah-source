"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle, CreditCard } from "lucide-react";
import { PaymentStatus, PAYMENT_STATUS_CONFIG } from "@/types/orders.types";
import { updatePaymentStatusAction } from "@/lib/actions/admin-order-actions";

const PAYMENT_STATUS_LIST: PaymentStatus[] = ["unpaid", "paid", "refunded"];

interface PaymentStatusUpdaterProps {
  orderId: string;
  currentPaymentStatus: PaymentStatus;
}

export function PaymentStatusUpdater({
  orderId,
  currentPaymentStatus: initialStatus,
}: PaymentStatusUpdaterProps) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<PaymentStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleStatusChange = async (newStatus: PaymentStatus) => {
    if (newStatus === currentStatus || isPending) return;

    setFeedback(null);

    startTransition(async () => {
      try {
        const result = await updatePaymentStatusAction(orderId, newStatus);
        if (result.success) {
          setCurrentStatus(newStatus);
          setFeedback({
            type: "success",
            message: result.message || "পেমেন্ট স্ট্যাটাস সফলভাবে আপডেট হয়েছে।",
          });
          router.refresh();
        } else {
          setFeedback({
            type: "error",
            message:
              result.message ||
              "পেমেন্ট স্ট্যাটাস আপডেট করা যায়নি। আবার চেষ্টা করুন।",
          });
        }
      } catch (err: any) {
        setFeedback({
          type: "error",
          message: "পেমেন্ট স্ট্যাটাস আপডেট করা যায়নি। আবার চেষ্টা করুন।",
        });
      }
    });
  };

  const activeConfig =
    PAYMENT_STATUS_CONFIG[currentStatus] || PAYMENT_STATUS_CONFIG.unpaid;

  return (
    <div className="bg-white rounded-2xl p-5 border border-surface-border shadow-subtle space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <label
            htmlFor="payment-status-select"
            className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1"
          >
            <span className="inline-flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              পেমেন্ট স্ট্যাটাস
            </span>
          </label>
          <p className="text-xs text-charcoal-500">
            অর্ডারের পেমেন্ট অবস্থা আপডেট করুন।
          </p>
        </div>

        {/* Current Status Pill */}
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border self-start sm:self-auto ${activeConfig.badgeClass}`}
        >
          <span>{activeConfig.labelBn}</span>
        </span>
      </div>

      {/* Selector Dropdown */}
      <div className="relative">
        <select
          id="payment-status-select"
          value={currentStatus}
          disabled={isPending}
          onChange={(e) => handleStatusChange(e.target.value as PaymentStatus)}
          aria-label="পেমেন্ট স্ট্যাটাস নির্বাচন করুন"
          className="w-full bg-surface-canvas border border-surface-border text-charcoal-900 font-bold text-sm rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-2xs"
        >
          {PAYMENT_STATUS_LIST.map((statusKey) => {
            const config = PAYMENT_STATUS_CONFIG[statusKey];
            return (
              <option key={statusKey} value={statusKey}>
                {config.labelBn} {statusKey === currentStatus ? "(বর্তমান)" : ""}
              </option>
            );
          })}
        </select>

        {isPending && (
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-brand-700">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        )}
      </div>

      {/* Feedback Messages */}
      {feedback && (
        <div
          role="alert"
          className={`p-3.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-2.5 transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}
    </div>
  );
}
