"use client";

import React from "react";
import {
  CheckCircle2,
  Clock,
  PackageCheck,
  Truck,
  CheckCheck,
  XCircle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { ORDER_STATUS_CONFIG } from "@/types/orders.types";
import { OrderStatus } from "@/types/commerce.types";
import { formatBanglaDateTime } from "@/lib/utils";

interface OrderTrackingTimelineProps {
  orderStatus: OrderStatus;
  createdAt: string;
  updatedAt?: string;
}

interface StepDefinition {
  status: OrderStatus;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FORWARD_STEPS: StepDefinition[] = [
  {
    status: "pending",
    title: "অর্ডার গ্রহণ",
    description: "অর্ডারটি সফলভাবে গৃহীত হয়েছে ও নিশ্চিতকরণের অপেক্ষায় আছে।",
    icon: Clock,
  },
  {
    status: "confirmed",
    title: "অর্ডার নিশ্চিত",
    description: "প্রতিনিধি কল করে অর্ডার ও ঠিকানার তথ্য নিশ্চিত করেছেন।",
    icon: CheckCircle2,
  },
  {
    status: "processing",
    title: "প্রস্তুত সম্পন্ন",
    description: "খাঁটি ও প্রাকৃতিক পণ্য প্যাকিং ও মান যাচাই সম্পন্ন হয়েছে।",
    icon: PackageCheck,
  },
  {
    status: "shipped",
    title: "কুরিয়ারে হস্তান্তর",
    description: "পার্সেলটি কুরিয়ারে হস্তান্তর করা হয়েছে ও ডেলিভারির পথে আছে।",
    icon: Truck,
  },
  {
    status: "delivered",
    title: "ডেলিভার্ড",
    description: "গ্রাহক সফলভাবে পণ্য বুঝে পেয়েছেন। আলহামদুলিল্লাহ!",
    icon: CheckCheck,
  },
];

const STAGE_ORDER: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
};

export const OrderTrackingTimeline: React.FC<OrderTrackingTimelineProps> = ({
  orderStatus,
  createdAt,
  updatedAt,
}) => {
  const isTerminalCancelled = orderStatus === "cancelled";
  const isTerminalReturned = orderStatus === "returned";
  const statusConfig = ORDER_STATUS_CONFIG[orderStatus] || ORDER_STATUS_CONFIG.pending;
  const currentStepIndex = STAGE_ORDER[orderStatus] ?? -1;

  return (
    <div className="bg-white rounded-2xl border border-surface-border shadow-card p-5 sm:p-7">
      {/* 1. Header with Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-surface-border/80">
        <div>
          <span className="text-[11px] font-bold text-charcoal-400 uppercase tracking-wider block mb-1">
            বর্তমান অবস্থা
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-bold border ${statusConfig.badgeClass}`}
            >
              <span className={`w-2 h-2 rounded-full ${statusConfig.dotClass}`} />
              {statusConfig.labelBn}
            </span>
          </div>
        </div>

        <div className="text-left sm:text-right text-xs text-charcoal-500">
          <p className="font-medium">
            অর্ডারের সময়: <span className="font-sans font-semibold text-charcoal-700">{formatBanglaDateTime(createdAt)}</span>
          </p>
          {updatedAt && updatedAt !== createdAt && (
            <p className="text-[11px] text-charcoal-400 mt-0.5">
              সর্বশেষ আপডেট: <span className="font-sans">{formatBanglaDateTime(updatedAt)}</span>
            </p>
          )}
        </div>
      </div>

      {/* 2. Terminal Alert Banners if Applicable */}
      {isTerminalCancelled && (
        <div className="mt-5 p-4 rounded-xl bg-rose-50 border border-rose-200/80 flex items-start gap-3 text-rose-800 text-xs sm:text-sm">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-rose-900 text-sm">অর্ডারটি বাতিল করা হয়েছে</h4>
            <p className="mt-1 leading-relaxed text-rose-700">
              এই অর্ডারটি বাতিল (Cancelled) করা হয়েছে এবং পণ্যের স্টক পুনরুদ্ধার করা হয়েছে। কোনো প্রয়োজনে আমাদের হটলাইনে যোগাযোগ করতে পারেন।
            </p>
          </div>
        </div>
      )}

      {isTerminalReturned && (
        <div className="mt-5 p-4 rounded-xl bg-stone-100 border border-stone-300 flex items-start gap-3 text-stone-800 text-xs sm:text-sm">
          <RotateCcw className="w-5 h-5 text-stone-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-stone-900 text-sm">পণ্য ফেরত (Returned) এসেছে</h4>
            <p className="mt-1 leading-relaxed text-stone-600">
              পার্সেলটি ফেরত হিসেবে আমাদের ওয়্যারহাউজে গৃহীত হয়েছে এবং ইনভেন্টরি রেকর্ড সামঞ্জস্য করা হয়েছে।
            </p>
          </div>
        </div>
      )}

      {/* 3. Five-Stage Stepper Progression (Horizontal on desktop, Vertical on mobile) */}
      {!isTerminalCancelled && !isTerminalReturned && (
        <div className="mt-8">
          {/* Desktop Stepper */}
          <div className="hidden md:block">
            <div className="relative flex items-center justify-between">
              {/* Horizontal Connecting Line */}
              <div
                className="absolute left-6 right-6 top-5 -translate-y-1/2 h-1 bg-surface-border -z-0"
                aria-hidden="true"
              >
                <div
                  className="h-full bg-emerald-600 transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.min(100, (Math.max(0, currentStepIndex) / (FORWARD_STEPS.length - 1)) * 100)}%`,
                  }}
                />
              </div>

              {FORWARD_STEPS.map((step, idx) => {
                const IconComponent = step.icon;
                const isCompleted = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                const isUpcoming = idx > currentStepIndex;

                return (
                  <div key={step.status} className="relative z-10 flex flex-col items-center text-center max-w-[120px]">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCompleted
                          ? "bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-50"
                          : isCurrent
                          ? "bg-brand-700 text-white ring-4 ring-brand-100 scale-110 shadow-md animate-pulse"
                          : "bg-white border-2 border-surface-border text-charcoal-400"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <IconComponent className="w-4 h-4" />
                      )}
                    </div>

                    <div className="mt-3">
                      <p
                        className={`text-xs font-bold ${
                          isCurrent
                            ? "text-brand-900 font-extrabold"
                            : isCompleted
                            ? "text-charcoal-800"
                            : "text-charcoal-400 font-medium"
                        }`}
                      >
                        {step.title}
                      </p>
                      <p className="text-[10px] text-charcoal-400 mt-0.5 leading-snug line-clamp-2">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile Vertical Stepper */}
          <div className="md:hidden space-y-4">
            {FORWARD_STEPS.map((step, idx) => {
              const IconComponent = step.icon;
              const isCompleted = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              const isUpcoming = idx > currentStepIndex;
              const isLast = idx === FORWARD_STEPS.length - 1;

              return (
                <div key={step.status} className="flex gap-3.5 relative">
                  {/* Vertical line connecting to next step */}
                  {!isLast && (
                    <div
                      className={`absolute left-4 top-8 -bottom-3 w-0.5 -translate-x-1/2 ${
                        isCompleted ? "bg-emerald-500" : "bg-surface-border"
                      }`}
                    />
                  )}

                  {/* Icon circle */}
                  <div
                    className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center relative z-10 ${
                      isCompleted
                        ? "bg-emerald-600 text-white ring-2 ring-emerald-50"
                        : isCurrent
                        ? "bg-brand-700 text-white ring-4 ring-brand-100 scale-105"
                        : "bg-surface-canvas border border-surface-border text-charcoal-400"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <IconComponent className="w-3.5 h-3.5" />
                    )}
                  </div>

                  {/* Step Description */}
                  <div className="flex-1 pb-3">
                    <p
                      className={`text-xs font-bold ${
                        isCurrent
                          ? "text-brand-900"
                          : isCompleted
                          ? "text-charcoal-800"
                          : "text-charcoal-400 font-medium"
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-[11px] text-charcoal-500 mt-0.5 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Active Status Explanatory Note */}
      <div className="mt-6 pt-4 border-t border-surface-border/60 flex items-start gap-2.5 text-xs text-charcoal-600 bg-surface-canvas/60 p-3.5 rounded-xl">
        <Sparkles className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-charcoal-900">ডেলিভারি নোট: </strong>
          {statusConfig.descriptionBn}
        </p>
      </div>
    </div>
  );
};
