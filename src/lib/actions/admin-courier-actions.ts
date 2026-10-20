"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  createSteadfastOrder,
  isSteadfastConfigured,
  getSteadfastTrackingUrl,
} from "@/lib/services/steadfast-courier";

export interface CourierBookingResult {
  success: boolean;
  message: string;
  trackingCode?: string;
  trackingUrl?: string;
  consignmentId?: number | string;
}

/**
 * Checks whether Steadfast credentials are configured in environment variables.
 */
export async function checkSteadfastConfigAction(): Promise<{
  isConfigured: boolean;
}> {
  return {
    isConfigured: isSteadfastConfigured(),
  };
}

/**
 * Books an existing order to Steadfast Courier with 1-click execution.
 * Transitions order status to 'shipped' and records tracking details.
 */
export async function bookOrderToSteadfast(
  orderId: string
): Promise<CourierBookingResult> {
  try {
    if (!orderId) {
      return { success: false, message: "অর্ডার আইডি আবশ্যক।" };
    }

    // 1. Authenticate admin user
    const authSupabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: "অননুমোদিত প্রবেশাধিকার। অ্যাডমিন লগইন প্রয়োজন।",
      };
    }

    const adminClient = await createAdminClient();

    // 2. Fetch the order
    const { data: order, error: fetchError } = await adminClient
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return {
        success: false,
        message: "অর্ডারটি ডাটাবেজে পাওয়া যায়নি।",
      };
    }

    // 3. Status guards: cannot book cancelled or returned orders
    if (order.order_status === "cancelled" || order.order_status === "returned") {
      return {
        success: false,
        message: `বাতিলকৃত বা ফেরত আসা অর্ডার কুরিয়ারে বুকিং করা যাবে না (বর্তমান স্ট্যাটাস: ${order.order_status})।`,
      };
    }

    // 4. Duplicate booking guard: prevent double-booking if already tracked
    const existingTracking = order.courier_tracking_code || order.tracking_code;
    if (existingTracking && (order.courier_partner?.toLowerCase() === "steadfast" || order.courier_name?.toLowerCase() === "steadfast")) {
      return {
        success: false,
        message: `এই অর্ডারটি ইতোমধ্যে Steadfast-এ বুকিং করা হয়েছে (ট্র্যাকিং কোড: ${existingTracking})।`,
        trackingCode: existingTracking,
        trackingUrl: getSteadfastTrackingUrl(existingTracking),
      };
    }

    // 5. Prepare recipient and shipment payload
    const shipping = (order.shipping_address || {}) as Record<string, any>;
    const recipientName = (order.guest_name || shipping.fullName || "গ্রাহক").trim();
    const recipientPhone = (order.guest_phone || shipping.phone || "").trim();

    const addressParts = [
      shipping.fullAddress,
      shipping.thana,
      shipping.district,
    ].filter(Boolean);
    const fullAddress = addressParts.length > 0 ? addressParts.join(", ") : "ঠিকানা প্রদান করা হয়নি";

    // Collectible COD: If paid online, COD is 0; otherwise grand_total
    const isPaid = order.payment_status === "paid";
    const codAmount = isPaid ? 0 : Math.max(0, Math.round(Number(order.grand_total) || 0));

    const zoneLabel = shipping.zone === "inside_dhaka" ? "ঢাকা সিটি (Inside Dhaka)" : "ঢাকার বাইরে (Outside Dhaka)";
    const note = [shipping.notes, zoneLabel].filter(Boolean).join(" | ");

    // 6. Execute Steadfast API dispatch
    const courierResult = await createSteadfastOrder({
      invoice: order.order_number,
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      recipient_address: fullAddress,
      cod_amount: codAmount,
      note,
    });

    if (!courierResult.success || !courierResult.consignment) {
      return {
        success: false,
        message: courierResult.message || "Steadfast এ বুকিং ব্যর্থ হয়েছে।",
      };
    }

    const consignment = courierResult.consignment;
    const trackingCode = String(consignment.tracking_code);
    const consignmentId = consignment.consignment_id;
    const trackingUrl = getSteadfastTrackingUrl(trackingCode);

    // 7. Update the order in Supabase with courier details & transition to 'shipped'
    const updatePayload: Record<string, any> = {
      courier_partner: "Steadfast",
      courier_tracking_code: trackingCode,
      order_status: "shipped",
      updated_at: new Date().toISOString(),
    };

    // If admin_notes column is present, also append Steadfast consignment info
    if (order.admin_notes !== undefined) {
      const noteEntry = `Steadfast Consignment ID: ${consignmentId}`;
      updatePayload.admin_notes = order.admin_notes
        ? `${order.admin_notes} | ${noteEntry}`
        : noteEntry;
    }

    const { error: updateError } = await adminClient
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId);

    if (updateError) {
      console.error("[bookOrderToSteadfast] Database update error:", updateError);
      return {
        success: false,
        message: `Steadfast-এ বুকিং সফল হয়েছে (ট্র্যাকিং: ${trackingCode}), কিন্তু ডাটাবেজ আপডেট ব্যর্থ হয়েছে: ${updateError.message}`,
        trackingCode,
        trackingUrl,
        consignmentId,
      };
    }

    // 8. Revalidate relevant Next.js paths
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin");
    revalidatePath("/track-order");

    return {
      success: true,
      message: `Steadfast-এ সফলভাবে অর্ডার বুকিং হয়েছে! ট্র্যাকিং কোড: ${trackingCode}`,
      trackingCode,
      trackingUrl,
      consignmentId,
    };
  } catch (err: any) {
    console.error("[bookOrderToSteadfast] Server action error:", err);
    return {
      success: false,
      message: err.message || "সার্ভার এরর ঘটেছে।",
    };
  }
}
