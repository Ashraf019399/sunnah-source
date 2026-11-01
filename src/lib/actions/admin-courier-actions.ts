"use server";

import fs from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/auth/admin-guard";
import {
  testSteadfastConnection,
  createSteadfastOrder,
  getSteadfastDeliveryStatus,
  isSteadfastConfigured,
  getSteadfastTrackingUrl,
  STEADFAST_BASE_URL,
} from "@/lib/services/steadfast";
import {
  CourierSettings,
  DEFAULT_COURIER_SETTINGS,
  CourierSettingsMutationResult,
} from "@/types/settings.types";

const SETTINGS_FILE_PATH = path.join(
  process.cwd(),
  "src",
  "lib",
  "data",
  "courier-settings.json"
);

export interface CourierBookingResult {
  success: boolean;
  message: string;
  consignment_id?: string | number;
  consignmentId?: string | number;
  tracking_code?: string;
  trackingCode?: string;
  trackingUrl?: string;
  status?: string;
  orderStatus?: string;
}

/**
 * Retrieves the current Steadfast Courier settings.
 * Persisted in src/lib/data/courier-settings.json with .env.local fallback.
 */
export async function getCourierSettings(): Promise<CourierSettings> {
  let fileData: Partial<CourierSettings> = {};

  try {
    const raw = await fs.readFile(SETTINGS_FILE_PATH, "utf-8");
    fileData = JSON.parse(raw);
  } catch {
    // If file doesn't exist, will fallback to env
  }

  const apiKey = String(
    fileData.apiKey || process.env.STEADFAST_API_KEY || DEFAULT_COURIER_SETTINGS.apiKey
  ).trim();

  const secretKey = String(
    fileData.secretKey || process.env.STEADFAST_SECRET_KEY || DEFAULT_COURIER_SETTINGS.secretKey
  ).trim();

  const baseUrl = String(
    fileData.baseUrl || process.env.STEADFAST_BASE_URL || STEADFAST_BASE_URL
  ).replace(/\/+$/, "");

  const isConfigured = Boolean(apiKey && secretKey);

  return {
    provider: "steadfast",
    apiKey,
    secretKey,
    baseUrl,
    isConfigured,
    updatedAt: fileData.updatedAt || null,
    updatedBy: fileData.updatedBy || null,
  };
}

/**
 * Server Action: Saves courier settings securely to courier-settings.json.
 * Strictly guarded by Admin authentication.
 */
export async function saveCourierSettingsAction(formData: {
  apiKey: string;
  secretKey: string;
}): Promise<CourierSettingsMutationResult> {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: "অননুমোদিত প্রবেশাধিকার। অ্যাডমিন লগইন আবশ্যক।",
      };
    }

    // 2. Authorize admin
    const isAdmin = await checkIsAdmin(user, supabase);
    if (!isAdmin) {
      return {
        success: false,
        message: "অননুমোদিত প্রবেশাধিকার। শুধুমাত্র অ্যাডমিনরা সেটিংস পরিবর্তন করতে পারেন।",
      };
    }

    // 3. Validate credentials
    const cleanApiKey = (formData.apiKey || "").trim();
    const cleanSecretKey = (formData.secretKey || "").trim();

    const fieldErrors: { apiKey?: string; secretKey?: string } = {};
    if (!cleanApiKey) {
      fieldErrors.apiKey = "Steadfast API Key প্রদান করুন।";
    }
    if (!cleanSecretKey) {
      fieldErrors.secretKey = "Steadfast Secret Key প্রদান করুন।";
    }

    if (Object.keys(fieldErrors).length > 0) {
      return {
        success: false,
        message: "সবগুলো প্রয়োজনীয় ফিল্ড সঠিকভাবে পূরণ করুন।",
        fieldErrors,
      };
    }

    // 4. Persist to JSON file
    const newSettings: CourierSettings = {
      provider: "steadfast",
      apiKey: cleanApiKey,
      secretKey: cleanSecretKey,
      baseUrl: STEADFAST_BASE_URL,
      isConfigured: true,
      updatedAt: new Date().toISOString(),
      updatedBy: user.email || "admin",
    };

    // Ensure directory exists
    await fs.mkdir(path.dirname(SETTINGS_FILE_PATH), { recursive: true });
    await fs.writeFile(
      SETTINGS_FILE_PATH,
      JSON.stringify(newSettings, null, 2),
      "utf-8"
    );

    // 5. Revalidate cache
    revalidatePath("/admin/settings");
    revalidatePath("/admin/orders");
    revalidatePath("/admin");

    return {
      success: true,
      message: "কুরিয়ার সেটিংস সফলভাবে সংরক্ষিত হয়েছে।",
      data: newSettings,
    };
  } catch (err: any) {
    console.error("[saveCourierSettingsAction] Error:", err);
    return {
      success: false,
      message: err.message || "সেটিংস সংরক্ষণ ব্যর্থ হয়েছে।",
    };
  }
}

