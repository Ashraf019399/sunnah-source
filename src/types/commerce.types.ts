export type DeliveryZone = 'inside_dhaka' | 'outside_dhaka';

export type PaymentMethod = 'cod' | 'bkash' | 'nagad' | 'sslcommerz';

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled' 
  | 'returned';

export interface CustomerAddress {
  fullName: string;
  phone: string;
  zone: DeliveryZone;
  district: string;
  thana: string;
  fullAddress: string;
  notes?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  title: string;
  titleBn: string;
  variantName: string;
  unitPrice: number;
  originalPrice?: number;
  image: string;
  weightLabel: string;
  quantity: number;
  maxStock: number;
}

export interface OrderCreationPayload {
  customer: CustomerAddress;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  couponCode?: string;
  grandTotal: number;
  paymentMethod: PaymentMethod;
}

export interface ProductVariant {
  id: string;
  sku: string;
  displayName: string;
  weightValue: number;
  weightUnit: string;
  regularPrice: number;
  salePrice?: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isDefault?: boolean;
}

export interface Product {
  id: string;
  categorySlug: string;
  titleEn: string;
  titleBn: string;
  slug: string;
  badge?: string;
  originSource?: string;
  shortDescriptionEn?: string;
  shortDescriptionBn?: string;
  fullDescriptionEn?: string;
  fullDescriptionBn?: string;
  ingredients?: string[];
  storageInfo?: string;
  labReportUrl?: string;
  ratingAverage: number;
  reviewCount: number;
  variants: ProductVariant[];
  images: string[];
  isActive: boolean;
  isFeatured?: boolean;
  isCombo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
