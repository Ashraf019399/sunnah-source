"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { checkIsAdmin, verifyAdminSession } from "@/lib/auth/admin-guard";
import { CATEGORIES_DATA, getCategoryDisplayImage, type Category } from "@/lib/data/categories";
import { revalidatePath, revalidateTag, unstable_noStore as noStore } from "next/cache";

const ADMIN_CATEGORY_COLUMNS =
  "id, slug, name_en, name_bn, tagline_bn, description_bn, sourcing_origin_bn, purity_promise_bn, image_url, display_order, is_active";

function isMissingCategoriesTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const code = error.code || "";
  return (
    code === "42P01" ||
    code === "PGRST116" ||
    code === "42501" ||
    Boolean(error.message?.includes("does not exist"))
  );
}

function revalidateCategoryStorefrontPaths(slug?: string) {
  revalidatePath("/admin/categories");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/combos");
  if (slug) {
    revalidatePath(`/category/${slug}`);
  }
  revalidateTag("admin-categories");
  revalidateTag("categories");
}

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
 * Internal computation of categories list.
 */
async function fetchAdminCategoriesInternal(): Promise<AdminCategoryResult> {
  try {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const adminClient = await createAdminClient();
        let { data: dbCategories, error: dbError } = await adminClient
          .from("categories")
          .select(ADMIN_CATEGORY_COLUMNS)
          .order("display_order", { ascending: true });

        // If ordering failed because display_order column does not exist, retry without order
        if (dbError && dbError.code === "42703") {
          const retry = await adminClient
            .from("categories")
            .select(ADMIN_CATEGORY_COLUMNS);
          dbCategories = retry.data;
          dbError = retry.error;
        }

        if (dbError) {
          if (dbError.code === "42501") {
            console.error(
              `[getAdminCategories] Permission denied for public.categories (code 42501). Grant SELECT to service_role in Supabase: ${dbError.hint || dbError.message}`
            );
          } else if (!isMissingCategoriesTableError(dbError)) {
            console.error(
              `[getAdminCategories] Database query error (code ${dbError.code}): ${dbError.message}`
            );
          }
        } else if (Array.isArray(dbCategories) && dbCategories.length > 0) {
          const mapped: Category[] = dbCategories.map((row: any) => {
            const rawImg = row.image_url ?? row.imageUrl ?? "";
            const img = getCategoryDisplayImage(row.slug, rawImg);

            let nameBn = row.name_bn ?? row.nameBn ?? "";
            if (row.slug === "combos" && (nameBn.includes("সান্নাহ") || !nameBn)) {
              nameBn = "সুন্নাহ কম্বো ও গিফট বক্স";
            }

            let sourcingOriginBn = row.sourcing_origin_bn ?? row.sourcingOriginBn;
            if (sourcingOriginBn && sourcingOriginBn.includes("সান্নাহ")) {
              sourcingOriginBn = sourcingOriginBn.replace("সান্নাহ", "সুন্নাহ");
            }

            return {
              id: row.id ?? row.slug,
              slug: row.slug,
              nameEn: row.name_en ?? row.nameEn ?? "",
              nameBn,
              taglineBn: row.tagline_bn ?? row.taglineBn ?? "",
              descriptionBn: row.description_bn ?? row.descriptionBn ?? "",
              sourcingOriginBn,
              purityPromiseBn: row.purity_promise_bn ?? row.purityPromiseBn,
              imageUrl: img,
              displayOrder: row.display_order ?? row.displayOrder ?? 0,
              isActive: row.is_active ?? row.isActive ?? true,
            };
          });
          return { success: true, data: mapped, isFromLiveDb: true };
        }
      } catch (err: any) {
        console.warn("[getAdminCategories] Supabase fetch failed, using catalog fallback:", err?.message);
      }
    }

    const sorted = [...CATEGORIES_DATA]
      .map((cat) => ({
        ...cat,
        imageUrl: getCategoryDisplayImage(cat.slug, cat.imageUrl),
        nameBn: cat.slug === "combos" ? "সুন্নাহ কম্বো ও গিফট বক্স" : cat.nameBn,
      }))
      .sort((a, b) => a.displayOrder - b.displayOrder);
    return { success: true, data: sorted };
  } catch (err: any) {
    console.error("[getAdminCategories] Server error:", err);
    return { success: false, message: "ক্যাটাগরি তালিকা লোড করতে সমস্যা হয়েছে।" };
  }
}

/**
 * Real-time accessor for categories list in Admin Panel (no-store).
 */
export async function getCachedAdminCategories(): Promise<AdminCategoryResult> {
  noStore();
  return await fetchAdminCategoriesInternal();
}

/**
 * Fetch all categories for admin panel.
 */
