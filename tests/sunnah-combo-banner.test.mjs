import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Sunnah Special Combo Banner & Hero Slider Integration Suite", async (t) => {
  const heroPath = path.join(
    process.cwd(),
    "src",
    "components",
    "home",
    "hero-section.tsx"
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
  const heroCode = fs.readFileSync(heroPath, "utf-8");

  await t.test("1. Sunnah Special Combo banner image physically exists in public/images/banners/", () => {
    assert.ok(
      fs.existsSync(bannerJpgPath) || fs.existsSync(bannerPngPath),
      "Banner image file must physically exist in public/images/banners/"
    );
    const targetFile = fs.existsSync(bannerJpgPath) ? bannerJpgPath : bannerPngPath;
    const stats = fs.statSync(targetFile);
    assert.ok(stats.size > 0, "Banner image file must not be empty");
  });

  await t.test("2. Hero section slide array defines Sunnah Special Combo with exact required metadata", () => {
    // Check ID
    assert.ok(
      heroCode.includes('id: "sunnah-special-combo"'),
      "Must define slide id 'sunnah-special-combo'"
    );

    // Check Title
    assert.ok(
      heroCode.includes('title: "সুন্নাহ স্পেশাল কম্বো"'),
      "Must define title 'সুন্নাহ স্পেশাল কম্বো'"
    );

    // Check Subtitle
    assert.ok(
      heroCode.includes('subtitle: "প্রাকৃতিক কাঁচা মধু, মদিনার আজওয়া খেজুর ও গাওয়া ঘি"'),
      "Must define subtitle 'প্রাকৃতিক কাঁচা মধু, মদিনার আজওয়া খেজুর ও গাওয়া ঘি'"
    );

    // Check Badge (15% Off)
    assert.ok(
      heroCode.includes('badge: "১৫% ছাড়"'),
      "Must define badge '১৫% ছাড়'"
    );

    // Check Image Path
    assert.ok(
      heroCode.includes('image: "/images/banners/sunnah-special-combo-banner.jpg"') ||
        heroCode.includes('image: "/images/banners/sunnah-special-combo-banner.png"'),
      "Must reference sunnah-special-combo-banner image path"
    );

    // Check Link
    assert.ok(
      heroCode.includes('link: "/combos"'),
      "Must link to '/combos'"
    );

    // Check CTA Text
    assert.ok(
      heroCode.includes('ctaText: "এখনই অর্ডার করুন"'),
      "Must have ctaText 'এখনই অর্ডার করুন'"
    );
  });
});

