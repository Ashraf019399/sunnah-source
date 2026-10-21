"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { Printer, X, ShieldCheck, ShoppingBag } from "lucide-react";
import { CartItem } from "@/types/commerce.types";
import { formatBDT } from "@/lib/utils";

export interface InvoiceOrderData {
  orderNumber: string;
  fullName: string;
  phone: string;
  shippingAddress: string;
  zoneText?: string;
  subtotal: number;
  deliveryFee: number;
  discountAmount?: number;
  couponCode?: string | null;
  grandTotal: number;
  items?: CartItem[];
  createdAt?: string;
}

interface PrintableInvoiceProps {
  order: InvoiceOrderData;
  autoPrint?: boolean;
  onClose?: () => void;
}

export const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({
  order,
  autoPrint = false,
  onClose,
}) => {
  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  const items = order.items || [];
  const trackingUrl = `https://sunnahsourcebd.com/track-order?orderNumber=${encodeURIComponent(
    order.orderNumber
  )}&phone=${encodeURIComponent(order.phone)}`;

  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
    trackingUrl
  )}`;

  return (
    <div className="min-h-screen bg-stone-100 font-bengali text-charcoal-900 print:bg-white print:text-black">
      {/* 1. Screen-Only Action Bar */}
      <aside
        aria-label="প্রিন্ট নিয়ন্ত্রণ বার"
        className="print:hidden sticky top-0 z-50 bg-charcoal-900 text-white px-4 py-3 shadow-md border-b border-charcoal-700"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm sm:text-base">চালান প্রিন্ট প্রিভিউ</span>
            <span className="text-xs text-stone-400 font-mono">#{order.orderNumber}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট করুন</span>
            </button>

            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">বন্ধ করুন</span>
              </button>
            ) : null}
          </div>
        </div>
      </aside>

      {/* 2. Printable A4 Invoice Container */}
      <main className="p-4 sm:p-8 print:p-0 flex justify-center">
        <article className="w-full max-w-[210mm] bg-white rounded-2xl shadow-card border border-surface-border p-6 sm:p-10 print:p-6 print:shadow-none print:border-none print:rounded-none">
          {/* Header Row */}
          <header className="flex justify-between items-start border-b-2 border-brand-900 pb-5 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-brand-900 tracking-tight leading-tight">
                  সুন্নাহ সোর্স
                </h1>
                <span className="text-xs font-sans font-bold text-brand-700 uppercase tracking-widest px-2 py-0.5 rounded bg-brand-50 border border-brand-200">
                  Sunnah Source
                </span>
              </div>
              <p className="text-xs font-semibold text-charcoal-700 mt-1">
                প্রকৃতির বিশুদ্ধতা, সুন্নাহর অনুপ্রেরণা — ১০০% খাঁটি খাদ্যপণ্য
              </p>
              <div className="text-[11px] text-charcoal-500 mt-1.5 space-y-0.5 font-sans">
                <p>হটলাইন: ০১৯১৪-৬১২০০৭ | ইমেইল: support@sunnahsourcebd.com</p>
                <p>ওয়েবসাইট: www.sunnahsourcebd.com | ঢাকা, বাংলাদেশ</p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="inline-block px-3 py-1 rounded bg-brand-900 text-white font-black text-xs uppercase tracking-wider">
                কাস্টমার চালান ও মেমো
              </span>
              <div className="mt-2 space-y-1">
                <p className="text-base sm:text-lg font-mono font-black text-brand-900">
                  #{order.orderNumber}
                </p>
                <p className="text-xs text-charcoal-600">
                  তারিখ:{" "}
                  <span className="font-semibold">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString("bn-BD", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "আজকের তারিখ"}
                  </span>
                </p>
              </div>
            </div>
          </header>

          {/* Customer & Delivery Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 my-5 p-4 rounded-xl bg-surface-canvas/60 border border-surface-border text-xs sm:text-sm">
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-brand-900 uppercase tracking-wider block border-b border-surface-border pb-1">
                গ্রাহকের বিবরণ (Customer Details)
              </span>
              <div>
                <span className="text-charcoal-500 text-xs">নাম: </span>
                <strong className="text-charcoal-900 font-bold text-sm">
                  {order.fullName}
                </strong>
              </div>
              <div>
                <span className="text-charcoal-500 text-xs">মোবাইল: </span>
                <strong className="font-mono text-base font-black text-brand-900 tracking-wider">
                  {order.phone}
                </strong>
              </div>
              <div>
                <span className="text-charcoal-500 text-xs">ঠিকানা: </span>
                <span className="font-semibold text-charcoal-900 leading-relaxed">
                  {order.shippingAddress}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-brand-900 uppercase tracking-wider block border-b border-surface-border pb-1">
                ডেলিভারি ও পেমেন্ট
              </span>
              <div>
                <span className="text-charcoal-500 text-xs">ডেলিভারি জোন: </span>
                <span className="font-semibold text-charcoal-800">
                  {order.zoneText || "স্ট্যান্ডার্ড ডেলিভারি"}
                </span>
              </div>
              <div>
                <span className="text-charcoal-500 text-xs">পেমেন্ট মেথড: </span>
                <span className="font-bold text-emerald-800">
                  ক্যাশ অন ডেলিভারি (COD)
                </span>
              </div>
              <div className="pt-2">
                <div className="p-2.5 rounded-lg border-2 border-brand-900 bg-brand-50/50">
                  <span className="block text-[11px] font-bold text-brand-900 uppercase">
                    কুরিয়ারে প্রদেয় মোট টাকা:
                  </span>
                  <p className="font-mono text-lg sm:text-xl font-black text-brand-900">
                    {formatBDT(order.grandTotal)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          {items.length > 0 && (
            <div className="my-5 overflow-hidden border border-surface-border rounded-xl">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-brand-900 text-white font-bold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-12">ক্র.</th>
                    <th className="py-2.5 px-3">পণ্যের বিবরণ</th>
                    <th className="py-2.5 px-3 text-right w-24">একক মূল্য</th>
                    <th className="py-2.5 px-3 text-center w-20">পরিমাণ</th>
                    <th className="py-2.5 px-3 text-right w-28">মোট টাকা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border text-charcoal-900">
                  {items.map((item, idx) => {
                    const price = Number(item.unitPrice) || 0;
                    const qty = Number(item.quantity) || 1;
                    const total = price * qty;
                    return (
                      <tr key={`${item.id || idx}`} className="even:bg-surface-canvas/40">
                        <td className="py-2.5 px-3 text-center font-bold text-charcoal-500">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-charcoal-900">
                            {item.titleBn || item.title}
                          </p>
                          {(item.variantName || item.weightLabel) && (
                            <span className="text-[11px] font-semibold text-brand-800 block">
                              {item.variantName || item.weightLabel}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium">
                          {formatBDT(price)}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-charcoal-900">
                          {qty}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-charcoal-900">
                          {formatBDT(total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Financial Breakdown & QR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-5 items-end">
            <div className="flex items-center gap-3.5 p-3.5 rounded-xl border border-surface-border bg-surface-canvas/50">
              <div className="w-20 h-20 bg-white p-1 rounded-lg border border-surface-border shrink-0 flex items-center justify-center">
                <Image
                  src={qrCodeApiUrl}
                  alt="Order Tracking QR"
                  width={72}
                  height={72}
                  className="w-full h-full object-contain"
                  unoptimized
                />
              </div>
              <div className="text-xs space-y-1">
                <span className="font-bold text-brand-900 block">
                  পার্সেল ট্র্যাকিং কিউআর
                </span>
                <p className="text-[11px] text-charcoal-600 leading-snug">
                  ক্যামেরা দিয়ে স্ক্যান করে অর্ডারের অবস্থা অনলাইনে চেক করুন।
                </p>
                <p className="text-[10px] text-brand-800 font-mono truncate max-w-[200px]">
                  sunnahsourcebd.com/track-order
                </p>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="space-y-1.5 text-xs sm:text-sm">
              <div className="flex justify-between py-1 text-charcoal-700">
                <span>পণ্যসমূহের মূল্য (Subtotal):</span>
                <span className="font-mono font-bold">{formatBDT(order.subtotal)}</span>
              </div>
              <div className="flex justify-between py-1 text-charcoal-700">
                <span>ডেলিভারি চার্জ:</span>
                <span className="font-mono font-bold">
                  {order.deliveryFee === 0 ? "ফ্রি" : formatBDT(order.deliveryFee)}
                </span>
              </div>
              {typeof order.discountAmount === "number" && order.discountAmount > 0 ? (
                <div className="flex justify-between py-1 text-emerald-800 bg-emerald-50 px-2 rounded font-semibold">
                  <span>
                    কুপন ছাড় ({order.couponCode || "প্রমোশন"}):
                  </span>
                  <span className="font-mono font-bold">
                    - ৳{order.discountAmount}
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between py-2 border-t-2 border-brand-900 text-sm sm:text-base font-black text-brand-900">
                <span>সর্বমোট প্রদেয় (Grand Total):</span>
                <span className="font-mono font-black text-base sm:text-lg">
                  {formatBDT(order.grandTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Signatures */}
          <footer className="mt-8 pt-6 border-t border-surface-border text-xs">
            <div className="grid grid-cols-2 gap-8 text-center pt-8">
              <div>
                <div className="border-t border-dashed border-charcoal-400 max-w-[200px] mx-auto pt-1 font-bold text-charcoal-700">
                  প্যাকেজিং যাচাইকারীর স্বাক্ষর
                </div>
                <span className="text-[10px] text-charcoal-400 font-sans block mt-0.5">
                  সুন্নাহ সোর্স ওয়্যারহাউজ
                </span>
              </div>
              <div>
                <div className="border-t border-dashed border-charcoal-400 max-w-[200px] mx-auto pt-1 font-bold text-charcoal-700">
                  গ্রাহকের স্বাক্ষর
                </div>
                <span className="text-[10px] text-charcoal-400 font-sans block mt-0.5">
                  পণ্য বুঝে পেয়েছি
                </span>
              </div>
            </div>

            <div className="text-center mt-6 pt-3 border-t border-surface-border/60 text-[11px] text-charcoal-500">
              <p className="font-medium text-brand-900">
                সুন্নাহ সোর্স থেকে কেনাকাটা করার জন্য ধন্যবাদ।
              </p>
              <p className="mt-0.5">
                বিশেষ সতর্কতা: পণ্য ডেলিভারি প্রতিনিধির সামনে চেক করে গ্রহণ করুন। হটলাইন: ০১৯১৪-৬১২০০৭।
              </p>
            </div>
          </footer>
        </article>
      </main>
    </div>
  );
};
