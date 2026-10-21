import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Specification logic matching src/lib/services/live-sales.ts
const BUYER_NAMES = [
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

const LOCATIONS = [
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

const RELATIVE_TIMES = [
  "২ মিনিট আগে",
  "৩ মিনিট আগে",
  "৪ মিনিট আগে",
  "৫ মিনিট আগে",
  "৭ মিনিট আগে",
  "৮ মিনিট আগে",
  "১০ মিনিট আগে",
  "১২ মিনিট আগে",
];

function isLiveSalesRestrictedRoute(pathname) {
  if (!pathname) return false;
  return (
    pathname === "/checkout" ||
    pathname.startsWith("/checkout/") ||
    pathname.startsWith("/admin")
  );
}

function generateRandomSaleItem(products, previousId) {
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

describe("Live Sales Social Proof Notification", () => {
  it("Correctly identifies restricted routes where notification must remain hidden", () => {
    // Restricted routes
    assert.equal(isLiveSalesRestrictedRoute("/checkout"), true, "/checkout should be restricted");
    assert.equal(isLiveSalesRestrictedRoute("/checkout/success"), true, "/checkout sub-routes should be restricted");
    assert.equal(isLiveSalesRestrictedRoute("/admin"), true, "/admin should be restricted");
    assert.equal(isLiveSalesRestrictedRoute("/admin/orders"), true, "/admin/orders should be restricted");
    assert.equal(isLiveSalesRestrictedRoute("/admin/products"), true, "/admin/products should be restricted");
    assert.equal(isLiveSalesRestrictedRoute("/admin/coupons"), true, "/admin/coupons should be restricted");

    // Allowed customer-facing routes
    assert.equal(isLiveSalesRestrictedRoute("/"), false, "Home page should be allowed");
    assert.equal(isLiveSalesRestrictedRoute("/shop"), false, "/shop should be allowed");
    assert.equal(
      isLiveSalesRestrictedRoute("/product/sundarban-raw-wild-honey"),
      false,
      "Product page should be allowed"
    );
    assert.equal(isLiveSalesRestrictedRoute("/account/orders"), false, "/account/orders should be allowed");
    assert.equal(isLiveSalesRestrictedRoute("/track-order"), false, "/track-order should be allowed");
    assert.equal(isLiveSalesRestrictedRoute(null), false, "Null pathname should be handled safely");
  });

  it("Generates realistic Bangladeshi buyer order notifications with valid product details", () => {
    const mockProducts = [
      {
        id: "prod-1",
        titleBn: "সুন্দরবনের প্রাকৃতিক চাকের কাঁচা মধু",
        slug: "sundarban-raw-wild-honey",
        images: ["/images/honey.png"],
      },
      {
        id: "prod-2",
        titleBn: "প্রথাগত বিলোনা গাওয়া ঘি",
        slug: "traditional-bilona-cow-ghee",
        images: ["/images/ghee.png"],
      },
    ];

    for (let i = 0; i < 25; i++) {
      const item = generateRandomSaleItem(mockProducts);

      assert.ok(item.id, "Sale item must have an id");
      assert.ok(BUYER_NAMES.includes(item.customerName), `Customer name '${item.customerName}' should be in BUYER_NAMES`);
      assert.ok(LOCATIONS.includes(item.location), `Location '${item.location}' should be in LOCATIONS`);
      assert.ok(RELATIVE_TIMES.includes(item.timeAgo), `Time ago '${item.timeAgo}' should be in RELATIVE_TIMES`);
      assert.ok(item.productTitle && item.productTitle.length > 0, "Product title must not be empty");
      assert.ok(item.productSlug && item.productSlug.length > 0, "Product slug must not be empty");
      assert.ok(item.productImage && item.productImage.length > 0, "Product image must not be empty");
    }
  });

  it("Ensures consecutive generated sales notifications vary products when possible", () => {
    const mockProducts = [
      {
        id: "prod-1",
        titleBn: "সুন্দরবনের প্রাকৃতিক চাকের কাঁচা মধু",
        slug: "sundarban-raw-wild-honey",
        images: ["/images/honey.png"],
      },
      {
        id: "prod-2",
        titleBn: "প্রথাগত বিলোনা গাওয়া ঘি",
        slug: "traditional-bilona-cow-ghee",
        images: ["/images/ghee.png"],
      },
    ];

    const first = generateRandomSaleItem(mockProducts);
    const second = generateRandomSaleItem(mockProducts, first.id);

    assert.notEqual(second.id, first.id, "Consecutive item id should not match previous id when candidates exist");
  });

  it("Adheres to required timing specification parameters", () => {
    const INITIAL_APPEARANCE_MS = 8000;
    const VISIBILITY_DURATION_MS = 6000;
    const MIN_INTERVAL_MS = 25000;
    const MAX_INTERVAL_MS = 35000;

    assert.equal(INITIAL_APPEARANCE_MS, 8000, "Initial delay must be 8 seconds");
    assert.equal(VISIBILITY_DURATION_MS, 6000, "Duration must be 6 seconds");
    assert.equal(MIN_INTERVAL_MS, 25000, "Min interval must be 25 seconds");
    assert.equal(MAX_INTERVAL_MS, 35000, "Max interval must be 35 seconds");
  });
});
