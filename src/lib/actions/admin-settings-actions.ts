"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/auth/admin-guard";
import {
  DeliveryRuleConfig,
  DeliverySettingsFormData,
  AdminSettingsMutationResult,
} from "@/types/settings.types";

export const DEFAULT_DELIVERY_SETTINGS: DeliveryRuleConfig = {
  insideDhakaFee: 70,
  outsideDhakaFee: 130,
  freeDeliveryThreshold: 2000,
  paymentMethod: "ক্যাশ অন ডেলিভারি (COD)",
  isFromDb: false,
  updatedAt: null,
  updatedBy: null,
  sourceFilePath: "src/lib/actions/checkout-actions.ts",
};

/**
 * Reads delivery settings from Supabase store_settings table.
 * If the table has not been migrated or query fails, gracefully returns verified defaults.
 */
export async function getAdminDeliverySettings(): Promise<DeliveryRuleConfig> {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return { ...DEFAULT_DELIVERY_SETTINGS };
    }

    const adminClient = await createAdminClient();
    const { data, error } = await adminClient
      .from("store_settings")
      .select("id, inside_dhaka_delivery_fee, outside_dhaka_delivery_fee, free_delivery_threshold, updated_at, updated_by")
      .eq("id", "default")
      .maybeSingle();

    if (error || !data) {
      return { ...DEFAULT_DELIVERY_SETTINGS };
    }

    const insideDhaka = Number(data.inside_dhaka_delivery_fee);
    const outsideDhaka = Number(data.outside_dhaka_delivery_fee);
    const threshold = Number(data.free_delivery_threshold);

    return {
      insideDhakaFee: Number.isFinite(insideDhaka) && insideDhaka >= 0 ? insideDhaka : 70,
      outsideDhakaFee: Number.isFinite(outsideDhaka) && outsideDhaka >= 0 ? outsideDhaka : 130,
      freeDeliveryThreshold: Number.isFinite(threshold) && threshold >= 0 ? threshold : 2000,
      paymentMethod: "ক্যাশ অন ডেলিভারি (COD)",
      isFromDb: true,
      updatedAt: data.updated_at,
      updatedBy: data.updated_by,
      sourceFilePath: "Supabase public.store_settings",
    };
  } catch (err) {
    console.error("[getAdminDeliverySettings] Failed to fetch delivery settings:", err);
    return { ...DEFAULT_DELIVERY_SETTINGS };
  }
}

/**
 * Server action to update delivery charges & free shipping threshold.
 * Strictly restricted to verified admins. Validates non-negative finite numbers and caps.
 */
