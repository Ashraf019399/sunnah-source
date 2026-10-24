"use server";

import fs from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/auth/admin-guard";
import {
  MarketingPixelSettings,
  DEFAULT_MARKETING_SETTINGS,
  MarketingSettingsMutationResult,
} from "@/types/settings.types";

const SETTINGS_FILE_PATH = path.join(
  process.cwd(),
  "src",
  "lib",
  "data",
  "marketing-settings.json"
);

/**
 * Reads persistent Meta / Facebook Pixel configuration.
 * Always returns a validated settings object with reliable defaults.
 */
export async function getMarketingSettings(): Promise<MarketingPixelSettings> {
  try {
    const raw = await fs.readFile(SETTINGS_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw);

    const pixelId = String(
      parsed.pixelId ||
        process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID ||
        DEFAULT_MARKETING_SETTINGS.pixelId
    ).trim();

    const isEnabled =
      typeof parsed.isEnabled === "boolean"
        ? parsed.isEnabled
        : DEFAULT_MARKETING_SETTINGS.isEnabled;

    return {
      pixelId: pixelId || DEFAULT_MARKETING_SETTINGS.pixelId,
      isEnabled,
      updatedAt: parsed.updatedAt || null,
      updatedBy: parsed.updatedBy || null,
    };
  } catch {
    return {
      pixelId:
        process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID ||
        DEFAULT_MARKETING_SETTINGS.pixelId,
      isEnabled: DEFAULT_MARKETING_SETTINGS.isEnabled,
      updatedAt: null,
      updatedBy: null,
    };
  }
}

/**
 * Server Action: Updates Facebook Pixel ID and Tracking Switch.
 * Guarded strictly by Admin authentication.
 * Instantly revalidates storefront and admin cache so changes take effect immediately.
 */
export async function updateAdminMarketingSettingsAction(formData: {
  pixelId: string;
  isEnabled: boolean;
}): Promise<MarketingSettingsMutationResult> {
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

    // 3. Validate Pixel ID
    const cleanId = String(formData.pixelId || "").trim();
    if (!cleanId) {
      return {
        success: false,
        message: "ফেসবুক পিক্সেল আইডি প্রদান করা আবশ্যক।",
        fieldError: "পিক্সেল আইডি খালি রাখা যাবে না।",
      };
    }

    // Standard Meta Pixel ID is a sequence of 8 to 24 numeric digits
    if (!/^\d{8,24}$/.test(cleanId)) {
      return {
        success: false,
        message: "অবৈধ পিক্সেল আইডি। পিক্সেল আইডি শুধুমাত্র সংখ্যা (Digits) হতে হবে।",
        fieldError: "সঠিক ফরম্যাটে পিক্সেল আইডি প্রদান করুন (৮-২৪ সংখ্যা)।",
      };
    }

    const updatedSettings: MarketingPixelSettings = {
      pixelId: cleanId,
      isEnabled: Boolean(formData.isEnabled),
      updatedAt: new Date().toISOString(),
      updatedBy: user.email || "Admin",
    };

    // 4. Persist to storage
    await fs.writeFile(
      SETTINGS_FILE_PATH,
      JSON.stringify(updatedSettings, null, 2),
      "utf-8"
    );

    // 5. Revalidate cache across all pages so changes reflect immediately
    revalidatePath("/", "layout");
    revalidatePath("/admin/settings");
    revalidatePath("/checkout");

    return {
      success: true,
      message: "ফেসবুক পিক্সেল সফলভাবে আপডেট হয়েছে!",
      data: updatedSettings,
    };
  } catch (err: any) {
    console.error("[updateAdminMarketingSettingsAction] Unexpected error:", err);
    return {
      success: false,
      message: err?.message || "একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। আবার চেষ্টা করুন।",
    };
  }
}
