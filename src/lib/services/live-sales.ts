import { ALL_PRODUCTS } from "@/lib/data/products";

export interface LiveSaleItem {
  id: string;
  customerName: string;
  location: string;
  productTitle: string;
  productSlug: string;
  productImage: string;
  timeAgo: string;
}

export const BUYER_NAMES: string[] = [
  "তানভীর আহমেদ",
  "সাবরিনা সুলতানা",
  "ডা: আরিফুল ইসলাম",
  "প্রকৌশলী মেহরাব",
  "শাহরিয়ার কবির",
  "নুসরাত জাহান",
  "আল-আমিন মোল্লা",
  "ফাহিম মুনতাসির",
  "রাবেয়া খাতুন",
  "নাজমুল হাসান",
  "তাহমিনা আক্তার",
  "মেহেদী হাসান",
  "সাদিয়া ইসলাম",
  "আসিফ মাহমুদ",
  "ফারহানা ইয়াসমিন",
];

export const LOCATIONS: string[] = [
  "উত্তরা (ঢাকা)",
  "ধানমন্ডি (ঢাকা)",
  "মিরপুর (ঢাকা)",
  "গুলশান (ঢাকা)",
  "বনশ্রী (ঢাকা)",
  "মোহাম্মদপুর (ঢাকা)",
  "জিইসি মোড় (চট্টগ্রাম)",
  "পাঁচলাইশ (চট্টগ্রাম)",
  "উপশহর (সিলেট)",
  "উপশহর (রাজশাহী)",
  "বয়রা (খুলনা)",
  "কান্দিরপাড় (কুমিল্লা)",
  "আগ্রাবাদ (চট্টগ্রাম)",
  "জালালাবাদ (সিলেট)",
];

export const RELATIVE_TIMES: string[] = [
  "২ মিনিট আগে",
  "৩ মিনিট আগে",
  "৪ মিনিট আগে",
  "৫ মিনিট আগে",
  "৭ মিনিট আগে",
  "৮ মিনিট আগে",
  "১০ মিনিট আগে",
  "১২ মিনিট আগে",
];

/**
 * Checks whether the current path is restricted from showing sales popups.
 * Hides on /checkout and /admin routes.
 */
export function isLiveSalesRestrictedRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname === "/checkout" ||
    pathname.startsWith("/checkout/") ||
    pathname.startsWith("/admin")
  );
}

/**
 * Generates a realistic Bangladeshi customer order payload.
 */
export function generateRandomSaleItem(previousId?: string): LiveSaleItem {
  const activeProducts = ALL_PRODUCTS.filter((p) => p.isActive);
  const products = activeProducts.length > 0 ? activeProducts : ALL_PRODUCTS;

  let product = products[Math.floor(Math.random() * products.length)];
  if (products.length > 1 && previousId && product.id === previousId) {
    const candidates = products.filter((p) => p.id !== previousId);
    if (candidates.length > 0) {
      product = candidates[Math.floor(Math.random() * candidates.length)];
    }
  }

  const customerName = BUYER_NAMES[Math.floor(Math.random() * BUYER_NAMES.length)];
  const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
  const timeAgo = RELATIVE_TIMES[Math.floor(Math.random() * RELATIVE_TIMES.length)];
  const productImage = product.images?.[0] || "/images/hero-honey.png";

  return {
    id: product.id,
    customerName,
    location,
    productTitle: product.titleBn,
    productSlug: product.slug,
    productImage,
    timeAgo,
  };
}
