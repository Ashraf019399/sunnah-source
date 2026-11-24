"use server";

import fs from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/auth/admin-guard";
import {
  OrderSecuritySettings,
  DEFAULT_SECURITY_SETTINGS,
  SecuritySettingsMutationResult,
} from "@/types/settings.types";

const SETTINGS_FILE_PATH = path.join(
  process.cwd(),
  "src",
  "lib",
  "data",
  "security-settings.json"
);

/**
 * Reads persistent Order Security & Fraud Guard configuration.
 */
export async function getOrderSecuritySettings(): Promise<OrderSecuritySettings> {
  try {
    const raw = await fs.readFile(SETTINGS_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw);

    return {
      enableFakeOrderGuard:
        typeof parsed.enableFakeOrderGuard === "boolean"
          ? parsed.enableFakeOrderGuard
          : DEFAULT_SECURITY_SETTINGS.enableFakeOrderGuard,
      enableDuplicateWarning:
        typeof parsed.enableDuplicateWarning === "boolean"
          ? parsed.enableDuplicateWarning
          : DEFAULT_SECURITY_SETTINGS.enableDuplicateWarning,
      blockDuplicate24hPhone:
        typeof parsed.blockDuplicate24hPhone === "boolean"
          ? parsed.blockDuplicate24hPhone
          : DEFAULT_SECURITY_SETTINGS.blockDuplicate24hPhone,
      maxOrdersPerPhone24h:
        Number(parsed.maxOrdersPerPhone24h) > 0
          ? Number(parsed.maxOrdersPerPhone24h)
          : DEFAULT_SECURITY_SETTINGS.maxOrdersPerPhone24h,
      blockDuplicate24hIp:
        typeof parsed.blockDuplicate24hIp === "boolean"
          ? parsed.blockDuplicate24hIp
          : DEFAULT_SECURITY_SETTINGS.blockDuplicate24hIp,
      maxOrdersPerIp24h:
        Number(parsed.maxOrdersPerIp24h) > 0
          ? Number(parsed.maxOrdersPerIp24h)
          : DEFAULT_SECURITY_SETTINGS.maxOrdersPerIp24h,
      updatedAt: parsed.updatedAt || null,
      updatedBy: parsed.updatedBy || null,
    };
  } catch {
    return { ...DEFAULT_SECURITY_SETTINGS };
  }
}

/**
 * Server Action: Updates Order Security Settings.
 * Guarded strictly by Admin authentication.
 */
export async function updateOrderSecuritySettingsAction(
  formData: Partial<OrderSecuritySettings>
): Promise<SecuritySettingsMutationResult> {
  try {
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

    const isAdmin = await checkIsAdmin(user, supabase);
    if (!isAdmin) {
      return {
        success: false,
        message: "অননুমোদিত প্রবেশাধিকার। শুধুমাত্র অ্যাডমিনরা সেটিংস পরিবর্তন করতে পারেন।",
      };
    }

    const maxPhone = Math.max(1, Math.min(10, Number(formData.maxOrdersPerPhone24h) || 1));
    const maxIp = Math.max(1, Math.min(20, Number(formData.maxOrdersPerIp24h) || 3));

    const updatedSettings: OrderSecuritySettings = {
      enableFakeOrderGuard: Boolean(formData.enableFakeOrderGuard ?? true),
      enableDuplicateWarning: Boolean(formData.enableDuplicateWarning ?? true),
      blockDuplicate24hPhone: Boolean(formData.blockDuplicate24hPhone ?? true),
      maxOrdersPerPhone24h: maxPhone,
      blockDuplicate24hIp: Boolean(formData.blockDuplicate24hIp ?? true),
      maxOrdersPerIp24h: maxIp,
      updatedAt: new Date().toISOString(),
      updatedBy: user.email || "Admin",
    };

    await fs.mkdir(path.dirname(SETTINGS_FILE_PATH), { recursive: true });
    await fs.writeFile(
      SETTINGS_FILE_PATH,
      JSON.stringify(updatedSettings, null, 2),
      "utf-8"
    );

    revalidatePath("/admin/settings");
    revalidatePath("/checkout");

    return {
      success: true,
      message: "অর্ডার সিকিউরিটি ও ফ্রড গার্ড সেটিংস সফলভাবে আপডেট হয়েছে!",
      data: updatedSettings,
    };
  } catch (err: any) {
    console.error("[updateOrderSecuritySettingsAction] Unexpected error:", err);
    return {
      success: false,
      message: err?.message || "একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। আবার চেষ্টা করুন।",
    };
  }
}
