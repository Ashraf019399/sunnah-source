"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/auth/admin-guard";
import { CATEGORIES_DATA, type Category } from "@/lib/data/categories";
import { revalidatePath } from "next/cache";

export interface AdminCategoryResult {
  success: boolean;
  data?: Category[];
  message?: string;
  isFromLiveDb?: boolean;
}

export interface AdminCategoryMutationResult {
  success: boolean;
  message?: string;
}

/**
 * Helper: verify admin access and return supabase admin client.
 * Returns null + error message if unauthorized.
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
      return { adminClient: null, errorMsg: "সার্ভার কনফিগারেশন ত্রুটি। Service role key পাওয়া যায়নি।" };
    }

    const adminClient = await createAdminClient();
    return { adminClient };
  } catch (err: any) {
    console.error("[getAuthorizedAdminClient] Error:", err?.message || err);
    return { adminClient: null, errorMsg: "সার্ভার ত্রুটি। আবার চেষ্টা করুন।" };
  }
}

/**
 * Checks whether a `categories` table exists in Supabase.
 * Returns false gracefully if the table does not exist.
 */
async function categoriesTableExists(
  adminClient: Awaited<ReturnType<typeof createAdminClient>>
): Promise<boolean> {
  try {
    const { error } = await adminClient.from("categories").select("*").limit(1);
    if (error) {
      const code = error.code || "";
      if (code === "42P01" || code === "PGRST116" || error.message?.includes("does not exist")) {
        return false;
      }
      if (code === "42501") {
        console.error(
          `[categoriesTableExists] Permission denied for public.categories (code 42501). Grant SELECT to service_role in Supabase: ${error.hint || error.message}`
        );
      } else {
        console.warn("[categoriesTableExists] Unexpected error:", error.message);
      }
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Fetch all categories for admin panel.
 * Tries Supabase `categories` table first; falls back to catalog data.
 */
export async function getAdminCategories(): Promise<AdminCategoryResult> {
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

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const adminClient = await createAdminClient();
        const tableExists = await categoriesTableExists(adminClient);

        if (tableExists) {
          let { data: dbCategories, error: dbError } = await adminClient
            .from("categories")
            .select("*")
            .order("display_order", { ascending: true });

          // If ordering failed because display_order column does not exist, retry without order
          if (dbError && dbError.code === "42703") {
            const retry = await adminClient.from("categories").select("*");
            dbCategories = retry.data;
            dbError = retry.error;
          }

          if (dbError) {
            console.error(
              `[getAdminCategories] Database query error (code ${dbError.code}): ${dbError.message}`
            );
          } else if (Array.isArray(dbCategories) && dbCategories.length > 0) {
            const mapped: Category[] = dbCategories.map((row: any) => ({
              id: row.id ?? row.slug,
              slug: row.slug,
              nameEn: row.name_en ?? row.nameEn ?? "",
              nameBn: row.name_bn ?? row.nameBn ?? "",
              taglineBn: row.tagline_bn ?? row.taglineBn ?? "",
              descriptionBn: row.description_bn ?? row.descriptionBn ?? "",
              sourcingOriginBn: row.sourcing_origin_bn ?? row.sourcingOriginBn,
              purityPromiseBn: row.purity_promise_bn ?? row.purityPromiseBn,
              imageUrl: row.image_url ?? row.imageUrl ?? "",
              displayOrder: row.display_order ?? row.displayOrder ?? 0,
              isActive: row.is_active ?? row.isActive ?? true,
            }));
            return { success: true, data: mapped, isFromLiveDb: true };
          }
        }
      } catch (err: any) {
        console.warn("[getAdminCategories] Supabase fetch failed, using catalog fallback:", err?.message);
      }
    }

    const sorted = [...CATEGORIES_DATA].sort((a, b) => a.displayOrder - b.displayOrder);
    return { success: true, data: sorted };
  } catch (err: any) {
    console.error("[getAdminCategories] Server error:", err);
    return { success: false, message: "ক্যাটাগরি তালিকা লোড করতে সমস্যা হয়েছে।" };
  }
}

/**
 * Add a new category.
 */
