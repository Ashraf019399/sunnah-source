"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isValidBDPhone, normalizeBDPhone } from "@/lib/utils";
import { ALL_PRODUCTS } from "@/lib/data/products";
import { PRODUCT_ID_MAP } from "@/lib/data/catalog-mapping";
import { OrderStatus, DeliveryZone, PaymentMethod } from "@/types/commerce.types";
import { PaymentStatus } from "@/types/orders.types";

export interface PublicSafeOrderItem {
  productTitle: string;
  variantName?: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  productImage?: string;
}

export interface PublicSafeOrderDTO {
  orderNumber: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  createdAt: string;
  updatedAt?: string;
  deliveryZone: DeliveryZone;
  district?: string;
  thana?: string;
  maskedPhone: string;
  maskedAddress: string;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  couponCode?: string | null;
  grandTotal: number;
  items: PublicSafeOrderItem[];
  courierPartner?: string | null;
  courierTrackingCode?: string | null;
  courierTrackingUrl?: string | null;
}

export interface TrackOrderResult {
  success: boolean;
  message?: string;
  data?: PublicSafeOrderDTO;
}

/**
 * Public Server Action to track customer orders without exposing sensitive internal data.
 * Requires both the order number and customer phone number to prevent unauthorized enumeration.
 */
export async function trackOrderPublicAction(
  orderNumber: string,
  phone: string
): Promise<TrackOrderResult> {
  try {
    // 1. Input Sanitization: Strip leading '#' and trim whitespace from orderNumber
    const cleanOrderNumber = (orderNumber || "").replace(/^[#\s]+/, "").trim();
    const cleanRawPhone = (phone || "").trim();

    // 2. Input presence validation
    if (!cleanOrderNumber) {
      return {
        success: false,
        message: "অনুগ্রহ করে অর্ডার নম্বর প্রদান করুন (যেমন: SS-261019-XXXX)।",
      };
    }

    if (!cleanRawPhone) {
      return {
        success: false,
        message: "অনুগ্রহ করে আপনার ১১ ডিজিটের মোবাইল নম্বরটি দিন।",
      };
    }

    // 3. Validate Bangladeshi phone format
    const cleanPhone = normalizeBDPhone(cleanRawPhone);
    if (!isValidBDPhone(cleanRawPhone) && !isValidBDPhone(cleanPhone)) {
      return {
        success: false,
        message: "অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।",
      };
    }

    // 4. Supabase Client Initialization with Graceful Fallback
    let supabaseClient: any;
    try {
      if (
        process.env.SUPABASE_SERVICE_ROLE_KEY &&
        process.env.SUPABASE_SERVICE_ROLE_KEY !== "placeholder-service-key"
      ) {
        supabaseClient = await createAdminClient();
      } else {
        supabaseClient = await createClient();
      }
    } catch (clientInitErr) {
      console.warn(
        "[trackOrderPublicAction] createAdminClient failed, falling back to createClient:",
        clientInitErr
      );
      supabaseClient = await createClient();
    }

    // 5. Query order using select("*") to avoid column-name mismatch failures
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .select("*")
      .ilike("order_number", cleanOrderNumber)
      .maybeSingle();

    if (orderError) {
      console.error("[trackOrderPublicAction] Order query error:", {
        code: orderError.code,
        message: orderError.message,
        details: orderError.details,
        hint: orderError.hint,
        searchedOrderNumber: cleanOrderNumber,
      });

      // Special diagnostic hint for database table permissions (Postgres error 42501)
      if (orderError.code === "42501") {
        console.error(
          "[trackOrderPublicAction] CRITICAL: Table permissions missing (42501). Run in Supabase SQL Editor: GRANT SELECT ON public.orders TO service_role; GRANT SELECT ON public.order_items TO service_role;"
        );
      }

      return {
        success: false,
        message: "অর্ডার ট্র্যাকিং তথ্য লোড করতে সমস্যা হচ্ছে। কিছুক্ষণ পর আবার চেষ্টা করুন।",
      };
    }

    if (!order) {
      return {
        success: false,
        message: "অর্ডার নম্বর অথবা মোবাইল নম্বরটি সঠিক নয়।",
      };
    }

    // 6. Phone Verification: Compare against guest_phone, customer_phone, or phone in shipping_address
    const shipping = (order.shipping_address as any) || {};
    const storedPhones = [
      order.guest_phone,
      (order as any).customer_phone,
      (order as any).phone,
      shipping.phone,
      shipping.guest_phone,
      shipping.customer_phone,
    ]
      .filter(Boolean)
      .map((p) => normalizeBDPhone(String(p)));

    const phoneMatches = storedPhones.some((stored) => {
      return (
        stored === cleanPhone ||
        (stored.length >= 10 &&
          cleanPhone.length >= 10 &&
          stored.slice(-10) === cleanPhone.slice(-10))
      );
    });

    if (!phoneMatches) {
      return {
        success: false,
        message: "অর্ডার নম্বর অথবা মোবাইল নম্বরটি সঠিক নয়।",
      };
    }

    // 7. Query order line items using select("*")
    const { data: rawItems, error: itemsError } = await supabaseClient
      .from("order_items")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true });

    if (itemsError) {
      console.error("[trackOrderPublicAction] Items query error:", {
        code: itemsError.code,
        message: itemsError.message,
        details: itemsError.details,
        hint: itemsError.hint,
        orderId: order.id,
      });
    }

    // 8. Map public-safe items and attach catalog product images
    const items: PublicSafeOrderItem[] = (rawItems || []).map((item: any) => {
      const productId = item.product_id || "";
      const matchedProduct = ALL_PRODUCTS.find(
        (p) => p.id === productId || PRODUCT_ID_MAP[p.id] === productId
      );

      return {
        productTitle: item.product_title || item.title || "পণ্য",
        variantName: item.variant_name || item.variant_title || undefined,
        unitPrice: Number(item.unit_price ?? item.price ?? 0),
        quantity: Number(item.quantity ?? 1),
        lineTotal: Number(
          item.line_total ??
            Number(item.unit_price ?? 0) * Number(item.quantity ?? 1)
        ),
        productImage: matchedProduct?.images?.[0] || undefined,
      };
    });

    // 9. Extract sanitized geographic details and mask phone/address
    const district = typeof shipping.district === "string" ? shipping.district.trim() : "";
    const thana = typeof shipping.thana === "string" ? shipping.thana.trim() : "";
    const deliveryZone: DeliveryZone =
      shipping.zone === "outside_dhaka" ? "outside_dhaka" : "inside_dhaka";

    const effectivePhone = cleanPhone;
    const maskedPhone =
      effectivePhone.length >= 10
        ? `${effectivePhone.slice(0, 3)}****${effectivePhone.slice(-4)}`
        : "০১৭********";

    const maskedAddress =
      [thana, district].filter(Boolean).join(", ") ||
      (deliveryZone === "inside_dhaka" ? "ঢাকা সিটি" : "ঢাকার বাইরে");

    // 10. Build and return sanitized DTO with fallback column resolution
    const safeOrder: PublicSafeOrderDTO = {
      orderNumber: order.order_number,
      orderStatus: order.order_status || (order as any).status || "pending",
      paymentStatus: order.payment_status || "unpaid",
      paymentMethod: order.payment_method || "cod",
      createdAt: order.created_at || new Date().toISOString(),
      updatedAt: order.updated_at || undefined,
      deliveryZone,
      district: district || undefined,
      thana: thana || undefined,
      maskedPhone,
      maskedAddress,
      subtotal: Number(order.subtotal ?? (order as any).total_amount ?? 0),
      deliveryFee: Number(order.delivery_fee ?? (order as any).shipping_fee ?? 0),
      discountAmount: Number(order.discount_amount ?? (order as any).discount ?? 0),
      couponCode: order.coupon_code || null,
      grandTotal: Number(
        order.grand_total ?? (order as any).total ?? (order as any).total_amount ?? 0
      ),
      items,
      courierPartner: order.courier_partner || (order as any).courier_name || null,
      courierTrackingCode: order.courier_tracking_code || (order as any).tracking_code || null,
      courierTrackingUrl: (order.courier_tracking_code || (order as any).tracking_code)
        ? `https://steadfast.com.bd/tracking/${encodeURIComponent(order.courier_tracking_code || (order as any).tracking_code)}`
        : null,
    };

    return {
      success: true,
      data: safeOrder,
    };
  } catch (err: any) {
    console.error("[trackOrderPublicAction] Unexpected exception:", {
      message: err?.message,
      stack: err?.stack,
      cause: err?.cause,
    });
    return {
      success: false,
      message: "সার্ভারে অনাকাঙ্ক্ষিত ত্রুটি ঘটেছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।",
    };
  }
}
