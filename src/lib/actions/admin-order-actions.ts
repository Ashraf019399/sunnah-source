"use server";

import { cache } from "react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { checkIsAdmin, verifyAdminSession } from "@/lib/auth/admin-guard";
import { ALL_PRODUCTS } from "@/lib/data/products";
import {
  AdminOrder,
  AdminOrderItem,
  AdminOrderWithItems,
  OrdersFilterParams,
  PaginatedOrdersResult,
  ORDER_STATUS_LIST,
  PaymentStatus,
} from "@/types/orders.types";
import { OrderStatus } from "@/types/commerce.types";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getMarketingSettings } from "@/lib/actions/admin-marketing-actions";
import { sendMetaCapiPurchaseEvent } from "@/lib/services/facebook-conversions-api";

/**
 * Ensures the requesting user has valid admin authorization.
 * Wrapped in React cache() so within a single request it runs once.
 */
export const getAuthenticatedAdminClient = cache(async () => {
  const { user, isAdmin } = await verifyAdminSession();

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  if (!isAdmin) {
    throw new Error("FORBIDDEN");
  }

  const supabase = await createClient();
  return { supabase, user };
});

/**
 * Server-only service role client accessor, pre-verified for admin identity.
 */
export const getVerifiedAdminServiceClient = cache(async () => {
  await getAuthenticatedAdminClient();
  return await createAdminClient();
});

/**
 * Executes a query with the verified admin client directly when service role key
 * is available (bypassing RLS latency overhead), or falls back to session client.
 */
async function executeAdminDbQuery<T>(
  queryFn: (client: SupabaseClient) => Promise<{ data: T | null; error: any; count?: number | null }>
) {
  await getAuthenticatedAdminClient();

  if (
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY !== "placeholder-service-key"
  ) {
    try {
      const adminClient = await createAdminClient();
      const adminRes = await queryFn(adminClient);
      if (!adminRes.error) {
        return adminRes;
      }
    } catch {
      // Fallback
    }
  }

  const { supabase } = await getAuthenticatedAdminClient();
  return await queryFn(supabase);
}

/**
 * Fetch paginated orders with optional search and filters.
 */
export async function getAdminOrders(
  params: OrdersFilterParams = {}
): Promise<{ success: boolean; data?: PaginatedOrdersResult; message?: string }> {
  try {
    const page = Math.max(1, Number(params.page) || 1);
    const pageSize = Math.max(1, Math.min(100, Number(params.pageSize) || 20));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const queryResult = await executeAdminDbQuery<AdminOrder[]>(async (client) => {
      let query = client
        .from("orders")
        .select("*", { count: "exact" });

      // Search by Order number, Customer name, or Phone
      if (params.searchQuery && params.searchQuery.trim().length > 0) {
        const cleanQuery = params.searchQuery.trim().replace(/[%_]/g, "\\$&");
        query = query.or(
          `order_number.ilike.%${cleanQuery}%,guest_name.ilike.%${cleanQuery}%,guest_phone.ilike.%${cleanQuery}%`
        );
      }

      // Filter by Order Status
      if (params.status && params.status !== "all") {
        query = query.eq("order_status", params.status);
      }

      // Filter by Payment Status
      if (params.paymentStatus && params.paymentStatus !== "all") {
        query = query.eq("payment_status", params.paymentStatus);
      }

      // Filter by Delivery Zone (JSONB inside shipping_address)
      if (params.zone && params.zone !== "all") {
        query = query.filter("shipping_address->>zone", "eq", params.zone);
      }

      // Sort newest orders first
      query = query.order("created_at", { ascending: false }).range(from, to);

      return (await query) as any;
    });

    if (queryResult.error) {
      console.error("[getAdminOrders] DB error:", queryResult.error);
      return {
        success: false,
        message: "অর্ডার তালিকা লোড করা যায়নি: " + queryResult.error.message,
      };
    }

    const orders = (queryResult.data || []) as AdminOrder[];
    const totalCount = queryResult.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    // Attach items count for each returned order
    if (orders.length > 0) {
      try {
        const orderIds = orders.map((o) => o.id);
        const itemsRes = await executeAdminDbQuery<{ order_id: string; quantity: number }[]>(
          async (client) => {
            return (await client
              .from("order_items")
              .select("order_id, quantity")
              .in("order_id", orderIds)) as any;
          }
        );

        if (itemsRes.data && Array.isArray(itemsRes.data)) {
          const countMap: Record<string, number> = {};
          for (const it of itemsRes.data) {
            countMap[it.order_id] =
              (countMap[it.order_id] || 0) + (Number(it.quantity) || 1);
          }
          for (const ord of orders) {
            ord.items_count = countMap[ord.id] ?? 0;
            if (!ord.consignment_id && ord.admin_notes) {
              const cidMatch = ord.admin_notes.match(/Steadfast Consignment ID:\s*([0-9a-zA-Z_-]+)/i);
              if (cidMatch) {
                ord.consignment_id = cidMatch[1];
              }
            }
          }
        }
      } catch (err) {
        console.warn("[getAdminOrders] Failed to attach items_count:", err);
      }
    }

    // Ensure consignment_id is populated even if items query was skipped
    for (const ord of orders) {
      if (!ord.consignment_id && ord.admin_notes) {
        const cidMatch = ord.admin_notes.match(/Steadfast Consignment ID:\s*([0-9a-zA-Z_-]+)/i);
        if (cidMatch) {
          ord.consignment_id = cidMatch[1];
        }
      }
    }

    return {
      success: true,
      data: {
        orders,
        totalCount,
        page,
        pageSize,
        totalPages,
      },
    };
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN") {
      return {
        success: false,
        message: "অননুমোদিত প্রবেশাধিকার। অ্যাডমিন লগইন প্রয়োজন।",
      };
    }
    console.error("[getAdminOrders] Server error:", err);
    return {
      success: false,
      message: err.message || "সার্ভার এরর ঘটেছে।",
    };
  }
}