export async function addAdminCategory(
  payload: Omit<Category, "id">
): Promise<AdminCategoryMutationResult> {
  const { adminClient, errorMsg } = await getAuthorizedAdminClient();
  if (!adminClient) return { success: false, message: errorMsg };

  try {
    const tableExists = await categoriesTableExists(adminClient);
    if (!tableExists) {
      return {
        success: false,
        message:
          "Supabase-এ 'categories' টেবিল পাওয়া যায়নি। এই ফিচার ব্যবহারের জন্য টেবিলটি তৈরি করতে হবে।",
      };
    }

    const { error } = await adminClient.from("categories").insert([
      {
        slug: payload.slug,
        name_en: payload.nameEn,
        name_bn: payload.nameBn,
        tagline_bn: payload.taglineBn,
        description_bn: payload.descriptionBn,
        sourcing_origin_bn: payload.sourcingOriginBn ?? null,
        purity_promise_bn: payload.purityPromiseBn ?? null,
        image_url: payload.imageUrl,
        display_order: payload.displayOrder,
        is_active: payload.isActive,
      },
    ]);

    if (error) {
      console.error("[addAdminCategory] Insert error:", error);
      return { success: false, message: `ক্যাটাগরি যোগ করতে ব্যর্থ: ${error.message}` };
    }

    revalidatePath("/admin/categories");
    revalidatePath("/admin");
    return { success: true, message: "ক্যাটাগরি সফলভাবে যোগ করা হয়েছে।" };
  } catch (err: any) {
    console.error("[addAdminCategory] Error:", err);
    return { success: false, message: "ক্যাটাগরি যোগ করতে সমস্যা হয়েছে।" };
  }
}

/**
 * Update an existing category by slug.
 */
export async function updateAdminCategory(
  slug: string,
  payload: Partial<Omit<Category, "id" | "slug">>
): Promise<AdminCategoryMutationResult> {
  const { adminClient, errorMsg } = await getAuthorizedAdminClient();
  if (!adminClient) return { success: false, message: errorMsg };

  try {
    const tableExists = await categoriesTableExists(adminClient);
    if (!tableExists) {
      return {
        success: false,
        message:
          "Supabase-এ 'categories' টেবিল পাওয়া যায়নি। এই ফিচার ব্যবহারের জন্য টেবিলটি তৈরি করতে হবে।",
      };
    }

    const updatePayload: Record<string, any> = {};
    if (payload.nameEn !== undefined) updatePayload.name_en = payload.nameEn;
    if (payload.nameBn !== undefined) updatePayload.name_bn = payload.nameBn;
    if (payload.taglineBn !== undefined) updatePayload.tagline_bn = payload.taglineBn;
    if (payload.descriptionBn !== undefined) updatePayload.description_bn = payload.descriptionBn;
    if (payload.sourcingOriginBn !== undefined) updatePayload.sourcing_origin_bn = payload.sourcingOriginBn;
    if (payload.purityPromiseBn !== undefined) updatePayload.purity_promise_bn = payload.purityPromiseBn;
    if (payload.imageUrl !== undefined) updatePayload.image_url = payload.imageUrl;
    if (payload.displayOrder !== undefined) updatePayload.display_order = payload.displayOrder;
    if (payload.isActive !== undefined) updatePayload.is_active = payload.isActive;

    const { error } = await adminClient
      .from("categories")
      .update(updatePayload)
      .eq("slug", slug);

    if (error) {
      console.error("[updateAdminCategory] Update error:", error);
      return { success: false, message: `আপডেট করতে ব্যর্থ: ${error.message}` };
    }

    revalidatePath("/admin/categories");
    revalidatePath("/admin");
    return { success: true, message: "ক্যাটাগরি সফলভাবে আপডেট করা হয়েছে।" };
  } catch (err: any) {
    console.error("[updateAdminCategory] Error:", err);
    return { success: false, message: "ক্যাটাগরি আপডেট করতে সমস্যা হয়েছে।" };
  }
}

/**
 * Delete a category by slug.
 */
export async function deleteAdminCategory(
  slug: string
): Promise<AdminCategoryMutationResult> {
  const { adminClient, errorMsg } = await getAuthorizedAdminClient();
  if (!adminClient) return { success: false, message: errorMsg };

  try {
    const tableExists = await categoriesTableExists(adminClient);
    if (!tableExists) {
      return {
        success: false,
        message:
          "Supabase-এ 'categories' টেবিল পাওয়া যায়নি। এই ফিচার ব্যবহারের জন্য টেবিলটি তৈরি করতে হবে।",
      };
    }

    const { error } = await adminClient
      .from("categories")
      .delete()
      .eq("slug", slug);

    if (error) {
      console.error("[deleteAdminCategory] Delete error:", error);
      return { success: false, message: `ডিলিট করতে ব্যর্থ: ${error.message}` };
    }

    revalidatePath("/admin/categories");
    revalidatePath("/admin");
    return { success: true, message: "ক্যাটাগরি সফলভাবে মুছে ফেলা হয়েছে।" };
  } catch (err: any) {
    console.error("[deleteAdminCategory] Error:", err);
    return { success: false, message: "ক্যাটাগরি মুছতে সমস্যা হয়েছে।" };
  }
}
