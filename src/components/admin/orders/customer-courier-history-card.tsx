"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  PackageCheck,
  PackageX,
  Truck,
  Send,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  getCustomerCourierHistoryAction,
  CustomerCourierHistory,
} from "@/lib/services/courier-fraud-check";
import { fireMetaCapiPurchaseManualAction } from "@/lib/actions/admin-order-actions";

interface CustomerCourierHistoryCardProps {
  orderId: string;
  orderNumber: string;
  phone: string;
  customerName?: string;
  adminNotes?: string | null;
}

export function CustomerCourierHistoryCard({
  orderId,
  orderNumber,
  phone,
  customerName,
  adminNotes,
}: CustomerCourierHistoryCardProps) {
  const [history, setHistory] = useState<CustomerCourierHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Meta CAPI manual trigger transition
  const [isFiringCapi, startFiringCapi] = useTransition();
  const [capiFeedback, setCapiFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const isCapiAlreadyFired = adminNotes?.includes("Meta CAPI Purchase Fired");

  const loadHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getCustomerCourierHistoryAction(phone);
      if (res.success && res.data) {
        setHistory(res.data);
      } else {
        setError(res.message || "কুরিয়ার হিস্ট্রি লোড করা সম্ভব হয়নি।");
      }
    } catch {
      setError("সার্ভার সংযোগ বিচ্ছিন্ন। আবার চেষ্টা করুন।");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (phone) {
      loadHistory();
    }
  }, [phone]);

  const handleManualCapi = () => {
    setCapiFeedback(null);
    startFiringCapi(async () => {
      const res = await fireMetaCapiPurchaseManualAction(orderId);
      setCapiFeedback({
        success: res.success,
        message: res.message,
      });
    });
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-surface-border shadow-subtle space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-border/70 pb-3">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-brand-700" />
          <h3 className="text-sm font-bold text-charcoal-900 uppercase tracking-wider">
            কুরিয়ার হিস্ট্রি ও ফ্রড গার্ড (Customer Risk & History)
          </h3>
        </div>
        <button
          type="button"
          onClick={loadHistory}
          disabled={isLoading}
          className="text-xs text-charcoal-500 hover:text-brand-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
          title="রিফ্রেশ করুন"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">রিফ্রেশ</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-6 flex flex-col items-center justify-center gap-2 text-xs text-charcoal-500">
          <Loader2 className="w-5 h-5 animate-spin text-brand-700" />
          <span>কাস্টমারের কুরিয়ার ও অর্ডার রেকর্ড যাচাই করা হচ্ছে...</span>
        </div>
      ) : error ? (
        <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-600">
          {error}
        </div>
      ) : history ? (
        <div className="space-y-4 text-xs">
          {/* Risk Badge and Summary Alert */}
          <div
            className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${
              history.riskLevel === "high"
                ? "bg-rose-50/90 border-rose-200 text-rose-950"
                : history.riskLevel === "moderate"
                ? "bg-amber-50/90 border-amber-200 text-amber-950"
                : "bg-emerald-50/90 border-emerald-200 text-emerald-950"
            }`}
          >
            {history.riskLevel === "high" ? (
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            ) : history.riskLevel === "moderate" ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight">
                  {history.riskLabelBn}
                </span>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-white/80 border border-current font-bold">
                  সাকসেস রেট: {history.successRate}%
                </span>
              </div>
              <p className="leading-relaxed opacity-90">{history.riskDescriptionBn}</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-2 pt-1 text-center">
            <div className="bg-surface-canvas p-2.5 rounded-2xl border border-surface-border">
              <span className="text-[10px] text-charcoal-500 block uppercase font-bold">
                মোট অর্ডার
              </span>
              <span className="text-base font-black text-charcoal-900 font-mono">
                {history.totalOrders}
              </span>
            </div>
            <div className="bg-emerald-50/60 p-2.5 rounded-2xl border border-emerald-200/70">
              <span className="text-[10px] text-emerald-700 block uppercase font-bold">
                ডেলিভার্ড
              </span>
              <span className="text-base font-black text-emerald-900 font-mono">
                {history.deliveredCount}
              </span>
            </div>
            <div className="bg-rose-50/60 p-2.5 rounded-2xl border border-rose-200/70">
              <span className="text-[10px] text-rose-700 block uppercase font-bold">
                রিটার্ন
              </span>
              <span className="text-base font-black text-rose-900 font-mono">
                {history.returnedCount}
              </span>
            </div>
            <div className="bg-amber-50/60 p-2.5 rounded-2xl border border-amber-200/70">
              <span className="text-[10px] text-amber-700 block uppercase font-bold">
                ক্যানসেল
              </span>
              <span className="text-base font-black text-amber-900 font-mono">
                {history.cancelledCount}
              </span>
            </div>
          </div>

          {/* External Courier Check Links */}
          <div className="pt-2 border-t border-surface-border/70 flex flex-wrap gap-2">
            <a
              href={history.externalCheckUrls.steadfastUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-canvas hover:bg-stone-100 border border-surface-border text-charcoal-700 font-semibold text-[11px] transition-colors"
            >
              <span>Steadfast পোর্টালে নম্বর খুঁজুন</span>
              <ExternalLink className="w-3 h-3 text-charcoal-400" />
            </a>
            <a
              href={history.externalCheckUrls.fraudCheckBdUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-canvas hover:bg-stone-100 border border-surface-border text-charcoal-700 font-semibold text-[11px] transition-colors"
            >
              <span>FraudCheck BD-তে যাচাই</span>
              <ExternalLink className="w-3 h-3 text-charcoal-400" />
            </a>
          </div>

          {/* Meta CAPI Tracking Status & Manual Fire */}
          <div className="pt-3 border-t border-surface-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="text-charcoal-600 font-medium">Meta CAPI ট্র্যাকিং:</span>
              {isCapiAlreadyFired ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>পিক্সেল ফায়ার হয়েছে</span>
                </span>
              ) : (
                <span className="text-[11px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                  অপেক্ষারত (Pending Call)
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleManualCapi}
              disabled={isFiringCapi}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-800 hover:bg-brand-900 text-white font-bold text-[11px] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isFiringCapi ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>পাঠানো হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Send className="w-3 h-3" />
                  <span>{isCapiAlreadyFired ? "পুনরায় পিক্সেল ফায়ার" : "ম্যানুয়াল পিক্সেল ফায়ার (CAPI)"}</span>
                </>
              )}
            </button>
          </div>

          {capiFeedback && (
            <div
              className={`p-2.5 rounded-xl text-[11px] ${
                capiFeedback.success
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {capiFeedback.message}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
