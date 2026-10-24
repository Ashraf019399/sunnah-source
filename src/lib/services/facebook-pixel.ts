export const FACEBOOK_PIXEL_ID =
  process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || "2675229749603202";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

export interface FbViewContentParams {
  id: string;
  name: string;
  category?: string;
  price: number;
}

export interface FbAddToCartParams {
  id: string;
  name: string;
  price: number;
  quantity?: number;
}

export interface FbInitiateCheckoutItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface FbPurchaseParams {
  orderId: string;
  total: number;
  numItems: number;
  items?: { id: string; name: string }[];
}

function pageview(): void {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", "PageView");
  }
}

function event(name: string, options: Record<string, unknown> = {}): void {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", name, options);
  }
}

/**
 * Safely trigger Meta Pixel PageView event
 */
export function fbPageView(): void {
  pageview();
}

/**
 * Safely trigger Meta Pixel ViewContent event
 */
export function fbViewContent(product: FbViewContentParams): void {
  event("ViewContent", {
    content_name: product.name,
    content_category: product.category,
    content_ids: [product.id],
    value: product.price,
    currency: "BDT",
  });
}

/**
 * Safely trigger Meta Pixel AddToCart event
 */
export function fbAddToCart(product: FbAddToCartParams): void {
  event("AddToCart", {
    content_name: product.name,
    content_ids: [product.id],
    value: product.price,
    currency: "BDT",
  });
}

/**
 * Safely trigger Meta Pixel InitiateCheckout event
 */
export function fbInitiateCheckout(
  items: FbInitiateCheckoutItem[],
  subtotal: number
): void {
  event("InitiateCheckout", {
    content_ids: items.map((i) => i.id),
    num_items: items.reduce((sum, item) => sum + item.quantity, 0),
    value: subtotal,
    currency: "BDT",
  });
}

/**
 * Safely trigger Meta Pixel Purchase event
 */
export function fbPurchase(order: FbPurchaseParams): void {
  event("Purchase", {
    content_name: `Order #${order.orderId}`,
    content_ids: order.items?.map((i) => i.id) || [],
    value: order.total,
    currency: "BDT",
    num_items: order.numItems,
  });
}
