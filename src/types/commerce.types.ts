export type DeliveryZone = 'inside_dhaka' | 'outside_dhaka';
export type PaymentMethod = 'cod' | 'bkash' | 'nagad' | 'sslcommerz';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
export interface CustomerAddress { fullName: string; phone: string; zone: DeliveryZone; district: string; thana: string; fullAddress: string; notes?: string; }
export interface CartItem { id: string; productId: string; variantId: string; title: string; titleBn: string; variantName: string; unitPrice: number; originalPrice?: number; image: string; weightLabel: string; quantity: number; maxStock: number; }
export interface OrderCreationPayload { customer: CustomerAddress; items: CartItem[]; subtotal: number; deliveryFee: number; discountAmount: number; couponCode?: string; grandTotal: number; paymentMethod: PaymentMethod; }