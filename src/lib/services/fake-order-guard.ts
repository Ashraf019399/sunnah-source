/**
 * Fake Order Guard, Validation & Rate Limiting Service
 * Provides comprehensive fraud prevention for e-commerce checkout in Bangladesh.
 */

import type { OrderSecuritySettings } from "@/types/settings.types";

// Valid Bangladeshi Mobile Carrier Prefixes
const VALID_BD_PREFIXES = ["013", "014", "015", "016", "017", "018", "019"];

// Known spam dummy phone numbers
const KNOWN_DUMMY_PHONES = new Set([
  "01700000000",
  "01711111111",
  "01722222222",
  "01733333333",
  "01744444444",
  "01755555555",
  "01766666666",
  "01777777777",
  "01788888888",
  "01799999999",
  "01800000000",
  "01811111111",
  "01888888888",
  "01900000000",
  "01911111111",
  "01999999999",
  "01234567890",
  "01987654321",
]);

/**
 * Validates honeypot field.
 * Returns true if clean (empty/undefined), false if filled by a spam bot.
 */
export function validateHoneypot(honeypotValue?: string | null): boolean {
  if (!honeypotValue) return true;
  return honeypotValue.trim().length === 0;
}

/**
 * Deep validation for Bangladeshi phone numbers.
 * Enforces valid carrier prefix, length, and rejects dummy numbers.
 */
export function validateBangladeshiPhone(phone: string): {
  isValid: boolean;
  cleanPhone: string;
  errorMessage?: string;
} {
  const digitsOnly = phone.replace(/\D/g, "");
  const cleanPhone = digitsOnly.slice(-11);

  if (cleanPhone.length !== 11) {
    return {
      isValid: false,
      cleanPhone,
      errorMessage: "সঠিক ১১ ডিজিটের মোবাইল নম্বর প্রদান করুন (যেমন: 017XXXXXXXX)।",
    };
  }

  const prefix = cleanPhone.substring(0, 3);
  if (!VALID_BD_PREFIXES.includes(prefix)) {
    return {
      isValid: false,
      cleanPhone,
      errorMessage: `অকার্যকর নম্বর প্রিফিক্স (${prefix})। শুধুমাত্র গ্রামীণফোন, বাংলালিংক, রবি, এয়ারটেল বা টেলিটক নম্বর প্রযোজ্য।`,
    };
  }

  // Check known dummy numbers
  if (KNOWN_DUMMY_PHONES.has(cleanPhone)) {
    return {
      isValid: false,
      cleanPhone,
      errorMessage: "অনুগ্রহ করে আপনার প্রকৃত সচল মোবাইল নম্বর প্রদান করুন।",
    };
  }

  // Check repeated last 8 digits (e.g. 01711111111 or 01700000000)
  const lastEight = cleanPhone.substring(3);
  if (/^(\d)\1{7}$/.test(lastEight)) {
    return {
      isValid: false,
      cleanPhone,
      errorMessage: "একটি সঠিক মোবাইল নম্বর প্রদান করুন। ভুয়া নম্বর গ্রহণযোগ্য নয়।",
    };
  }

  // Check sequential last 8 digits (e.g. 12345678 or 87654321)
  if (
    lastEight === "12345678" ||
    lastEight === "87654321" ||
    lastEight === "01234567"
  ) {
    return {
      isValid: false,
      cleanPhone,
      errorMessage: "অনুগ্রহ করে একটি সঠিক ও সক্রিয় মোবাইল নম্বর দিন।",
    };
  }

  return {
    isValid: true,
    cleanPhone,
  };
}

/**
 * Validates customer full name to detect bot or gibberish input.
 */
export function validateCustomerName(name: string): {
  isValid: boolean;
  errorMessage?: string;
} {
  const trimmed = (name || "").trim();
  if (!trimmed || trimmed.length < 2) {
    return {
      isValid: false,
      errorMessage: "অনুগ্রহ করে আপনার সম্পূর্ণ নাম লিখুন (কমপক্ষে ২ অক্ষর)।",
    };
  }

  if (/^(asdf|test|admin|user|null|fake|spam|none)$/i.test(trimmed)) {
    return {
      isValid: false,
      errorMessage: "অনুগ্রহ করে আপনার প্রকৃত নাম লিখুন।",
    };
  }

  // Reject all numbers or URL in name
  if (/^\d+$/.test(trimmed) || /https?:\/\/|\.com|\.net/i.test(trimmed)) {
    return {
      isValid: false,
      errorMessage: "নামে শুধুমাত্র অক্ষর ব্যবহার করুন।",
    };
  }

  return { isValid: true };
}

/**
 * Validates delivery address to ensure delivery agents can locate the customer.
 */
