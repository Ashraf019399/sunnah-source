"use client";

import React, { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import {
  Printer,
  X,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Truck,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Package,
  AlertCircle,
  FileText,
} from "lucide-react";
import type { AdminOrder, AdminOrderWithItems, AdminOrderItem } from "@/types/orders.types";
import { formatBDT, formatBanglaDateTime, toBanglaDigits } from "@/lib/utils";
import { getAdminOrderById } from "@/lib/actions/admin-order-actions";

// ─── Print Styles ─────────────────────────────────────────────────────────────

const PRINT_STYLES = `
@media print {
  html, body {
    background: #ffffff !important;
    color: #000000 !important;
    margin: 0 !important;
    padding: 0 !important;
    font-size: 12pt;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  
  /* Hide all app chrome, sidebars, topbars, and modal backdrops */
  body * {
    visibility: hidden;
  }
  
  /* Make only the printable invoice container visible */
  #printable-invoice-container,
  #printable-invoice-container * {
    visibility: visible;
  }
  
  #printable-invoice-container {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    box-shadow: none !important;
    border: none !important;
  }
  
  .no-print,
  .print-hidden,
  .print\\:hidden {
    display: none !important;
  }
  
  @page {
    size: A4 portrait;
    margin: 10mm 12mm;
  }

  tr, .avoid-break {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
}
`;

// ─── Printable Invoice Document Component ─────────────────────────────────────

export interface OrderInvoicePrintableProps {
  order: AdminOrder | AdminOrderWithItems;
  autoPrint?: boolean;
  onClose?: () => void;
}

export function OrderInvoicePrintable({
  order,
  autoPrint = false,
  onClose,
}: OrderInvoicePrintableProps) {
  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  const items: AdminOrderItem[] = (order as AdminOrderWithItems).items || [];
  const shipping =
    (order.shipping_address as unknown as Record<string, string | undefined>) || {};

  const isPaid = order.payment_status === "paid";
  const paymentMethodLabel =
    order.payment_method === "cod"
      ? "ক্যাশ অন ডেলিভারি (Cash on Delivery)"
      : order.payment_method === "bkash"
      ? "বিকাশ (bKash Online)"
      : order.payment_method === "nagad"
      ? "নগদ (Nagad Online)"
      : order.payment_method === "sslcommerz"
      ? "অনলাইন কার্ড / গেটওয়ে (SSLCommerz)"
      : "ক্যাশ অন ডেলিভারি (COD)";

  // Resolve Steadfast consignment ID & tracking code
  const resolveConsignmentId = (): string | null => {
    if (order.consignment_id) return String(order.consignment_id);
    if (order.admin_notes) {
      const match = order.admin_notes.match(/Steadfast Consignment ID:\s*([0-9a-zA-Z_-]+)/i);
      if (match) return match[1];
    }
    return null;
  };

  const consignmentId = resolveConsignmentId();
  const trackingCode = order.courier_tracking_code || order.tracking_code || null;
  const isDispatched = Boolean(consignmentId || trackingCode);

  // Tracking QR code URL
  const trackingUrl = `https://sunnahsourcebd.com/track-order?orderNumber=${encodeURIComponent(
    order.order_number
  )}&phone=${encodeURIComponent(order.guest_phone || "")}`;

  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
    trackingUrl
  )}`;

  return (
    <div className="font-bengali text-charcoal-900 bg-white">
      {/* Global Print Style injection */}
      <style>{PRINT_STYLES}</style>

      {/* Main Printable Document Card */}
      <article
        id="printable-invoice-container"
        className="w-full max-w-[210mm] mx-auto bg-white p-6 sm:p-8 print:p-0 print:max-w-none text-charcoal-900 leading-normal"
      >
        {/* ======================================================== */}
        {/* 1. Header: Brand, Title, Tagline & Contact Details       */}
        {/* ======================================================== */}
        <header className="border-b-2 border-brand-900 pb-4 mb-4">
          <div className="flex flex-row justify-between items-start gap-4">
            {/* Left: Brand Identity */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-brand-900 tracking-tight leading-none print:text-black">
                  সুন্নাহ সোর্স
                </h1>
                <span className="text-xs font-sans font-bold text-brand-800 uppercase tracking-widest px-2 py-0.5 rounded bg-brand-50 border border-brand-200 print:border-black print:text-black print:bg-transparent">
                  Sunnah Source
                </span>
              </div>
              <p className="text-xs font-bold text-charcoal-700 print:text-black">
                প্রকৃতির ছোঁয়ায় খাঁটি পুষ্টি — ১০০% অপরিশোধিত ও বিশুদ্ধ খাদ্যপণ্য
              </p>
              <div className="text-[11px] text-charcoal-600 print:text-black font-sans space-y-0.5 pt-0.5">
                <p>
                  <strong>ওয়েবসাইট:</strong> sunnahsourcebd.com &nbsp;|&nbsp;{" "}
                  <strong>হটলাইন:</strong> 01914-612007
                </p>
                <p>
                  <strong>ইমেইল:</strong> support@sunnahsourcebd.com &nbsp;|&nbsp;{" "}
                  <strong>ঠিকানা:</strong> লালমনিরহাট, বাংলাদেশ
                </p>
              </div>
            </div>

            {/* Right: Invoice Label & Order Number */}
            <div className="text-right shrink-0">
              <div className="inline-block px-3 py-1 rounded-md bg-brand-900 text-white font-black text-xs uppercase tracking-wider print:bg-black print:text-white">
                ডেলিভারি চালান ও মেমো (Packing Slip)
              </div>
              <div className="mt-2 space-y-0.5">
                <div className="text-base sm:text-lg font-mono font-black text-brand-900 print:text-black">
                  #{order.order_number}
                </div>
                <div className="text-[11px] text-charcoal-600 print:text-black">
                  তারিখ: <span className="font-semibold">{formatBanglaDateTime(order.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ======================================================== */}
        {/* 2. Invoice Meta Grid: Logistics, Payment & Courier Info  */}
        {/* ======================================================== */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-surface-canvas/80 border border-surface-border text-xs print:bg-white print:border-stone-800 print:p-2 mb-4">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-charcoal-500 uppercase block">ইনভয়েস / অর্ডার নং</span>
            <span className="font-mono font-black text-brand-900 text-xs sm:text-sm print:text-black">
              #{order.order_number}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-charcoal-500 uppercase block">পেমেন্ট পদ্ধতি</span>
            <span className="font-bold text-charcoal-900 text-xs print:text-black">
              {paymentMethodLabel}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-charcoal-500 uppercase block">পেমেন্ট স্ট্যাটাস</span>
            {isPaid ? (
              <span className="inline-block font-black text-emerald-800 text-xs bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 print:border-black print:text-black print:bg-transparent">
                পরিশোধিত (PAID)
              </span>
            ) : (
              <span className="inline-block font-black text-rose-800 text-xs bg-rose-100 px-2 py-0.5 rounded border border-rose-300 print:border-black print:text-black print:bg-transparent">
                বাকি / ক্যাশ অন ডেলিভারি (COD)
              </span>
            )}
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-charcoal-500 uppercase block">ডেলিভারি পার্টনার</span>
            <div className="font-bold text-charcoal-900 text-xs print:text-black">
              স্টিডফাস্ট কুরিয়ার (Steadfast Courier)
            </div>
            {isDispatched && (
              <div className="text-[10px] text-charcoal-600 print:text-black font-mono">
                {consignmentId && <span>CID: {consignmentId} </span>}
                {trackingCode && <span>Trk: {trackingCode}</span>}
              </div>
            )}
          </div>
        </section>

        {/* ======================================================== */}
        {/* 3. Recipient (গ্রাহকের বিবরণ) Box                        */}
        {/* ======================================================== */}
        <section className="border border-surface-border rounded-xl p-3.5 mb-4 bg-surface-canvas/40 print:bg-white print:border-stone-800 print:p-3">
          <div className="flex items-center gap-1.5 border-b border-surface-border pb-1.5 mb-2 font-black text-xs text-brand-900 uppercase tracking-wider print:text-black">
            <MapPin className="w-3.5 h-3.5 text-brand-800 print:text-black" />
            <span>প্রাপকের বিবরণ ও ডেলিভারি ঠিকানা (Recipient & Shipping Address)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-[10px] font-bold text-charcoal-500 uppercase block">গ্রাহকের নাম</span>
              <strong className="text-sm font-black text-charcoal-900 print:text-black block">
                {order.guest_name || "—"}
              </strong>
            </div>

            <div>
              <span className="text-[10px] font-bold text-charcoal-500 uppercase block">মোবাইল নম্বর</span>
              <strong className="text-sm sm:text-base font-mono font-black text-brand-900 print:text-black block tracking-wider">
                {order.guest_phone || "—"}
              </strong>
            </div>

            <div>
              <span className="text-[10px] font-bold text-charcoal-500 uppercase block">ডেলিভারি এরিয়া / জোন</span>
              <span className="font-bold text-charcoal-800 print:text-black">
                {shipping.zone === "inside_dhaka"
                  ? "ঢাকা সিটি কর্পোরেশন"
                  : shipping.zone === "outside_dhaka"
                  ? "ঢাকা সিটির বাইরে"
                  : "সাধারণ ডেলিভারি"}
              </span>
            </div>

            <div className="sm:col-span-3 pt-1">
              <span className="text-[10px] font-bold text-charcoal-500 uppercase block">পূর্ণাঙ্গ ডেলিভারি ঠিকানা</span>
              <p className="font-semibold text-charcoal-900 print:text-black leading-relaxed">
                {shipping.fullAddress || "—"}
                {(shipping.thana || shipping.district) && (
                  <span className="text-charcoal-600 print:text-black font-normal">
                    {" "}
                    ({[shipping.thana, shipping.district].filter(Boolean).join(", ")})
                  </span>
                )}
              </p>
              {shipping.notes && (
                <div className="mt-1 p-1.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs print:border-stone-800 print:bg-transparent print:text-black">
                  <strong>ডেলিভারি নোট:</strong> {shipping.notes}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 4. Order Items Table                                     */}
        {/* ======================================================== */}
        <section className="mb-4 overflow-hidden border border-surface-border rounded-xl print:border-stone-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-brand-900 text-white font-bold text-[11px] uppercase tracking-wider print:bg-stone-200 print:text-black border-b border-brand-950 print:border-stone-800">
              <tr>
                <th className="py-2 px-3 text-center w-10">ক্র.</th>
                <th className="py-2 px-3">পণ্যের বিবরণ ও সাইজ (Product & Variant)</th>
                <th className="py-2 px-3 text-center w-16">পরিমাণ</th>
                <th className="py-2 px-3 text-right w-24">একক মূল্য</th>
                <th className="py-2 px-3 text-right w-24">মোট মূল্য</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border print:divide-stone-800 text-charcoal-900 print:text-black">
              {items.length > 0 ? (
                items.map((item, idx) => (
                  <tr key={item.id || idx} className="even:bg-surface-canvas/30 print:even:bg-transparent avoid-break">
                    <td className="py-2 px-3 text-center font-bold text-charcoal-500 print:text-black">
                      {toBanglaDigits(idx + 1)}
                    </td>
                    <td className="py-2 px-3">
                      <p className="font-bold text-charcoal-900 print:text-black">
                        {item.product_title}
                      </p>
                      {item.variant_name && (
                        <span className="text-[10px] text-charcoal-600 print:text-black block">
                          সাইজ / ভ্যারিয়েন্ট: {item.variant_name}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-bold">
                      {toBanglaDigits(item.quantity)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      {formatBDT(item.unit_price)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold">
                      {formatBDT(item.line_total)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-charcoal-500">
                    {order.items_count
                      ? `${toBanglaDigits(order.items_count)}টি পণ্য সংরক্ষিত রয়েছে।`
                      : "কোনো পণ্য পাওয়া যায়নি।"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* ======================================================== */}
        {/* 5. Calculation, Grand Total & High-Visibility COD Badge  */}
        {/* ======================================================== */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 items-end avoid-break">
          {/* Left: Dynamic Parcel Tracking QR Code */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-surface-border bg-surface-canvas/40 print:bg-white print:border-stone-800">
            <div className="w-18 h-18 bg-white p-1 rounded-lg border border-surface-border shrink-0 flex items-center justify-center print:border-stone-800">
              <Image
                src={qrCodeApiUrl}
                alt="Order Tracking QR"
                width={64}
                height={64}
                className="w-full h-full object-contain"
                unoptimized
              />
            </div>
            <div className="text-[11px] space-y-0.5">
              <span className="font-bold text-brand-900 print:text-black block">
                পার্সেল ট্র্যাকিং কিউআর কোড
              </span>
              <p className="text-[10px] text-charcoal-600 print:text-black leading-tight">
                স্মার্টফোন ক্যামেরা দিয়ে স্ক্যান করে অর্ডারের লাইভ ট্র্যাকিং দেখুন।
              </p>
              <p className="text-[10px] text-brand-800 print:text-black font-mono truncate max-w-[190px]">
                sunnahsourcebd.com/track-order
              </p>
            </div>
          </div>

          {/* Right: Subtotal, Delivery, Discount & COD Banner */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-0.5 text-charcoal-700 print:text-black">
              <span>পণ্যসমূহের মোট মূল্য (Subtotal):</span>
              <span className="font-mono font-bold">{formatBDT(order.subtotal)}</span>
            </div>
            <div className="flex justify-between py-0.5 text-charcoal-700 print:text-black">
              <span>ডেলিভারি চার্জ (Delivery Fee):</span>
              <span className="font-mono font-bold">
                {order.delivery_fee === 0 ? "৳০ (ফ্রি)" : formatBDT(order.delivery_fee)}
              </span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between py-0.5 text-emerald-800 print:text-black font-semibold">
                <span>ছাড় / কুপন ({order.coupon_code || "অফার"}):</span>
                <span className="font-mono font-bold">- {formatBDT(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between py-1 border-t border-surface-border text-xs sm:text-sm font-bold text-charcoal-900 print:text-black print:border-stone-800">
              <span>সর্বমোট ইনভয়েস মূল্য:</span>
              <span className="font-mono font-black">{formatBDT(order.grand_total)}</span>
            </div>

            {/* High-Visibility COD Badge */}
            <div className="p-2.5 rounded-xl border-2 border-brand-900 bg-brand-50/70 print:bg-transparent print:border-black text-center mt-2">
              <span className="block text-[10px] font-bold text-brand-950 print:text-black uppercase tracking-wider">
                {isPaid ? "পরিশোধিত স্ট্যাটাস" : "কুরিয়ারে আদায়যোগ্য মোট টাকা (Total Cash on Delivery)"}
              </span>
              <span className="block text-lg sm:text-xl font-black font-mono text-brand-900 print:text-black leading-tight mt-0.5">
                {isPaid ? "৳০ (পরিশোধিত / PAID)" : formatBDT(order.grand_total)}
              </span>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 6. Footer Notes & Signatures                             */}
        {/* ======================================================== */}
        <footer className="pt-3 border-t-2 border-brand-900 print:border-stone-800 text-[11px] avoid-break">
          <div className="grid grid-cols-2 gap-8 text-center pt-6 pb-4">
            <div>
              <div className="border-t border-dashed border-charcoal-400 print:border-stone-800 max-w-[180px] mx-auto pt-1 font-bold text-charcoal-700 print:text-black">
                প্যাকেজিং যাচাইকারীর স্বাক্ষর
              </div>
              <span className="text-[10px] text-charcoal-500 print:text-black block mt-0.5">
                সুন্নাহ সোর্স ওয়্যারহাউজ
              </span>
            </div>
            <div>
              <div className="border-t border-dashed border-charcoal-400 print:border-stone-800 max-w-[180px] mx-auto pt-1 font-bold text-charcoal-700 print:text-black">
                গ্রাহকের স্বাক্ষর
              </div>
              <span className="text-[10px] text-charcoal-500 print:text-black block mt-0.5">
                পণ্য ও চালান বুঝে পেয়েছি
              </span>
            </div>
          </div>

          <div className="text-center mt-3 pt-2 border-t border-surface-border text-charcoal-600 print:text-black print:border-stone-800 space-y-0.5">
            <p className="font-bold text-brand-900 print:text-black">
              পণ্য গ্রহণের সময় ডেলিভারিম্যানের সামনে চেক করে মূল্য পরিশোধ করুন।
            </p>
            <p className="font-medium text-charcoal-500 print:text-black text-[10px]">
              সুন্নাহ সোর্স-এর পাশে থাকার জন্য আন্তরিক জাযাকাল্লাহু খাইরান।
            </p>
          </div>
        </footer>
      </article>
    </div>
  );
}

// ─── Modal Wrapper Component for 1-Click Interactive Preview ───────────────────

export interface OrderInvoiceModalProps {
  order: AdminOrder | AdminOrderWithItems;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderInvoiceModal({ order, isOpen, onClose }: OrderInvoiceModalProps) {
  const [fullOrder, setFullOrder] = useState<AdminOrderWithItems | null>(
    (order as AdminOrderWithItems).items ? (order as AdminOrderWithItems) : null
  );
  const [isLoading, setIsLoading] = useState<boolean>(!(order as AdminOrderWithItems).items);
  const [error, setError] = useState<string | null>(null);

  // Fetch full items if order is shallow from table list
  useEffect(() => {
    if (!isOpen) return;

    if ((order as AdminOrderWithItems).items && (order as AdminOrderWithItems).items.length > 0) {
      setFullOrder(order as AdminOrderWithItems);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    getAdminOrderById(order.id)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setFullOrder(res.data);
        } else {
          setError(res.message || "অর্ডারের বিস্তারিত তথ্য লোড করা যায়নি।");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err?.message || "সার্ভার এরর ঘটেছে।");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, order]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-charcoal-900/75 backdrop-blur-xs font-bengali">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col border border-surface-border overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        {/* Screen Only Interactive Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-border bg-charcoal-900 text-white shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-800 text-accent-amber flex items-center justify-center shrink-0">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">চালান ও প্যাকিং স্লিপ প্রিভিউ</h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-charcoal-800 text-stone-300">
                  #{order.order_number}
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                A4 বা হাফ-A4 প্যাকিং স্লিপ সাইজে সরাসরি প্রিন্ট করুন
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-700 hover:bg-brand-600 text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>এখনই প্রিন্ট করুন (Print Now)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-stone-300 hover:text-white hover:bg-charcoal-800 transition-colors cursor-pointer"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-100 print:bg-white print:p-0">
          {isLoading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-brand-700 mx-auto" />
              <p className="text-xs font-bold text-charcoal-700">
                চালানের পণ্য তালিকা ও বিবরণ প্রস্তুত হচ্ছে...
              </p>
            </div>
          ) : error ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-rose-200 max-w-md mx-auto my-10 space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
              <h4 className="text-sm font-bold text-rose-900">{error}</h4>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-charcoal-800 text-white text-xs font-bold"
              >
                বন্ধ করুন
              </button>
            </div>
          ) : fullOrder ? (
            <OrderInvoicePrintable order={fullOrder} onClose={onClose} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── 1-Click Print Slip Action Button Component ────────────────────────────────

export interface OrderInvoiceModalButtonProps {
  order: AdminOrder | AdminOrderWithItems;
  variant?: "button" | "compact" | "icon";
  className?: string;
}

export function OrderInvoiceModalButton({
  order,
  variant = "compact",
  className = "",
}: OrderInvoiceModalButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (variant === "icon") {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`p-1.5 rounded-lg text-charcoal-600 hover:text-brand-900 hover:bg-brand-50 transition-colors cursor-pointer ${className}`}
          title="চালান প্রিন্ট করুন"
        >
          <Printer className="w-4 h-4" />
        </button>
        <OrderInvoiceModal order={order} isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </>
    );
  }

  if (variant === "compact") {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface-canvas hover:bg-stone-100 text-charcoal-700 hover:text-brand-900 border border-surface-border text-xs font-bold transition-all shadow-2xs cursor-pointer ${className}`}
          title="চালান ও প্যাকিং স্লিপ প্রিন্ট করুন"
        >
          <Printer className="w-3.5 h-3.5 text-charcoal-500" />
          <span>প্রিন্ট চালান</span>
        </button>
        <OrderInvoiceModal order={order} isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-50 hover:bg-brand-100/90 text-brand-900 border border-brand-200/90 font-bold text-xs sm:text-sm transition-all shadow-xs hover:shadow-sm active:scale-[0.98] cursor-pointer ${className}`}
        title="অর্ডারের চালান ও প্যাকিং স্লিপ প্রিন্ট করুন"
      >
        <Printer className="w-4 h-4 text-brand-700 shrink-0" />
        <span>প্রিন্ট চালান (Print Slip)</span>
      </button>
      <OrderInvoiceModal order={order} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

