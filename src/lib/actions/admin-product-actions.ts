"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/auth/admin-guard";
import { ALL_PRODUCTS } from "@/lib/data/products";
import { CATEGORIES_DATA } from "@/lib/data/categories";
import { VARIANT_ID_MAP } from "@/lib/data/catalog-mapping";
import { Product, ProductVariant } from "@/types/commerce.types";

export interface AdminVariantView extends ProductVariant {
  isLiveStock: boolean;
  dbId?: string;
}

export interface AdminProductView extends Omit<Product, "variants"> {
  categoryNameBn: string;
  totalStock: number;
  hasLiveInventory: boolean;
  variants: AdminVariantView[];
}

/**
 * Server action to fetch all products for the admin dashboard.
 * Queries live stock from public.product_variants and explicitly tags
 * whether each variant is using live database stock or fallback catalog stock.
 */
export async function getAdminProducts(): Promise<{
  success: boolean;
  data?: AdminProductView[];
  hasLiveInventory?: boolean;
  message?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: "অননুমোদিত প্রবেশাধিকার। অ্যাডমিন লগইন প্রয়োজন।" };
    }

    const isAdmin = await checkIsAdmin(user, supabase);
    if (!isAdmin) {
      return { success: false, message: "অননুমোদিত প্রবেশাধিকার। এই তথ্যের অনুমতি নেই।" };
    }

    // Query live stock from Supabase public.product_variants using service-role
    const liveStockMap = new Map<string, number>();
    let isLiveConnected = false;

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn(
        "[getAdminProducts] SUPABASE_SERVICE_ROLE_KEY is missing in server environment. Cannot safely read live inventory without service-role privileges."
      );
    } else {
      try {
        const adminClient = await createAdminClient();
        const { data: dbVariants, error: dbError } = await adminClient
          .from("product_variants")
          .select("id, stock_quantity");

        if (dbError) {
          const errCode = dbError.code || "NO_CODE";
          const errMsg = dbError.message || dbError.details || "No message provided";
          const errDetails = dbError.details ? ` | details: ${dbError.details}` : "";
          const errHint = dbError.hint ? ` | hint: ${dbError.hint}` : "";
          console.error(
            `[getAdminProducts] Failed to fetch live variant stock via service-role: code=${errCode} message=${errMsg}${errDetails}${errHint}`
          );
        } else if (Array.isArray(dbVariants)) {
          isLiveConnected = true;
          for (const v of dbVariants) {
            if (v.id && typeof v.stock_quantity === "number") {
              liveStockMap.set(v.id, v.stock_quantity);
            }
          }
        } else {
          console.warn("[getAdminProducts] Service-role query returned unexpected non-array data:", dbVariants);
        }
      } catch (err: any) {
        console.error("[getAdminProducts] Unexpected error invoking createAdminClient:", err?.message || err);
      }
    }

    // Merge live stock and category information with catalog products
    const products: AdminProductView[] = ALL_PRODUCTS.map((prod) => {
      const category = CATEGORIES_DATA.find((c) => c.slug === prod.categorySlug);

      const mergedVariants: AdminVariantView[] = prod.variants.map((variant) => {
        const dbId = VARIANT_ID_MAP[variant.id];
        const isLive = Boolean(dbId && liveStockMap.has(dbId));
        const liveStock = isLive ? liveStockMap.get(dbId)! : variant.stockQuantity;

        return {
          ...variant,
          dbId,
          isLiveStock: isLive,
          stockQuantity: liveStock,
        };
      });

      const totalStock = mergedVariants.reduce((sum, v) => sum + v.stockQuantity, 0);

      return {
        ...prod,
        variants: mergedVariants,
        categoryNameBn: category?.nameBn || prod.categorySlug,
        totalStock,
        hasLiveInventory: isLiveConnected,
      };
    });

    return {
      success: true,
      data: products,
      hasLiveInventory: isLiveConnected,
    };
  } catch (err: any) {
    console.error("[getAdminProducts] Server error:", err);
    return {
      success: false,
      message: "পণ্য তালিকা লোড করতে সমস্যা হয়েছে।",
    };
  }
}

