"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  Search,
  Truck,
  Printer,
  ChevronRight,
  ShoppingBag,
  ArrowRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  Phone,
  Tag,
  Loader2,
  X,
  RotateCcw,
} from "lucide-react";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { PrintableInvoice, InvoiceOrderData } from "@/components/checkout/printable-invoice";
import { WhatsAppIcon } from "@/components/commerce/whatsapp-order-button";
import {
  getCustomerOrdersByPhone,
  CustomerOrderDTO,
} from "@/lib/actions/customer-order-actions";
import { formatBDT, formatBanglaDateTime, isValidBDPhone, normalizeBDPhone } from "@/lib/utils";
import { OrderStatus } from "@/types/commerce.types";

const STORAGE_PHONE_KEY = "sunnah_customer_phone";

export default function CustomerOrdersPage() {
  const [phoneInput, setPhoneInput] = useState("");
  const [searchedPhone, setSearchedPhone] = useState("");
  const [orders, setOrders] = useState<CustomerOrderDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selected order for Printable Invoice Modal
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<InvoiceOrderData | null>(null);

  // Perform search
  const handleFetchOrders = useCallback(async (targetPhone: string) => {
    const cleanRaw = targetPhone.trim();
    if (!cleanRaw) {
      setErrorMessage("অনুগ্রহ করে আপনার মোবাইল নম্বরটি প্রদান করুন।");
      return;
    }

    const normalized = normalizeBDPhone(cleanRaw);
    if (!isValidBDPhone(cleanRaw) && !isValidBDPhone(normalized)) {
      setErrorMessage("অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await getCustomerOrdersByPhone(cleanRaw);

      if (result.success) {
        setOrders(result.orders);
        setSearchedPhone(cleanRaw);
        setHasSearched(true);
        // Persist verified phone for future visits
        try {
          if (typeof window !== "undefined") {
            window.localStorage?.setItem(STORAGE_PHONE_KEY, cleanRaw);
          }
        } catch {
          // Ignore quota errors
        }
      } else {
        setOrders([]);
        setHasSearched(true);
        setErrorMessage(result.message || "অর্ডার লোড করতে সমস্যা হয়েছে।");
      }
    } catch {
      setErrorMessage("সার্ভারে সমস্যা দেখা দিয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-detect previously used phone on initial mount
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const savedPhone = window.localStorage?.getItem(STORAGE_PHONE_KEY);
        if (savedPhone && isValidBDPhone(savedPhone)) {
          setPhoneInput(savedPhone);
          handleFetchOrders(savedPhone);
          return;
        }

        // Try reading phone from latest placed order
        const latestOrderStr = window.localStorage?.getItem("sunnah_latest_order");
        if (latestOrderStr) {
          const parsed = JSON.parse(latestOrderStr);
          const orderPhone = parsed.phone || parsed.customerPhone;
          if (orderPhone && isValidBDPhone(orderPhone)) {
            setPhoneInput(orderPhone);
            handleFetchOrders(orderPhone);
          }
        }
      }
    } catch {
      // Ignore storage read errors
    }
  }, [handleFetchOrders]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFetchOrders(phoneInput);
  };

  const handleResetSearch = () => {
    setOrders([]);
    setHasSearched(false);
    setPhoneInput("");
    setSearchedPhone("");
    setErrorMessage(null);
    try {
      if (typeof window !== "undefined") {
        window.localStorage?.removeItem(STORAGE_PHONE_KEY);
      }
    } catch {
      // Ignore
    }
  };

  // Status badge config
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return {
          label: "পেন্ডিং (অপেক্ষমান)",
          className: "bg-amber-50 text-amber-800 border-amber-200",
        };
      case "confirmed":
      case "processing":
        return {
          label: "প্রসেসিং (প্রক্রিয়াধীন)",
          className: "bg-blue-50 text-blue-800 border-blue-200",
        };
      case "shipped":
        return {
          label: "কুরিয়ারে হস্তান্তর",
          className: "bg-purple-50 text-purple-800 border-purple-200",
        };
      case "delivered":
        return {
          label: "ডেলিভার্ড (সম্পন্ন)",
          className: "bg-emerald-50 text-emerald-800 border-emerald-200",
        };
      case "cancelled":
        return {
          label: "বাতিল (Cancelled)",
          className: "bg-red-50 text-red-800 border-red-200",
        };
      case "returned":
        return {
          label: "ফেরত (Returned)",
          className: "bg-stone-100 text-stone-700 border-stone-300",
        };
      default:
        return {
          label: status,
          className: "bg-stone-50 text-stone-700 border-stone-200",
        };
    }
  };

  // Convert order to PrintableInvoice format
  const handleOpenInvoice = (order: CustomerOrderDTO) => {
    const invoiceData: InvoiceOrderData = {
      orderNumber: order.order_number,
      fullName: order.customer_name || "সম্মানিত গ্রাহক",
      phone: order.customer_phone || searchedPhone,
      shippingAddress: order.delivery_address,
      subtotal: order.subtotal,
      deliveryFee: order.delivery_fee,
      discountAmount: order.discount_amount,
      couponCode: order.coupon_code,
      grandTotal: order.grand_total,
      createdAt: order.created_at,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        variantId: item.id,
        title: item.productTitle,
        titleBn: item.productTitle,
        variantName: item.variantName || "",
        unitPrice: item.unitPrice,
        image: item.image || "",
        weightLabel: item.variantName || "",
        quantity: item.quantity,
        maxStock: 99,
      })),
    };
    setSelectedInvoiceOrder(invoiceData);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-canvas font-bengali">
      {/* 1. Header & Navigation */}
      <AnnouncementBar />
      <Header />

      {/* 2. Main Page Content */}
      <main className="flex-1 py-8 sm:py-12 px-4">
        <div className="container mx-auto max-w-5xl space-y-8">
          {/* Breadcrumb Navigation */}
          <nav aria-label="ব্রেডক্রাম্ব" className="flex items-center gap-1.5 text-xs text-charcoal-500">
            <Link href="/" className="hover:text-brand-700 transition-colors font-medium">
              হোম
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <Link href="/shop" className="hover:text-brand-700 transition-colors font-medium">
              দোকান
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span className="text-brand-900 font-bold">আমার অর্ডারসমূহ</span>
          </nav>

          {/* Page Heading & Hero Card */}
          <div className="bg-white rounded-3xl border border-surface-border p-6 sm:p-8 shadow-card space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-charcoal-900 tracking-tight">
                      আমার অর্ডারসমূহ (My Orders)
                    </h1>
                    <p className="text-xs sm:text-sm text-charcoal-500 pt-0.5">
                      আপনার মোবাইল নম্বর দিয়ে পূর্ববর্তী সমস্ত অর্ডারের অগ্রগতি ও রসিদ দেখুন।
                    </p>
                  </div>
                </div>
              </div>

              {hasSearched && (
                <button
                  type="button"
                  onClick={handleResetSearch}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-charcoal-600 hover:text-brand-700 px-3 py-1.5 rounded-xl border border-surface-border hover:bg-stone-50 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>অন্য নম্বর দিয়ে খুঁজুন</span>
                </button>
              )}
            </div>

            {/* Phone Lookup Bar */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <label htmlFor="customer-phone" className="block text-xs sm:text-sm font-bold text-charcoal-800">
                অর্ডারে ব্যবহৃত মোবাইল নম্বর দিন:
              </label>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="customer-phone"
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => {
                      setPhoneInput(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="017XXXXXXXX"
                    maxLength={14}
                    className="w-full h-12 pl-11 pr-4 bg-surface-canvas rounded-2xl border border-stone-300 text-charcoal-900 font-mono text-sm sm:text-base focus:bg-white focus:outline-none focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20 transition-all placeholder:text-stone-400"
                  />
                  {phoneInput && (
                    <button
                      type="button"
                      onClick={() => setPhoneInput("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 rounded-full cursor-pointer"
                      aria-label="মুছে ফেলুন"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 px-6 rounded-2xl font-bold text-sm sm:text-base bg-brand-700 hover:bg-brand-800 text-white flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>অর্ডার খোঁজা হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>অর্ডার দেখুন</span>
                    </>
                  )}
                </button>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </form>
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="bg-white rounded-3xl border border-surface-border p-12 text-center space-y-3 shadow-card">
              <Loader2 className="w-8 h-8 text-brand-700 animate-spin mx-auto" />
              <p className="text-sm font-bold text-charcoal-800">আপনার অর্ডারের বিবরণ খোঁজা হচ্ছে...</p>
            </div>
          )}

          {/* 3. Empty State: No Orders Found */}
          {!isLoading && hasSearched && orders.length === 0 && (
            <div className="bg-white rounded-3xl border border-surface-border p-8 sm:p-12 text-center space-y-5 shadow-card">
              <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400">
                <ShoppingBag className="w-10 h-10" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-lg sm:text-xl font-black text-charcoal-900">
                  কোনো অর্ডার পাওয়া যায়নি
                </h3>
                <p className="text-xs sm:text-sm text-charcoal-500">
                  {searchedPhone} নম্বরে সান্নাহ সোর্সে কোনো পূর্ববর্তী অর্ডারের রেকর্ড নেই। মোবাইল নম্বরটি পুনরায় যাচাই করে দেখুন।
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-sm shadow-card transition-all active:scale-[0.99]"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>এখনই কেনাকাটা করুন</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* 4. Orders Showcase List */}
          {!isLoading && hasSearched && orders.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-lg sm:text-xl font-bold text-charcoal-900">
                  মোট অর্ডার: {orders.length}টি
                </h2>
                <span className="text-xs text-charcoal-500 font-mono">
                  {searchedPhone}
                </span>
              </div>

              <div className="space-y-6">
                {orders.map((order) => {
                  const statusInfo = getStatusBadge(order.status);
                  const whatsappHelpUrl = `https://wa.me/8801914612007?text=${encodeURIComponent(
                    `আসসালামু আলাইকুম সুন্নাহ সোর্স, আমার অর্ডার #${order.order_number} সম্পর্কে জানতে চাচ্ছি।`
                  )}`;

                  return (
                    <article
                      key={order.id}
                      className="bg-white rounded-3xl border border-surface-border shadow-card hover:shadow-lg transition-all overflow-hidden space-y-5 p-5 sm:p-6"
                    >
                      {/* Top Header Row: Order ID, Date & Status Badge */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-surface-border">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-charcoal-500 font-medium">অর্ডার নম্বর:</span>
                            <span className="font-mono text-sm sm:text-base font-black text-brand-800">
                              #{order.order_number}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-charcoal-500">
                            <Clock className="w-3.5 h-3.5 text-stone-400" />
                            <span>{formatBanglaDateTime(order.created_at)}</span>
                          </div>
                        </div>

                        <span
                          className={`inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold border shadow-xs ${statusInfo.className}`}
                        >
                          {statusInfo.label}
                        </span>
                      </div>

                      {/* Items Preview */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold text-charcoal-500 uppercase tracking-wider">
                          অর্ডারকৃত পণ্যসমূহ:
                        </h3>

                        <div className="divide-y divide-surface-border/70 border border-surface-border rounded-2xl overflow-hidden bg-surface-canvas/30">
                          {order.items.map((item) => (
                            <div
                              key={item.id}
                              className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-white transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white border border-surface-border shrink-0">
                                  <Image
                                    src={item.image || "/images/hero-honey.png"}
                                    alt={item.productTitle}
                                    fill
                                    sizes="48px"
                                    className="object-cover"
                                  />
                                </div>
                                <div className="min-w-0 space-y-0.5">
                                  <h4 className="text-xs sm:text-sm font-bold text-charcoal-900 truncate">
                                    {item.productTitle}
                                  </h4>
                                  <div className="flex items-center gap-2 text-[11px] text-charcoal-500">
                                    {item.variantName && <span>{item.variantName}</span>}
                                    <span>•</span>
                                    <span className="font-mono">পরিমাণ: {item.quantity}টি</span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="font-mono text-xs sm:text-sm font-bold text-charcoal-900">
                                  {formatBDT(item.lineTotal)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Financial Summary & Delivery Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-surface-canvas border border-surface-border text-xs text-charcoal-700">
                        <div className="space-y-1">
                          <strong className="block text-charcoal-900 font-bold">ডেলিভারি ঠিকানা:</strong>
                          <p className="text-charcoal-600 leading-relaxed">{order.delivery_address}</p>
                          {order.customer_name && (
                            <p className="text-[11px] text-charcoal-500">
                              গ্রাহক: {order.customer_name} ({order.customer_phone})
                            </p>
                          )}
                        </div>

                        <div className="space-y-1.5 md:text-right border-t md:border-t-0 pt-2 md:pt-0 border-stone-200">
                          <div className="flex items-center md:justify-end gap-2 text-charcoal-600">
                            <span>সাবটোটাল:</span>
                            <span className="font-mono font-semibold">{formatBDT(order.subtotal)}</span>
                          </div>

                          {order.discount_amount > 0 && (
                            <div className="flex items-center md:justify-end gap-2 text-emerald-700 font-medium">
                              {order.coupon_code && (
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                  {order.coupon_code}
                                </span>
                              )}
                              <span>কুপন ছাড়:</span>
                              <span className="font-mono font-bold">-{formatBDT(order.discount_amount)}</span>
                            </div>
                          )}

                          <div className="flex items-center md:justify-end gap-2 text-charcoal-600">
                            <span>ডেলিভারি চার্জ:</span>
                            <span className="font-mono font-semibold">
                              {order.delivery_fee === 0 ? "ফ্রি" : formatBDT(order.delivery_fee)}
                            </span>
                          </div>

                          <div className="flex items-center md:justify-end gap-2 text-sm sm:text-base font-black text-brand-800 pt-1 border-t border-stone-300">
                            <span>সর্বমোট পরিশোধযোগ্য:</span>
                            <span className="font-mono">{formatBDT(order.grand_total)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Action Buttons */}
                      <div className="pt-2 flex flex-wrap items-center justify-end gap-2.5">
                        {/* 1. Print Invoice Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenInvoice(order)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-surface-border bg-white hover:bg-stone-50 text-charcoal-800 font-bold text-xs shadow-xs transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-stone-500" />
                          <span>চালান প্রিন্ট করুন (Invoice)</span>
                        </button>

                        {/* 2. Live Tracking Button */}
                        <Link
                          href={`/track-order?id=${encodeURIComponent(order.order_number)}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-brand-700/30 bg-brand-50 hover:bg-brand-100 text-brand-800 font-bold text-xs shadow-xs transition-colors"
                        >
                          <Truck className="w-3.5 h-3.5 text-brand-700" />
                          <span>লাইভ ট্র্যাক করুন</span>
                        </Link>

                        {/* 3. WhatsApp Support Button */}
                        <a
                          href={whatsappHelpUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5 fill-white" />
                          <span>হোয়াটসঅ্যাপ সহায়তা</span>
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 5. Printable Invoice Modal Overlay */}
      {selectedInvoiceOrder && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
        >
          <div className="relative w-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-2xl max-h-[95vh] flex flex-col">
            <div className="sticky top-0 z-10 bg-charcoal-900 text-white px-4 py-3 flex items-center justify-between">
              <span className="font-bold text-sm">চালান রসিদ (Invoice #{selectedInvoiceOrder.orderNumber})</span>
              <button
                type="button"
                onClick={() => setSelectedInvoiceOrder(null)}
                className="p-1 rounded-lg hover:bg-charcoal-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
                aria-label="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <PrintableInvoice
                order={selectedInvoiceOrder}
                onClose={() => setSelectedInvoiceOrder(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* 6. Footer & Drawer Elements */}
      <Footer />
      <MobileBottomNav />
      <CartDrawer />
    </div>
  );
}
