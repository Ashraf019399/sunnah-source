/**
 * Steadfast Courier API Integration Service
 * 
 * Official Steadfast Courier Documentation & Fallback Endpoints:
 * Primary: https://portal.packzy.com/api/v1
 * Secondary: https://portal.steadfast.com.bd/api/v1
 * Headers: Api-Key, Secret-Key, Content-Type, Accept, User-Agent
 * 
 * Endpoints:
 * - GET /get_balance
 * - POST /create_order
 * - GET /status_by_cid/{consignment_id}
 */

function toBanglaDigits(num: number | string): string {
  const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(num).replace(/[0-9]/g, (digit) => banglaDigits[parseInt(digit, 10)]);
}

export const STEADFAST_PRIMARY_BASE_URL = "https://portal.packzy.com/api/v1";
export const STEADFAST_SECONDARY_BASE_URL = "https://portal.steadfast.com.bd/api/v1";
export const STEADFAST_BASE_URL = STEADFAST_PRIMARY_BASE_URL;

export const STEADFAST_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 SunnahSource/1.0";

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
  formattedBalance?: string;
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

export interface SteadfastRequestOptions {
  path: string;
  method?: "GET" | "POST";
  body?: Record<string, any>;
  apiKey: string;
  secretKey: string;
}

export interface SteadfastApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T;
  endpointUsed: string;
  errorMessage?: string;
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
 * Executes a Steadfast API request with dual-endpoint fallback (Packzy -> Steadfast.bd)
 * and Cloudflare-compliant browser headers + 10s timeout handling.
 */