export function validateCustomerAddress(address: string): {
  isValid: boolean;
  errorMessage?: string;
} {
  const trimmed = (address || "").trim();
  if (!trimmed || trimmed.length < 5) {
    return {
      isValid: false,
      errorMessage:
        "অনুগ্রহ করে বিস্তারিত ডেলিভারি ঠিকানা লিখুন (বাসা/রোড/এলাকা/জেলা)।",
    };
  }

  if (/^(test|asdf|address|dhaka|bangladesh)$/i.test(trimmed)) {
    return {
      isValid: false,
      errorMessage: "অনুগ্রহ করে আপনার সম্পূর্ণ ও স্পষ্ট ঠিকানা দিন।",
    };
  }

  return { isValid: true };
}

export interface DuplicateOrderCheckResult {
  hasDuplicate: boolean;
  isBlocked: boolean;
  existingOrderNumber?: string;
  orderStatus?: string;
  placedAt?: string;
  message?: string;
}

/**
 * Checks if a customer has placed an active order within the last 24 hours.
 * Used for real-time customer duplicate warning and server action enforcement.
 */
export async function checkRecentCustomerOrders(
  phone: string,
  settings: OrderSecuritySettings
): Promise<DuplicateOrderCheckResult> {
  const { cleanPhone, isValid } = validateBangladeshiPhone(phone);
  if (!isValid || !cleanPhone) {
    return { hasDuplicate: false, isBlocked: false };
  }

  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return { hasDuplicate: false, isBlocked: false };
    }

    const { createAdminClient } = await import("@/lib/supabase/server");
    const adminClient = await createAdminClient();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: recentOrders, error } = await adminClient
      .from("orders")
      .select("id, order_number, order_status, created_at")
      .eq("guest_phone", cleanPhone)
      .neq("order_status", "cancelled")
      .gte("created_at", twentyFourHoursAgo)
      .order("created_at", { ascending: false });

    if (error || !recentOrders || recentOrders.length === 0) {
      return { hasDuplicate: false, isBlocked: false };
    }

    const orderCount = recentOrders.length;
    const latestOrder = recentOrders[0];
    const isExceeded = orderCount >= settings.maxOrdersPerPhone24h;
    const isBlocked = settings.blockDuplicate24hPhone && isExceeded;

    const message = isBlocked
      ? `আপনার এই নম্বর (${cleanPhone}) থেকে গত ২৪ ঘণ্টার মধ্যে ইতোমধ্যে অর্ডার গৃহীত হয়েছে (অর্ডার #${latestOrder.order_number})। নতুন কোনো পণ্য যোগ করতে বা অর্ডার সংক্রান্ত তথ্যের জন্য অনুগ্রহ করে আমাদের হেল্পলাইনে সরাসরি কল করুন: ০১৯১৪-৬১২০০৭`
      : `⚠️ তথ্য: আপনার এই নম্বরে ইতোমধ্যে একটি অর্ডার (#${latestOrder.order_number}) প্রক্রিয়া করা হচ্ছে। আপনি কি নিশ্চিত যে আরেকটি নতুন অর্ডার করতে চান?`;

    return {
      hasDuplicate: true,
      isBlocked,
      existingOrderNumber: latestOrder.order_number,
      orderStatus: latestOrder.order_status,
      placedAt: latestOrder.created_at,
      message,
    };
  } catch (err) {
    console.warn("[checkRecentCustomerOrders] Error checking recent orders:", err);
    return { hasDuplicate: false, isBlocked: false };
  }
}

/**
 * Enforces IP based 24-hour order rate limits.
 */
export async function checkIpOrderLimit(
  clientIp: string,
  settings: OrderSecuritySettings
): Promise<{ isAllowed: boolean; message?: string }> {
  if (!settings.blockDuplicate24hIp || !clientIp || clientIp === "127.0.0.1" || clientIp === "::1") {
    return { isAllowed: true };
  }

  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return { isAllowed: true };
    }

    const { createAdminClient } = await import("@/lib/supabase/server");
    const adminClient = await createAdminClient();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Check by shipping_address->>clientIp or client_ip column
    const { data: ipOrders, error } = await adminClient
      .from("orders")
      .select("id")
      .or(`shipping_address->>clientIp.eq.${clientIp},guest_phone.ilike.%${clientIp}%`)
      .neq("order_status", "cancelled")
      .gte("created_at", twentyFourHoursAgo);

    if (!error && ipOrders && ipOrders.length >= settings.maxOrdersPerIp24h) {
      return {
        isAllowed: false,
        message:
          "একই ইন্টারনেট কানেকশন বা আইপি থেকে অল্প সময়ের মধ্যে অতিরিক্ত অর্ডারের অনুরোধ পাওয়া গেছে। সহায়তার জন্য অনুগ্রহ করে সরাসরি হেল্পলাইনে যোগাযোগ করুন: ০১৯১৪-৬১২০০৭",
      };
    }

    return { isAllowed: true };
  } catch {
    return { isAllowed: true };
  }
}
