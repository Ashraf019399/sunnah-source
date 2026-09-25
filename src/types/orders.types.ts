import { CustomerAddress, DeliveryZone, OrderStatus, PaymentMethod } from "./commerce.types";

export type PaymentStatus = "unpaid" | "paid" | "refunded";

export interface AdminOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id?: string | null;
  product_title: string;
  variant_name?: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
  created_at?: string;
  // Resolved catalog image if matched
  product_image?: string;
}

export interface AdminOrder {
  id: string;
  order_number: string;
  guest_name: string;
  guest_phone: string;
  shipping_address: CustomerAddress;
  subtotal: number;
  delivery_fee: number;
  discount_amount: number;
  coupon_code?: string | null;
  grand_total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  created_at: string;
  updated_at?: string;
}

export interface AdminOrderWithItems extends AdminOrder {
  items: AdminOrderItem[];
}

export interface OrdersFilterParams {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  status?: OrderStatus | "all";
  paymentStatus?: PaymentStatus | "all";
  zone?: DeliveryZone | "all";
}

export interface PaginatedOrdersResult {
  orders: AdminOrder[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface StatusConfigItem {
  key: OrderStatus;
  labelBn: string;
  badgeClass: string;
  dotClass: string;
  descriptionBn: string;
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusConfigItem> = {
  pending: {
    key: "pending",
    labelBn: "অপেক্ষমাণ",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    dotClass: "bg-amber-500",
    descriptionBn: "অর্ডারটি গ্রহণ করা হয়েছে, নিশ্চিতকরণের অপেক্ষায় আছে।",
  },
  confirmed: {
    key: "confirmed",
    labelBn: "নিশ্চিত",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
    dotClass: "bg-blue-500",
    descriptionBn: "গ্রাহকের সাথে কথা বলে অর্ডারটি নিশ্চিত করা হয়েছে।",
  },
  processing: {
    key: "processing",
    labelBn: "প্রস্তুত করা হচ্ছে",
    badgeClass: "bg-purple-50 text-purple-800 border-purple-200",
    dotClass: "bg-purple-500",
    descriptionBn: "পণ্য প্যাকিং ও ডেলিভারির জন্য প্রস্তুত করা হচ্ছে।",
  },
  shipped: {
    key: "shipped",
    labelBn: "কুরিয়ারে পাঠানো হয়েছে",
    badgeClass: "bg-cyan-50 text-cyan-800 border-cyan-200",
    dotClass: "bg-cyan-500",
    descriptionBn: "পণ্য কুরিয়ার সার্ভিসে হস্তান্তর করা হয়েছে।",
  },
  delivered: {
    key: "delivered",
    labelBn: "ডেলিভার হয়েছে",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dotClass: "bg-emerald-500",
    descriptionBn: "গ্রাহক সফলভাবে পণ্য বুঝে পেয়েছেন।",
  },
  cancelled: {
    key: "cancelled",
    labelBn: "বাতিল",
    badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
    dotClass: "bg-rose-500",
    descriptionBn: "অর্ডারটি বাতিল করা হয়েছে।",
  },
  returned: {
    key: "returned",
    labelBn: "ফেরত এসেছে",
    badgeClass: "bg-stone-100 text-stone-700 border-stone-300",
    dotClass: "bg-stone-500",
    descriptionBn: "পণ্য কুরিয়ার থেকে ফেরত এসেছে।",
  },
};

export const ORDER_STATUS_LIST: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

export const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, { labelBn: string; shortBn: string }> = {
  cod: {
    labelBn: "ক্যাশ অন ডেলিভারি (Cash on Delivery)",
    shortBn: "ক্যাশ অন ডেলিভারি",
  },
  bkash: {
    labelBn: "বিকাশ (bKash)",
    shortBn: "বিকাশ",
  },
  nagad: {
    labelBn: "নগদ (Nagad)",
    shortBn: "নগদ",
  },
  sslcommerz: {
    labelBn: "অনলাইন পেমেন্ট (SSLCommerz)",
    shortBn: "অনলাইন গেটওয়ে",
  },
};

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { labelBn: string; badgeClass: string }> = {
  paid: {
    labelBn: "পরিশোধিত",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  unpaid: {
    labelBn: "অপরিশোধিত",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  refunded: {
    labelBn: "রিফান্ডকৃত",
    badgeClass: "bg-stone-100 text-stone-700 border-stone-300",
  },
};

export const DELIVERY_ZONE_CONFIG: Record<DeliveryZone, { labelBn: string; shortBn: string }> = {
  inside_dhaka: {
    labelBn: "ঢাকার ভিতরে (হোম ডেলিভারি)",
    shortBn: "ঢাকার ভিতরে",
  },
  outside_dhaka: {
    labelBn: "ঢাকার বাইরে (সারা বাংলাদেশ)",
    shortBn: "ঢাকার বাইরে",
  },
};