export async function fetchSteadfastWithFallback<T = any>(
  options: SteadfastRequestOptions
): Promise<SteadfastApiResponse<T>> {
  const cleanApiKey = (options.apiKey || "").trim();
  const cleanSecretKey = (options.secretKey || "").trim();

  // Dual endpoints list in priority order
  const endpoints = [
    STEADFAST_PRIMARY_BASE_URL,
    STEADFAST_SECONDARY_BASE_URL,
  ];

  // If a custom override is in process.env, prioritize it first
  if (process.env.STEADFAST_BASE_URL) {
    const custom = process.env.STEADFAST_BASE_URL.replace(/\/+$/, "");
    if (!endpoints.includes(custom)) {
      endpoints.unshift(custom);
    }
  }

  let lastError = "Steadfast সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি।";
  let lastStatus = 500;
  let lastData: any = null;

  for (let i = 0; i < endpoints.length; i++) {
    const baseUrl = endpoints[i];
    const pathNormalized = options.path.startsWith("/") ? options.path : `/${options.path}`;
    const url = `${baseUrl}${pathNormalized}`;
    const isLast = i === endpoints.length - 1;

    try {
      const response = await fetch(url, {
        method: options.method || "GET",
        headers: {
          "Api-Key": cleanApiKey,
          "Secret-Key": cleanSecretKey,
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": STEADFAST_USER_AGENT,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });

      const responseText = await response.text();
      let parsedData: any = {};
      try {
        parsedData = JSON.parse(responseText);
      } catch {
        parsedData = { message: responseText };
      }

      const isHtmlResponse =
        typeof responseText === "string" &&
        (responseText.trim().startsWith("<!DOCTYPE") ||
          responseText.trim().startsWith("<html"));

      // Check success: HTTP 200/201 and Steadfast returns status 200/201
      const isSuccess =
        (response.ok || parsedData.status === 200 || parsedData.status === 201) &&
        !isHtmlResponse;

      if (isSuccess) {
        return {
          ok: true,
          status: response.status,
          data: parsedData,
          endpointUsed: baseUrl,
        };
      }

      lastStatus = response.status;
      lastData = parsedData;
      lastError =
        parsedData.message ||
        parsedData.error ||
        (isHtmlResponse
          ? "ক্লাউডফ্লেয়ার ফায়ারওয়াল প্রতিক্রিয়া প্রতিরোধ করেছে (Cloudflare Challenge)।"
          : `HTTP ${response.status} ত্রুটি`);

      // If primary failed, seamlessly try the secondary endpoint before returning an error
      if (!isLast) {
        console.warn(
          `[Steadfast API] Primary endpoint ${baseUrl} failed (${response.status}: ${lastError}). Trying fallback endpoint ${endpoints[i + 1]}...`
        );
        continue;
      }
    } catch (err: any) {
      lastError =
        err.name === "TimeoutError" || err.message?.includes("aborted")
          ? "Steadfast সার্ভার সংযোগ টাইমআউট (১০ সেকেন্ড)।"
          : `Steadfast সার্ভারে সংযোগ ব্যর্থ: ${err.message || "Network Error"}`;

      if (!isLast) {
        console.warn(
          `[Steadfast API] Endpoint ${baseUrl} network error (${lastError}). Trying fallback endpoint ${endpoints[i + 1]}...`
        );
        continue;
      }
    }
  }

  return {
    ok: false,
    status: lastStatus,
    data: lastData,
    endpointUsed: endpoints[endpoints.length - 1],
    errorMessage: lastError,
  };
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
  const cleanKey = creds.apiKey.trim();
  const cleanSecret = creds.secretKey.trim();

  if (!cleanKey || !cleanSecret) {
    return {
      success: false,
      message: "Steadfast API Key এবং Secret Key কনফিগার করা নেই। অনুগ্রহ করে সেটিংস থেকে প্রদান করুন।",
    };
  }

  const res = await fetchSteadfastWithFallback({
    path: "/get_balance",
    method: "GET",
    apiKey: cleanKey,
    secretKey: cleanSecret,
  });

  if (res.ok) {
    const data = res.data;
    const balanceVal =
      data.current_balance !== undefined
        ? Number(data.current_balance)
        : data.balance !== undefined
        ? Number(data.balance)
        : data.data?.current_balance !== undefined
        ? Number(data.data.current_balance)
        : 0;

    const safeBalance = isNaN(balanceVal) ? 0 : balanceVal;
    const formatted = "৳" + toBanglaDigits(Math.round(safeBalance).toLocaleString("en-IN"));

    return {
      success: true,
      current_balance: safeBalance,
      balance: safeBalance,
      formattedBalance: formatted,
      message: `সংযোগ সফল! বর্তমান ডেলিভারি ব্যালেন্স: ${formatted}`,
      rawResponse: data,
    };
  }

  return {
    success: false,
    message: res.errorMessage || "Steadfast সার্ভার থেকে ব্যালেন্স লোড করা যায়নি।",
    rawResponse: res.data,
  };
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
  const cleanKey = creds.apiKey.trim();
  const cleanSecret = creds.secretKey.trim();

  if (!cleanKey || !cleanSecret) {
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

  const requestBody = {
    invoice: payload.invoice.trim(),
    recipient_name: (payload.recipient_name || "সম্মানিত গ্রাহক").trim(),
    recipient_phone: payload.recipient_phone.trim(),
    recipient_address: payload.recipient_address.trim(),
    cod_amount: Math.max(0, Math.round(Number(payload.cod_amount) || 0)),
    note: payload.note || "Sunnah Source Parcel",
  };

  const res = await fetchSteadfastWithFallback({
    path: "/create_order",
    method: "POST",
    apiKey: cleanKey,
    secretKey: cleanSecret,
    body: requestBody,
  });

  if (res.ok) {
    const data = res.data;
    const consignment = data.consignment || data.data;

    if (consignment && (consignment.tracking_code || consignment.consignment_id)) {
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
  }

  return {
    success: false,
    message: res.errorMessage || "Steadfast এ বুকিং ব্যর্থ হয়েছে।",
    rawResponse: res.data,
  };
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
  const cleanKey = creds.apiKey.trim();
  const cleanSecret = creds.secretKey.trim();

  if (!cleanKey || !cleanSecret) {
    return {
      success: false,
      message: "Steadfast API Key বা Secret Key কনফিগার করা হয়নি।",
    };
  }

  const res = await fetchSteadfastWithFallback({
    path: `/status_by_cid/${encodeURIComponent(cleanId)}`,
    method: "GET",
    apiKey: cleanKey,
    secretKey: cleanSecret,
  });

  if (res.ok) {
    const data = res.data;
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
    message: res.errorMessage || "স্ট্যাটাস পাওয়া যায়নি।",
    rawResponse: res.data,
  };
}
