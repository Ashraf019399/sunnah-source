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

    // 3. Trusted financial calculations
    const trustedSubtotal = orderItems.reduce((sum, it) => sum + it.lineTotal, 0);
    const isFreeDelivery = trustedSubtotal >= 2000;
    const trustedDeliveryFee = isFreeDelivery
      ? 0
      : customer.zone === "inside_dhaka"
      ? 70
      : 130;
    // 4. Server-side coupon validation and discount calculation
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

    // 5. Order metadata
    const orderId = crypto.randomUUID();
    const orderNumber =
      "SS-" + Date.now().toString().slice(-6) + Math.floor(10 + Math.random() * 90);
    const cleanPhone = customer.phone.replace(/\D/g, "").slice(-11);

    // 6. Ensure service-role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[checkout-actions] SUPABASE_SERVICE_ROLE_KEY is missing in server environment.");
      return {
        success: false,
        message: "সার্ভার কনফিগারেশনজনিত ত্রুটি। অনুগ্রহ করে আমাদের সাথে যোগাযোগ করুন।",
      };
    }

    // 7. Execute atomic RPC via service-role client
    const adminClient = await createAdminClient();
    const rpcPayload = {
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
      return {
        success: false,
        message: "অর্ডার সম্পন্ন করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
      };
    }

    const rpcData = rpcResult.data as { success: boolean; message?: string; order_number?: string };
    if (!rpcData || !rpcData.success) {
      return {
        success: false,
        message: rpcData?.message || "অর্ডার সম্পন্ন করতে সমস্যা হয়েছে।",
      };
    }

    return {
      success: true,
      message: "অর্ডার সফল হয়েছে!",
      data: { orderNumber: rpcData.order_number || orderNumber },
    };
  } catch (err: any) {
    console.error("[checkout-actions] Unexpected server error:", err);
    return { success: false, message: err?.message || "সার্ভার এরর ঘটেছে।" };
  }
}