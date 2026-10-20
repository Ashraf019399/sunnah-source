"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Truck,
  ShieldCheck,
  Search,
  HelpCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { OrderTrackingForm } from "@/components/tracking/order-tracking-form";
import { OrderTrackingTimeline } from "@/components/tracking/order-tracking-timeline";
import { OrderTrackingSummary } from "@/components/tracking/order-tracking-summary";
import {
  trackOrderPublicAction,
  PublicSafeOrderDTO,
} from "@/lib/actions/order-tracking-actions";

interface TrackOrderContentProps {
  initialOrderNumber?: string;
  initialPhone?: string;
  initialOrderData?: PublicSafeOrderDTO | null;
  initialError?: string | null;
}

export const TrackOrderContent: React.FC<TrackOrderContentProps> = ({
  initialOrderNumber = "",
  initialPhone = "",
  initialOrderData = null,
  initialError = null,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [order, setOrder] = useState<PublicSafeOrderDTO | null>(initialOrderData);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError);
  const [isPending, startTransition] = useTransition();

  // If initial props are present and no order data yet loaded, attempt search
  useEffect(() => {
    if (initialOrderNumber && initialPhone && !initialOrderData && !initialError) {
      handleTrack(initialOrderNumber, initialPhone);
    }
  }, [initialOrderNumber, initialPhone]);

  const handleTrack = (orderNumber: string, phone: string) => {
    setErrorMessage(null);

    // Update browser URL query params for bookmarking/sharing without page reload
    const params = new URLSearchParams(searchParams.toString());
    params.set("orderNumber", orderNumber);
    params.set("phone", phone);
    router.replace(`/track-order?${params.toString()}`, { scroll: false });

    startTransition(async () => {
      const result = await trackOrderPublicAction(orderNumber, phone);
      if (result.success && result.data) {
        setOrder(result.data);
        setErrorMessage(null);
      } else {
        setOrder(null);
        setErrorMessage(result.message || "অর্ডারটি পাওয়া যায়নি।");
      }
    });
  };

  return (
    <div className="container mx-auto px-4 max-w-5xl py-8 sm:py-12">
      {/* 1. Page Header */}
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200/60 text-brand-800 text-xs font-bold mb-3">
          <Truck className="w-3.5 h-3.5 text-brand-700" />
          <span>সুন্নাহ সোর্স অর্ডার ট্র্যাকিং</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-charcoal-900 tracking-tight leading-tight">
          আপনার অর্ডার ট্র্যাক করুন
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-500 mt-2 leading-relaxed">
          অর্ডারের বর্তমান অবস্থা, প্যাকিং ও কুরিয়ার ডেলিভারি অগ্রগতি এক ক্লিকেই জেনে নিন
        </p>
      </div>

      {/* 2. Tracking Search Form */}
      <div className="mb-8">
        <OrderTrackingForm
          initialOrderNumber={initialOrderNumber}
          initialPhone={initialPhone}
          isLoading={isPending}
          errorMessage={errorMessage}
          onSubmit={handleTrack}
        />
      </div>

      {/* 3. Result Section or Informative Placeholder */}
      {order ? (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Timeline Stepper */}
          <OrderTrackingTimeline
            orderStatus={order.orderStatus}
            createdAt={order.createdAt}
            updatedAt={order.updatedAt}
          />

          {/* Order Summary & Financials */}
          <OrderTrackingSummary order={order} />
        </div>
      ) : (
        /* Helpful guide card when no order is active */
        <div className="bg-white rounded-2xl border border-surface-border shadow-card p-6 sm:p-8">
          <h3 className="text-base font-black text-charcoal-900 tracking-tight mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent-amber" />
            <span>সহজে অর্ডার ট্র্যাক করার নিয়মাবলী</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-4 rounded-xl bg-surface-canvas border border-surface-border/60 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-xs shrink-0">
                ১
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-charcoal-800 mb-1">
                  অর্ডার নম্বর সংগ্রহ করুন
                </h4>
                <p className="text-[11px] sm:text-xs text-charcoal-500 leading-relaxed">
                  অর্ডার সম্পন্ন হওয়ার পর স্ক্রিনে এবং আপনার মোবাইলে পাঠানো নিশ্চিতকরণ এসএমএসে অর্ডার নম্বরটি থাকে।
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-canvas border border-surface-border/60 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-xs shrink-0">
                ২
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-charcoal-800 mb-1">
                  মোবাইল নম্বর মিলিয়ে নিন
                </h4>
                <p className="text-[11px] sm:text-xs text-charcoal-500 leading-relaxed">
                  অর্ডার করার সময় যে ১১ ডিজিটের মোবাইল নম্বরটি দিয়েছিলেন, সেটি এখানে সঠিকভাবে ইনপুট দিন।
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-canvas border border-surface-border/60 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-xs shrink-0">
                ৩
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-charcoal-800 mb-1">
                  সহায়তা প্রয়োজন?
                </h4>
                <p className="text-[11px] sm:text-xs text-charcoal-500 leading-relaxed">
                  যেকোনো সমস্যায় কল করুন আমাদের হটলাইনে:{" "}
                  <a href="tel:01914612007" className="font-bold text-brand-700 hover:underline">
                    ০১৯১৪-৬১২০০৭
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
