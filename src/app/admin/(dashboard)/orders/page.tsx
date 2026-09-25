import React from "react";
import type { Metadata } from "next";
import { getAdminOrders } from "@/lib/actions/admin-order-actions";
import { OrdersTable } from "@/components/admin/orders/orders-table";
import { OrdersFilterBar } from "@/components/admin/orders/orders-filter-bar";
import { OrdersPagination } from "@/components/admin/orders/orders-pagination";
import { ShoppingBag, AlertCircle } from "lucide-react";
import { OrderStatus, DeliveryZone } from "@/types/commerce.types";
import { PaymentStatus } from "@/types/orders.types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "অর্ডার ব্যবস্থাপনা | Sunnah Source Admin",
  description: "সুন্নাহ সোর্স অ্যাডমিন প্যানেল - সকল কাস্টমার অর্ডার পর্যবেক্ষণ ও পরিচালনা।",
};

interface OrdersPageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
    payment?: string;
    zone?: string;
  }>;
}

export default async function AdminOrdersPage({
  searchParams,
}: OrdersPageProps) {
  const resolvedSearchParams = await searchParams;

  const page = Math.max(1, Number(resolvedSearchParams.page) || 1);
  const searchQuery = resolvedSearchParams.q || "";
  const status = (resolvedSearchParams.status || "all") as OrderStatus | "all";
  const paymentStatus = (resolvedSearchParams.payment || "all") as
    | PaymentStatus
    | "all";
  const zone = (resolvedSearchParams.zone || "all") as DeliveryZone | "all";

  const result = await getAdminOrders({
    page,
    pageSize: 20,
    searchQuery,
    status,
    paymentStatus,
    zone,
  });

  return (
    <div className="space-y-6 font-bengali">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border/70 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-charcoal-900 tracking-tight">
              অর্ডারসমূহ (Orders Management)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-charcoal-500">
            সকল কাস্টমার অর্ডার তালিকা, স্ট্যাটাস পর্যবেক্ষণ ও বিস্তারিত বিবরণ।
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <OrdersFilterBar
        currentQuery={searchQuery}
        currentStatus={status}
        currentPaymentStatus={paymentStatus}
        currentZone={zone}
      />

      {/* Main Content / Table */}
      {!result.success ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-6 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h3 className="font-bold text-sm sm:text-base">
            অর্ডার ডাটা লোড করতে সমস্যা হয়েছে
          </h3>
          <p className="text-xs">{result.message}</p>
        </div>
      ) : (
        <>
          <OrdersTable orders={result.data?.orders || []} />

          {/* Pagination */}
          {result.data && result.data.totalPages > 1 && (
            <OrdersPagination
              page={result.data.page}
              totalPages={result.data.totalPages}
              totalCount={result.data.totalCount}
              pageSize={result.data.pageSize}
            />
          )}
        </>
      )}
    </div>
  );
}
