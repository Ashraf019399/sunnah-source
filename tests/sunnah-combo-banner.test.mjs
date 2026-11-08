import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Sunnah Special Combo Banner Placement & Hero Configuration Suite", async (t) => {
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
  const bannerJpgPath = path.join(
    process.cwd(),
    "public",
    "images",
    "banners",
    "sunnah-special-combo-banner.jpg"
  );
  const bannerPngPath = path.join(
    process.cwd(),
    "public",
    "images",
    "banners",
    "sunnah-special-combo-banner.png"
  );

  assert.ok(fs.existsSync(heroPath), "hero-section.tsx must exist");
  assert.ok(fs.existsSync(mobilePromoPath), "mobile-promo-banners.tsx must exist");
  const heroCode = fs.readFileSync(heroPath, "utf-8");
  const mobilePromoCode = fs.readFileSync(mobilePromoPath, "utf-8");

  await t.test("1. Sunnah Special Combo banner image physically exists in public/images/banners/", () => {
    assert.ok(
      fs.existsSync(bannerJpgPath) || fs.existsSync(bannerPngPath),
      "Banner image file must physically exist in public/images/banners/"
    );
    const targetFile = fs.existsSync(bannerJpgPath) ? bannerJpgPath : bannerPngPath;
    const stats = fs.statSync(targetFile);
    assert.ok(stats.size > 0, "Banner image file must not be empty");
  });

  await t.test("2. Big Hero Carousel (MAIN_BANNERS) is restored with the nature/honey main slider as lead", () => {
    // Lead slide should be the big nature honey banner
    assert.ok(
      heroCode.includes('id: "honey"'),
      "MAIN_BANNERS must include the main honey banner"
    );
    assert.ok(
      heroCode.includes('image: "/images/banners/banner-nature-honey.jpg"'),
      "Lead main banner must be banner-nature-honey.jpg"
    );

    // Main carousel should not be overcrowded with the new combo banner
    const mainBannersBlock = heroCode.substring(
      heroCode.indexOf("export const MAIN_BANNERS"),
      heroCode.indexOf("export const TWIN_PROMOS")
    );
    assert.ok(
      !mainBannersBlock.includes('id: "sunnah-special-combo"'),
      "Big main carousel must not contain sunnah-special-combo"
    );
  });

  await t.test("3. Right-side Promo Section (TWIN_PROMOS) features the new Sunnah Special Combo banner", () => {
    // Promo combo card with the new banner
    assert.ok(
      heroCode.includes('id: "promo-combo"'),
      "TWIN_PROMOS must include promo-combo"
    );
    assert.ok(
      heroCode.includes('image: "/images/banners/sunnah-special-combo-banner.jpg"'),
      "Promo combo must use sunnah-special-combo-banner.jpg"
    );
    assert.ok(
      heroCode.includes('title: "সুন্নাহ স্পেশাল কম্বো"'),
      "Promo combo must have title 'সুন্নাহ স্পেশাল কম্বো'"
    );
    assert.ok(
      heroCode.includes('badge: "১৫% ছাড়"'),
      "Promo combo must have badge '১৫% ছাড়'"
    );
    assert.ok(
      heroCode.includes('link: "/combos"'),
      "Promo combo must link to '/combos'"
    );
    assert.ok(
      heroCode.includes('alt: "সুন্নাহ স্পেশাল কম্বো — ১৫% ছাড়"'),
      "Promo combo must have alt text 'সুন্নাহ স্পেশাল কম্বো — ১৫% ছাড়'"
    );
  });

  await t.test("4. Mobile Promo Banners seamlessly renders TWIN_PROMOS on mobile viewports", () => {
    assert.ok(
      mobilePromoCode.includes("TWIN_PROMOS"),
      "mobile-promo-banners.tsx must map TWIN_PROMOS"
    );
  });
});
