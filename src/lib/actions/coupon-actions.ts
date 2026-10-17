"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Coupon, CouponValidationResult } from "@/types/coupons.types";
import { validateCouponRules, mapDbCouponToCoupon } from "@/lib/data/coupons";

/**
 * Fetch a coupon by code strictly from the live Supabase database.
 * Never uses in-memory fallbacks for checkout or financial operations.
 */
async function fetchCouponFromLiveDb(code: string): Promise<{ coupon: Coupon | null; error?: string }> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { coupon: null };

  try {
    const client = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? await createAdminClient()
      : await createClient();

    const { data: dbCoupon, error } = await client
      .from("coupons")
      .select("*")
      .ilike("code", normalized)
      .maybeSingle();

    if (error) {
      console.error("[fetchCouponFromLiveDb] Database error:", error.code, error.message);
      return { coupon: null, error: error.message };
    }

    if (!dbCoupon) {
      return { coupon: null };
    }

    return { coupon: mapDbCouponToCoupon(dbCoupon) };
  } catch (err: any) {
    console.error("[fetchCouponFromLiveDb] Unexpected lookup error:", err?.message || err);
    return { coupon: null, error: err?.message || "ডাটাবেস সংযোগ ব্যর্থ হয়েছে।" };
  }
}

/**
 * Public Server Action called from checkout to validate a coupon code against current subtotal and delivery fee.
 * Rejects the coupon if the live database is inaccessible.
 */
export async function validateCouponAction(
  code: string,
  subtotal: number,
  deliveryFee: number = 0
): Promise<CouponValidationResult> {
  const cleanCode = (code || "").trim().toUpperCase();

  if (!cleanCode) {
    return {
      isValid: false,
      message: "অনুগ্রহ করে একটি কুপন কোড লিখুন।",
    };
  }

  if (typeof subtotal !== "number" || subtotal <= 0) {
    return {
      isValid: false,
      message: "কুপন ব্যবহারের জন্য কার্টে পণ্য থাকতে হবে।",
    };
  }

  const { coupon, error } = await fetchCouponFromLiveDb(cleanCode);

  if (error) {
    return {
      isValid: false,
      message: "কুপন সিস্টেম বর্তমানে অফলাইনে রয়েছে বা ডাটাবেস পারমিশন পেন্ডিং। অনুগ্রহ করে পরে চেষ্টা করুন বা কুপন ছাড়া অর্ডার করুন।",
    };
  }

  if (!coupon) {
    return {
      isValid: false,
      message: `"${cleanCode}" কুপন কোডটি খুঁজে পাওয়া যায়নি। সঠিক কোড লিখুন।`,
    };
  }

  return validateCouponRules(coupon, subtotal, deliveryFee);
}

/**
 * Server-only helper used during checkout submission to calculate trusted discount.
 * Enforces live database verification. NEVER trusts client discount values.
 * Usage recording is deferred to the atomic order RPC transaction.
 */
export async function processOrderCouponServerSide(
  code: string | undefined | null,
  trustedSubtotal: number,
  deliveryFee: number = 0
): Promise<{
  isValid: boolean;
  discountAmount: number;
  couponCode: string | null;
  message?: string;
}> {
  if (!code || !code.trim()) {
    return {
      isValid: true,
      discountAmount: 0,
      couponCode: null,
    };
  }

  const cleanCode = code.trim().toUpperCase();
  const { coupon, error } = await fetchCouponFromLiveDb(cleanCode);

  if (error) {
    return {
      isValid: false,
      discountAmount: 0,
      couponCode: null,
      message: "কুপন কোডটি ডাটাবেসে যাচাই করা যায়নি (ডাটাবেস মাইগ্রেশন বা পারমিশন পেন্ডিং)। অনুগ্রহ করে কুপন ছাড়া অর্ডার সম্পন্ন করুন।",
    };
  }

  if (!coupon) {
    return {
      isValid: false,
      discountAmount: 0,
      couponCode: null,
      message: `কুপন কোড "${cleanCode}" ডাটাবেসে পাওয়া যায়নি।`,
    };
  }

  const validation = validateCouponRules(coupon, trustedSubtotal, deliveryFee);
  if (!validation.isValid || !validation.coupon) {
    return {
      isValid: false,
      discountAmount: 0,
      couponCode: null,
      message: validation.message,
    };
  }

  return {
    isValid: true,
    discountAmount: validation.coupon.discountAmount,
    couponCode: validation.coupon.code,
  };
}
