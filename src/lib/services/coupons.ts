import type { Coupon } from "@/types/coupons.types";

export interface ValidateCouponResult {
  isValid: boolean;
  discountAmount: number;
  isFreeShipping: boolean;
  message: string;
  coupon?: Coupon;
}

/**
 * Valid promotional coupons for Sunnah Source:
 * 1. SUNNAH10: 10% discount on subtotal (no min order, description: "১০% বিশেষ মূল্যছাড়")
 * 2. WELCOME50: ৳50 flat discount (min order ৳500, description: "৳৫০ স্বাগতম ডিসকাউন্ট")
 * 3. FREESHIP: 100% off delivery fee (free shipping)
 */
export const PROMOTIONAL_COUPONS: Coupon[] = [
  {
    id: "promo-sunnah10",
    code: "SUNNAH10",
    discountType: "percentage",
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscountAmount: null,
    usageLimit: null,
    usedCount: 0,
    isActive: true,
    description: "১০% বিশেষ মূল্যছাড়",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "promo-welcome50",
    code: "WELCOME50",
    discountType: "fixed",
    discountValue: 50,
    minOrderAmount: 500,
    maxDiscountAmount: null,
    usageLimit: null,
    usedCount: 0,
    isActive: true,
    description: "৳৫০ স্বাগতম ডিসকাউন্ট",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "promo-freeship",
    code: "FREESHIP",
    discountType: "free_shipping",
    discountValue: 100,
    minOrderAmount: 0,
    maxDiscountAmount: null,
    usageLimit: null,
    usedCount: 0,
    isActive: true,
    description: "ফ্রি ডেলিভারি",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

/**
 * Validates a coupon code against subtotal and optional delivery fee.
 * 
 * @param code The coupon code entered by user
 * @param subtotal Cart items total value before delivery fee
 * @param deliveryFee Optional delivery fee for free shipping calculation
 * @returns {ValidateCouponResult} Validation status, calculated discount amount, free shipping flag, message, and coupon details.
 */
export function validateCoupon(
  code: string,
  subtotal: number,
  deliveryFee: number = 0
): ValidateCouponResult {
  const normalized = (code || "").trim().toUpperCase();

  if (!normalized) {
    return {
      isValid: false,
      discountAmount: 0,
      isFreeShipping: false,
      message: "কুপন কোডটি সঠিক নয় বা মেয়াদোত্তীর্ণ।",
    };
  }

  if (typeof subtotal !== "number" || isNaN(subtotal) || subtotal <= 0) {
    return {
      isValid: false,
      discountAmount: 0,
      isFreeShipping: false,
      message: "কুপন কোডটি সঠিক নয় বা মেয়াদোত্তীর্ণ।",
    };
  }

  const coupon = PROMOTIONAL_COUPONS.find(
    (c) => c.code.toUpperCase() === normalized
  );

  if (!coupon || !coupon.isActive) {
    return {
      isValid: false,
      discountAmount: 0,
      isFreeShipping: false,
      message: "কুপন কোডটি সঠিক নয় বা মেয়াদোত্তীর্ণ।",
    };
  }

  // Minimum order check
  if (coupon.minOrderAmount > 0 && subtotal < coupon.minOrderAmount) {
    return {
      isValid: false,
      discountAmount: 0,
      isFreeShipping: false,
      message: "কুপন কোডটি সঠিক নয় বা মেয়াদোত্তীর্ণ।",
      coupon,
    };
  }

  // Free shipping check
  if (coupon.discountType === "free_shipping") {
    const feeDiscount = Math.max(0, Math.round(deliveryFee));
    return {
      isValid: true,
      discountAmount: feeDiscount,
      isFreeShipping: true,
      message: "✓ কুপন 'FREESHIP' সফলভাবে প্রয়োগ করা হয়েছে! (ফ্রি ডেলিভারি)",
      coupon,
    };
  }

  // Percentage discount check
  if (coupon.discountType === "percentage") {
    let discount = Math.round((subtotal * coupon.discountValue) / 100);
    if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
      discount = Math.min(discount, coupon.maxDiscountAmount);
    }
    discount = Math.max(0, Math.min(discount, subtotal));
    const label = coupon.code === "SUNNAH10" ? "১০% ছাড়" : `${coupon.discountValue}% ছাড়`;
    return {
      isValid: true,
      discountAmount: discount,
      isFreeShipping: false,
      message: `✓ কুপন '${coupon.code}' সফলভাবে প্রয়োগ করা হয়েছে! (${label})`,
      coupon,
    };
  }

  // Fixed discount check
  const discount = Math.max(0, Math.min(Math.round(coupon.discountValue), subtotal));
  const label = coupon.code === "WELCOME50" ? "৳৫০ ছাড়" : `৳${coupon.discountValue} ছাড়`;
  return {
    isValid: true,
    discountAmount: discount,
    isFreeShipping: false,
    message: `✓ কুপন '${coupon.code}' সফলভাবে প্রয়োগ করা হয়েছে! (${label})`,
    coupon,
  };
}
