"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/auth/admin-guard";
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
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Ensures the requesting user has valid admin authorization.
 * Returns the session Supabase client and verified admin user.
 */
export async function getAuthenticatedAdminClient() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("UNAUTHORIZED");
  }

  const isAdmin = await checkIsAdmin(user, supabase);
  if (!isAdmin) {
    throw new Error("FORBIDDEN");
  }

  return { supabase, user };
}

/**
 * Executes a query with the authenticated session client first.
 * If RLS blocks access and service role key is available on server,
 * falls back to service role client securely on the server.
 */
async function executeAdminDbQuery<T>(
  queryFn: (client: SupabaseClient) => Promise<{ data: T | null; error: any; count?: number | null }>
) {
  const { supabase } = await getAuthenticatedAdminClient();

  // 1. Try with session client first (RLS compliant)
  const res = await queryFn(supabase);
  if (!res.error) {
    return res;
  }

  // 2. Server-side fallback if session query was blocked by RLS
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const adminClient = await createAdminClient();
      const adminRes = await queryFn(adminClient);
      if (!adminRes.error) {
        return adminRes;
      }
    } catch {
      // Fallback failed, return initial error
    }
  }

  return res;
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

    return {
      success: true,
      data: {
        ...order,
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
 * Ensures the requesting user has valid admin authorization,
 * then returns the server-only service_role admin client.
 * Used for calling service-role-restricted database RPCs directly without
 * encountering predictable 42501 permission-denied roundtrips against the session client.
 */
async function getVerifiedAdminServiceClient() {
  await getAuthenticatedAdminClient();
  return await createAdminClient();
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

    // Revalidate paths for instant consistency
    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);

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
 * Get high-level dashboard metrics for orders.
 * Accurately excludes cancelled, returned, and uncollected unpaid orders from realized revenue.
 */
export async function getAdminDashboardMetrics(): Promise<{
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

    const list = ordersResult.data || [];
    const totalOrders = list.length;
    let totalRevenue = 0;
    let pendingOrders = 0;
    let deliveredOrders = 0;

    for (const item of list) {
      // Realized revenue policy:
      // Strictly excludes cancelled, returned, and refunded orders.
      // Uncollected COD orders (pending/confirmed/processing/shipped) are not realized revenue until delivered.
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
    return { success: false, message: err.message };
  }
}