/**
 * Server Action: Validates live API credentials with toast feedback.
 * Calls testSteadfastConnection(apiKey, secretKey) to check wallet balance.
 */
export async function testCourierConnectionAction(credentials?: {
  apiKey?: string;
  secretKey?: string;
}): Promise<{
  success: boolean;
  message: string;
  balance?: number;
  formattedBalance?: string;
}> {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: "অননুমোদিত প্রবেশাধিকার। অ্যাডমিন লগইন আবশ্যক।",
      };
    }

    const isAdmin = await checkIsAdmin(user, supabase);
    if (!isAdmin) {
      return {
        success: false,
        message: "অননুমোদিত প্রবেশাধিকার। শুধুমাত্র অ্যাডমিনরা টেস্ট করতে পারেন।",
      };
    }

    // 2. Call live API with trimmed keys
    let apiKey = (credentials?.apiKey || "").trim();
    let secretKey = (credentials?.secretKey || "").trim();

    if (!apiKey || !secretKey) {
      const saved = await getCourierSettings();
      apiKey = (saved.apiKey || "").trim();
      secretKey = (saved.secretKey || "").trim();
    }

    if (!apiKey || !secretKey) {
      return {
        success: false,
        message: "Steadfast API Key এবং Secret Key প্রদান করা আবশ্যক।",
      };
    }

    const result = await testSteadfastConnection(
      apiKey,
      secretKey
    );

    return {
      success: result.success,
      message: result.message,
      balance: result.current_balance ?? result.balance,
      formattedBalance: result.formattedBalance,
    };
  } catch (err: any) {
    console.error("[testCourierConnectionAction] Error:", err);
    return {
      success: false,
      message: err.message || "সার্ভার এরর ঘটেছে।",
    };
  }
}

/**
 * Server Action: Dispatches an order to Steadfast Courier with 1-Click execution.
 * Auto-fetches order details, dispatches consignment to Steadfast,
 * saves consignment_id and tracking_code to the order, and updates order status to "shipped".
 */