export async function updateAdminDeliverySettingsAction(
  formData: DeliverySettingsFormData
): Promise<AdminSettingsMutationResult> {
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

    // 3. Input Validation (Condition 9: Non-negative, finite numbers, reasonable maximums, decimal handling)
    const fieldErrors: Record<string, string> = {};

    const rawInsideDhaka = Number(formData.insideDhakaFee);
    const rawOutsideDhaka = Number(formData.outsideDhakaFee);
    const rawThreshold = Number(formData.freeDeliveryThreshold);

    if (isNaN(rawInsideDhaka) || !Number.isFinite(rawInsideDhaka)) {
      fieldErrors.insideDhakaFee = "ঢাকার ভেতরের ডেলিভারি ফি একটি বৈধ সংখ্যা হতে হবে।";
    } else if (rawInsideDhaka < 0) {
      fieldErrors.insideDhakaFee = "ডেলিভারি ফি ঋণাত্মক (০ এর চেয়ে কম) হতে পারবে না।";
    } else if (rawInsideDhaka > 5000) {
      fieldErrors.insideDhakaFee = "ডেলিভারি ফি সর্বোচ্চ ৫,০০০ টাকার মধ্যে হতে হবে।";
    }

    if (isNaN(rawOutsideDhaka) || !Number.isFinite(rawOutsideDhaka)) {
      fieldErrors.outsideDhakaFee = "ঢাকার বাইরের ডেলিভারি ফি একটি বৈধ সংখ্যা হতে হবে।";
    } else if (rawOutsideDhaka < 0) {
      fieldErrors.outsideDhakaFee = "ডেলিভারি ফি ঋণাত্মক (০ এর চেয়ে কম) হতে পারবে না।";
    } else if (rawOutsideDhaka > 5000) {
      fieldErrors.outsideDhakaFee = "ডেলিভারি ফি সর্বোচ্চ ৫,০০০ টাকার মধ্যে হতে হবে।";
    }

    if (isNaN(rawThreshold) || !Number.isFinite(rawThreshold)) {
      fieldErrors.freeDeliveryThreshold = "ফ্রি ডেলিভারি সীমা একটি বৈধ সংখ্যা হতে হবে।";
    } else if (rawThreshold < 0) {
      fieldErrors.freeDeliveryThreshold = "ফ্রি ডেলিভারি সীমা ঋণাত্মক হতে পারবে না।";
    } else if (rawThreshold > 100000) {
      fieldErrors.freeDeliveryThreshold = "ফ্রি ডেলিভারি সীমা সর্বোচ্চ ১,০০,০০০ টাকার মধ্যে হতে হবে।";
    }

    if (Object.keys(fieldErrors).length > 0) {
      return {
        success: false,
        message: "প্রদত্ত তথ্যে ভুল রয়েছে। অনুগ্রহ করে সঠিক সংখ্যা প্রদান করুন।",
        fieldErrors,
      };
    }

    // Two decimal precision handling
    const insideDhakaFee = Math.round(rawInsideDhaka * 100) / 100;
    const outsideDhakaFee = Math.round(rawOutsideDhaka * 100) / 100;
    const freeDeliveryThreshold = Math.round(rawThreshold * 100) / 100;

    // 4. Ensure service role key is present
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return {
        success: false,
        message: "সার্ভার কনফিগারেশন ত্রুটি: SUPABASE_SERVICE_ROLE_KEY সংজ্ঞায়িত নেই।",
      };
    }

    // 5. Update database via service client
    const adminClient = await createAdminClient();
    const { data: updatedRow, error: dbError } = await adminClient
      .from("store_settings")
      .upsert(
        {
          id: "default",
          inside_dhaka_delivery_fee: insideDhakaFee,
          outside_dhaka_delivery_fee: outsideDhakaFee,
          free_delivery_threshold: freeDeliveryThreshold,
          updated_at: new Date().toISOString(),
          updated_by: user.email || "Admin",
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (dbError) {
      console.error("[updateAdminDeliverySettingsAction] DB error:", dbError);
      return {
        success: false,
        message:
          dbError.code === "42P01"
            ? "ডেটাবেসে 'store_settings' টেবিলটি খুঁজে পাওয়া যায়নি। অনুগ্রহ করে প্রথমে SQL মাইগ্রেশনটি চালান।"
            : `ডেটাবেস সংরক্ষণে ব্যর্থ: ${dbError.message}`,
      };
    }

    // 6. Revalidate cache
    revalidatePath("/admin/settings");
    revalidatePath("/checkout");
    revalidatePath("/");

    return {
      success: true,
      message: "ডেলিভারি চার্জ ও ফ্রি ডেলিভারি সীমা সফলভাবে সংরক্ষিত হয়েছে!",
      data: {
        insideDhakaFee: Number(updatedRow.inside_dhaka_delivery_fee),
        outsideDhakaFee: Number(updatedRow.outside_dhaka_delivery_fee),
        freeDeliveryThreshold: Number(updatedRow.free_delivery_threshold),
        paymentMethod: "ক্যাশ অন ডেলিভারি (COD)",
        isFromDb: true,
        updatedAt: updatedRow.updated_at,
        updatedBy: updatedRow.updated_by,
        sourceFilePath: "Supabase public.store_settings",
      },
    };
  } catch (err: any) {
    console.error("[updateAdminDeliverySettingsAction] Unexpected error:", err);
    return {
      success: false,
      message: err?.message || "একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। আবার চেষ্টা করুন।",
    };
  }
}
