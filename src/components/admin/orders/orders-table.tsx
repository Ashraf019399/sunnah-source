import React from "react";
import Link from "next/link";
import {
  ShoppingBag,
  ExternalLink,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  ChevronRight,
  Eye,
} from "lucide-react";
import {
  AdminOrder,
  ORDER_STATUS_CONFIG,
  PAYMENT_METHOD_CONFIG,
  PAYMENT_STATUS_CONFIG,
  DELIVERY_ZONE_CONFIG,
} from "@/types/orders.types";
import { formatBDT, formatBanglaDateTime } from "@/lib/utils";

interface OrdersTableProps {
  orders: AdminOrder[];
}

export function OrdersTable({ orders }: OrdersTableProps) {
  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-10 sm:p-14 border border-surface-border text-center shadow-subtle flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h3 className="text-lg font-bold text-charcoal-900">
            এখনও কোনো অর্ডার পাওয়া যায়নি
          </h3>
          <p className="text-xs sm:text-sm text-charcoal-500 leading-relaxed">
            কোনো কাস্টমার অর্ডার সম্পন্ন করলে তা সাথে সাথে এখানে প্রদর্শিত হবে।
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ======================================================== */}
      {/* 1. Desktop Table View (lg:block)                          */}
      {/* ======================================================== */}
      <div className="hidden lg:block bg-white rounded-3xl border border-surface-border shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-border bg-surface-canvas/60 text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                <th className="py-4 px-5">অর্ডার নম্বর</th>
                <th className="py-4 px-4">গ্রাহক</th>
                <th className="py-4 px-4">ফোন</th>
                <th className="py-4 px-4">ডেলিভারি এরিয়া</th>
                <th className="py-4 px-4">মোট মূল্য</th>
                <th className="py-4 px-4">পেমেন্ট</th>
                <th className="py-4 px-4">স্ট্যাটাস</th>
                <th className="py-4 px-4">তারিখ ও সময়</th>
                <th className="py-4 px-5 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/70 text-xs sm:text-sm">
              {orders.map((order) => {
                const statusCfg =
                  ORDER_STATUS_CONFIG[order.order_status] ||
                  ORDER_STATUS_CONFIG.pending;
                const paymentCfg =
                  PAYMENT_STATUS_CONFIG[order.payment_status] ||
                  PAYMENT_STATUS_CONFIG.unpaid;
                const paymentMethodCfg =
                  PAYMENT_METHOD_CONFIG[order.payment_method];

                const zone = order.shipping_address?.zone;
                const district = order.shipping_address?.district;
                const areaLabel = district
                  ? `${district}${zone === "inside_dhaka" ? " (ঢাকা)" : ""}`
                  : zone
                  ? DELIVERY_ZONE_CONFIG[zone]?.shortBn || zone
                  : "—";

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-brand-50/30 transition-colors group"
                  >
                    {/* Order Number */}
                    <td className="py-4 px-5">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono font-bold text-brand-800 hover:text-brand-900 hover:underline flex items-center gap-1.5"
                      >
                        <span>{order.order_number}</span>
                      </Link>
                    </td>

                    {/* Customer Name */}
                    <td className="py-4 px-4">
                      <div className="font-semibold text-charcoal-900 truncate max-w-[140px]">
                        {order.guest_name || "—"}
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="py-4 px-4 font-mono text-charcoal-700 whitespace-nowrap">
                      {order.guest_phone || "—"}
                    </td>

                    {/* Delivery Area */}
                    <td className="py-4 px-4 text-charcoal-700 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="truncate max-w-[120px]">{areaLabel}</span>
                      </span>
                    </td>

                    {/* Grand Total */}
                    <td className="py-4 px-4 font-bold text-brand-900 whitespace-nowrap">
                      {formatBDT(order.grand_total)}
                    </td>

                    {/* Payment Info */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-[11px] font-semibold text-charcoal-700 truncate max-w-[110px]">
                          {paymentMethodCfg?.shortBn || order.payment_method}
                        </div>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${paymentCfg.badgeClass}`}
                        >
                          {paymentCfg.labelBn}
                        </span>
                      </div>
                    </td>

                    {/* Order Status */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusCfg.badgeClass}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotClass}`}
                        />
                        <span>{statusCfg.labelBn}</span>
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="py-4 px-4 text-xs text-charcoal-500 whitespace-nowrap">
                      {formatBanglaDateTime(order.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-canvas hover:bg-brand-700 hover:text-white border border-surface-border text-charcoal-700 text-xs font-bold transition-all shadow-2xs group-hover:border-brand-700/50"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>বিস্তারিত</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. Mobile Responsive Cards View (lg:hidden)               */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 lg:hidden">
        {orders.map((order) => {
          const statusCfg =
            ORDER_STATUS_CONFIG[order.order_status] ||
            ORDER_STATUS_CONFIG.pending;
          const paymentCfg =
            PAYMENT_STATUS_CONFIG[order.payment_status] ||
            PAYMENT_STATUS_CONFIG.unpaid;
          const paymentMethodCfg =
            PAYMENT_METHOD_CONFIG[order.payment_method];

          const zone = order.shipping_address?.zone;
          const district = order.shipping_address?.district;
          const areaLabel = district
            ? `${district}${zone === "inside_dhaka" ? " (ঢাকা)" : ""}`
            : zone
            ? DELIVERY_ZONE_CONFIG[zone]?.shortBn || zone
            : "—";

          return (
            <div
              key={order.id}
              className="bg-white rounded-2xl p-4 border border-surface-border shadow-subtle space-y-3.5 hover:border-brand-700/40 transition-colors"
            >
              {/* Card Header: Order # & Status Badge */}
              <div className="flex items-center justify-between gap-2 border-b border-surface-border/60 pb-3">
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="font-mono font-bold text-sm text-brand-800 hover:text-brand-900"
                >
                  {order.order_number}
                </Link>

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusCfg.badgeClass}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotClass}`}
                  />
                  <span>{statusCfg.labelBn}</span>
                </span>
              </div>

              {/* Customer & Location */}
              <div className="space-y-1.5 text-xs text-charcoal-700">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-charcoal-900 text-sm">
                    {order.guest_name || "—"}
                  </span>
                  <span className="font-bold text-brand-900 text-sm">
                    {formatBDT(order.grand_total)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-stone-500 font-mono text-xs">
                  <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>{order.guest_phone}</span>
                </div>

                <div className="flex items-center gap-2 text-stone-500 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span className="truncate">{areaLabel}</span>
                </div>
              </div>

              {/* Payment & Date Footer */}
              <div className="pt-2 border-t border-surface-border/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-stone-500">
                    {paymentMethodCfg?.shortBn || order.payment_method}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${paymentCfg.badgeClass}`}
                  >
                    {paymentCfg.labelBn}
                  </span>
                </div>

                <Link
                  href={`/admin/orders/${order.id}`}
                  className="inline-flex items-center gap-1 font-bold text-brand-800 hover:text-brand-900 text-xs"
                >
                  <span>বিস্তারিত</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
