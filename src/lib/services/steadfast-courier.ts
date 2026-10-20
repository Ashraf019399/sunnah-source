/**
 * Steadfast Courier API Integration Service
 * 
 * Documentation & Endpoints:
 * Base URL: https://portal.packzy.com/api/v1 (or STEADFAST_BASE_URL env var)
 * Endpoint: POST /create_order
 * Headers: Api-Key, Secret-Key, Content-Type: application/json
 */

export interface SteadfastCreateOrderPayload {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  note?: string;
}

export interface SteadfastConsignment {
  consignment_id: number | string;
  invoice: string;
  tracking_code: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  status?: string;
  note?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SteadfastOrderResult {
  success: boolean;
  message: string;
  consignment?: SteadfastConsignment;
  trackingCode?: string;
  consignmentId?: number | string;
  rawResponse?: any;
}

/**
 * Returns whether Steadfast credentials are configured in the environment.
 */
export function isSteadfastConfigured(): boolean {
  const apiKey = process.env.STEADFAST_API_KEY?.trim();
  const secretKey = process.env.STEADFAST_SECRET_KEY?.trim();
  return Boolean(apiKey && secretKey);
}

/**
 * Returns public tracking portal URL for a Steadfast tracking code.
 */
export function getSteadfastTrackingUrl(trackingCode: string): string {
  const cleanCode = (trackingCode || "").trim();
  return `https://steadfast.com.bd/tracking/${encodeURIComponent(cleanCode)}`;
}

/**
 * Creates a courier delivery consignment in Steadfast Courier.
 */
export async function createSteadfastOrder(
  payload: SteadfastCreateOrderPayload
): Promise<SteadfastOrderResult> {
  const baseUrl = (process.env.STEADFAST_BASE_URL || "https://portal.packzy.com/api/v1").replace(
    /\/+$/,
    ""
  );
  const apiKey = process.env.STEADFAST_API_KEY?.trim();
  const secretKey = process.env.STEADFAST_SECRET_KEY?.trim();

  // 1. Validate credentials presence
  if (!apiKey || !secretKey) {
    return {
      success: false,
      message: "Steadfast API Key or Secret Key is not configured in .env.local",
    };
  }

  // 2. Validate input payload
  if (!payload.invoice || !payload.recipient_phone || !payload.recipient_address) {
    return {
      success: false,
      message: "ইনভয়েস নম্বর, গ্রাহকের ফোন নম্বর এবং সম্পূর্ণ ঠিকানা আবশ্যক।",
    };
  }

  const endpoint = `${baseUrl}/create_order`;

  const requestBody = {
    invoice: payload.invoice,
    recipient_name: payload.recipient_name || "সম্মানিত গ্রাহক",
    recipient_phone: payload.recipient_phone,
    recipient_address: payload.recipient_address,
    cod_amount: Math.max(0, Math.round(Number(payload.cod_amount) || 0)),
    note: payload.note || "Sunnah Source Parcel",
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": apiKey,
        "Secret-Key": secretKey,
      },
      body: JSON.stringify(requestBody),
      cache: "no-store",
    });

    const responseText = await response.text();
    let data: any = {};
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { message: responseText };
    }

    // Steadfast typically returns:
    // { "status": 200, "message": "Order created successfully", "consignment": { ... } }
    const isOkStatus = data.status === 200 || data.status === 201 || response.ok;
    const consignment = data.consignment || data.data;

    if (isOkStatus && consignment && (consignment.tracking_code || consignment.consignment_id)) {
      const trackingCode = String(consignment.tracking_code || consignment.consignment_id);
      return {
        success: true,
        message: data.message || "Steadfast-এ পার্সেল সফলভাবে বুকিং সম্পন্ন হয়েছে।",
        consignment: {
          consignment_id: consignment.consignment_id,
          invoice: consignment.invoice || payload.invoice,
          tracking_code: trackingCode,
          recipient_name: consignment.recipient_name || payload.recipient_name,
          recipient_phone: consignment.recipient_phone || payload.recipient_phone,
          recipient_address: consignment.recipient_address || payload.recipient_address,
          cod_amount: consignment.cod_amount ?? payload.cod_amount,
          status: consignment.status,
          note: consignment.note,
        },
        trackingCode,
        consignmentId: consignment.consignment_id,
        rawResponse: data,
      };
    }

    // Error handling from Steadfast response
    const errorMessage =
      data.message ||
      data.error ||
      (typeof data.errors === "object" ? JSON.stringify(data.errors) : null) ||
      `Steadfast API ত্রুটি (HTTP ${response.status})`;

    return {
      success: false,
      message: errorMessage,
      rawResponse: data,
    };
  } catch (err: any) {
    console.error("[createSteadfastOrder] Network/fetch error:", err);
    return {
      success: false,
      message: `Steadfast সার্ভারের সাথে যোগাযোগ করা যায়নি: ${err.message || "Network Error"}`,
    };
  }
}
