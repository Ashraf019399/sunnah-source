/**
 * Steadfast Courier API Integration Service
 * 
 * Official Steadfast Courier Documentation:
 * Base URL: https://portal.steadfast.com.bd/api/v1
 * Headers: Api-Key, Secret-Key, Content-Type: application/json
 * 
 * Endpoints:
 * - GET /get_balance
 * - POST /create_order
 * - GET /status_by_cid/{consignment_id}
 */

export const STEADFAST_BASE_URL = "https://portal.steadfast.com.bd/api/v1";

export interface SteadfastCredentials {
  apiKey: string;
  secretKey: string;
  baseUrl?: string;
}

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
  recipient_name?: string;
  recipient_phone?: string;
  recipient_address?: string;
  cod_amount?: number;
  status?: string;
  note?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SteadfastBalanceResult {
  success: boolean;
  current_balance?: number;
  balance?: number;
  message: string;
  rawResponse?: any;
}

export interface SteadfastOrderResult {
  success: boolean;
  message: string;
  consignment_id?: number | string;
  tracking_code?: string;
  status?: string;
  consignment?: SteadfastConsignment;
  trackingCode?: string;
  consignmentId?: number | string;
  rawResponse?: any;
}

export interface SteadfastStatusResult {
  success: boolean;
  status?: string;
  delivery_status?: string;
  message: string;
  rawResponse?: any;
}

/**
 * Resolves Steadfast API credentials from explicit arguments or environment variables.
 */
export function resolveSteadfastCredentials(
  explicitApiKey?: string,
  explicitSecretKey?: string
): SteadfastCredentials {
  const cleanArgKey = explicitApiKey?.trim();
  const cleanArgSecret = explicitSecretKey?.trim();

  const envKey = (process.env.STEADFAST_API_KEY || "").trim();
  const envSecret = (process.env.STEADFAST_SECRET_KEY || "").trim();
  const envBaseUrl = (process.env.STEADFAST_BASE_URL || STEADFAST_BASE_URL).replace(/\/+$/, "");

  return {
    apiKey: cleanArgKey || envKey,
    secretKey: cleanArgSecret || envSecret,
    baseUrl: envBaseUrl,
  };
}

/**
 * Checks whether Steadfast credentials are configured in environment or provided.
 */
export function isSteadfastConfigured(apiKey?: string, secretKey?: string): boolean {
  const creds = resolveSteadfastCredentials(apiKey, secretKey);
  return Boolean(creds.apiKey && creds.secretKey);
}

/**
 * Returns public tracking portal URL for a Steadfast tracking code.
 * Direct link: https://steadfast.com.bd/t/{tracking_code}
 */
export function getSteadfastTrackingUrl(trackingCode: string): string {
  const cleanCode = (trackingCode || "").trim();
  return `https://steadfast.com.bd/t/${encodeURIComponent(cleanCode)}`;
}

/**
 * Tests connection to Steadfast Courier by calling GET /get_balance
 * to verify credentials and return current delivery wallet balance.
 */
export async function testSteadfastConnection(
  apiKey?: string,
  secretKey?: string
): Promise<SteadfastBalanceResult> {
  const creds = resolveSteadfastCredentials(apiKey, secretKey);

  if (!creds.apiKey || !creds.secretKey) {
    return {
      success: false,
      message: "Steadfast API Key এবং Secret Key কনফিগার করা নেই। অনুগ্রহ করে সেটিংস থেকে প্রদান করুন।",
    };
  }

  const endpoint = `${creds.baseUrl || STEADFAST_BASE_URL}/get_balance`;

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": creds.apiKey,
        "Secret-Key": creds.secretKey,
      },
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
    // { "status": 200, "current_balance": 1250 } or { "current_balance": ... }
    const isOkStatus = data.status === 200 || response.ok;

    if (isOkStatus) {
      const balanceVal =
        data.current_balance !== undefined
          ? Number(data.current_balance)
          : data.balance !== undefined
          ? Number(data.balance)
          : data.data?.current_balance !== undefined
          ? Number(data.data.current_balance)
          : 0;

      const safeBalance = isNaN(balanceVal) ? 0 : balanceVal;

      return {
        success: true,
        current_balance: safeBalance,
        balance: safeBalance,
        message: data.message || `কানেকশন সফল! বর্তমান ওয়ালেট ব্যালেন্স: ৳${safeBalance.toLocaleString("bn-BD")}`,
        rawResponse: data,
      };
    }

    const errorMsg =
      data.message ||
      data.error ||
      `Steadfast সার্ভার প্রতিক্রিয়া প্রদান করেনি (HTTP ${response.status})`;

    return {
      success: false,
      message: errorMsg,
      rawResponse: data,
    };
  } catch (err: any) {
    console.error("[testSteadfastConnection] Network error:", err);
    return {
      success: false,
      message: `Steadfast সার্ভারে সংযোগ ব্যর্থ হয়েছে: ${err.message || "Network Error"}`,
    };
  }
}

/**
 * Creates a courier delivery consignment in Steadfast Courier.
 * Calls POST /create_order and returns consignment_id, tracking_code, status.
 */
