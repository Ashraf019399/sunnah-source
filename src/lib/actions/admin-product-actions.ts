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

    // Query live stock from Supabase public.product_variants
    const liveStockMap = new Map<string, number>();
    let isLiveConnected = false;

    try {
      const { data: dbVariants, error: dbError } = await supabase
        .from("product_variants")
        .select("id, stock_quantity");

      if (!dbError && dbVariants && dbVariants.length > 0) {
        isLiveConnected = true;
        for (const v of dbVariants) {
          if (v.id && typeof v.stock_quantity === "number") {
            liveStockMap.set(v.id, v.stock_quantity);
          }
        }
      } else if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        // Fallback with service role client if RLS blocked the session client
        const adminClient = await createAdminClient();
        const { data: adminDbVariants, error: adminDbError } = await adminClient
          .from("product_variants")
          .select("id, stock_quantity");

        if (!adminDbError && adminDbVariants && adminDbVariants.length > 0) {
          isLiveConnected = true;
          for (const v of adminDbVariants) {
            if (v.id && typeof v.stock_quantity === "number") {
              liveStockMap.set(v.id, v.stock_quantity);
            }
          }
        }
      }
    } catch (e) {
      console.warn("[getAdminProducts] Live stock fetch error:", e);
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
