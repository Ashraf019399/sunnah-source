"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Truck,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import type { AdminOrder } from "@/types/orders.types";
import { dispatchOrderToSteadfastAction } from "@/lib/actions/admin-courier-actions";
import { getSteadfastTrackingUrl } from "@/lib/services/steadfast";

interface SteadfastBookingModalProps {
  order: AdminOrder;
  variant?: "button" | "compact";
  onSuccess?: (trackingCode: string, consignmentId?: string | number) => void;
}

export function SteadfastBookingModal({
  order,
  variant = "button",
  onSuccess,
}: SteadfastBookingModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Local state for instant optimistic feedback without waiting for reload
  const [dispatchedData, setDispatchedData] = useState<{
    trackingCode: string;
    consignmentId?: string | number;
  } | null>(null);

  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Helper to resolve Consignment ID from order or admin_notes
  const resolveConsignmentId = (): string | number | undefined => {
    if (dispatchedData?.consignmentId) return dispatchedData.consignmentId;
    if (order.consignment_id) return order.consignment_id;
    if (order.admin_notes) {
      const match = order.admin_notes.match(/Steadfast Consignment ID:\s*([0-9a-zA-Z_-]+)/i);
      if (match) return match[1];
    }
    return undefined;
  };

  const existingTracking =
    dispatchedData?.trackingCode ||
    order.courier_tracking_code ||
    order.tracking_code ||
    null;

  const consignmentId = resolveConsignmentId();

  const isSteadfastDispatched =
    Boolean(dispatchedData) ||
    ((order.courier_partner?.toLowerCase() === "steadfast" ||
      order.courier_name?.toLowerCase() === "steadfast" ||
      Boolean(consignmentId)) &&
      Boolean(existingTracking));

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  // 1-Click Dispatch to Steadfast
  const handle1ClickDispatch = () => {
    startTransition(async () => {
      try {
        const res = await dispatchOrderToSteadfastAction(order.id);

        if (res.success && (res.tracking_code || res.trackingCode)) {
          const trackCode = String(res.tracking_code || res.trackingCode);
          const cid = res.consignment_id || res.consignmentId;

          setDispatchedData({
            trackingCode: trackCode,
            consignmentId: cid,
          });

          showToast("success", res.message || "Steadfast-এ সফলভাবে অর্ডার বুকিং হয়েছে!");
          onSuccess?.(trackCode, cid);
          router.refresh();
        } else {
          showToast("error", res.message || "Steadfast-এ বুকিং ব্যর্থ হয়েছে।");
        }
      } catch (err: any) {
        showToast("error", err?.message || "সার্ভার এরর ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
      }
    });
  };

  // 1. If already dispatched, display the Steadfast Consignment ID and Tracking Code badge with direct link
  if (isSteadfastDispatched && existingTracking) {
    const trackingUrl = getSteadfastTrackingUrl(existingTracking);

    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/90 text-emerald-900 text-xs font-bold shadow-2xs font-bengali">
        <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <div className="flex items-center gap-1.5">
          {consignmentId && (
            <span
              className="font-mono text-[10px] text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded font-semibold whitespace-nowrap"
              title="Steadfast Consignment ID"
            >
              CID: #{consignmentId}
            </span>
          )}
          <span className="font-mono text-emerald-950 font-bold whitespace-nowrap">
            #{existingTracking}
          </span>
        </div>
        <a
          href={trackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 rounded-lg hover:bg-emerald-100 text-emerald-700 hover:text-emerald-950 transition-colors"
          title="Steadfast পোর্টালে সরাসরি ট্র্যাক করুন"
        >
          <ExternalLink className="w-3 h-3" />
        </a>

        {/* Floating Toast Notification */}
        {toast && (
          <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-charcoal-900 text-white text-xs font-bold shadow-xl border border-charcoal-700 animate-in fade-in slide-in-from-bottom-2">
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    );
  }

  // 2. If order is cancelled or returned, disable courier booking
  if (order.order_status === "cancelled" || order.order_status === "returned") {
    return null;
  }

  // 3. If pending/confirmed (or processing), show clean emerald button "স্টিডফাস্টে বুক করুন" with loading spinner and instant feedback
  return (
    <>
      {variant === "compact" ? (
        <button
          type="button"
          onClick={handle1ClickDispatch}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-[11px] font-bold transition-all shadow-2xs font-bengali whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          title="১-ক্লিকে Steadfast-এ পার্সেল বুক করুন"
        >
          {isPending ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>বুকিং হচ্ছে...</span>
            </>
          ) : (
            <>
              <Truck className="w-3 h-3" />
              <span>স্টিডফাস্টে বুক করুন</span>
            </>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={handle1ClickDispatch}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-xs hover:shadow transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer font-bengali"
          title="১-ক্লিকে Steadfast-এ পার্সেল বুক করুন"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>স্টিডফাস্টে পাঠানো হচ্ছে...</span>
            </>
          ) : (
            <>
              <Truck className="w-4 h-4" />
              <span>স্টিডফাস্টে বুক করুন</span>
            </>
          )}
        </button>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-charcoal-900 text-white text-xs font-bold shadow-xl border border-charcoal-700 animate-in fade-in slide-in-from-bottom-2">
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </>
  );
}

/**
 * Clean alias for SteadfastDispatchButton
 */
export const SteadfastDispatchButton = SteadfastBookingModal;
