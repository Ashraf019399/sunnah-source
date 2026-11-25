"use server";

import { headers } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
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
import { getCachedDeliverySettings } from "@/lib/actions/admin-settings-actions";
import { getOrderSecuritySettings } from "@/lib/actions/admin-security-actions";
import { getMarketingSettings } from "@/lib/actions/admin-marketing-actions";
import {
  validateHoneypot,
  validateBangladeshiPhone,
  validateCustomerName,
  validateCustomerAddress,
  checkRecentCustomerOrders,
  checkIpOrderLimit,
} from "@/lib/services/fake-order-guard";

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

    // 0. Bot & Honeypot Trap Validation (Fake Order Guard)
    if (!validateHoneypot(payload.honeypot)) {
      console.warn("[checkout-actions] Honeypot triggered. Rejected bot order.");
      return {
        success: false,
        message: "অপ্রত্যাশিত অনুরোধ। অনুগ্রহ করে পেজ রিফ্রেশ করে আবার চেষ্টা করুন।",
      };
    }

    // 1. Fetch Order Security & Cached Delivery Settings in parallel
    const [securitySettings, deliverySettings] = await Promise.all([
      getOrderSecuritySettings(),
      getCachedDeliverySettings(),
    ]);

    // 2. Customer validation & Fraud Guard checks
    if (!customer?.fullName?.trim() || !customer?.phone?.trim() || !customer?.fullAddress?.trim()) {
      return { success: false, message: "গ্রাহকের নাম, মোবাইল নম্বর এবং ঠিকানা আবশ্যক।" };
    }

    // Deep Bangladeshi phone validation (prefix 013-019, length 11, dummy check)
    if (securitySettings.enableFakeOrderGuard) {
      const phoneValidation = validateBangladeshiPhone(customer.phone);
      if (!phoneValidation.isValid) {
        return {
          success: false,
          message: phoneValidation.errorMessage || "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।",
        };
      }

      const nameValidation = validateCustomerName(customer.fullName);
      if (!nameValidation.isValid) {
        return {
          success: false,
          message: nameValidation.errorMessage || "অনুগ্রহ করে আপনার প্রকৃত নাম লিখুন।",
        };
      }

      const addressValidation = validateCustomerAddress(customer.fullAddress);
      if (!addressValidation.isValid) {
        return {
          success: false,
          message: addressValidation.errorMessage || "অনুগ্রহ করে বিস্তারিত ডেলিভারি ঠিকানা লিখুন।",
        };
      }
    } else if (!isValidBDPhone(customer.phone)) {
      return { success: false, message: "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।" };
    }

    if (!items || items.length === 0) {
      return { success: false, message: "কার্ট খালি!" };
    }

    // Extract client IP & User Agent safely
    let clientIp = "127.0.0.1";
    let userAgent = "";
    try {
      const headerList = await headers();
      const forwarded = headerList.get("x-forwarded-for");
      const realIp = headerList.get("x-real-ip");
      clientIp = forwarded ? forwarded.split(",")[0].trim() : realIp || "127.0.0.1";
      userAgent = headerList.get("user-agent") || "";
    } catch {
      // Non-blocking in mock or isolated test environments
    }

    const cleanPhone = customer.phone.replace(/\D/g, "").slice(-11);

    // 3 & 4. Run 24-Hour Phone & IP Limit Protection concurrently
    const [phoneCheck, ipCheck] = await Promise.all([
      securitySettings.blockDuplicate24hPhone
        ? checkRecentCustomerOrders(cleanPhone, securitySettings)
        : Promise.resolve({ isBlocked: false, message: "" }),
      securitySettings.blockDuplicate24hIp
        ? checkIpOrderLimit(clientIp, securitySettings)
        : Promise.resolve({ isAllowed: true, message: "" }),
    ]);

    if (phoneCheck.isBlocked) {
      return {
        success: false,
        message: phoneCheck.message || "এই মোবাইল নম্বর দিয়ে গত ২৪ ঘণ্টার মধ্যে ইতোমধ্যে অর্ডার গৃহীত হয়েছে।",
      };
    }

    if (!ipCheck.isAllowed) {
      return {
        success: false,
        message: ipCheck.message || "একই ডিভাইস/আইপি থেকে অতিরিক্ত অর্ডার অনুরোধ পরিলক্ষিত হয়েছে।",
      };
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
      p_shipping_address: {
        ...customer,
        clientIp,
        userAgent,
      },
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

    try {
      revalidatePath("/admin");
      revalidatePath("/admin/orders");
      revalidatePath("/admin/products");
      revalidatePath("/");
      revalidatePath("/shop");
      revalidatePath("/product", "layout");
      revalidateTag("admin-dashboard-metrics");
      revalidateTag("admin-recent-orders");
      revalidateTag("admin-products");
      revalidateTag("admin-low-stock-alerts");
      revalidateTag("products");
      revalidateTag("orders");
    } catch {}

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
  const settings = await getCachedDeliverySettings();
  return {
    insideDhakaFee: settings.insideDhakaFee,
    outsideDhakaFee: settings.outsideDhakaFee,
    freeDeliveryThreshold: settings.freeDeliveryThreshold,
  };
}

/**
 * Public action for checkout UI to verify duplicate phone number in real-time.
 */
export async function checkDuplicatePhoneAction(phone: string) {
  try {
    const settings = await getOrderSecuritySettings();
    if (!settings.enableDuplicateWarning && !settings.blockDuplicate24hPhone) {
      return { hasDuplicate: false, isBlocked: false };
    }
    return await checkRecentCustomerOrders(phone, settings);
  } catch {
    return { hasDuplicate: false, isBlocked: false };
  }
}

/**
 * Public action for storefront to query whether Pixel purchase should fire immediately or on call confirmation.
 */
export async function getMarketingPixelConfigAction(): Promise<{
  pixelId: string;
  isEnabled: boolean;
  fireOnOrderConfirmationOnly: boolean;
}> {
  try {
    const settings = await getMarketingSettings();
    return {
      pixelId: settings.pixelId,
      isEnabled: settings.isEnabled,
      fireOnOrderConfirmationOnly: settings.fireOnOrderConfirmationOnly,
    };
  } catch {
    return {
      pixelId: "2675229749603202",
      isEnabled: true,
      fireOnOrderConfirmationOnly: true,
    };
  }
}
