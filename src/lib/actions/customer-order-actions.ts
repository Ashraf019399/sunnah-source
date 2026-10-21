"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isValidBDPhone, normalizeBDPhone } from "@/lib/utils";
import { ALL_PRODUCTS } from "@/lib/data/products";
import { PRODUCT_ID_MAP } from "@/lib/data/catalog-mapping";
import { OrderStatus, PaymentMethod } from "@/types/commerce.types";
import { PaymentStatus } from "@/types/orders.types";

export interface CustomerOrderItem {
  id: string;
  productId: string;
  productTitle: string;
  variantName?: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  image?: string;
}

export interface CustomerOrderDTO {
  id: string;
  order_number: string;
  created_at: string;
  status: OrderStatus;
  grand_total: number;
  subtotal: number;
  discount_amount: number;
  delivery_fee: number;
  coupon_code?: string | null;
  delivery_address: string;
  customer_name?: string;
  customer_phone?: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  courier_partner?: string | null;
  courier_tracking_code?: string | null;
  items: CustomerOrderItem[];
}

export interface GetCustomerOrdersResult {
  success: boolean;
  message?: string;
  orders: CustomerOrderDTO[];
}

interface RawOrderRow {
  id: string;
  order_number: string;
  created_at?: string;
  order_status?: string;
  status?: string;
  grand_total?: number;
  total?: number;
  total_amount?: number;
  subtotal?: number;
  discount_amount?: number;
  discount?: number;
  delivery_fee?: number;
  shipping_fee?: number;
  coupon_code?: string;
  guest_phone?: string;
  customer_phone?: string;
  phone?: string;
  guest_name?: string;
  customer_name?: string;
  shipping_address?: Record<string, unknown>;
  payment_method?: string;
  payment_status?: string;
  courier_partner?: string;
  courier_name?: string;
  courier_tracking_code?: string;
  tracking_code?: string;
}

interface RawOrderItemRow {
  id: string;
  order_id: string;
  product_id?: string;
  product_title?: string;
  title?: string;
  variant_name?: string;
  variant_title?: string;
  unit_price?: number;
  price?: number;
  quantity?: number;
  line_total?: number;
}

/**
 * Server Action to fetch all customer orders by normalized 11-digit Bangladeshi phone number.
 */
