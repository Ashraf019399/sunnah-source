import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const searchModalPath = path.join(
  rootDir,
  "src",
  "components",
  "layout",
  "mobile-search-modal.tsx"
);

test("Mobile Search Modal Upgrade Suite", async (t) => {
  assert.ok(fs.existsSync(searchModalPath), "mobile-search-modal.tsx must exist");
  const content = fs.readFileSync(searchModalPath, "utf-8");

  await t.test("1. Hardware & Gesture Back Button Handling", () => {
    // History pushState on open
    assert.ok(
      content.includes("history.pushState({ modal: \"mobile-search\" }") ||
      content.includes("history.pushState({ modal: 'mobile-search' }"),
      "Must push browser history state with { modal: 'mobile-search' }"
    );

    // Popstate event listener
    assert.ok(
      content.includes('window.addEventListener("popstate"') ||
      content.includes("window.addEventListener('popstate'"),
      "Must attach popstate event listener for hardware back button"
    );

    // Popping history state on close
    assert.ok(
      content.includes("history.state?.modal === \"mobile-search\"") ||
      content.includes("history.state?.modal === 'mobile-search'"),
      "Must verify history.state?.modal === 'mobile-search' before popping history"
    );
    assert.ok(
      content.includes("window.history.back()"),
      "Must call window.history.back() when closing with active modal history"
    );

    // Escape key support
    assert.ok(content.includes('e.key === "Escape"') || content.includes("e.key === 'Escape'"), "Must support Escape key to close");
  });

  await t.test("2. Beautiful, Spacious Layout with Dedicated 'খুঁজুন' Button", () => {
    // 48px input height, 16px text (prevents iOS auto-zoom), pl-11 pr-9 padding
    assert.ok(content.includes("h-12"), "Must use h-12 (48px) for input and button");
    assert.ok(
      content.includes("text-[16px]") || content.includes("text-base"),
      "Must use 16px font size to prevent iOS auto-zoom"
    );
    assert.ok(
      content.includes("pl-11") && content.includes("pr-9"),
      "Must have spacious padding pl-11 pr-9 with no cramped buttons inside"
    );

    // Magnifying glass icon text-brand-700
    assert.ok(content.includes("text-brand-700"), "Must have emerald magnifying glass icon text-brand-700");

    // Exact placeholder
    assert.ok(
      content.includes("পণ্য খুঁজুন (মধু, ঘি, খেজুর)..."),
      "Must have placeholder 'পণ্য খুঁজুন (মধু, ঘি, খেজুর)...'"
    );

    // Dedicated right "খুঁজুন" button
    assert.ok(
      content.includes("bg-brand-700") && content.includes("খুঁজুন"),
      "Must have dedicated right 'খুঁজুন' button styled in bg-brand-700"
    );

    // Sleek circular close button
    assert.ok(
      content.includes("w-9 h-9") && content.includes("rounded-full"),
      "Must have sleek w-9 h-9 rounded-full close button"
    );
  });

  await t.test("3. Clutter-Free Layout for Mobile Keyboard", () => {
    // Bulky header removed
    assert.ok(
      !content.includes("তাৎক্ষণিক সার্চ অনুসন্ধান") &&
      !content.includes("তাৎক্ষণিক পণ্য অনুসন্ধান"),
      "Must remove bulky header text to preserve mobile viewport space"
    );

    // Large category boxes removed
    assert.ok(
      !content.includes("প্রধান ক্যাটাগরি সমূহ"),
      "Must remove bulky category boxes that collide with mobile keyboard"
    );

    // Trending pills with emojis
    const expectedPills = [
      "🍯 সুন্দরবন মধু",
      "🧈 গাওয়া ঘি",
      "🌴 আজওয়া খেজুর",
      "🌱 কালোজিরা তেল",
      "✨ চিয়া সিড",
      "🎁 কম্বো",
    ];

    for (const pill of expectedPills) {
      assert.ok(content.includes(pill), `Must include trending pill '${pill}'`);
    }

    // Horizontal scroll layout
    assert.ok(
      content.includes("overflow-x-auto"),
      "Must render trending pills in a clean horizontal-scrolling row"
    );
  });

  await t.test("4. Live Fuzzy Search Results", () => {
    // Imports and data access
    assert.ok(content.includes("ALL_PRODUCTS"), "Must search ALL_PRODUCTS");
    assert.ok(content.includes("CATEGORIES_DATA"), "Must map category names from CATEGORIES_DATA");
    assert.ok(content.includes("formatBDT"), "Must format price in BDT");

    // Bengali normalization / fuzzy matching support
    assert.ok(
      content.includes("normalizeBengali") || content.includes("normalize"),
      "Must implement Bengali text normalization for fuzzy search"
    );

    // Thumbnail, title, category, price, link
    assert.ok(content.includes("product.titleBn"), "Must render product.titleBn");
    assert.ok(content.includes("product.slug"), "Must link to product slug");
  });
});

