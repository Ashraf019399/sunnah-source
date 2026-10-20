"use client";

import React from "react";
import Image from "next/image";
import {
  Package,
  MapPin,
  Phone,
  CreditCard,
  ExternalLink,
  MessageCircle,
  Truck,
  Tag,
  HelpCircle,
} from "lucide-react";
import { PublicSafeOrderDTO } from "@/lib/actions/order-tracking-actions";
import { formatBDT, toBanglaDigits } from "@/lib/utils";

interface OrderTrackingSummaryProps {
  order: PublicSafeOrderDTO;
}

export const OrderTrackingSummary: React.FC<OrderTrackingSummaryProps> = ({ order }) => {
  const isPaid = order.paymentStatus === "paid";
  const isRefunded = order.paymentStatus === "refunded";

  const paymentMethodLabel =
    order.paymentMethod === "cod"
      ? "ক্যাশ অন ডেলিভারি (COD)"
      : order.paymentMethod === "bkash"
      ? "বিকাশ (bKash)"
      : order.paymentMethod === "nagad"
      ? "নগদ (Nagad)"
      : order.paymentMethod === "sslcommerz"
      ? "অনলাইন পেমেন্ট (SSLCommerz)"
      : "ক্যাশ অন ডেলিভারি";

  const whatsappMessage = encodeURIComponent(
    `আসসালামু আলাইকুম, আমি সুন্নাহ সোর্স অর্ডার নম্বর ${order.orderNumber} এর বিস্তারিত জানতে চাচ্ছি।`
  );

  return (
    <div className="space-y-6">
      {/* 1. Order Key Facts Card */}
      <div className="bg-white rounded-2xl border border-surface-border shadow-card p-5 sm:p-7">
        <h3 className="text-base font-black text-charcoal-900 tracking-tight mb-4 flex items-center gap-2">
          <Truck className="w-5 h-5 text-brand-700" />
          <span>অর্ডারের মূল তথ্য</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs sm:text-sm">
          {/* Order Number */}
          <div className="p-3.5 rounded-xl bg-surface-canvas border border-surface-border/60">
            <span className="text-[11px] font-bold text-charcoal-400 uppercase tracking-wider block mb-1">
              অর্ডার নম্বর
            </span>
            <span className="font-mono font-bold text-brand-900 text-sm sm:text-base">
              {order.orderNumber}
            </span>
          </div>

          {/* Masked Customer Phone */}
          <div className="p-3.5 rounded-xl bg-surface-canvas border border-surface-border/60">
            <span className="text-[11px] font-bold text-charcoal-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />
              <span>মোবাইল নম্বর</span>
            </span>
            <span className="font-mono font-bold text-charcoal-800 text-sm sm:text-base">
              {order.maskedPhone}
            </span>
          </div>

          {/* Delivery Destination */}
          <div className="p-3.5 rounded-xl bg-surface-canvas border border-surface-border/60">
            <span className="text-[11px] font-bold text-charcoal-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>ডেলিভারি এলাকা</span>
            </span>
            <span className="font-bold text-charcoal-800 text-xs sm:text-sm block truncate">
              {order.maskedAddress}
            </span>
            <span className="text-[11px] text-charcoal-400 block mt-0.5">
              {order.deliveryZone === "inside_dhaka" ? "ঢাকা সিটি (২৪-৪৮ ঘণ্টা)" : "ঢাকা সিটির বাইরে (২-৩ কার্যদিবস)"}
            </span>
          </div>

          {/* Payment Status */}
          <div className="p-3.5 rounded-xl bg-surface-canvas border border-surface-border/60 sm:col-span-2 lg:col-span-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-charcoal-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5" />
                <span>পেমেন্ট তথ্য</span>
              </span>
              <p className="font-semibold text-charcoal-700 text-xs sm:text-sm">
                মেথড: {paymentMethodLabel}
              </p>
            </div>

            <div>
              {isPaid ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  পরিশোধিত (Paid)
                </span>
              ) : isRefunded ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-700 border border-stone-300">
                  রিফান্ডকৃত (Refunded)
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  অপরিশোধিত (Unpaid)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Order Line Items Card */}
      <div className="bg-white rounded-2xl border border-surface-border shadow-card p-5 sm:p-7">
        <h3 className="text-base font-black text-charcoal-900 tracking-tight mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-brand-700" />
          <span>অর্ডারের পণ্যসমূহ ({toBanglaDigits(order.items.length)}টি)</span>
        </h3>

        <div className="divide-y divide-surface-border">
          {order.items.map((item, idx) => (
            <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Product Thumbnail */}
                <div className="w-14 h-14 rounded-xl bg-surface-canvas border border-surface-border shrink-0 overflow-hidden relative flex items-center justify-center">
                  {item.productImage ? (
                    <Image
                      src={item.productImage}
                      alt={item.productTitle}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-6 h-6 text-charcoal-400" />
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-charcoal-900 leading-snug truncate">
                    {item.productTitle}
                  </h4>
                  {item.variantName && (
                    <p className="text-[11px] text-brand-800 font-medium mt-0.5">
                      {item.variantName}
                    </p>
                  )}
                  <p className="text-[11px] text-charcoal-400 mt-0.5">
                    {toBanglaDigits(item.quantity)} x {formatBDT(item.unitPrice)}
                  </p>
                </div>
              </div>

              {/* Line Total */}
              <div className="text-right shrink-0">
                <span className="font-mono font-bold text-xs sm:text-sm text-charcoal-900">
                  {formatBDT(item.lineTotal)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Summary Breakdown */}
        <div className="mt-6 pt-5 border-t border-surface-border space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between items-center text-charcoal-600">
            <span>পণ্যগুলোর মোট মূল্য:</span>
            <span className="font-mono font-semibold">{formatBDT(order.subtotal)}</span>
          </div>

          <div className="flex justify-between items-center text-charcoal-600">
            <span>ডেলিভারি চার্জ:</span>
            <span className="font-mono font-semibold">{formatBDT(order.deliveryFee)}</span>
          </div>

          {order.discountAmount > 0 && (
            <div className="flex justify-between items-center text-emerald-700 bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
              <span className="flex items-center gap-1.5 font-medium">
                <Tag className="w-3.5 h-3.5" />
                <span>কুপন ছাড় {order.couponCode ? `(${order.couponCode})` : ""}:</span>
              </span>
              <span className="font-mono font-bold">-{formatBDT(order.discountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-3 border-t border-surface-border/80 text-sm sm:text-base font-black text-charcoal-900">
            <span>সর্বমোট প্রদেয় মূল্য:</span>
            <span className="font-mono text-brand-700 text-base sm:text-lg font-extrabold">
              {formatBDT(order.grandTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Customer Support Actions */}
      <div className="bg-gradient-to-br from-brand-50 to-white rounded-2xl border border-brand-200/60 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-brand-900 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-brand-700" />
              <span>ডেলিভারি সম্পর্কিত কোনো প্রশ্ন আছে?</span>
            </h4>
            <p className="text-xs text-charcoal-600 leading-relaxed">
              যেকোনো জিজ্ঞাসা বা জরুরি প্রয়োজনে আমাদের কাস্টমার কেয়ারে যোগাযোগ করুন।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`https://wa.me/8801914612007?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs sm:text-sm font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>হোয়াটসঅ্যাপ মেসেজ</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>

            <a
              href="tel:01914612007"
              className="inline-flex items-center gap-2 bg-white hover:bg-stone-50 border border-surface-border text-charcoal-800 text-xs sm:text-sm font-bold py-2.5 px-4 rounded-xl transition-all"
            >
              <Phone className="w-3.5 h-3.5 text-brand-700" />
              <span>০১৯১৪-৬১২০০৭</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