export async function createSteadfastOrder(
  payload: SteadfastCreateOrderPayload,
  credentials?: { apiKey?: string; secretKey?: string }
): Promise<SteadfastOrderResult> {
  const creds = resolveSteadfastCredentials(
    credentials?.apiKey,
    credentials?.secretKey
  );

  if (!creds.apiKey || !creds.secretKey) {
    return {
      success: false,
      message: "Steadfast API Key বা Secret Key কনফিগার করা হয়নি।",
    };
  }

  // Validate required fields
  if (!payload.invoice || !payload.recipient_phone || !payload.recipient_address) {
    return {
      success: false,
      message: "ইনভয়েস নম্বর, গ্রাহকের ফোন নম্বর এবং সম্পূর্ণ ঠিকানা আবশ্যক।",
    };
  }

  const endpoint = `${creds.baseUrl || STEADFAST_BASE_URL}/create_order`;

  const requestBody = {
    invoice: payload.invoice,
    recipient_name: (payload.recipient_name || "সম্মানিত গ্রাহক").trim(),
    recipient_phone: (payload.recipient_phone || "").trim(),
    recipient_address: (payload.recipient_address || "").trim(),
    cod_amount: Math.max(0, Math.round(Number(payload.cod_amount) || 0)),
    note: payload.note || "Sunnah Source Parcel",
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": creds.apiKey,
        "Secret-Key": creds.secretKey,
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
    // { "status": 200, "message": "...", "consignment": { "consignment_id": 12345, "tracking_code": "...", "status": "in_review" } }
    const isOkStatus = data.status === 200 || data.status === 201 || response.ok;
    const consignment = data.consignment || data.data;

    if (isOkStatus && consignment && (consignment.tracking_code || consignment.consignment_id)) {
      const trackingCode = String(consignment.tracking_code || consignment.consignment_id);
      const consignmentId = consignment.consignment_id || trackingCode;
      const status = String(consignment.status || "in_review");

      const parsedConsignment: SteadfastConsignment = {
        consignment_id: consignmentId,
        invoice: consignment.invoice || payload.invoice,
        tracking_code: trackingCode,
        recipient_name: consignment.recipient_name || payload.recipient_name,
        recipient_phone: consignment.recipient_phone || payload.recipient_phone,
        recipient_address: consignment.recipient_address || payload.recipient_address,
        cod_amount: consignment.cod_amount ?? payload.cod_amount,
        status: status,
        note: consignment.note || payload.note,
        created_at: consignment.created_at,
        updated_at: consignment.updated_at,
      };

      return {
        success: true,
        message: data.message || "Steadfast-এ পার্সেল সফলভাবে বুকিং সম্পন্ন হয়েছে।",
        consignment_id: consignmentId,
        tracking_code: trackingCode,
        status: status,
        consignment: parsedConsignment,
        trackingCode: trackingCode,
        consignmentId: consignmentId,
        rawResponse: data,
      };
    }

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
    console.error("[createSteadfastOrder] Network error:", err);
    return {
      success: false,
      message: `Steadfast সার্ভারের সাথে যোগাযোগ করা যায়নি: ${err.message || "Network Error"}`,
    };
  }
}

/**
 * Fetches delivery status of a consignment from Steadfast.
 * Calls GET /status_by_cid/{consignment_id}
 */
export async function getSteadfastDeliveryStatus(
  consignmentId: string | number,
  credentials?: { apiKey?: string; secretKey?: string }
): Promise<SteadfastStatusResult> {
  const cleanId = String(consignmentId || "").trim();
  if (!cleanId) {
    return {
      success: false,
      message: "কনসাইনমেন্ট আইডি আবশ্যক।",
    };
  }

  const creds = resolveSteadfastCredentials(
    credentials?.apiKey,
    credentials?.secretKey
  );

  if (!creds.apiKey || !creds.secretKey) {
    return {
      success: false,
      message: "Steadfast API Key বা Secret Key কনফিগার করা হয়নি।",
    };
  }

  const endpoint = `${creds.baseUrl || STEADFAST_BASE_URL}/status_by_cid/${encodeURIComponent(cleanId)}`;

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": creds.apiKey,
        "Secret-Key": creds.secretKey,
      },
      cache: "no-store",
    });

    const responseText = await response.text();
    let data: any = {};
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { message: responseText };
    }

    const isOkStatus = data.status === 200 || response.ok;

    if (isOkStatus) {
      const deliveryStatus =
        data.delivery_status || data.status_name || data.status || "unknown";

      return {
        success: true,
        status: String(deliveryStatus),
        delivery_status: String(deliveryStatus),
        message: data.message || `ডেলিভারি স্ট্যাটাস: ${deliveryStatus}`,
        rawResponse: data,
      };
    }

    return {
      success: false,
      message: data.message || `স্ট্যাটাস পাওয়া যায়নি (HTTP ${response.status})`,
      rawResponse: data,
    };
  } catch (err: any) {
    console.error("[getSteadfastDeliveryStatus] Network error:", err);
    return {
      success: false,
      message: `Steadfast সার্ভারের সাথে যোগাযোগ করা যায়নি: ${err.message || "Network Error"}`,
    };
  }
}
