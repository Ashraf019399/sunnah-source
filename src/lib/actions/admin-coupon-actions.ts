"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/auth/admin-guard";
import {
  AdminCouponsResult,
  AdminCouponMutationResult,
  CouponFormData,
} from "@/types/coupons.types";
import { mapDbCouponToCoupon } from "@/lib/data/coupons";
import { PROMOTIONAL_COUPONS } from "@/lib/services/coupons";
import { revalidatePath } from "next/cache";

/**
 * Helper: verify admin access and return supabase admin client.
 */
async function getAuthorizedAdminClient(): Promise<{
  adminClient: Awaited<ReturnType<typeof createAdminClient>> | null;
  errorMsg?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { adminClient: null, errorMsg: "অননুমোদিত প্রবেশাধিকার। অ্যাডমিন লগইন প্রয়োজন।" };
    }

    const isAdmin = await checkIsAdmin(user, supabase);
    if (!isAdmin) {
      return { adminClient: null, errorMsg: "অননুমোদিত প্রবেশাধিকার। এই তথ্যের অনুমতি নেই।" };
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return {
        adminClient: null,
        errorMsg: "সার্ভার কনফিগারেশন ত্রুটি। Service role key পাওয়া যায়নি।",
      };
    }

    const adminClient = await createAdminClient();
    return { adminClient };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[getAuthorizedAdminClient] Error:", errorMsg);
    return { adminClient: null, errorMsg: "সার্ভার ত্রুটি। আবার চেষ্টা করুন।" };
  }
}

/**
 * Checks whether the `coupons` table is queryable in Supabase.
 */
async function couponsTableExists(
  adminClient: Awaited<ReturnType<typeof createAdminClient>>
): Promise<boolean> {
  try {
    const { error } = await adminClient.from("coupons").select("*").limit(1);
    if (error) {
      const code = error.code || "";
      if (code === "42P01" || code === "PGRST116" || error.message?.includes("does not exist")) {
        return false;
      }
      if (code === "42501") {
        console.error(
          `[couponsTableExists] Permission denied for public.coupons (code 42501). Grant SELECT to service_role in Supabase: ${error.hint || error.message}`
        );
      } else {
        console.warn("[couponsTableExists] Table access check error:", error.message);
      }
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Fetch all coupons for the admin panel.
 */
export async function getAdminCoupons(): Promise<AdminCouponsResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: "অননুমোদিত প্রবেশাধিকার।" };
    }

    const isAdmin = await checkIsAdmin(user, supabase);
    if (!isAdmin) {
      return { success: false, message: "অননুমোদিত প্রবেশাধিকার।" };
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return {
        success: true,
        data: PROMOTIONAL_COUPONS,
        isFromLiveDb: false,
        message: "সার্ভারে SUPABASE_SERVICE_ROLE_KEY কনফিগার করা নেই। প্রমোশনাল কুপনসমূহ সক্রিয় প্রদর্শিত হচ্ছে।",
      };
    }

    const adminClient = await createAdminClient();
    const tableAccessible = await couponsTableExists(adminClient);

    if (!tableAccessible) {
      return {
        success: true,
        data: PROMOTIONAL_COUPONS,
        isFromLiveDb: false,
        message: "Supabase-এ public.coupons টেবিলের পারমিশন (42501) পেন্ডিং রয়েছে। প্রমোশনাল কুপনসমূহ সক্রিয় প্রদর্শিত হচ্ছে।",
      };
    }

    const { data: dbCoupons, error: dbError } = await adminClient
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (dbError) {
      console.error("[getAdminCoupons] Database query error:", dbError);
      return {
        success: true,
        data: PROMOTIONAL_COUPONS,
        isFromLiveDb: false,
        message: `কুপন লোড করতে ডাটাবেস এরর: ${dbError.message}। প্রমোশনাল কুপনসমূহ সক্রিয় প্রদর্শিত হচ্ছে।`,
      };
    }

    const mapped = (dbCoupons || []).map((row) =>
      mapDbCouponToCoupon(row as Record<string, unknown>)
    );

    // Merge default promotional coupons if not already present in live database
    const existingCodes = new Set(mapped.map((c) => c.code.toUpperCase()));
    for (const promo of PROMOTIONAL_COUPONS) {
      if (!existingCodes.has(promo.code.toUpperCase())) {
        mapped.push(promo);
      }
    }

    return {
      success: true,
      data: mapped,
      isFromLiveDb: true,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[getAdminCoupons] Unexpected error:", errorMsg);
    return {
      success: true,
      data: PROMOTIONAL_COUPONS,
      isFromLiveDb: false,
      message: errorMsg || "কুপন লোড করতে সমস্যা হয়েছে।",
    };
  }
}