/**
 * Fetch a single order by ID or order number, including its line items.
 */
export async function getAdminOrderById(
  orderId: string
): Promise<{ success: boolean; data?: AdminOrderWithItems; message?: string }> {
  try {
    if (!orderId || typeof orderId !== "string") {
      return { success: false, message: "অর্ডার আইডি প্রদান করা হয়নি।" };
    }

    // 1. Fetch order record
    const orderResult = await executeAdminDbQuery<AdminOrder>(async (client) => {
      // Check if orderId is UUID or order_number
      let query = client.from("orders").select("*");
      if (orderId.startsWith("SS-")) {
        query = query.eq("order_number", orderId);
      } else {
        query = query.eq("id", orderId);
      }
      return (await query.maybeSingle()) as any;
    });

    if (orderResult.error) {
      console.error("[getAdminOrderById] Order query error:", orderResult.error);
      return { success: false, message: "অর্ডার তথ্য লোড করা যায়নি।" };
    }

    if (!orderResult.data) {
      return { success: false, message: "অর্ডারটি পাওয়া যায়নি।" };
    }

    const order = orderResult.data;

    // 2. Fetch order items
    const itemsResult = await executeAdminDbQuery<AdminOrderItem[]>(async (client) => {
      return (await client
        .from("order_items")
        .select("*")
        .eq("order_id", order.id)
        .order("created_at", { ascending: true })) as any;
    });

    const rawItems = (itemsResult.data || []) as AdminOrderItem[];

    // 3. Attach product catalog images if available
    const itemsWithImages: AdminOrderItem[] = rawItems.map((item) => {
      const matchedCatalogProduct = ALL_PRODUCTS.find(
        (p) => p.id === item.product_id
      );
      return {
        ...item,
        product_image: matchedCatalogProduct?.images?.[0] || undefined,
      };
    });

    let resolvedConsignmentId = order.consignment_id || null;
    if (!resolvedConsignmentId && order.admin_notes) {
      const cidMatch = order.admin_notes.match(/Steadfast Consignment ID:\s*([0-9a-zA-Z_-]+)/i);
      if (cidMatch) {
        resolvedConsignmentId = cidMatch[1];
      }
    }

    return {
      success: true,
      data: {
        ...order,
        consignment_id: resolvedConsignmentId,
        items: itemsWithImages,
      },
    };
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN") {
      return {
        success: false,
        message: "অননুমোদিত প্রবেশাধিকার। অ্যাডমিন লগইন প্রয়োজন।",
      };
    }
    console.error("[getAdminOrderById] Server error:", err);
    return {
      success: false,
      message: err.message || "সার্ভার এরর ঘটেছে।",
    };
  }
}



/**
 * Server action to update an order's status.
 * Enforces Finite State Machine (FSM) transitions, atomic inventory restoration,
 * and single-use promotional coupon quota restoration.
 */
