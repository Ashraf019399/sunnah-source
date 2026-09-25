"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { OrderStatus } from "@/types/commerce.types";
import {
  ORDER_STATUS_CONFIG,
  ORDER_STATUS_LIST,
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
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (newStatus === currentStatus || isPending) return;

    setFeedback(null);

    startTransition(async () => {
      try {
        const result = await updateOrderStatusAction(orderId, newStatus);
        if (result.success) {
          setCurrentStatus(newStatus);
          setFeedback({
            type: "success",
            message: result.message || "অর্ডারের স্ট্যাটাস সফলভাবে আপডেট হয়েছে।",
          });
          router.refresh();
        } else {
          setFeedback({
            type: "error",
            message:
              result.message ||
              "অর্ডারের স্ট্যাটাস আপডেট করা যায়নি। আবার চেষ্টা করুন।",
          });
        }
      } catch (err: any) {
        setFeedback({
          type: "error",
          message: "অর্ডারের স্ট্যাটাস আপডেট করা যায়নি। আবার চেষ্টা করুন।",
        });
      }
    });
  };

  const activeConfig =
    ORDER_STATUS_CONFIG[currentStatus] || ORDER_STATUS_CONFIG.pending;

  return (
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
          value={currentStatus}
          disabled={isPending}
          onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
          aria-label="অর্ডার স্ট্যাটাস নির্বাচন করুন"
          className="w-full bg-surface-canvas border border-surface-border text-charcoal-900 font-bold text-sm rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-2xs"
        >
          {ORDER_STATUS_LIST.map((statusKey) => {
            const config = ORDER_STATUS_CONFIG[statusKey];
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