/**
 * Validate coupon form inputs.
 */
function validateCouponFormData(form: CouponFormData): string | null {
  const code = (form.code || "").trim().toUpperCase();
  if (!code) {
    return "কুপন কোড আবশ্যক।";
  }
  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
    return "কুপন কোডে শুধুমাত্র ইংরেজি বর্ণ, সংখ্যা, হাইফেন বা আন্ডারস্কোর ব্যবহার করুন (৩-৩০ অক্ষর)।";
  }
  if (typeof form.discountValue !== "number" || isNaN(form.discountValue) || form.discountValue <= 0) {
    return "সঠিক ডিসকাউন্ট মান লিখুন (০ এর বেশি)।";
  }
  if (form.discountType === "percentage" && form.discountValue > 100) {
    return "শতাংশ ডিসকাউন্ট সর্বোচ্চ ১০০% হতে পারে।";
  }
  if (typeof form.minOrderAmount === "number" && form.minOrderAmount < 0) {
    return "ন্যূনতম অর্ডার মান ঋণাত্মক হতে পারে না।";
  }
  if (
    typeof form.maxDiscountAmount === "number" &&
    form.maxDiscountAmount <= 0
  ) {
    return "সর্বোচ্চ ডিসকাউন্ট সীমা ০ এর বেশি হতে হবে।";
  }
  if (typeof form.usageLimit === "number" && form.usageLimit <= 0) {
    return "ব্যবহারের সীমা ১ বা তার বেশি হতে হবে।";
  }
  if (form.expiryDate) {
    const expTime = new Date(form.expiryDate).getTime();
    if (isNaN(expTime)) {
      return "মেয়াদ শেষের তারিখ সঠিক নয়।";
    }
  }
  return null;
}

/**
 * Create a new coupon strictly in the live database matching actual schema:
 * minimum_order_value, max_discount_cap, end_date, times_used, discount_type enum.
 */
export async function addAdminCoupon(
  formData: CouponFormData
): Promise<AdminCouponMutationResult> {
  const validationError = validateCouponFormData(formData);
  if (validationError) {
    return { success: false, message: validationError };
  }

  const cleanCode = formData.code.trim().toUpperCase();

  try {
    const { adminClient, errorMsg } = await getAuthorizedAdminClient();
    if (errorMsg || !adminClient) {
      return { success: false, message: errorMsg || "অননুমোদিত প্রবেশাধিকার।" };
    }

    const tableAccessible = await couponsTableExists(adminClient);
    if (!tableAccessible) {
      return {
        success: false,
        message: "ডাটাবেস টেবিল প্রস্তুত নয় (পারমিশন 42501 পেন্ডিং)। অনুগ্রহ করে আগে Supabase-এ প্রস্তুতকৃত মাইগ্রেশন SQL রান করুন।",
      };
    }

    // Check code uniqueness in live DB
    const { data: existing } = await adminClient
      .from("coupons")
      .select("id")
      .ilike("code", cleanCode)
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        message: `"${cleanCode}" কোডটি ইতিমধ্যে ব্যবহৃত হচ্ছে। অন্য কোড দিন।`,
      };
    }

    const newId = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    const dbDiscountType =
      formData.discountType === "fixed" ? "fixed_amount" : "percentage";

    const insertPayload: Record<string, unknown> = {
      id: newId,
      code: cleanCode,
      discount_type: dbDiscountType,
      discount_value: formData.discountValue,
      minimum_order_value: formData.minOrderAmount || 0,
      max_discount_cap: formData.maxDiscountAmount || null,
      usage_limit: formData.usageLimit || null,
      times_used: 0,
      start_date: formData.startDate || null,
      end_date: formData.expiryDate || null,
      is_active: formData.isActive ?? true,
      description: formData.description?.trim() || null,
      created_at: nowIso,
    };

    const { error: insertError } = await adminClient.from("coupons").insert([insertPayload]);

    if (insertError) {
      console.error("[addAdminCoupon] DB insert error:", insertError);
      return {
        success: false,
        message: "কুপন ডাটাবেসে সেভ করা যায়নি: " + insertError.message,
      };
    }

    revalidatePath("/admin/coupons");
    return { success: true, message: "কুপন সফলভাবে তৈরি করা হয়েছে।" };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[addAdminCoupon] Error:", errorMsg);
    return { success: false, message: errorMsg || "কুপন তৈরিতে সমস্যা হয়েছে।" };
  }
}

/**
 * Update an existing coupon strictly in the live database matching actual schema.
 */