export async function updateOrderStatusAction(
  orderId: string,
  newStatus: OrderStatus
): Promise<{ success: boolean; message: string }> {
  try {
    if (!orderId) {
      return { success: false, message: "অর্ডার আইডি আবশ্যক।" };
    }

    if (!ORDER_STATUS_LIST.includes(newStatus)) {
      return {
        success: false,
        message: "অবৈধ অর্ডার স্ট্যাটাস মান নির্বাচন করা হয়েছে।",
      };
    }

    // Authenticate admin and obtain server-only service role client directly
    const adminClient = await getVerifiedAdminServiceClient();
    const updateResult = await adminClient.rpc("update_order_status_with_inventory", {
      p_order_id: orderId,
      p_new_status: newStatus,
    });

    if (updateResult.error || !updateResult.data) {
      console.error("[updateOrderStatusAction] DB error:", updateResult.error);
      const errMsg = updateResult.error?.message || "";
      if (errMsg.includes("does not exist") || updateResult.error?.code === "PGRST204") {
        return {
          success: false,
          message:
            "ডাটাবেজে update_order_status_with_inventory RPC পাওয়া যায়নি। অনুগ্রহ করে সর্বশেষ মাইগ্রেশন সম্পন্ন হয়েছে কিনা তা যাচাই করুন।",
        };
      }
      return {
        success: false,
        message:
          updateResult.error?.message ||
          "অর্ডারের স্ট্যাটাস আপডেট করা যায়নি। আবার চেষ্টা করুন।",
      };
    }

    const rpcData = updateResult.data as { success: boolean; message: string };
    if (!rpcData.success) {
      return {
        success: false,
        message: rpcData.message || "অর্ডারের স্ট্যাটাস আপডেট করা যায়নি।",
      };
    }

    // Server-Side Meta Conversions API (CAPI): Fire purchase event after confirmation call
    if (newStatus === "confirmed") {
      try {
        const marketingSettings = await getMarketingSettings({ unmasked: true });
        if (
          marketingSettings.isEnabled &&
          marketingSettings.accessToken &&
          marketingSettings.fireOnOrderConfirmationOnly
        ) {
          const { data: orderDetails } = await adminClient
            .from("orders")
            .select("id, order_number, grand_total, guest_name, guest_phone, shipping_address, admin_notes")
            .eq("id", orderId)
            .maybeSingle();

          if (orderDetails) {
            const alreadyFired = orderDetails.admin_notes?.includes("Meta CAPI Purchase Fired");
            if (!alreadyFired) {
              const { data: orderItems } = await adminClient
                .from("order_items")
                .select("product_id, quantity, unit_price, product_title")
                .eq("order_id", orderId);

              const shipping = (orderDetails.shipping_address || {}) as Record<string, any>;
              const capiRes = await sendMetaCapiPurchaseEvent({
                orderNumber: orderDetails.order_number,
                grandTotal: Number(orderDetails.grand_total) || 0,
                customerName: orderDetails.guest_name || shipping.fullName,
                phone: orderDetails.guest_phone || shipping.phone,
                city: shipping.district || shipping.zone || "Dhaka",
                clientIp: shipping.clientIp,
                userAgent: shipping.userAgent,
                items: (orderItems || []).map((it) => ({
                  id: it.product_id,
                  name: it.product_title,
                  quantity: it.quantity,
                  item_price: Number(it.unit_price) || 0,
                })),
              });

              if (capiRes.success) {
                const noteEntry = `Meta CAPI Purchase Fired`;
                const newNotes = orderDetails.admin_notes
                  ? `${orderDetails.admin_notes} | ${noteEntry}`
                  : noteEntry;
                await adminClient
                  .from("orders")
                  .update({ admin_notes: newNotes })
                  .eq("id", orderId);
              }
            }
          }
        }
      } catch (capiErr) {
        console.warn("[updateOrderStatusAction] Meta CAPI notice:", capiErr);
      }
    }

    // Revalidate paths for instant consistency
    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    revalidateTag("admin-dashboard-metrics");
    revalidateTag("admin-recent-orders");
    revalidateTag("orders");

    return {
      success: true,
      message: rpcData.message || "অর্ডারের স্ট্যাটাস সফলভাবে আপডেট হয়েছে।",
    };
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN") {
      return {
        success: false,
        message: "অননুমোদিত প্রবেশাধিকার। এই পরিবর্তনের অনুমতি নেই।",
      };
    }
    console.error("[updateOrderStatusAction] Server error:", err);
    return {
      success: false,
      message: "অর্ডারের স্ট্যাটাস আপডেট করা যায়নি। আবার চেষ্টা করুন।",
    };
  }
}

/**
 * Server action to update an order's payment status.
 * Invokes the atomic database-level update_order_payment_status RPC,
 * enforcing business consistency rules inside a single locked transaction:
 * - Cannot refund an unpaid order.
 * - Cannot mark a cancelled or returned order as paid.
 * - Refunding requires order to be in cancelled or returned state.
 * - Refunded payments cannot be reversed.
 */
