import type { Coupon, CouponValidationResult } from "@/types/coupons.types";

/**
 * Normalizes a raw coupon row from the database into the Coupon interface.
 */
export function mapDbCouponToCoupon(row: Record<string, unknown>): Coupon {
  const discountType =
    row.discount_type === "percentage"
      ? "percentage"
      : row.discount_type === "free_shipping"
      ? "free_shipping"
      : "fixed";

  const code = typeof row.code === "string" ? row.code.toUpperCase() : "";
  const id = typeof row.id === "string" ? row.id : String(row.id || "");

  return {
    id,
    code,
    discountType,
    discountValue: Number(row.discount_value) || 0,
    minOrderAmount: Number(row.minimum_order_value ?? row.min_order_amount) || 0,
    maxDiscountAmount:
      row.max_discount_cap !== null && row.max_discount_cap !== undefined
        ? Number(row.max_discount_cap)
        : row.max_discount_amount !== null && row.max_discount_amount !== undefined
        ? Number(row.max_discount_amount)
        : null,
    usageLimit:
      row.usage_limit !== null && row.usage_limit !== undefined
        ? Number(row.usage_limit)
        : null,
    usedCount: Number(row.times_used ?? row.used_count) || 0,
    startDate: typeof row.start_date === "string" ? row.start_date : null,
    expiryDate:
      typeof row.end_date === "string"
        ? row.end_date
        : typeof row.expiry_date === "string"
        ? row.expiry_date
        : null,
    isActive: Boolean(row.is_active ?? true),
    description: typeof row.description === "string" ? row.description : null,
    createdAt: typeof row.created_at === "string" ? row.created_at : undefined,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : undefined,
  };
}

/**
 * Pure calculation function for coupon discount.
 * Calculates discount amount based on subtotal, delivery fee, and coupon rules:
 * - Percentage: respects optional maximum cap, cannot exceed eligible subtotal.
 * - Fixed amount: cannot exceed eligible subtotal.
 * - Free shipping: applies to delivery fee, even when product subtotal is lower than delivery fee.
 */
export function calculateCouponDiscount(
  coupon: Pick<Coupon, "discountType" | "discountValue" | "maxDiscountAmount">,
  subtotal: number,
  deliveryFee: number = 0
): number {
  if (subtotal <= 0) {
    return 0;
  }

  let calculated = 0;
  if (coupon.discountType === "percentage") {
    if (coupon.discountValue <= 0) return 0;
    calculated = Math.round((subtotal * coupon.discountValue) / 100);
    if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
      calculated = Math.min(calculated, coupon.maxDiscountAmount);
    }
    // Percentage discounts respect the maximum discount cap and cannot exceed eligible subtotal
    return Math.max(0, Math.min(calculated, subtotal));
  } else if (coupon.discountType === "free_shipping") {
    // Free-shipping discounts correctly apply to the delivery fee, even when subtotal is lower than delivery fee
    return Math.max(0, Math.round(deliveryFee));
  } else {
    // Fixed-amount discounts respect the eligible subtotal
    if (coupon.discountValue <= 0) return 0;
    calculated = Math.round(coupon.discountValue);
    return Math.max(0, Math.min(calculated, subtotal));
  }
}

/**
 * Validates a coupon against business rules, order subtotal, and delivery fee.
 * Returns friendly Bengali messages for all edge cases.
 */
export function validateCouponRules(
  coupon: Coupon,
  subtotal: number,
  deliveryFee: number = 0
): CouponValidationResult {
  // 1. Active status check
  if (!coupon.isActive) {
    return {
      isValid: false,
      message: `কুপন কোড "${coupon.code}" বর্তমানে নিষ্ক্রিয় রয়েছে।`,
    };
  }

  // 2. Start date check (if configured)
  const now = Date.now();
  if (coupon.startDate) {
    const startTime = new Date(coupon.startDate).getTime();
    if (!isNaN(startTime) && now < startTime) {
      return {
        isValid: false,
        message: `কুপন কোড "${coupon.code}" এর মেয়াদ এখনো শুরু হয়নি।`,
      };
    }
  }

  // 3. Expiry date check
  if (coupon.expiryDate) {
    const expiryTime = new Date(coupon.expiryDate).getTime();
    if (!isNaN(expiryTime) && now > expiryTime) {
      return {
        isValid: false,
        message: `কুপন কোড "${coupon.code}" এর মেয়াদ শেষ হয়ে গেছে।`,
      };
    }
  }

  // 4. Usage limit check
  if (
    typeof coupon.usageLimit === "number" &&
    coupon.usageLimit > 0 &&
    (coupon.usedCount || 0) >= coupon.usageLimit
  ) {
    return {
      isValid: false,
      message: `কুপন কোড "${coupon.code}" এর ব্যবহারের সর্বোচ্চ সীমা শেষ হয়ে গেছে।`,
    };
  }

  // 5. Minimum order amount check
  if (typeof coupon.minOrderAmount === "number" && coupon.minOrderAmount > 0) {
    if (subtotal < coupon.minOrderAmount) {
      const needed = coupon.minOrderAmount - subtotal;
      return {
        isValid: false,
        message: `এই কুপনটি ব্যবহারের জন্য ন্যূনতম ৳${coupon.minOrderAmount} টাকার অর্ডার আবশ্যক। আরও ৳${needed} টাকার পণ্য যোগ করুন।`,
      };
    }
  }

  // 6. Calculate discount
  const discountAmount = calculateCouponDiscount(coupon, subtotal, deliveryFee);
  if (discountAmount <= 0) {
    if (coupon.discountType === "free_shipping" && subtotal >= 2000) {
      return {
        isValid: false,
        message: "আপনার অর্ডারে ইতিমধ্যেই ফ্রি ডেলিভারি প্রযোজ্য রয়েছে।",
      };
    }
    return {
      isValid: false,
      message: "এই কুপনে কোনো ছাড় প্রযোজ্য হয়নি।",
    };
  }

  return {
    isValid: true,
    message: "কুপনটি সফলভাবে যুক্ত হয়েছে!",
    coupon: {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscountAmount: coupon.maxDiscountAmount,
      description: coupon.description,
    },
  };
}
