"use server";

import fs from "fs/promises";
import path from "path";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/auth/admin-guard";
import {
  MarketingPixelSettings,
  DEFAULT_MARKETING_SETTINGS,
  MarketingSettingsMutationResult,
  MASKED_SECRET,
  isMaskedSecret,
} from "@/types/settings.types";

const SETTINGS_FILE_PATH = path.join(
  process.cwd(),
  "src",
  "lib",
  "data",
  "marketing-settings.json"
);

async function readMarketingSettingsFromSource(
  unmasked: boolean
): Promise<MarketingPixelSettings> {
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

    const fireOnOrderConfirmationOnly =
      typeof parsed.fireOnOrderConfirmationOnly === "boolean"
        ? parsed.fireOnOrderConfirmationOnly
        : true;

    const rawToken = String(
      parsed.accessToken || process.env.FACEBOOK_CAPI_ACCESS_TOKEN || ""
    ).trim();

    const accessToken = unmasked
      ? rawToken
      : rawToken
      ? MASKED_SECRET
      : "";

    const testEventCode = String(
      parsed.testEventCode || process.env.FACEBOOK_CAPI_TEST_EVENT_CODE || ""
    ).trim();

    return {
      pixelId: pixelId || DEFAULT_MARKETING_SETTINGS.pixelId,
      accessToken,
      testEventCode,
      fireOnOrderConfirmationOnly,
      isEnabled,
      updatedAt: parsed.updatedAt || null,
      updatedBy: parsed.updatedBy || null,
    };
  } catch {
    return {
      pixelId:
        process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID ||
        DEFAULT_MARKETING_SETTINGS.pixelId,
      accessToken: "",
      testEventCode: "",
      fireOnOrderConfirmationOnly: true,
      isEnabled: DEFAULT_MARKETING_SETTINGS.isEnabled,
      updatedAt: null,
      updatedBy: null,
    };
  }
}

const getCachedPublicMarketingSettings = unstable_cache(
  async () => readMarketingSettingsFromSource(false),
  ["public-marketing-settings"],
  {
    revalidate: 300,
    tags: ["marketing-settings"],
  }
);

/**
 * Reads persistent Meta / Facebook Pixel configuration.
 * Uses 5-minute tagged cache for public/masked reads while keeping unmasked CAPI reads live.
 */
export async function getMarketingSettings(options?: {
  unmasked?: boolean;
}): Promise<MarketingPixelSettings> {
  if (options?.unmasked) {
    return await readMarketingSettingsFromSource(true);
  }
  return await getCachedPublicMarketingSettings();
}

/**
 * Server Action: Updates Facebook Pixel ID, Meta CAPI Access Token, and Tracking switches.
 * Guarded strictly by Admin authentication.
 */
export async function updateAdminMarketingSettingsAction(formData: {
  pixelId: string;
  isEnabled: boolean;
  accessToken?: string;
  testEventCode?: string;
  fireOnOrderConfirmationOnly?: boolean;
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

    // 4. Handle Access Token preservation if masked
    let finalToken = String(formData.accessToken || "").trim();
    if (isMaskedSecret(finalToken)) {
      const existing = await getMarketingSettings({ unmasked: true });
      finalToken = existing.accessToken || "";
    }

    const cleanTestCode = String(formData.testEventCode || "").trim();
    const fireOnConfirmation =
      typeof formData.fireOnOrderConfirmationOnly === "boolean"
        ? formData.fireOnOrderConfirmationOnly
        : true;

    const updatedSettings: MarketingPixelSettings = {
      pixelId: cleanId,
      accessToken: finalToken,
      testEventCode: cleanTestCode,
      fireOnOrderConfirmationOnly: fireOnConfirmation,
      isEnabled: Boolean(formData.isEnabled),
      updatedAt: new Date().toISOString(),
      updatedBy: user.email || "Admin",
    };

    // 5. Persist to storage
    await fs.writeFile(
      SETTINGS_FILE_PATH,
      JSON.stringify(updatedSettings, null, 2),
      "utf-8"
    );

    // 6. Revalidate cache across all pages so changes reflect immediately
    revalidateTag("marketing-settings");
    revalidatePath("/", "layout");
    revalidatePath("/admin/settings");
    revalidatePath("/checkout");

    return {
      success: true,
      message: "ফেসবুক পিক্সেল ও সার্ভার সাইড (CAPI) ট্র্যাকিং সেটিংস সফলভাবে আপডেট হয়েছে!",
      data: {
        ...updatedSettings,
        accessToken: finalToken ? MASKED_SECRET : "",
      },
    };
  } catch (err: any) {
    console.error("[updateAdminMarketingSettingsAction] Unexpected error:", err);
    return {
      success: false,
      message: err?.message || "একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। আবার চেষ্টা করুন।",
    };
  }
}