export interface AdminLowStockAlert {
  variantId: string;
  dbId?: string;
  sku: string;
  productTitle: string;
  variantDisplayName: string;
  stockQuantity: number;
  lowStockThreshold: number;
  productSlug?: string;
  productImage?: string;
}

/**
 * Server action to fetch low-stock variant alerts for executive dashboard.
 * Queries live database stock <= threshold, sorted by lowest stock first.
 */
export async function getAdminLowStockAlertsAction(
  threshold: number = 5
): Promise<{
  success: boolean;
  data?: AdminLowStockAlert[];
  message?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: "UNAUTHORIZED" };
    }

    const isAdmin = await checkIsAdmin(user, supabase);
    if (!isAdmin) {
      return { success: false, message: "FORBIDDEN" };
    }

    let lowStockItems: AdminLowStockAlert[] = [];
    const hasServiceKey = Boolean(
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY !== "placeholder-service-key"
    );

    if (hasServiceKey) {
      try {
        const adminClient = await createAdminClient();
        const { data: dbVariants, error: dbError } = await adminClient
          .from("product_variants")
          .select("id, sku, display_name, stock_quantity, low_stock_threshold, product_id")
          .lte("stock_quantity", threshold)
          .order("stock_quantity", { ascending: true });

        if (!dbError && Array.isArray(dbVariants)) {
          lowStockItems = dbVariants.map((dbv) => {
            const matchedProduct = ALL_PRODUCTS.find((p) =>
              p.variants.some(
                (v) => VARIANT_ID_MAP[v.id] === dbv.id || v.id === dbv.id || v.sku === dbv.sku
              )
            );
            const matchedVariant = matchedProduct?.variants.find(
              (v) => VARIANT_ID_MAP[v.id] === dbv.id || v.id === dbv.id || v.sku === dbv.sku
            );

            return {
              variantId: matchedVariant?.id || dbv.id,
              dbId: dbv.id,
              sku: dbv.sku,
              productTitle: matchedProduct?.titleBn || matchedProduct?.titleEn || "পণ্য",
              variantDisplayName: dbv.display_name || matchedVariant?.displayName || "সাধারণ ভ্যারিয়েন্ট",
              stockQuantity: Number(dbv.stock_quantity) || 0,
              lowStockThreshold: Number(dbv.low_stock_threshold) || threshold,
              productSlug: matchedProduct?.slug,
              productImage: matchedProduct?.images?.[0],
            };
          });
        }
      } catch (dbQueryErr) {
        console.error("[getAdminLowStockAlertsAction] Live query error:", dbQueryErr);
      }
    }

    // Fallback to catalog definition if service-role key is unavailable or returned 0
    if (lowStockItems.length === 0 && !hasServiceKey) {
      for (const p of ALL_PRODUCTS) {
        for (const v of p.variants) {
          if (v.stockQuantity <= threshold) {
            lowStockItems.push({
              variantId: v.id,
              dbId: VARIANT_ID_MAP[v.id],
              sku: v.sku,
              productTitle: p.titleBn || p.titleEn,
              variantDisplayName: v.displayName,
              stockQuantity: v.stockQuantity,
              lowStockThreshold: v.lowStockThreshold || threshold,
              productSlug: p.slug,
              productImage: p.images?.[0],
            });
          }
        }
      }
      lowStockItems.sort((a, b) => a.stockQuantity - b.stockQuantity);
    }

    return {
      success: true,
      data: lowStockItems,
    };
  } catch (err: any) {
    console.error("[getAdminLowStockAlertsAction] Server error:", err);
    return {
      success: false,
      message: err?.message || "লো-স্টক অ্যালার্ট লোড করা যায়নি।",
    };
  }
}