export async function getAdminCategories(): Promise<AdminCategoryResult> {
  const { isAdmin } = await verifyAdminSession();
  if (!isAdmin) {
    return { success: false, message: "অননুমোদিত প্রবেশাধিকার।" };
  }
  return await getCachedAdminCategories();
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
    let cleanNameBn = payload.nameBn?.trim();
    if (payload.slug === "combos" && cleanNameBn && cleanNameBn.includes("সান্নাহ")) {
      cleanNameBn = cleanNameBn.replace("সান্নাহ", "সুন্নাহ");
    }

    let cleanSourcingBn = payload.sourcingOriginBn?.trim() || null;
    if (cleanSourcingBn && cleanSourcingBn.includes("সান্নাহ")) {
      cleanSourcingBn = cleanSourcingBn.replace("সান্নাহ", "সুন্নাহ");
    }

    const resolvedImageUrl = getCategoryDisplayImage(payload.slug, payload.imageUrl);

    const { error } = await adminClient.from("categories").insert([
      {
        slug: payload.slug,
        name_en: payload.nameEn,
        name_bn: cleanNameBn,
        tagline_bn: payload.taglineBn,
        description_bn: payload.descriptionBn,
        sourcing_origin_bn: cleanSourcingBn,
        purity_promise_bn: payload.purityPromiseBn ?? null,
        image_url: resolvedImageUrl,
        display_order: payload.displayOrder,
        is_active: payload.isActive,
      },
    ]);

    if (error) {
      if (isMissingCategoriesTableError(error)) {
        return {
          success: false,
          message:
            "Supabase-এ 'categories' টেবিল পাওয়া যায়নি। এই ফিচার ব্যবহারের জন্য টেবিলটি তৈরি করতে হবে।",
        };
      }
      console.error("[addAdminCategory] Insert error:", error);
      return { success: false, message: `ক্যাটাগরি যোগ করতে ব্যর্থ: ${error.message}` };
    }

    revalidateCategoryStorefrontPaths(payload.slug);
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
    const updatePayload: Record<string, any> = {};
    if (payload.nameEn !== undefined) updatePayload.name_en = payload.nameEn;
    if (payload.nameBn !== undefined) {
      let cleanBn = payload.nameBn.trim();
      if (slug === "combos" && cleanBn.includes("সান্নাহ")) {
        cleanBn = cleanBn.replace("সান্নাহ", "সুন্নাহ");
      }
      updatePayload.name_bn = cleanBn;
    }
    if (payload.taglineBn !== undefined) updatePayload.tagline_bn = payload.taglineBn;
    if (payload.descriptionBn !== undefined) updatePayload.description_bn = payload.descriptionBn;
    if (payload.sourcingOriginBn !== undefined) {
      let cleanSource = payload.sourcingOriginBn.trim();
      if (cleanSource.includes("সান্নাহ")) {
        cleanSource = cleanSource.replace("সান্নাহ", "সুন্নাহ");
      }
      updatePayload.sourcing_origin_bn = cleanSource;
    }
    if (payload.purityPromiseBn !== undefined) updatePayload.purity_promise_bn = payload.purityPromiseBn;
    if (payload.imageUrl !== undefined) {
      updatePayload.image_url = getCategoryDisplayImage(slug, payload.imageUrl);
    }
    if (payload.displayOrder !== undefined) updatePayload.display_order = payload.displayOrder;
    if (payload.isActive !== undefined) updatePayload.is_active = payload.isActive;

    const { error } = await adminClient
      .from("categories")
      .update(updatePayload)
      .eq("slug", slug);

    if (error) {
      if (isMissingCategoriesTableError(error)) {
        return {
          success: false,
          message:
            "Supabase-এ 'categories' টেবিল পাওয়া যায়নি। এই ফিচার ব্যবহারের জন্য টেবিলটি তৈরি করতে হবে।",
        };
      }
      console.error("[updateAdminCategory] Update error:", error);
      return { success: false, message: `আপডেট করতে ব্যর্থ: ${error.message}` };
    }

    revalidateCategoryStorefrontPaths(slug);
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
    const { error } = await adminClient
      .from("categories")
      .delete()
      .eq("slug", slug);

    if (error) {
      if (isMissingCategoriesTableError(error)) {
        return {
          success: false,
          message:
            "Supabase-এ 'categories' টেবিল পাওয়া যায়নি। এই ফিচার ব্যবহারের জন্য টেবিলটি তৈরি করতে হবে।",
        };
      }
      console.error("[deleteAdminCategory] Delete error:", error);
      return { success: false, message: `ডিলিট করতে ব্যর্থ: ${error.message}` };
    }

    revalidateCategoryStorefrontPaths(slug);
    return { success: true, message: "ক্যাটাগরি সফলভাবে মুছে ফেলা হয়েছে।" };
  } catch (err: any) {
    console.error("[deleteAdminCategory] Error:", err);
    return { success: false, message: "ক্যাটাগরি মুছতে সমস্যা হয়েছে।" };
  }
}
