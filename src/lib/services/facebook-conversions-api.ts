/**
 * Meta Conversions API (CAPI) Service
 * Direct server-side tracking to Meta Graph API v19.0+
 * Bypasses ad-blockers and iOS tracking restrictions reliably.
 */

import crypto from "crypto";
import { getMarketingSettings } from "@/lib/actions/admin-marketing-actions";

export interface MetaCapiOrderItem {
  id: string;
  name?: string;
  quantity: number;
  item_price?: number;
}

export interface MetaCapiPurchasePayload {
  orderNumber: string;
  grandTotal: number;
  customerName?: string;
  phone: string;
  city?: string;
  clientIp?: string;
  userAgent?: string;
  items?: MetaCapiOrderItem[];
  eventSourceUrl?: string;
}

export interface MetaCapiResult {
  success: boolean;
  message: string;
  eventsReceived?: number;
  fbtraceId?: string;
  rawResponse?: any;
}

/**
 * SHA256 hashes a string according to Meta CAPI specification:
 * Trim, lowercase, then hash to hex.
 */
function hashMetaField(val?: string): string | undefined {
  if (!val) return undefined;
  const clean = val.trim().toLowerCase();
  if (!clean) return undefined;
  return crypto.createHash("sha256").update(clean).digest("hex");
}

/**
 * Formats BD phone number to international E.164 format for Meta hashing (+8801XXXXXXXXX)
 */
function normalizeBdPhoneForMeta(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const last11 = digits.slice(-11);
  if (last11.startsWith("01")) {
    return `88${last11}`;
  }
  return digits;
}

/**
 * Sends a server-side Purchase event directly to Meta Conversions API.
 * Triggered when an order is verified/confirmed by phone call, ensuring 100% clean data.
 */
export async function sendMetaCapiPurchaseEvent(
  payload: MetaCapiPurchasePayload
): Promise<MetaCapiResult> {
  try {
    const marketingSettings = await getMarketingSettings({ unmasked: true });

    if (!marketingSettings.isEnabled) {
      return {
        success: false,
        message: "Meta Pixel ট্র্যাকিং বর্তমানে সেটিংস থেকে বন্ধ (Disabled) রয়েছে।",
      };
    }

    const pixelId = marketingSettings.pixelId;
    const accessToken = marketingSettings.accessToken;

    if (!pixelId) {
      return {
        success: false,
        message: "Meta Pixel ID কনফিগার করা নেই।",
      };
    }

    if (!accessToken) {
      return {
        success: false,
        message:
          "Meta Conversions API (CAPI) Access Token কনফিগার করা নেই। অ্যাডমিন সেটিংস থেকে প্রদান করুন।",
      };
    }

    const eventTime = Math.floor(Date.now() / 1000);
    const eventId = `SS_${payload.orderNumber}`;

    // Prepare User Data with SHA-256 Hashing
    const normalizedPhone = normalizeBdPhoneForMeta(payload.phone);
    const hashedPhone = hashMetaField(normalizedPhone);
    const hashedName = hashMetaField(payload.customerName);
    const hashedCity = hashMetaField(payload.city || "Dhaka");
    const hashedCountry = hashMetaField("bd");

    const userData: Record<string, any> = {
      country: hashedCountry ? [hashedCountry] : undefined,
    };

    if (hashedPhone) userData.ph = [hashedPhone];
    if (hashedName) userData.fn = [hashedName];
    if (hashedCity) userData.ct = [hashedCity];
    if (payload.clientIp && payload.clientIp !== "127.0.0.1") {
      userData.client_ip_address = payload.clientIp;
    }
    if (payload.userAgent) {
      userData.client_user_agent = payload.userAgent;
    }

    // Custom Data
    const customData: Record<string, any> = {
      currency: "BDT",
      value: Math.max(0, Math.round(payload.grandTotal)),
      order_id: payload.orderNumber,
      content_type: "product",
    };

    if (payload.items && payload.items.length > 0) {
      customData.contents = payload.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        item_price: item.item_price || 0,
      }));
      customData.num_items = payload.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
    }

    const eventPayload: Record<string, any> = {
      event_name: "Purchase",
      event_time: eventTime,
      event_id: eventId,
      action_source: "website",
      event_source_url:
        payload.eventSourceUrl || "https://sunnahsource.com/checkout",
      user_data: userData,
      custom_data: customData,
    };

    const requestBody: Record<string, any> = {
      data: [eventPayload],
    };

    // If Test Event Code is configured, attach for verification in Meta Events Manager Test tool
    if (marketingSettings.testEventCode) {
      requestBody.test_event_code = marketingSettings.testEventCode;
    }

    const endpoint = `https://graph.facebook.com/v19.0/${encodeURIComponent(
      pixelId
    )}/events?access_token=${encodeURIComponent(accessToken)}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(requestBody),
      cache: "no-store",
    });

    const responseData = await response.json();

    if (response.ok && responseData.events_received) {
      return {
        success: true,
        message: `Meta CAPI Purchase ইভেন্ট সফলভাবে পাঠানো হয়েছে (Events Received: ${responseData.events_received})।`,
        eventsReceived: responseData.events_received,
        fbtraceId: responseData.fbtrace_id,
        rawResponse: responseData,
      };
    }

    const errorMsg =
      responseData.error?.message ||
      responseData.message ||
      `HTTP ${response.status} ত্রুটি`;

    return {
      success: false,
      message: `Meta CAPI রেসপন্স ত্রুটি: ${errorMsg}`,
      rawResponse: responseData,
    };
  } catch (err: any) {
    console.error("[sendMetaCapiPurchaseEvent] Unexpected error:", err);
    return {
      success: false,
      message: err.message || "Meta CAPI সার্ভারে সংযোগ ব্যর্থ হয়েছে।",
    };
  }
}
