"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { OrderStatus } from "@/types/commerce.types";
import {
  ORDER_STATUS_CONFIG,
  ORDER_STATUS_LIST,
  VALID_ORDER_TRANSITIONS,
} from "@/types/orders.types";
import { updateOrderStatusAction } from "@/lib/actions/admin-order-actions";

interface OrderStatusUpdaterProps {
  orderId: string;
  currentStatus: OrderStatus;
}

export function OrderStatusUpdater({
  orderId,
  currentStatus: initialStatus,
}: OrderStatusUpdaterProps) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(initialStatus);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(initialStatus);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Synchronize state if server re-renders with new props
  useEffect(() => {
    setCurrentStatus(initialStatus);
    setSelectedStatus(initialStatus);
  }, [initialStatus]);

  // Handle escape key to close confirmation modal
  useEffect(() => {
    if (!pendingStatus) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) {
        setSelectedStatus(currentStatus);
        setPendingStatus(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pendingStatus, isPending, currentStatus]);

  const allowedTransitions = VALID_ORDER_TRANSITIONS[currentStatus] || [];
  const isTerminal = allowedTransitions.length === 0;

  const executeStatusTransition = (targetStatus: OrderStatus) => {
    setFeedback(null);

    startTransition(async () => {
      try {
        const result = await updateOrderStatusAction(orderId, targetStatus);
        if (result.success) {
          setCurrentStatus(targetStatus);
          setSelectedStatus(targetStatus);
          setPendingStatus(null);
          setFeedback({
            type: "success",
            message: result.message || "অর্ডারের স্ট্যাটাস সফলভাবে আপডেট হয়েছে।",
          });
          router.refresh();
        } else {
          setSelectedStatus(currentStatus);
          setPendingStatus(null);
          setFeedback({
            type: "error",
            message:
              result.message ||
              "অর্ডারের স্ট্যাটাস আপডেট করা যায়নি। আবার চেষ্টা করুন।",
          });
        }
      } catch (err: any) {
        setSelectedStatus(currentStatus);
        setPendingStatus(null);
        setFeedback({
          type: "error",
          message: "অর্ডারের স্ট্যাটাস আপডেট করা যায়নি। আবার চেষ্টা করুন।",
        });
      }
    });
  };

  const handleSelectChange = (newStatus: OrderStatus) => {
    if (newStatus === currentStatus || isPending || isTerminal) return;

    if (!allowedTransitions.includes(newStatus)) {
      setFeedback({
        type: "error",
        message: "বর্তমান স্ট্যাটাস থেকে এই পরিবর্তনে অনুমতি নেই।",
      });
      return;
    }

    // Intercept terminal transitions with confirmation modal
    if (newStatus === "cancelled" || newStatus === "returned") {
      setSelectedStatus(newStatus);
      setPendingStatus(newStatus);
      return;
    }

    // Normal forward transitions execute immediately without blocking modal
    setSelectedStatus(newStatus);
    executeStatusTransition(newStatus);
  };

  const handleCancelModal = () => {
    if (isPending) return;
    setSelectedStatus(currentStatus);
    setPendingStatus(null);
  };

  const handleConfirmModal = () => {
    if (!pendingStatus || isPending) return;
    executeStatusTransition(pendingStatus);
  };

  const activeConfig =
    ORDER_STATUS_CONFIG[currentStatus] || ORDER_STATUS_CONFIG.pending;

  const terminalActionLabel = pendingStatus === "cancelled" ? "বাতিল" : "ফেরত";

  return (
    <>
      <div className="bg-white rounded-2xl p-5 border border-surface-border shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <label
              htmlFor="order-status-select"
              className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1"
            >
              অর্ডার স্ট্যাটাস
            </label>
            <p className="text-xs text-charcoal-500">
              {activeConfig.descriptionBn}
            </p>
          </div>

          {/* Current Status Pill */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border self-start sm:self-auto ${activeConfig.badgeClass}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${activeConfig.dotClass}`}
              aria-hidden="true"
            />
            <span>{activeConfig.labelBn}</span>
          </span>
        </div>

        {/* Selector Dropdown & Status Indicator */}
        <div className="relative">
          <select
            id="order-status-select"
            value={selectedStatus}
            disabled={isPending || isTerminal}
            onChange={(e) => handleSelectChange(e.target.value as OrderStatus)}
            aria-label="অর্ডার স্ট্যাটাস নির্বাচন করুন"
            className="w-full bg-surface-canvas border border-surface-border text-charcoal-900 font-bold text-sm rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-2xs"
          >
            {ORDER_STATUS_LIST.map((statusKey) => {
              const config = ORDER_STATUS_CONFIG[statusKey];
              const isCurrent = statusKey === currentStatus;
              const isAllowed = isCurrent || allowedTransitions.includes(statusKey);
              return (
                <option key={statusKey} value={statusKey} disabled={!isAllowed}>
                  {config.labelBn} {isCurrent ? "(বর্তমান)" : !isAllowed ? "(অননুমোদিত)" : ""}
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

        {isTerminal && (
          <p className="text-[11px] text-stone-500">
            অর্ডারটি চূড়ান্ত স্ট্যাটাসে রয়েছে (স্ট্যাটাস পরিবর্তনযোগ্য নয়)।
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

      {/* Confirmation Modal for Terminal States ('cancelled' or 'returned') */}
      {pendingStatus && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="terminal-modal-title"
          aria-describedby="terminal-modal-desc"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/70 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCancelModal();
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-rose-200 animate-in zoom-in-95 fade-in duration-200 overflow-hidden">
            <div className="p-6 sm:p-7 space-y-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
                  pendingStatus === "cancelled"
                    ? "bg-rose-50 text-rose-600"
                    : "bg-amber-50 text-amber-600"
                }`}
              >
                {pendingStatus === "cancelled" ? (
                  <XCircle className="w-6 h-6" />
                ) : (
                  <RotateCcw className="w-6 h-6" />
                )}
              </div>

              <div className="text-center space-y-2">
                <h3
                  id="terminal-modal-title"
                  className="text-base sm:text-lg font-black text-charcoal-900"
                >
                  {pendingStatus === "cancelled"
                    ? "অর্ডার বাতিল নিশ্চিতকরণ"
                    : "পণ্য ফেরত নিশ্চিতকরণ"}
                </h3>
                <p
                  id="terminal-modal-desc"
                  className="text-xs sm:text-sm text-charcoal-600 leading-relaxed font-sans"
                >
                  আপনি কি নিশ্চিতভাবে এই অর্ডারটি{" "}
                  <strong className="text-charcoal-900 font-bold underline decoration-rose-400">
                    {terminalActionLabel}
                  </strong>{" "}
                  হিসেবে চিহ্নিত করতে চান? এর ফলে পণ্যের স্টক এবং প্রযোজ্য ক্ষেত্রে কুপন পুনরুদ্ধার হবে। এই সিদ্ধান্তটি পরবর্তীতে আর পরিবর্তন করা যাবে না।
                </p>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleCancelModal}
                  disabled={isPending}
                  className="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold rounded-xl border border-surface-border text-charcoal-700 hover:bg-surface-canvas transition-colors disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                >
                  ফিরে যান
                </button>
                <button
                  type="button"
                  onClick={handleConfirmModal}
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-xs sm:text-sm font-black rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed shadow-sm"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  <span>{isPending ? "আপডেট হচ্ছে..." : "হ্যাঁ, নিশ্চিত"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