export async function dispatchOrderToSteadfastAction(
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

    const isAdmin = await checkIsAdmin(user, authSupabase);
    if (!isAdmin) {
      return {
        success: false,
        message: "অননুমোদিত প্রবেশাধিকার। শুধুমাত্র অ্যাডমিনরা পার্সেল বুকিং করতে পারেন।",
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
    if (
      existingTracking &&
      (order.courier_partner?.toLowerCase() === "steadfast" ||
        order.courier_name?.toLowerCase() === "steadfast")
    ) {
      const cidMatch = order.admin_notes?.match(/Steadfast Consignment ID:\s*([0-9a-zA-Z_-]+)/i);
      const existingCid = cidMatch ? cidMatch[1] : undefined;

      return {
        success: false,
        message: `এই অর্ডারটি ইতোমধ্যে Steadfast-এ বুকিং করা হয়েছে (ট্র্যাকিং কোড: ${existingTracking})।`,
        tracking_code: existingTracking,
        trackingCode: existingTracking,
        consignment_id: existingCid,
        consignmentId: existingCid,
        trackingUrl: getSteadfastTrackingUrl(existingTracking),
      };
    }

    // 5. Prepare recipient and shipment payload
    const shipping = (order.shipping_address || {}) as Record<string, any>;
    const recipientName = (order.guest_name || shipping.fullName || "সম্মানিত গ্রাহক").trim();
    const recipientPhone = (order.guest_phone || shipping.phone || "").trim();

    const addressParts = [
      shipping.fullAddress,
      shipping.thana,
      shipping.district,
    ].filter(Boolean);
    const fullAddress =
      addressParts.length > 0 ? addressParts.join(", ") : "ঠিকানা প্রদান করা হয়নি";

    // Collectible COD: If paid, COD is 0; otherwise grand_total
    const isPaid = order.payment_status === "paid";
    const codAmount = isPaid
      ? 0
      : Math.max(0, Math.round(Number(order.grand_total) || 0));

    const zoneLabel =
      shipping.zone === "inside_dhaka"
        ? "ঢাকা সিটি (Inside Dhaka)"
        : "ঢাকার বাইরে (Outside Dhaka)";
    const note = [shipping.notes, zoneLabel].filter(Boolean).join(" | ");

    // 6. Execute Steadfast API dispatch
    const courierSettings = await getCourierSettings();
    const cleanApiKey = (courierSettings.apiKey || "").trim();
    const cleanSecretKey = (courierSettings.secretKey || "").trim();

    if (!cleanApiKey || !cleanSecretKey) {
      return {
        success: false,
        message: "Steadfast API Key বা Secret Key কনফিগার করা হয়নি। সেটিংস থেকে সঠিক কি প্রদান করুন।",
      };
    }

    const courierResult = await createSteadfastOrder(
      {
        invoice: order.order_number,
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        recipient_address: fullAddress,
        cod_amount: codAmount,
        note,
      },
      {
        apiKey: cleanApiKey,
        secretKey: cleanSecretKey,
      }
    );

    if (!courierResult.success || !courierResult.consignment) {
      return {
        success: false,
        message: courierResult.message || "Steadfast-এ বুকিং ব্যর্থ হয়েছে।",
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

    // Append Steadfast Consignment ID to admin_notes
    const noteEntry = `Steadfast Consignment ID: ${consignmentId}`;
    updatePayload.admin_notes = order.admin_notes
      ? `${order.admin_notes} | ${noteEntry}`
      : noteEntry;

    const { error: updateError } = await adminClient
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId);

    if (updateError) {
      console.error("[dispatchOrderToSteadfastAction] Database update error:", updateError);
      return {
        success: false,
        message: `Steadfast-এ বুকিং সফল হয়েছে (ট্র্যাকিং: ${trackingCode}), কিন্তু ডাটাবেজ আপডেট ব্যর্থ হয়েছে: ${updateError.message}`,
        consignment_id: consignmentId,
        consignmentId,
        tracking_code: trackingCode,
        trackingCode,
        trackingUrl,
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
      consignment_id: consignmentId,
      consignmentId,
      tracking_code: trackingCode,
      trackingCode,
      trackingUrl,
      status: consignment.status,
      orderStatus: "shipped",
    };
  } catch (err: any) {
    console.error("[dispatchOrderToSteadfastAction] Server action error:", err);
    return {
      success: false,
      message: err.message || "সার্ভার এরর ঘটেছে।",
    };
  }
}

/**
 * Alias for dispatchOrderToSteadfastAction for backwards compatibility.
 */
export async function bookOrderToSteadfast(
  orderId: string
): Promise<CourierBookingResult> {
  return dispatchOrderToSteadfastAction(orderId);
}

/**
 * Checks whether Steadfast is configured in saved settings or environment.
 */
export async function checkSteadfastConfigAction(): Promise<{
  isConfigured: boolean;
}> {
  const settings = await getCourierSettings();
  return {
    isConfigured: settings.isConfigured,
  };
}

/**
 * Server action to query delivery status for a consignment.
 */
export async function checkCourierDeliveryStatusAction(
  consignmentId: string | number
) {
  return getSteadfastDeliveryStatus(consignmentId);
}