const VALID_PAYMENT_STATUSES: PaymentStatus[] = ["unpaid", "paid", "refunded"];

export async function updatePaymentStatusAction(
  orderId: string,
  newStatus: PaymentStatus
): Promise<{ success: boolean; message: string }> {
  try {
    if (!orderId) {
      return { success: false, message: "অর্ডার আইডি আবশ্যক।" };
    }

    if (!VALID_PAYMENT_STATUSES.includes(newStatus)) {
      return {
        success: false,
        message: "অবৈধ পেমেন্ট স্ট্যাটাস মান নির্বাচন করা হয়েছে।",
      };
    }

    // Authenticate admin and obtain server-only service role client directly
    const adminClient = await getVerifiedAdminServiceClient();
    const updateResult = await adminClient.rpc("update_order_payment_status", {
      p_order_id: orderId,
      p_new_payment_status: newStatus,
    });

    if (updateResult.error || !updateResult.data) {
      console.error("[updatePaymentStatusAction] DB error:", updateResult.error);
      const errMsg = updateResult.error?.message || "";
      if (errMsg.includes("does not exist") || updateResult.error?.code === "PGRST204") {
        return {
          success: false,
          message:
            "ডাটাবেজে update_order_payment_status RPC পাওয়া যায়নি। অনুগ্রহ করে সর্বশেষ মাইগ্রেশন সম্পন্ন হয়েছে কিনা তা যাচাই করুন।",
        };
      }
      return {
        success: false,
        message:
          updateResult.error?.message ||
          "পেমেন্ট স্ট্যাটাস আপডেট করা যায়নি। আবার চেষ্টা করুন।",
      };
    }

    const rpcData = updateResult.data as { success: boolean; message: string };
    if (!rpcData.success) {
      return {
        success: false,
        message: rpcData.message || "পেমেন্ট স্ট্যাটাস আপডেট করা যায়নি।",
      };
    }

    // Revalidate paths for instant consistency
    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    revalidateTag("admin-dashboard-metrics");
    revalidateTag("admin-recent-orders");
    revalidateTag("orders");

    return {
      success: true,
      message: rpcData.message || "পেমেন্ট স্ট্যাটাস সফলভাবে আপডেট হয়েছে।",
    };
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN") {
      return {
        success: false,
        message: "অননুমোদিত প্রবেশাধিকার। এই পরিবর্তনের অনুমতি নেই।",
      };
    }
    console.error("[updatePaymentStatusAction] Server error:", err);
    return {
      success: false,
      message: "পেমেন্ট স্ট্যাটাস আপডেট করা যায়নি। আবার চেষ্টা করুন।",
    };
  }
}

/**
 * Internal computation of dashboard metrics using admin client directly.
 */
async function fetchAdminDashboardMetricsInternal(): Promise<{
  success: boolean;
  data?: {
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    deliveredOrders: number;
  };
  message?: string;
}> {
  try {
    let rows: { grand_total: number; order_status: OrderStatus; payment_status: PaymentStatus }[] = [];

    if (
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY !== "placeholder-service-key"
    ) {
      const adminClient = await createAdminClient();
      const { data, error } = await adminClient
        .from("orders")
        .select("grand_total, order_status, payment_status");

      if (error) {
        return { success: false, message: error.message };
      }
      rows = data || [];
    } else {
      const ordersResult = await executeAdminDbQuery<{
        grand_total: number;
        order_status: OrderStatus;
        payment_status: PaymentStatus;
      }[]>(async (client) => {
        return (await client
          .from("orders")
          .select("grand_total, order_status, payment_status")) as any;
      });

      if (ordersResult.error) {
        return { success: false, message: ordersResult.error.message };
      }
      rows = ordersResult.data || [];
    }

    const totalOrders = rows.length;
    let totalRevenue = 0;
    let pendingOrders = 0;
    let deliveredOrders = 0;

    for (const item of rows) {
      const isDeliveredNotRefunded =
        item.order_status === "delivered" && item.payment_status !== "refunded";
      const isPrepaidActive =
        item.payment_status === "paid" &&
        !["cancelled", "returned"].includes(item.order_status);

      if (isDeliveredNotRefunded || isPrepaidActive) {
        totalRevenue += Number(item.grand_total) || 0;
      }
      if (item.order_status === "pending") {
        pendingOrders += 1;
      }
      if (item.order_status === "delivered") {
        deliveredOrders += 1;
      }
    }

    return {
      success: true,
      data: {
        totalOrders,
        totalRevenue,
        pendingOrders,
        deliveredOrders,
      },
    };
  } catch (err: any) {
    return { success: false, message: err?.message || "মেট্রিক্স লোড করা যায়নি।" };
  }
}