export async function getCustomerOrdersByPhone(
  phone: string
): Promise<GetCustomerOrdersResult> {
  try {
    const cleanRawPhone = (phone || "").trim();

    if (!cleanRawPhone) {
      return {
        success: false,
        message: "অনুগ্রহ করে আপনার মোবাইল নম্বরটি প্রদান করুন।",
        orders: [],
      };
    }

    const cleanPhone = normalizeBDPhone(cleanRawPhone);

    if (!isValidBDPhone(cleanRawPhone) && !isValidBDPhone(cleanPhone)) {
      return {
        success: false,
        message: "অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।",
        orders: [],
      };
    }

    const last10 = cleanPhone.slice(-10);

    // 1. Supabase Client Initialization with admin fallback
    let supabaseClient;
    try {
      if (
        process.env.SUPABASE_SERVICE_ROLE_KEY &&
        process.env.SUPABASE_SERVICE_ROLE_KEY !== "placeholder-service-key"
      ) {
        supabaseClient = await createAdminClient();
      } else {
        supabaseClient = await createClient();
      }
    } catch {
      supabaseClient = await createClient();
    }

    // 2. Query orders matching phone from orders table across possible phone fields
    let rawOrders: RawOrderRow[] = [];

    // Attempt 1: Query by guest_phone (canonical column in orders table)
    try {
      const { data, error } = await supabaseClient
        .from("orders")
        .select("*")
        .or(`guest_phone.ilike.%${last10}%`)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn(
          "[getCustomerOrdersByPhone] guest_phone query notice (RLS/permissions):",
          error.message || error
        );
      } else if (data) {
        rawOrders = data as RawOrderRow[];
      }
    } catch (err) {
      console.warn("[getCustomerOrdersByPhone] guest_phone query exception:", err);
    }

    // Attempt 2: If no orders found yet, try customer_phone (if schema variation exists)
    if (rawOrders.length === 0) {
      try {
        const { data, error } = await supabaseClient
          .from("orders")
          .select("*")
          .or(`customer_phone.ilike.%${last10}%`)
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          rawOrders = data as RawOrderRow[];
        }
      } catch {
        // Silently ignore schema variations
      }
    }

    // Attempt 3: If still no orders found, try phone column
    if (rawOrders.length === 0) {
      try {
        const { data, error } = await supabaseClient
          .from("orders")
          .select("*")
          .or(`phone.ilike.%${last10}%`)
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          rawOrders = data as RawOrderRow[];
        }
      } catch {
        // Silently ignore schema variations
      }
    }

    // 3. Strict Phone Verification against all stored phone variations
    const matchedOrders = rawOrders.filter((order) => {
      const shipping = order.shipping_address || {};
      const storedPhones = [
        order.guest_phone,
        order.customer_phone,
        order.phone,
        typeof shipping.phone === "string" ? shipping.phone : undefined,
        typeof shipping.guest_phone === "string" ? shipping.guest_phone : undefined,
        typeof shipping.customer_phone === "string" ? shipping.customer_phone : undefined,
      ]
        .filter((p): p is string => Boolean(p))
        .map((p) => normalizeBDPhone(p));

      return storedPhones.some(
        (stored) =>
          stored === cleanPhone ||
          (stored.length >= 10 && stored.slice(-10) === last10)
      );
    });

    if (matchedOrders.length === 0) {
      return {
        success: true,
        orders: [],
      };
    }

    // 4. Fetch line items for all matched orders
    const orderIds = matchedOrders.map((o) => o.id);
    let allItems: RawOrderItemRow[] = [];
    if (orderIds.length > 0) {
      try {
        const { data: rawItemsData, error: itemsError } = await supabaseClient
          .from("order_items")
          .select("*")
          .in("order_id", orderIds)
          .order("created_at", { ascending: true });

        if (itemsError) {
          console.warn("[getCustomerOrdersByPhone] Items query notice:", itemsError);
        } else if (rawItemsData) {
          allItems = rawItemsData as RawOrderItemRow[];
        }
      } catch (itemErr) {
        console.warn("[getCustomerOrdersByPhone] Items query exception:", itemErr);
      }
    }

    // Group items by order_id
    const itemsByOrderId = new Map<string, CustomerOrderItem[]>();
    for (const item of allItems) {
      const productId = item.product_id || "";
      const matchedProduct = ALL_PRODUCTS.find(
        (p) => p.id === productId || PRODUCT_ID_MAP[p.id] === productId
      );

      const parsedItem: CustomerOrderItem = {
        id: item.id,
        productId,
        productTitle: item.product_title || item.title || "পণ্য",
        variantName: item.variant_name || item.variant_title || null,
        unitPrice: Number(item.unit_price ?? item.price ?? 0),
        quantity: Number(item.quantity ?? 1),
        lineTotal: Number(
          item.line_total ??
            Number(item.unit_price ?? 0) * Number(item.quantity ?? 1)
        ),
        image: matchedProduct?.images?.[0] || "/images/hero-honey.png",
      };

      const existing = itemsByOrderId.get(item.order_id) || [];
      existing.push(parsedItem);
      itemsByOrderId.set(item.order_id, existing);
    }

    // 5. Transform each order into CustomerOrderDTO
    const orders: CustomerOrderDTO[] = matchedOrders.map((order) => {
      const shipping = order.shipping_address || {};
      const fullAddr =
        typeof shipping.fullAddress === "string"
          ? shipping.fullAddress
          : typeof shipping.address === "string"
          ? shipping.address
          : "";
      const thana = typeof shipping.thana === "string" ? shipping.thana : "";
      const district = typeof shipping.district === "string" ? shipping.district : "";
      const deliveryAddress =
        [fullAddr, thana, district].filter(Boolean).join(", ") || "ঠিকানা দেওয়া হয়নি";

      const rawStatus = (order.order_status || order.status || "pending").toLowerCase();
      let status: OrderStatus = "pending";
      if (
        [
          "pending",
          "confirmed",
          "processing",
          "shipped",
          "delivered",
          "cancelled",
          "returned",
        ].includes(rawStatus)
      ) {
        status = rawStatus as OrderStatus;
      }

      const customerName =
        (typeof shipping.fullName === "string" && shipping.fullName) ||
        order.guest_name ||
        order.customer_name ||
        "গ্রাহক";

      return {
        id: order.id,
        order_number: order.order_number,
        created_at: order.created_at || new Date().toISOString(),
        status,
        grand_total: Number(
          order.grand_total ?? order.total ?? order.total_amount ?? 0
        ),
        subtotal: Number(order.subtotal ?? order.total_amount ?? 0),
        discount_amount: Number(order.discount_amount ?? order.discount ?? 0),
        delivery_fee: Number(order.delivery_fee ?? order.shipping_fee ?? 0),
        coupon_code: order.coupon_code || null,
        delivery_address: deliveryAddress,
        customer_name: customerName,
        customer_phone: cleanPhone,
        payment_method: (order.payment_method || "cod") as PaymentMethod,
        payment_status: (order.payment_status || "unpaid") as PaymentStatus,
        courier_partner: order.courier_partner || order.courier_name || null,
        courier_tracking_code:
          order.courier_tracking_code || order.tracking_code || null,
        items: itemsByOrderId.get(order.id) || [],
      };
    });

    return {
      success: true,
      orders,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn("[getCustomerOrdersByPhone] Gracefully caught exception:", errorMsg);
    return {
      success: true,
      orders: [],
    };
  }
}
