"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle, CreditCard } from "lucide-react";
import { PaymentStatus, PAYMENT_STATUS_CONFIG } from "@/types/orders.types";
import { OrderStatus } from "@/types/commerce.types";
import { updatePaymentStatusAction } from "@/lib/actions/admin-order-actions";

const PAYMENT_STATUS_LIST: PaymentStatus[] = ["unpaid", "paid", "refunded"];

interface PaymentStatusUpdaterProps {
  orderId: string;
  currentPaymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
}

export function PaymentStatusUpdater({
  orderId,
  currentPaymentStatus: initialStatus,
  orderStatus,
}: PaymentStatusUpdaterProps) {
  const router = useRouter();
  const [confirmedStatus, setConfirmedStatus] = useState<PaymentStatus>(initialStatus);
  const [selectedStatus, setSelectedStatus] = useState<PaymentStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Sync state if server data refreshes with a new initialStatus
  useEffect(() => {
    setConfirmedStatus(initialStatus);
    setSelectedStatus(initialStatus);
  }, [initialStatus]);

  // Terminal financial state: Once refunded, payments cannot be altered
  const isRefundedTerminal = confirmedStatus === "refunded";

  // Evaluates whether a payment status option is valid given the current order & payment states
  const isOptionAllowed = (statusKey: PaymentStatus): boolean => {
    if (statusKey === confirmedStatus) return true;
    if (isRefundedTerminal) return false;

    // Rule 1: Paid payments cannot be reverted to unpaid
    if (statusKey === "unpaid" && confirmedStatus === "paid") {
      return false;
    }

    // Rule 2: Cannot mark cancelled or returned orders as paid
    if (statusKey === "paid" && (orderStatus === "cancelled" || orderStatus === "returned")) {
      return false;
    }

    // Rule 3 & 4: Refunding requires the order to be paid AND cancelled or returned
    if (statusKey === "refunded") {
      if (confirmedStatus !== "paid") return false;
      if (!["cancelled", "returned"].includes(orderStatus)) return false;
    }

    return true;
  };

  const handleStatusChange = async (newStatus: PaymentStatus) => {
    if (newStatus === confirmedStatus || isPending || isRefundedTerminal) return;

    if (!isOptionAllowed(newStatus)) {
      if (newStatus === "unpaid" && confirmedStatus === "paid") {
        setFeedback({
          type: "error",
          message: "পরিশোধিত (Paid) পেমেন্ট পুনরায় অপরিশোধিত (Unpaid) করা যাবে না।",
        });
        return;
      }
      if (newStatus === "paid" && (orderStatus === "cancelled" || orderStatus === "returned")) {
        setFeedback({
          type: "error",
          message: "বাতিলকৃত বা ফেরতকৃত অর্ডারের পেমেন্ট পেইড হিসেবে চিহ্নিত করা যাবে না।",
        });
        return;
      }
      if (newStatus === "refunded") {
        if (confirmedStatus !== "paid") {
          setFeedback({
            type: "error",
            message: "শুধুমাত্র পেইড (Paid) অর্ডারে রিফান্ড স্ট্যাটাস প্রদান করা যাবে।",
          });
          return;
        }
        if (!["cancelled", "returned"].includes(orderStatus)) {
          setFeedback({
            type: "error",
            message: "রিফান্ড করার পূর্বে অর্ডারটি বাতিল (Cancelled) বা ফেরত (Returned) স্ট্যাটাসে থাকতে হবে।",
          });
          return;
        }
      }
      setFeedback({
        type: "error",
        message: "বর্তমান অবস্থায় এই পেমেন্ট স্ট্যাটাস নির্বাচন অনুমোদিত নয়।",
      });
      return;
    }

    // Immediately reflect the selected status in the dropdown and clear old feedback
    setSelectedStatus(newStatus);
    setFeedback(null);

    startTransition(async () => {
      try {
        const result = await updatePaymentStatusAction(orderId, newStatus);
        if (result.success) {
          setConfirmedStatus(newStatus);
          setSelectedStatus(newStatus);
          setFeedback({
            type: "success",
            message: result.message || "পেমেন্ট স্ট্যাটাস সফলভাবে আপডেট হয়েছে।",
          });
          router.refresh();
        } else {
          // Revert dropdown visibly to the last confirmed status on failure
          setSelectedStatus(confirmedStatus);
          setFeedback({
            type: "error",
            message:
              result.message ||
              "পেমেন্ট স্ট্যাটাস আপডেট করা যায়নি। আবার চেষ্টা করুন।",
          });
        }
      } catch (err: any) {
        // Revert dropdown visibly to the last confirmed status on unexpected exception
        setSelectedStatus(confirmedStatus);
        setFeedback({
          type: "error",
          message: "পেমেন্ট স্ট্যাটাস আপডেট করা যায়নি। আবার চেষ্টা করুন।",
        });
      }
    });
  };

  const activeConfig =
    PAYMENT_STATUS_CONFIG[confirmedStatus] || PAYMENT_STATUS_CONFIG.unpaid;

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
          value={selectedStatus}
          disabled={isPending || isRefundedTerminal}
          onChange={(e) => handleStatusChange(e.target.value as PaymentStatus)}
          aria-label="পেমেন্ট স্ট্যাটাস নির্বাচন করুন"
          className="w-full bg-surface-canvas border border-surface-border text-charcoal-900 font-bold text-sm rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-2xs"
        >
          {PAYMENT_STATUS_LIST.map((statusKey) => {
            const config = PAYMENT_STATUS_CONFIG[statusKey];
            const isCurrent = statusKey === confirmedStatus;
            const allowed = isOptionAllowed(statusKey);

            let note = "";
            if (isCurrent) {
              note = "(বর্তমান)";
            } else if (!allowed) {
              if (isRefundedTerminal) {
                note = "(রিফান্ড চূড়ান্ত)";
              } else if (statusKey === "unpaid" && confirmedStatus === "paid") {
                note = "(পেইড অর্ডার অপরিশোধিত করা যাবে না)";
              } else if (statusKey === "paid") {
                note = "(বাতিল/ফেরত অর্ডারে প্রযোজ্য নয়)";
              } else if (statusKey === "refunded") {
                if (confirmedStatus !== "paid") {
                  note = "(শুধুমাত্র পেইড অর্ডারে প্রযোজ্য)";
                } else {
                  note = "(বাতিল/ফেরত হওয়ার পর প্রযোজ্য)";
                }
              } else {
                note = "(অননুমোদিত)";
              }
            }

            return (
              <option key={statusKey} value={statusKey} disabled={!allowed}>
                {config.labelBn} {note}
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

      {isRefundedTerminal && (
        <p className="text-[11px] text-stone-500">
          পেমেন্ট রিফান্ড সম্পন্ন হয়েছে (পেমেন্ট স্ট্যাটাস পরিবর্তনযোগ্য নয়)।
        </p>
      )}

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