/**
 * Fast cached accessor for dashboard metrics.
 * Revalidates in background every 15s or instantly when orders change.
 */
export const getCachedAdminDashboardMetrics = unstable_cache(
  async () => {
    return await fetchAdminDashboardMetricsInternal();
  },
  ["admin-dashboard-metrics"],
  {
    revalidate: 15,
    tags: ["admin-dashboard-metrics", "orders"],
  }
);

/**
 * Get high-level dashboard metrics for orders.
 */
export async function getAdminDashboardMetrics() {
  await getAuthenticatedAdminClient();
  return await getCachedAdminDashboardMetrics();
}

/**
 * Internal computation of top recent orders with items count.
 */
async function fetchAdminRecentOrdersInternal(limit: number = 5) {
  try {
    let orders: AdminOrder[] = [];
    let adminClient: any = null;

    if (
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY !== "placeholder-service-key"
    ) {
      adminClient = await createAdminClient();
    } else {
      adminClient = (await getAuthenticatedAdminClient()).supabase;
    }

    const { data: dbOrders, error } = await adminClient
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !dbOrders) {
      return { success: false, data: { orders: [], totalCount: 0, totalPages: 1 } };
    }

    orders = dbOrders as AdminOrder[];

    if (orders.length > 0) {
      const orderIds = orders.map((o) => o.id);
      const { data: items } = await adminClient
        .from("order_items")
        .select("order_id, quantity")
        .in("order_id", orderIds);

      if (items && Array.isArray(items)) {
        const countMap: Record<string, number> = {};
        for (const it of items) {
          countMap[it.order_id] = (countMap[it.order_id] || 0) + (it.quantity || 1);
        }
        orders = orders.map((o) => ({
          ...o,
          items_count: countMap[o.id] || 1,
        }));
      }
    }

    return {
      success: true,
      data: {
        orders,
        totalCount: orders.length,
        totalPages: 1,
      },
    };
  } catch (err: any) {
    return { success: false, message: err?.message || "অর্ডার লোড করা যায়নি" };
  }
}

/**
 * Fast cached accessor for recent orders in dashboard.
 * Serves top recent orders in 0-2ms.
 */
export const getCachedAdminRecentOrders = unstable_cache(
  async (limit: number = 5) => {
    return await fetchAdminRecentOrdersInternal(limit);
  },
  ["admin-recent-orders-top"],
  {
    revalidate: 10,
    tags: ["admin-recent-orders", "orders"],
  }
);

/**
 * Server action to manually trigger Meta CAPI Purchase event from Admin Order Details.
 */
export async function fireMetaCapiPurchaseManualAction(
  orderId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const adminClient = await getVerifiedAdminServiceClient();
    const { data: order } = await adminClient
      .from("orders")
      .select("id, order_number, grand_total, guest_name, guest_phone, shipping_address, admin_notes")
      .eq("id", orderId)
      .maybeSingle();

    if (!order) {
      return { success: false, message: "অর্ডারটি পাওয়া যায়নি।" };
    }

    const { data: orderItems } = await adminClient
      .from("order_items")
      .select("product_id, quantity, unit_price, product_title")
      .eq("order_id", orderId);

    const shipping = (order.shipping_address || {}) as Record<string, any>;
    const capiRes = await sendMetaCapiPurchaseEvent({
      orderNumber: order.order_number,
      grandTotal: Number(order.grand_total) || 0,
      customerName: order.guest_name || shipping.fullName,
      phone: order.guest_phone || shipping.phone,
      city: shipping.district || shipping.zone || "Dhaka",
      clientIp: shipping.clientIp,
      userAgent: shipping.userAgent,
      items: (orderItems || []).map((it) => ({
        id: it.product_id,
        name: it.product_title,
        quantity: it.quantity,
        item_price: Number(it.unit_price) || 0,
      })),
    });

    if (capiRes.success) {
      const noteEntry = `Meta CAPI Purchase Fired (Manual)`;
      const newNotes = order.admin_notes
        ? `${order.admin_notes} | ${noteEntry}`
        : noteEntry;
      await adminClient
        .from("orders")
        .update({ admin_notes: newNotes })
        .eq("id", orderId);

      revalidatePath(`/admin/orders/${orderId}`);
      revalidatePath("/admin/orders");
    }

    return {
      success: capiRes.success,
      message: capiRes.message,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Meta CAPI সার্ভার এরর ঘটেছে।",
    };
  }
}
