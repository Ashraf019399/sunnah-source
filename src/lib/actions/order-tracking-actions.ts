"use server";

import { createAdminClient } from "@/lib/supabase/server";
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
    const cleanOrderNumber = (orderNumber || "").trim();
    const cleanRawPhone = (phone || "").trim();

    // 1. Input presence validation
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

    // 2. Validate Bangladeshi phone format
    const cleanPhone = normalizeBDPhone(cleanRawPhone);
    if (!isValidBDPhone(cleanRawPhone) && !isValidBDPhone(cleanPhone)) {
      return {
        success: false,
        message: "অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।",
      };
    }

    // 3. Query order using administrative service-role client (bypassing RLS safely on the server)
    const adminClient = await createAdminClient();
    const { data: order, error: orderError } = await adminClient
      .from("orders")
      .select(
        "id, order_number, guest_name, guest_phone, shipping_address, subtotal, delivery_fee, discount_amount, coupon_code, grand_total, payment_method, payment_status, order_status, created_at, updated_at"
      )
      .ilike("order_number", cleanOrderNumber)
      .maybeSingle();

    if (orderError) {
      console.error("[trackOrderPublicAction] Order query error:", orderError);
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

    // 4. Phone Verification (Strict privacy guard against enumeration)
    const storedGuestPhone = normalizeBDPhone(order.guest_phone || "");
    const shipping = (order.shipping_address as any) || {};
    const storedShippingPhone = normalizeBDPhone(shipping.phone || "");

    const phoneMatches =
      (storedGuestPhone && storedGuestPhone === cleanPhone) ||
      (storedShippingPhone && storedShippingPhone === cleanPhone);

    if (!phoneMatches) {
      return {
        success: false,
        message: "অর্ডার নম্বর অথবা মোবাইল নম্বরটি সঠিক নয়।",
      };
    }

    // 5. Query order line items
    const { data: rawItems, error: itemsError } = await adminClient
      .from("order_items")
      .select("product_id, variant_id, product_title, variant_name, unit_price, quantity, line_total")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true });

    if (itemsError) {
      console.error("[trackOrderPublicAction] Items query error:", itemsError);
    }

    // 6. Map public-safe items and attach catalog product images
    const items: PublicSafeOrderItem[] = (rawItems || []).map((item) => {
      const matchedProduct = ALL_PRODUCTS.find(
        (p) => p.id === item.product_id || PRODUCT_ID_MAP[p.id] === item.product_id
      );

      return {
        productTitle: item.product_title,
        variantName: item.variant_name || undefined,
        unitPrice: Number(item.unit_price) || 0,
        quantity: Number(item.quantity) || 1,
        lineTotal: Number(item.line_total) || 0,
        productImage: matchedProduct?.images?.[0] || undefined,
      };
    });

    // 7. Extract sanitized geographic details and mask phone/address
    const district = typeof shipping.district === "string" ? shipping.district.trim() : "";
    const thana = typeof shipping.thana === "string" ? shipping.thana.trim() : "";
    const deliveryZone: DeliveryZone = shipping.zone === "outside_dhaka" ? "outside_dhaka" : "inside_dhaka";

    const effectivePhone = cleanPhone;
    const maskedPhone =
      effectivePhone.length >= 10
        ? `${effectivePhone.slice(0, 3)}****${effectivePhone.slice(-4)}`
        : "০১৭********";

    const maskedAddress =
      [thana, district].filter(Boolean).join(", ") ||
      (deliveryZone === "inside_dhaka" ? "ঢাকা সিটি" : "ঢাকার বাইরে");

    // 8. Build and return sanitized DTO
    const safeOrder: PublicSafeOrderDTO = {
      orderNumber: order.order_number,
      orderStatus: order.order_status,
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method,
      createdAt: order.created_at,
      updatedAt: order.updated_at || undefined,
      deliveryZone,
      district: district || undefined,
      thana: thana || undefined,
      maskedPhone,
      maskedAddress,
      subtotal: Number(order.subtotal) || 0,
      deliveryFee: Number(order.delivery_fee) || 0,
      discountAmount: Number(order.discount_amount) || 0,
      couponCode: order.coupon_code || null,
      grandTotal: Number(order.grand_total) || 0,
      items,
    };

    return {
      success: true,
      data: safeOrder,
    };
  } catch (err: any) {
    console.error("[trackOrderPublicAction] Unexpected error:", err);
    return {
      success: false,
      message: "সার্ভারে অনাকাঙ্ক্ষিত ত্রুটি ঘটেছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।",
    };
  }
}
