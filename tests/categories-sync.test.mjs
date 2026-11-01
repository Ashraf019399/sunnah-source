import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  CATEGORIES_DATA,
  CATEGORY_PRIMARY_PRODUCT_IMAGES,
  getCategoryDisplayImage,
} from "../src/lib/data/categories.ts";

test("Categories & Product Asset Auto-Sync Suite", async (t) => {
  await t.test("1. All categories map directly to authentic primary product assets", () => {
    assert.equal(
      CATEGORY_PRIMARY_PRODUCT_IMAGES.honey,
      "/images/products/sundarbans-raw-honey.png"
    );
    assert.equal(
      CATEGORY_PRIMARY_PRODUCT_IMAGES["ghee-oil"],
      "/images/products/golden-ghee.png"
    );
    assert.equal(
      CATEGORY_PRIMARY_PRODUCT_IMAGES.dates,
      "/images/products/premium-ajwa-dates.png"
    );
    assert.equal(
      CATEGORY_PRIMARY_PRODUCT_IMAGES["organic-seeds"],
      "/images/products/chia-seeds.png"
    );
    assert.equal(
      CATEGORY_PRIMARY_PRODUCT_IMAGES.combos,
      "/images/products/sunnah-health-booster-combo.png"
    );
    assert.equal(
      CATEGORY_PRIMARY_PRODUCT_IMAGES["dry-fruits"],
      "/images/products/cashew-nuts.png"
    );
  });

  await t.test("2. Primary product mockups physically exist in public/images/products/", () => {
    for (const [slug, imgPath] of Object.entries(CATEGORY_PRIMARY_PRODUCT_IMAGES)) {
      const fullPath = path.join(process.cwd(), "public", imgPath.replace(/^\//, ""));
      assert.ok(
        fs.existsSync(fullPath),
        `Asset for ${slug} must exist at: ${fullPath}`
      );
    }
  });

  await t.test("3. getCategoryDisplayImage seamlessly falls back from old demo banners and unsplash URLs", () => {
    // Empty or null
    assert.equal(
      getCategoryDisplayImage("honey", ""),
      "/images/products/sundarbans-raw-honey.png"
    );
    assert.equal(
      getCategoryDisplayImage("ghee-oil", null),
      "/images/products/golden-ghee.png"
    );

    // Old demo hero banner
    assert.equal(
      getCategoryDisplayImage("honey", "/images/hero-honey.png"),
      "/images/products/sundarbans-raw-honey.png"
    );
    assert.equal(
      getCategoryDisplayImage("organic-seeds", "/images/products/organic-seeds-banner.png"),
      "/images/products/chia-seeds.png"
    );
    assert.equal(
      getCategoryDisplayImage("dry-fruits", "/images/products/dry-fruits-banner.png"),
      "/images/products/cashew-nuts.png"
    );

    // External unsplash placeholders
    assert.equal(
      getCategoryDisplayImage(
        "dates",
        "https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=800&q=80"
      ),
      "/images/products/premium-ajwa-dates.png"
    );
    assert.equal(
      getCategoryDisplayImage(
        "ghee-oil",
        "https://images.unsplash.com/photo-1631379578550-7038263db699?auto=format&fit=crop&w=800&q=80"
      ),
      "/images/products/golden-ghee.png"
    );

    // Valid custom product image is preserved
    assert.equal(
      getCategoryDisplayImage("dates", "/images/products/premium-amber-dates.png"),
      "/images/products/premium-amber-dates.png"
    );
  });

  await t.test("4. Category 5 strictly adheres to Sunnah Source brand spelling ('সুন্নাহ কম্বো ও গিফট বক্স')", () => {
    const comboCat = CATEGORIES_DATA.find((c) => c.slug === "combos");
    assert.ok(comboCat, "Combos category must exist in CATEGORIES_DATA");
    assert.equal(comboCat.nameBn, "সুন্নাহ কম্বো ও গিফট বক্স");
    assert.ok(!comboCat.nameBn.includes("সান্নাহ"), "Must not use 'সান্নাহ'");
    assert.ok(
      comboCat.sourcingOriginBn?.includes("সুন্নাহ সোর্স"),
      "Sourcing origin must use 'সুন্নাহ সোর্স'"
    );
  });
});

