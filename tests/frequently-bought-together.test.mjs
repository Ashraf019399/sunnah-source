import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Complementary pairing rules specification
function getComplementaryProductSlug(mainProduct) {
  const isHoney =
    mainProduct.categorySlug === "honey" ||
    mainProduct.slug.includes("honey");

  const isGheeOrOil =
    mainProduct.categorySlug === "ghee-oil" ||
    mainProduct.slug.includes("ghee") ||
    mainProduct.slug.includes("mustard") ||
    mainProduct.slug.includes("oil");

  if (isHoney) {
    if (mainProduct.slug === "khalisha-flower-raw-honey") {
      return "traditional-bilona-cow-ghee";
    }
    return "extra-virgin-black-seed-oil";
  } else if (isGheeOrOil) {
    return "sundarban-raw-wild-honey";
  } else {
    // Dates, Seeds, Combos, or others
    return "sundarban-raw-wild-honey";
  }
}

describe("Frequently Bought Together Pairing Logic", () => {
  it("Honey products pair with Cold-Pressed Black Seed Oil or Traditional Bilona Cow Ghee", () => {
    const rawHoney = {
      id: "prod-h-1",
      slug: "sundarban-raw-wild-honey",
      categorySlug: "honey",
      titleBn: "সুন্দরবনের প্রাকৃতিক চাকের কাঁচা মধু",
    };
    const pair1 = getComplementaryProductSlug(rawHoney);
    assert.equal(pair1, "extra-virgin-black-seed-oil");

    const khalishaHoney = {
      id: "prod-h-2",
      slug: "khalisha-flower-raw-honey",
      categorySlug: "honey",
      titleBn: "খাঁটি খলিসা ফুলের মধু",
    };
    const pair2 = getComplementaryProductSlug(khalishaHoney);
    assert.equal(pair2, "traditional-bilona-cow-ghee");
  });

  it("Ghee and Mustard Oil products pair with Sundarban Raw Wild Honey", () => {
    const ghee = {
      id: "prod-g-1",
      slug: "traditional-bilona-cow-ghee",
      categorySlug: "ghee-oil",
      titleBn: "প্রথাগত বিলোনা গাওয়া ঘি",
    };
    assert.equal(getComplementaryProductSlug(ghee), "sundarban-raw-wild-honey");

    const mustardOil = {
      id: "prod-o-1",
      slug: "cold-pressed-mustard-oil",
      categorySlug: "ghee-oil",
      titleBn: "ঘানি ভাঙা খাঁটি সরিষার তেল",
    };
    assert.equal(getComplementaryProductSlug(mustardOil), "sundarban-raw-wild-honey");
  });

  it("Dates, Seeds, and other products pair with best-selling Raw Honey", () => {
    const ajwaDates = {
      id: "prod-d-1",
      slug: "madinah-vip-ajwa-dates",
      categorySlug: "dates",
    };
    assert.equal(getComplementaryProductSlug(ajwaDates), "sundarban-raw-wild-honey");

    const chiaSeeds = {
      id: "prod-s-1",
      slug: "organic-chia-seeds",
      categorySlug: "organic-seeds",
    };
    assert.equal(getComplementaryProductSlug(chiaSeeds), "sundarban-raw-wild-honey");
  });

  it("Free shipping qualification triggers accurately at ৳2,000 threshold", () => {
    const isFreeShipping = (subtotal) => subtotal >= 2000;

    assert.equal(isFreeShipping(1999), false);
    assert.equal(isFreeShipping(2000), true);
    assert.equal(isFreeShipping(2500), true);
    assert.equal(isFreeShipping(490), false);
  });

  it("Correct CTA text rendered based on selected item count", () => {
    const getCtaText = (selectedCount) => {
      if (selectedCount === 2) return "উভয় পণ্য একসাথে কার্টে যোগ করুন";
      if (selectedCount === 1) return "নির্বাচিত পণ্য কার্টে যোগ করুন";
      return "কমপক্ষে একটি পণ্য বেছে নিন";
    };

    assert.equal(getCtaText(2), "উভয় পণ্য একসাথে কার্টে যোগ করুন");
    assert.equal(getCtaText(1), "নির্বাচিত পণ্য কার্টে যোগ করুন");
    assert.equal(getCtaText(0), "কমপক্ষে একটি পণ্য বেছে নিন");
  });
});
