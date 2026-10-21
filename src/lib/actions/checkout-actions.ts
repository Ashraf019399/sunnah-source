"use server";

import { OrderCreationPayload } from "@/types/commerce.types";
import { createAdminClient } from "@/lib/supabase/server";
import { isValidBDPhone } from "@/lib/utils";
import { ALL_PRODUCTS } from "@/lib/data/products";
import {
  PRODUCT_ID_MAP,
  VARIANT_ID_MAP,
  resolveProductDbId,
  resolveVariantDbId,
} from "@/lib/data/catalog-mapping";
import { processOrderCouponServerSide } from "@/lib/actions/coupon-actions";
import { getAdminDeliverySettings } from "@/lib/actions/admin-settings-actions";

interface AggregatedOrderItem {
  productId: string;
  variantId: string;
  productTitle: string;
  variantName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export async function submitOrderServerAction(payload: OrderCreationPayload) {
  try {
    const { customer, items, paymentMethod } = payload;

    // 1. Customer validation
    if (!customer?.fullName?.trim() || !customer?.phone?.trim() || !customer?.fullAddress?.trim()) {
      return { success: false, message: "গ্রাহকের নাম, মোবাইল নম্বর এবং ঠিকানা আবশ্যক।" };
    }
    if (!isValidBDPhone(customer.phone)) {
      return { success: false, message: "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।" };
    }
    if (!items || items.length === 0) {
      return { success: false, message: "কার্ট খালি!" };
    }

    // 2. Validate and aggregate items by variant ID, verifying against trusted catalog
    const aggregatedMap = new Map<string, AggregatedOrderItem>();

    for (const item of items) {
      if (!item.quantity || !Number.isInteger(item.quantity) || item.quantity <= 0) {
        return { success: false, message: "পণ্যের পরিমাণ সঠিক নয়।" };
      }

      // Resolve database UUIDs
      const resolvedProductId = resolveProductDbId(item.productId);
      const resolvedVariantId = resolveVariantDbId(item.variantId);

      if (!resolvedProductId || !resolvedVariantId) {
        return {
          success: false,
          message: `অর্ডারের পণ্য "${item.titleBn || item.title || "অজানা পণ্য"}" শনাক্তকরণে সমস্যা হয়েছে।`,
        };
      }

      // Lookup trusted catalog product and variant
      const matchedProduct = ALL_PRODUCTS.find(
        (p) => p.id === item.productId || PRODUCT_ID_MAP[p.id] === item.productId
      );
      const matchedVariant = matchedProduct?.variants.find(
        (v) => v.id === item.variantId || VARIANT_ID_MAP[v.id] === item.variantId
      );

      if (!matchedProduct || !matchedVariant) {
        return {
          success: false,
          message: `ক্যাটালগে পণ্য বা ভ্যারিয়েন্ট নির্ভরযোগ্যভাবে পাওয়া যায়নি (${item.titleBn || item.variantName || "পণ্য"})।`,
        };
      }

      // Calculate trusted unit price from server catalog
      const trustedUnitPrice =
        typeof matchedVariant.salePrice === "number" && matchedVariant.salePrice > 0
          ? matchedVariant.salePrice
          : matchedVariant.regularPrice;

      if (typeof trustedUnitPrice !== "number" || trustedUnitPrice <= 0) {
        return {
          success: false,
          message: `পণ্যের মূল্য নির্ধারণে সমস্যা হয়েছে (${matchedProduct.titleBn})।`,
        };
      }

      if (aggregatedMap.has(resolvedVariantId)) {
        const existing = aggregatedMap.get(resolvedVariantId)!;
        existing.quantity += item.quantity;
        existing.lineTotal = existing.unitPrice * existing.quantity;
      } else {
        aggregatedMap.set(resolvedVariantId, {
          productId: resolvedProductId,
          variantId: resolvedVariantId,
          productTitle: matchedProduct.titleBn,
          variantName: matchedVariant.displayName,
          unitPrice: trustedUnitPrice,
          quantity: item.quantity,
          lineTotal: trustedUnitPrice * item.quantity,
        });
      }
    }

    // Sort items by variantId deterministically to eliminate deadlocks in concurrent checkouts
    const orderItems: AggregatedOrderItem[] = Array.from(aggregatedMap.values()).sort((a, b) =>
      a.variantId.localeCompare(b.variantId)
    );

    // 3. Trusted financial calculations based on dynamic store settings
    const trustedSubtotal = orderItems.reduce((sum, it) => sum + it.lineTotal, 0);
    const deliverySettings = await getAdminDeliverySettings();
    const isFreeDelivery = trustedSubtotal >= deliverySettings.freeDeliveryThreshold;
    const trustedDeliveryFee = isFreeDelivery
      ? 0
      : customer.zone === "inside_dhaka"
      ? deliverySettings.insideDhakaFee
      : deliverySettings.outsideDhakaFee;
    // 4. Order metadata & Idempotency Key
    const cleanIdempotencyKey =
      payload.idempotencyKey && typeof payload.idempotencyKey === "string"
        ? payload.idempotencyKey.trim().slice(0, 64)
        : null;

    const orderId = crypto.randomUUID();
    const orderNumber =
      "SS-" + Date.now().toString().slice(-6) + Math.floor(10 + Math.random() * 90);
    const cleanPhone = customer.phone.replace(/\D/g, "").slice(-11);

    // 5. Ensure service-role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[checkout-actions] SUPABASE_SERVICE_ROLE_KEY is missing in server environment.");
      return {
        success: false,
        message: "সার্ভার কনফিগারেশনজনিত ত্রুটি। অনুগ্রহ করে আমাদের সাথে যোগাযোগ করুন।",
      };
    }

    const adminClient = await createAdminClient();

    // 6. Return existing order on retry BEFORE coupon availability/usage validation can block it
    // Preserves server-side price, customer address, and payload-mismatch protection
    if (cleanIdempotencyKey) {
      const { data: existingOrder } = await adminClient
        .from("orders")
        .select(
          "id, order_number, grand_total, subtotal, delivery_fee, guest_phone, guest_name, coupon_code, payment_method, shipping_address"
        )
        .eq("idempotency_key", cleanIdempotencyKey)
        .maybeSingle();

      if (existingOrder) {
        // Enforce strict server-side payload-mismatch protection against altered checkout intent
        const incomingPhone = cleanPhone;
        const incomingSubtotal = trustedSubtotal;
        const incomingDeliveryFee = trustedDeliveryFee;
        const incomingCoupon = payload.couponCode?.trim().toUpperCase() || null;
        const incomingPaymentMethod = ["cod", "bkash", "nagad", "sslcommerz"].includes(paymentMethod)
          ? paymentMethod
          : "cod";
        const incomingAddress = customer.fullAddress.trim();
        const incomingThana = customer.thana.trim();
        const incomingDistrict = customer.district.trim();

        const existingShipping = (existingOrder.shipping_address as unknown as Record<string, string | undefined>) || {};
        let isMismatch =
          (existingOrder.guest_name || "").trim() !== customer.fullName.trim() ||
          existingOrder.guest_phone !== incomingPhone ||
          Number(existingOrder.subtotal) !== incomingSubtotal ||
          Number(existingOrder.delivery_fee) !== incomingDeliveryFee ||
          (existingOrder.coupon_code || null) !== incomingCoupon ||
          existingOrder.payment_method !== incomingPaymentMethod ||
          (existingShipping.fullAddress || "").trim() !== incomingAddress ||
          (existingShipping.thana || "").trim() !== incomingThana ||
          (existingShipping.district || "").trim() !== incomingDistrict;

        if (!isMismatch) {
          // Verify item-level integrity against existing order items
          const { data: existingItems } = await adminClient
            .from("order_items")
            .select("variant_id, quantity, unit_price")
            .eq("order_id", existingOrder.id);

          if (!existingItems || existingItems.length !== orderItems.length) {
            isMismatch = true;
          } else {
            const sortedExisting = [...existingItems].sort((a, b) =>
              (a.variant_id || "").localeCompare(b.variant_id || "")
            );
            for (let i = 0; i < orderItems.length; i++) {
              const incoming = orderItems[i];
              const existing = sortedExisting[i];
              if (
                !existing ||
                existing.variant_id !== incoming.variantId ||
                existing.quantity !== incoming.quantity ||
                Number(existing.unit_price) !== incoming.unitPrice
              ) {
                isMismatch = true;
                break;
              }
            }
          }
        }

        if (isMismatch) {
          return {
            success: false,
            message: "IDEMPOTENCY_PAYLOAD_MISMATCH: একই আইডেমপোটেন্সি কি দিয়ে ভিন্ন অর্ডারের অনুরোধ করা যাবে না।",
          };
        }

        return {
          success: true,
          message: "অর্ডার পূর্বেই সফলভাবে গৃহীত হয়েছে।",
          data: {
            orderNumber: existingOrder.order_number,
            isDuplicate: true,
          },
        };
      }
    }

    // 7. Server-side coupon validation and discount calculation for new orders
    const couponResult = await processOrderCouponServerSide(
      payload.couponCode,
      trustedSubtotal,
      trustedDeliveryFee
    );

    if (!couponResult.isValid) {
      return {
        success: false,
        message: couponResult.message || "প্রদত্ত কুপনটি বর্তমানে কার্যকর নয়।",
      };
    }

    const trustedDiscount = couponResult.discountAmount;
    const validatedCouponCode = couponResult.couponCode;
    const trustedGrandTotal = Math.max(0, trustedSubtotal + trustedDeliveryFee - trustedDiscount);

    // 8. Execute atomic RPC via service-role client with idempotency key
    const rpcPayload: Record<string, unknown> = {
      p_order_id: orderId,
      p_order_number: orderNumber,
      p_guest_name: customer.fullName.trim(),
      p_guest_phone: cleanPhone,
      p_shipping_address: customer,
      p_subtotal: trustedSubtotal,
      p_delivery_fee: trustedDeliveryFee,
      p_discount_amount: trustedDiscount,
      p_coupon_code: validatedCouponCode,
      p_grand_total: trustedGrandTotal,
      p_payment_method: ["cod", "bkash", "nagad", "sslcommerz"].includes(paymentMethod)
        ? paymentMethod
        : "cod",
      p_payment_status: "unpaid",
      p_items: orderItems.map((it) => ({
        product_id: it.productId,
        variant_id: it.variantId,
        product_title: it.productTitle,
        variant_name: it.variantName,
        unit_price: it.unitPrice,
        quantity: it.quantity,
        line_total: it.lineTotal,
      })),
      ...(cleanIdempotencyKey ? { p_idempotency_key: cleanIdempotencyKey } : {}),
    };

    const rpcResult = await adminClient.rpc("create_order_with_inventory", rpcPayload);

    if (rpcResult.error) {
      console.error("[checkout-actions] create_order_with_inventory error:", rpcResult.error);
      const rawMsg = rpcResult.error.message || "";
      if (rawMsg.includes("COUPON_ERROR:")) {
        const parts = rawMsg.split("COUPON_ERROR:")[1]?.split("\n")[0] || "";
        const couponMsg = parts.trim() || "কুপন যাচাইকরণে সমস্যা হয়েছে।";
        return {
          success: false,
          message: couponMsg,
        };
      }
      if (rawMsg.includes("OUT_OF_STOCK:")) {
        const parts = rawMsg.split("OUT_OF_STOCK:")[1]?.split(":") || [];
        const itemTitle = parts[0]?.trim() || "পণ্য";
        const currentStock = parts[1]?.trim() || "০";
        return {
          success: false,
          message: `দুঃখিত, "${itemTitle}" এর পর্যাপ্ত স্টক নেই (বর্তমান মজুদ: ${currentStock} টি)।`,
        };
      }
      if (rawMsg.includes("IDEMPOTENCY_PAYLOAD_MISMATCH:")) {
        const parts = rawMsg.split("IDEMPOTENCY_PAYLOAD_MISMATCH:")[1]?.split("\n")[0] || "";
        const mismatchMsg = parts.trim() || "একই আইডেমপোটেন্সি কি দিয়ে ভিন্ন অর্ডারের অনুরোধ করা যাবে না।";
        return {
          success: false,
          message: mismatchMsg,
        };
      }
      return {
        success: false,
        message: "অর্ডার সম্পন্ন করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
      };
    }

    const rpcData = rpcResult.data as {
      success: boolean;
      message?: string;
      order_number?: string;
      is_duplicate?: boolean;
    };
    if (!rpcData || !rpcData.success) {
      return {
        success: false,
        message: rpcData?.message || "অর্ডার সম্পন্ন করতে সমস্যা হয়েছে।",
      };
    }

    return {
      success: true,
      message: rpcData.message || "অর্ডার সফল হয়েছে!",
      data: {
        orderNumber: rpcData.order_number || orderNumber,
        isDuplicate: Boolean(rpcData.is_duplicate),
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[checkout-actions] Unexpected server error:", errorMsg);
    return { success: false, message: errorMsg || "সার্ভার এরর ঘটেছে।" };
  }
}

/**
 * Public action to retrieve current store delivery settings for storefront & checkout UI.
 */
export async function getPublicDeliverySettingsAction(): Promise<{
  insideDhakaFee: number;
  outsideDhakaFee: number;
  freeDeliveryThreshold: number;
}> {
  const settings = await getAdminDeliverySettings();
  return {
    insideDhakaFee: settings.insideDhakaFee,
    outsideDhakaFee: settings.outsideDhakaFee,
    freeDeliveryThreshold: settings.freeDeliveryThreshold,
  };
}