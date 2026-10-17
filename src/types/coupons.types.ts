export type CouponDiscountType = "percentage" | "fixed" | "free_shipping";

export interface Coupon {
  id: string;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number | null;
  usageLimit?: number | null;
  usedCount: number;
  startDate?: string | null;
  expiryDate?: string | null;
  isActive: boolean;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CouponFormData {
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number | null;
  usageLimit?: number | null;
  startDate?: string | null;
  expiryDate?: string | null;
  isActive: boolean;
  description?: string;
}

export interface CouponValidationResult {
  isValid: boolean;
  message: string;
  coupon?: {
    id: string;
    code: string;
    discountType: CouponDiscountType;
    discountValue: number;
    discountAmount: number;
    minOrderAmount: number;
    maxDiscountAmount?: number | null;
    description?: string | null;
  };
}

export interface AdminCouponsResult {
  success: boolean;
  data?: Coupon[];
  message?: string;
  isFromLiveDb?: boolean;
}

export interface AdminCouponMutationResult {
  success: boolean;
  message?: string;
  data?: Coupon;
}