export async function updateAdminCoupon(
  id: string,
  formData: CouponFormData
): Promise<AdminCouponMutationResult> {
  const validationError = validateCouponFormData(formData);
  if (validationError) {
    return { success: false, message: validationError };
  }

  const cleanCode = formData.code.trim().toUpperCase();

  try {
    const { adminClient, errorMsg } = await getAuthorizedAdminClient();
    if (errorMsg || !adminClient) {
      return { success: false, message: errorMsg || "অননুমোদিত প্রবেশাধিকার।" };
    }

    const tableAccessible = await couponsTableExists(adminClient);
    if (!tableAccessible) {
      return {
        success: false,
        message: "ডাটাবেস টেবিল প্রস্তুত নয় (পারমিশন 42501 পেন্ডিং)।",
      };
    }

    // Check uniqueness for other coupons
    const { data: existing } = await adminClient
      .from("coupons")
      .select("id")
      .ilike("code", cleanCode)
      .neq("id", id)
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        message: `"${cleanCode}" কোডটি অন্য একটি কুপনে ব্যবহৃত হচ্ছে।`,
      };
    }

    const dbDiscountType =
      formData.discountType === "fixed" ? "fixed_amount" : "percentage";

    const updatePayload: Record<string, unknown> = {
      code: cleanCode,
      discount_type: dbDiscountType,
      discount_value: formData.discountValue,
      minimum_order_value: formData.minOrderAmount || 0,
      max_discount_cap: formData.maxDiscountAmount || null,
      usage_limit: formData.usageLimit || null,
      start_date: formData.startDate || null,
      end_date: formData.expiryDate || null,
      is_active: formData.isActive ?? true,
      description: formData.description?.trim() || null,
    };

    const { error: updateError } = await adminClient
      .from("coupons")
      .update(updatePayload)
      .eq("id", id);

    if (updateError) {
      console.error("[updateAdminCoupon] DB update error:", updateError);
      return {
        success: false,
        message: "কুপন আপডেট করা যায়নি: " + updateError.message,
      };
    }

    revalidatePath("/admin/coupons");
    return { success: true, message: "কুপন সফলভাবে আপডেট করা হয়েছে।" };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[updateAdminCoupon] Error:", errorMsg);
    return { success: false, message: errorMsg || "কুপন আপডেট করতে সমস্যা হয়েছে।" };
  }
}

/**
 * Toggle coupon active status strictly in the live database.
 */
export async function toggleCouponStatus(
  id: string,
  isActive: boolean
): Promise<AdminCouponMutationResult> {
  try {
    const { adminClient, errorMsg } = await getAuthorizedAdminClient();
    if (errorMsg || !adminClient) {
      return { success: false, message: errorMsg || "অননুমোদিত প্রবেশাধিকার।" };
    }

    const tableAccessible = await couponsTableExists(adminClient);
    if (!tableAccessible) {
      return { success: false, message: "ডাটাবেস টেবিল প্রস্তুত নয় (পারমিশন 42501 পেন্ডিং)।" };
    }

    const { error: updateError } = await adminClient
      .from("coupons")
      .update({ is_active: isActive })
      .eq("id", id);

    if (updateError) {
      return { success: false, message: "স্ট্যাটাস পরিবর্তন করা যায়নি: " + updateError.message };
    }

    revalidatePath("/admin/coupons");
    return {
      success: true,
      message: isActive ? "কুপন সক্রিয় করা হয়েছে।" : "কুপন নিষ্ক্রিয় করা হয়েছে।",
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[toggleCouponStatus] Error:", errorMsg);
    return { success: false, message: errorMsg || "স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।" };
  }
}

/**
 * Delete a coupon strictly in the live database.
 */
export async function deleteAdminCoupon(id: string): Promise<AdminCouponMutationResult> {
  try {
    const { adminClient, errorMsg } = await getAuthorizedAdminClient();
    if (errorMsg || !adminClient) {
      return { success: false, message: errorMsg || "অননুমোদিত প্রবেশাধিকার।" };
    }

    const tableAccessible = await couponsTableExists(adminClient);
    if (!tableAccessible) {
      return { success: false, message: "ডাটাবেস টেবিল প্রস্তুত নয় (পারমিশন 42501 পেন্ডিং)।" };
    }

    const { error: delError } = await adminClient.from("coupons").delete().eq("id", id);
    if (delError) {
      return { success: false, message: "কুপন ডিলিট করা যায়নি: " + delError.message };
    }

    revalidatePath("/admin/coupons");
    return { success: true, message: "কুপন সফলভাবে মুছে ফেলা হয়েছে।" };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[deleteAdminCoupon] Error:", errorMsg);
    return { success: false, message: errorMsg || "কুপন মুছে ফেলা যায়নি।" };
  }
}
