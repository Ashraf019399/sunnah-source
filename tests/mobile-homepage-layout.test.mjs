import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Mobile Homepage Layout & Bubble Strip Suite", async (t) => {
  const bubbleStripPath = path.join(
    process.cwd(),
    "src",
    "components",
    "home",
    "featured-categories-bubble-strip.tsx"
  );
  const heroPath = path.join(
    process.cwd(),
    "src",
    "components",
    "home",
    "hero-section.tsx"
  );
  const mobilePromoPath = path.join(
    process.cwd(),
    "src",
    "components",
    "home",
    "mobile-promo-banners.tsx"
  );
  const homePagePath = path.join(
    process.cwd(),
    "src",
    "app",
    "page.tsx"
  );

  await t.test("1. Featured Categories Bubble Strip file exists and defines all 5 required organic food categories", () => {
    assert.ok(fs.existsSync(bubbleStripPath), "Bubble strip file must exist");
    const content = fs.readFileSync(bubbleStripPath, "utf-8");

    // Check all 5 categories
    // 1. Raw Honey
    assert.ok(content.includes("প্রাকৃতিক মধু"), "Must include 'প্রাকৃতিক মধু'");
    assert.ok(content.includes("Raw Honey"), "Must include 'Raw Honey'");
    assert.ok(content.includes("/category/honey"), "Must link to /category/honey");
    assert.ok(content.includes("/images/products/sundarbans-raw-honey.png"), "Must use honey mockup image");

    // 2. Ghee & Oils
    assert.ok(content.includes("গাওয়া ঘি ও তেল"), "Must include 'গাওয়া ঘি ও তেল'");
    assert.ok(content.includes("Ghee & Oils"), "Must include 'Ghee & Oils'");
    assert.ok(content.includes("/category/ghee-oil"), "Must link to /category/ghee-oil");
    assert.ok(content.includes("/images/products/golden-ghee.png"), "Must use ghee mockup image");

    // 3. Premium Dates
    assert.ok(content.includes("প্রিমিয়াম খেজুর"), "Must include 'প্রিমিয়াম খেজুর'");
    assert.ok(content.includes("Premium Dates"), "Must include 'Premium Dates'");
    assert.ok(content.includes("/category/dates"), "Must link to /category/dates");
    assert.ok(content.includes("/images/products/premium-ajwa-dates.png"), "Must use dates mockup image");

    // 4. Organic Seeds
    assert.ok(content.includes("অর্গানিক বীজ"), "Must include 'অর্গানিক বীজ'");
    assert.ok(content.includes("Organic Seeds"), "Must include 'Organic Seeds'");
    assert.ok(content.includes("/category/organic-seeds"), "Must link to /category/organic-seeds");
    assert.ok(content.includes("/images/products/chia-seeds.png"), "Must use chia seeds mockup image");

    // 5. Sunnah Combos
    assert.ok(content.includes("সুন্নাহ কম্বো"), "Must include 'সুন্নাহ কম্বো'");
    assert.ok(content.includes("Sunnah Combos"), "Must include 'Sunnah Combos'");
    assert.ok(content.includes("/combos"), "Must link to /combos");
    assert.ok(content.includes("/images/products/sunnah-health-booster-combo.png"), "Must use combo mockup image");
  });

  await t.test("2. All 5 transparent mockup assets exist on disk in public/", () => {
    const assets = [
      "/images/products/sundarbans-raw-honey.png",
      "/images/products/golden-ghee.png",
      "/images/products/premium-ajwa-dates.png",
      "/images/products/chia-seeds.png",
      "/images/products/sunnah-health-booster-combo.png",
    ];

    for (const imgPath of assets) {
      const fullPath = path.join(process.cwd(), "public", imgPath.replace(/^\//, ""));
      assert.ok(fs.existsSync(fullPath), `Asset ${imgPath} must physically exist`);
    }
  });

  await t.test("3. Bubble strip component implements horizontal scroll & emerald styling classes", () => {
    const stripCode = fs.readFileSync(bubbleStripPath, "utf8");

    assert.ok(
      stripCode.includes("flex overflow-x-auto no-scrollbar gap-4 py-2 px-4"),
      "Must implement horizontal scrollable container with no-scrollbar"
    );
    assert.ok(
      stripCode.includes("bg-brand-50/80 border border-brand-200/60"),
      "Must use soft emerald-tinted circle/bubble styling"
    );
    assert.ok(
      stripCode.includes("lg:hidden"),
      "Must be hidden on desktop (lg:hidden) as desktop uses full category grid"
    );
  });

  await t.test("4. HeroSection desktop/mobile split configuration preserves 3-column desktop and unblocks mobile", () => {
    const heroCode = fs.readFileSync(heroPath, "utf8");

    assert.ok(
      heroCode.includes("hidden lg:flex lg:col-span-4"),
      "Secondary promo cards must be hidden on mobile (< lg) and visible on desktop (>= lg)"
    );
    assert.ok(
      heroCode.includes("export const TWIN_PROMOS") || heroCode.includes("export let TWIN_PROMOS"),
      "TWIN_PROMOS is exported"
    );
  });

  await t.test("5. MobilePromoBanners component exists and is configured for mobile screens", () => {
    assert.ok(fs.existsSync(mobilePromoPath), "mobile-promo-banners.tsx must exist");
    const promoCode = fs.readFileSync(mobilePromoPath, "utf8");
    assert.ok(promoCode.includes("lg:hidden"), "Mobile promo banners must be hidden on desktop (lg:hidden)");
    assert.ok(promoCode.includes("TWIN_PROMOS"), "Renders TWIN_PROMOS");
  });

  await t.test("6. HomePage organizes mobile sections in the exact specified order", () => {
    const homeCode = fs.readFileSync(homePagePath, "utf8");

    const heroIndex = homeCode.indexOf("<HeroSection");
    const bubbleIndex = homeCode.indexOf("<FeaturedCategoriesBubbleStrip");
    const trustIndex = homeCode.indexOf("100% Pure & Natural");
    const bestSellerIndex = homeCode.indexOf("Best Selling Products");
    const mobilePromoIndex = homeCode.indexOf("<MobilePromoBanners");

    assert.ok(heroIndex > -1, "HeroSection must be in HomePage");
    assert.ok(bubbleIndex > -1, "FeaturedCategoriesBubbleStrip must be in HomePage");
    assert.ok(trustIndex > -1, "Trust Badges must be in HomePage");
    assert.ok(bestSellerIndex > -1, "Best Selling Products must be in HomePage");
    assert.ok(mobilePromoIndex > -1, "MobilePromoBanners must be in HomePage");

    // Verify ordering: 1. Hero -> 2. Bubble Strip -> 3. Trust Badges -> 4. Best Sellers -> 5. Secondary Promo
    assert.ok(heroIndex < bubbleIndex, "Hero (1) must precede Bubble Strip (2)");
    assert.ok(bubbleIndex < trustIndex, "Bubble Strip (2) must precede Trust Badges (3)");
    assert.ok(trustIndex < bestSellerIndex, "Trust Badges (3) must precede Best Sellers (4)");
    assert.ok(bestSellerIndex < mobilePromoIndex, "Best Sellers (4) must precede Secondary Promo Banners (5)");
  });
});
