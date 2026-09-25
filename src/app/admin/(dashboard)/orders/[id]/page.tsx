import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminOrderById } from "@/lib/actions/admin-order-actions";
import { OrderStatusUpdater } from "@/components/admin/orders/order-status-updater";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Calendar,
  CreditCard,
  Package,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  ORDER_STATUS_CONFIG,
  PAYMENT_METHOD_CONFIG,
  PAYMENT_STATUS_CONFIG,
  DELIVERY_ZONE_CONFIG,
} from "@/types/orders.types";
import { formatBDT, formatBanglaDateTime, toBanglaDigits } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface OrderDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: OrderDetailsPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `অর্ডার বিবরণ #${id} | Sunnah Source Admin`,
  };
}

export default async function AdminOrderDetailsPage({
  params,
}: OrderDetailsPageProps) {
  const { id } = await params;
  const result = await getAdminOrderById(id);

  if (!result.success || !result.data) {
    return (
      <div className="space-y-6 font-bengali">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-brand-800 hover:text-brand-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>সকল অর্ডার-এ ফিরে যান</span>
        </Link>

        <div className="bg-white rounded-3xl p-10 sm:p-14 border border-surface-border text-center shadow-subtle flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-w-sm">
            <h2 className="text-xl font-bold text-charcoal-900">
              অর্ডারটি পাওয়া যায়নি
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-500 leading-relaxed">
              অনুরোধকৃত অর্ডারটি ডাটাবেজে পাওয়া যায়নি অথবা এটি মুছে ফেলা হয়েছে।
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="px-5 py-2.5 rounded-xl bg-brand-900 text-white font-bold text-xs sm:text-sm hover:bg-brand-800 transition-colors"
          >
            অর্ডার তালিকায় যান
          </Link>
        </div>
      </div>
    );
  }

  const order = result.data;
  const items = order.items || [];
  const shipping = order.shipping_address || ({} as any);

  const paymentCfg =
    PAYMENT_STATUS_CONFIG[order.payment_status] || PAYMENT_STATUS_CONFIG.unpaid;
  const paymentMethodCfg = PAYMENT_METHOD_CONFIG[order.payment_method];

  const zoneConfig = shipping.zone
    ? DELIVERY_ZONE_CONFIG[shipping.zone]
    : undefined;

  return (
    <div className="space-y-6 font-bengali">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border/70 pb-4">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-brand-800 hover:text-brand-900 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>সকল অর্ডার-এ ফিরে যান</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs text-charcoal-500">অর্ডার তৈরি:</span>
          <span className="text-xs font-bold text-charcoal-800">
            {formatBanglaDateTime(order.created_at)}
          </span>
        </div>
      </div>

      {/* Order Header Summary Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-surface-border shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-lg bg-brand-50 text-brand-800 font-mono text-xs font-bold">
              #{order.order_number}
            </span>
            <span className="text-xs text-charcoal-500">
              ({toBanglaDigits(items.length)} টি পণ্য)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-charcoal-900 tracking-tight">
            গ্রাহক: {order.guest_name || "—"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-charcoal-500 font-bold uppercase tracking-wider">
              সর্বমোট মূল্য
            </div>
            <div className="text-2xl font-black text-brand-900 font-sans">
              {formatBDT(order.grand_total)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left (Products & Summary), Right (Customer, Delivery, Status) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ======================================================== */}
        {/* Left Column (2 Cols on lg): Items List & Price Summary    */}
        {/* ======================================================== */}
        <div className="lg:col-span-2 space-y-6">
          {/* Products List Card */}
          <div className="bg-white rounded-3xl border border-surface-border shadow-subtle overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-surface-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-brand-700" />
                <h2 className="text-base font-bold text-charcoal-900">
                  অর্ডারের পণ্যসমূহ ({toBanglaDigits(items.length)})
                </h2>
              </div>
            </div>

            <div className="divide-y divide-surface-border">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-canvas/50 transition-colors"
                >
                  {/* Product Info & Thumbnail */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-surface-canvas border border-surface-border overflow-hidden shrink-0 flex items-center justify-center relative">
                      {item.product_image ? (
                        <Image
                          src={item.product_image}
                          alt={item.product_title}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <ShoppingBag className="w-7 h-7 text-stone-400" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-bold text-sm sm:text-base text-charcoal-900">
                        {item.product_title}
                      </h3>
                      {item.variant_name && (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                          {item.variant_name}
                        </span>
                      )}
                      <div className="text-xs text-charcoal-500 font-sans">
                        একক মূল্য: {formatBDT(item.unit_price)} ×{" "}
                        {toBanglaDigits(item.quantity)}
                      </div>
                    </div>
                  </div>

                  {/* Quantity and Line Total */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-surface-border/60 pt-2 sm:pt-0">
                    <span className="text-xs text-charcoal-500 sm:hidden">
                      সাবটোটাল:
                    </span>
                    <span className="text-base font-bold text-brand-900 font-sans">
                      {formatBDT(item.line_total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Cost Summary Breakdown */}
            <div className="p-5 sm:p-6 bg-surface-canvas/60 border-t border-surface-border space-y-3">
              <div className="flex items-center justify-between text-xs sm:text-sm text-charcoal-700">
                <span>পণ্যসমূহের মোট মূল্য (Subtotal):</span>
                <span className="font-bold font-sans">
                  {formatBDT(order.subtotal)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm text-charcoal-700">
                <span>ডেলিভারি চার্জ (Delivery Fee):</span>
                <span className="font-bold font-sans">
                  {order.delivery_fee === 0
                    ? "ফ্রি ডেলিভারি"
                    : formatBDT(order.delivery_fee)}
                </span>
              </div>

              {order.discount_amount > 0 && (
                <div className="flex items-center justify-between text-xs sm:text-sm text-emerald-700">
                  <div className="flex items-center gap-1.5">
                    <span>ডিসকাউন্ট (ছাড়):</span>
                    {order.coupon_code && (
                      <span className="text-[11px] font-mono uppercase bg-emerald-100/80 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                        {order.coupon_code}
                      </span>
                    )}
                  </div>
                  <span className="font-bold font-sans">
                    -{formatBDT(order.discount_amount)}
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-surface-border flex items-center justify-between">
                <div>
                  <span className="text-sm sm:text-base font-bold text-charcoal-900 block">
                    সর্বমোট পরিশোধযোগ্য (Grand Total):
                  </span>
                  <span className="text-[11px] text-charcoal-500">
                    ভ্যাট ও ডেলিভারি অন্তর্ভুক্ত
                  </span>
                </div>
                <span className="text-xl sm:text-2xl font-black text-brand-900 font-sans">
                  {formatBDT(order.grand_total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* Right Column: Status Updater, Customer & Delivery Info    */}
        {/* ======================================================== */}
        <div className="space-y-6">
          {/* 1. Status Update Control */}
          <OrderStatusUpdater
            orderId={order.id}
            currentStatus={order.order_status}
          />

          {/* 2. Customer Information Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-surface-border shadow-subtle space-y-4">
            <div className="flex items-center gap-2 border-b border-surface-border/70 pb-3">
              <User className="w-4 h-4 text-brand-700" />
              <h3 className="text-sm font-bold text-charcoal-900 uppercase tracking-wider">
                গ্রাহকের তথ্য (Customer Information)
              </h3>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <span className="text-charcoal-500 block text-xs">নাম:</span>
                <span className="font-bold text-charcoal-900 text-sm">
                  {order.guest_name || "—"}
                </span>
              </div>

              <div>
                <span className="text-charcoal-500 block text-xs">মোবাইল নম্বর:</span>
                <a
                  href={`tel:${order.guest_phone}`}
                  className="font-mono font-bold text-brand-800 hover:text-brand-900 hover:underline inline-flex items-center gap-1.5 mt-0.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{order.guest_phone || "—"}</span>
                </a>
              </div>

              <div>
                <span className="text-charcoal-500 block text-xs">ইমেইল:</span>
                <span className="text-charcoal-700 font-sans">
                  {(shipping as any).email || "উপলব্ধ নয়"}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Delivery Information Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-surface-border shadow-subtle space-y-4">
            <div className="flex items-center gap-2 border-b border-surface-border/70 pb-3">
              <MapPin className="w-4 h-4 text-brand-700" />
              <h3 className="text-sm font-bold text-charcoal-900 uppercase tracking-wider">
                ডেলিভারি বিবরণ (Delivery Information)
              </h3>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <span className="text-charcoal-500 block text-xs">ডেলিভারি এরিয়া:</span>
                <span className="font-semibold text-charcoal-900 inline-block mt-0.5">
                  {zoneConfig?.labelBn || shipping.zone || "—"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-charcoal-500 block text-xs">জেলা:</span>
                  <span className="font-semibold text-charcoal-900">
                    {shipping.district || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-charcoal-500 block text-xs">থানা / উপজেলা:</span>
                  <span className="font-semibold text-charcoal-900">
                    {shipping.thana || "—"}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-charcoal-500 block text-xs">সম্পূর্ণ ঠিকানা:</span>
                <p className="font-semibold text-charcoal-900 leading-relaxed mt-0.5 bg-surface-canvas p-3 rounded-xl border border-surface-border">
                  {shipping.fullAddress || "—"}
                </p>
              </div>

              {shipping.notes && (
                <div>
                  <span className="text-charcoal-500 block text-xs">ডেলিভারি নোটস:</span>
                  <p className="text-xs text-stone-600 bg-amber-50/60 border border-amber-200/80 p-3 rounded-xl mt-0.5">
                    {shipping.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 4. Order & Payment Information Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-surface-border shadow-subtle space-y-4">
            <div className="flex items-center gap-2 border-b border-surface-border/70 pb-3">
              <CreditCard className="w-4 h-4 text-brand-700" />
              <h3 className="text-sm font-bold text-charcoal-900 uppercase tracking-wider">
                পেমেন্ট ও অর্ডার বিবরণ (Payment & Info)
              </h3>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-center justify-between">
                <span className="text-charcoal-500">পেমেন্ট মেথড:</span>
                <span className="font-bold text-charcoal-900">
                  {paymentMethodCfg?.labelBn || order.payment_method}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-charcoal-500">পেমেন্ট স্ট্যাটাস:</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${paymentCfg.badgeClass}`}
                >
                  {paymentCfg.labelBn}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-charcoal-500">অর্ডার নম্বর:</span>
                <span className="font-mono font-bold text-brand-900">
                  {order.order_number}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-charcoal-500">অর্ডার আইডি (UUID):</span>
                <span className="font-mono text-[10px] text-stone-400 truncate max-w-[150px]">
                  {order.id}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
