import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { formatEnglishWeightLabel } from "../src/lib/utils.ts";

test("Product Detail Card Streamline Suite (English Controls + Bengali Description)", async (t) => {
  const productInfoPath = path.join(
    process.cwd(),
    "src",
    "components",
    "product",
    "product-info.tsx"
  );
  const pdpContentPath = path.join(
    process.cwd(),
    "src",
    "app",
    "product",
    "[slug]",
    "product-details-content.tsx"
  );

  assert.ok(fs.existsSync(productInfoPath), "product-info.tsx must exist");
  assert.ok(fs.existsSync(pdpContentPath), "product-details-content.tsx must exist");

  const productInfoCode = fs.readFileSync(productInfoPath, "utf-8");
  const pdpContentCode = fs.readFileSync(pdpContentPath, "utf-8");

  await t.test("1. Prominent English Product Title with subtle Bengali subtitle", () => {
    // English title resolution
    assert.ok(
      productInfoCode.includes("product.titleEn") &&
        (productInfoCode.includes("product.name") || productInfoCode.includes("product.title")),
      "Must resolve English title from product.titleEn || product.name || product.title"
    );

    // High-end sans typography
    assert.ok(
      productInfoCode.includes("font-bold text-2xl sm:text-3xl text-stone-900 tracking-tight leading-snug"),
      "Must use crisp high-end typography 'font-bold text-2xl sm:text-3xl text-stone-900 tracking-tight leading-snug'"
    );

    // Bengali subtitle in brackets/subhead
    assert.ok(
      productInfoCode.includes("bengaliSubtitle"),
      "Must render Bengali subtitle secondary subhead/bracket"
    );
  });

  await t.test("2. Sleek English Variant Weights format (250g, 500g, 1kg, 1L, 5L)", () => {
    assert.strictEqual(
      formatEnglishWeightLabel({ weightValue: 250, weightUnit: "g", displayName: "২৫০ গ্রাম জার" }),
      "250g"
    );
    assert.strictEqual(
      formatEnglishWeightLabel({ weightValue: 500, weightUnit: "g", displayName: "৫০০ গ্রাম জার" }),
      "500g"
    );
    assert.strictEqual(
      formatEnglishWeightLabel({ weightValue: 1000, weightUnit: "g", displayName: "১ কেজি ফ্যামিলি প্যাক" }),
      "1kg"
    );
    assert.strictEqual(
      formatEnglishWeightLabel({ weightValue: 1000, weightUnit: "ml", displayName: "১ লিটার বোতল" }),
      "1L"
    );
    assert.strictEqual(
      formatEnglishWeightLabel({ weightValue: 5000, weightUnit: "ml", displayName: "৫ লিটার ক্যান" }),
      "5L"
    );
  });

  await t.test("3. Price, Savings Pill, and Quantity Selector in English", () => {
    // English Savings Pill
    assert.ok(
      productInfoCode.includes("Save ৳"),
      "Must display savings pill as 'Save ৳{amount}'"
    );

    // English Quantity label
    assert.ok(
      productInfoCode.includes("Quantity:"),
      "Must display 'Quantity:' label"
    );

    // English Select Size label
    assert.ok(
      productInfoCode.includes("Select Size:"),
      "Must display 'Select Size:' label"
    );
  });

  await t.test("4. English Action Buttons & Twin Contact Buttons", () => {
    // Action Buttons
    assert.ok(
      productInfoCode.includes("<span>BUY NOW</span>"),
      "Must include sleek [ ⚡ BUY NOW ] button"
    );
    assert.ok(
      productInfoCode.includes("<span>ADD TO CART</span>"),
      "Must include sleek [ 🛒 ADD TO CART ] button"
    );

    // Contact Buttons
    assert.ok(
      productInfoCode.includes("Order on WhatsApp"),
      "Must include [ 💬 Order on WhatsApp ] button"
    );
    assert.ok(
      productInfoCode.includes("Call for Order"),
      "Must include [ 📞 Call for Order ] button"
    );
  });

  await t.test("5. Product 'About / Description' strictly retained in Bengali below the fold", () => {
    // Bengali Description Section
    assert.ok(
      pdpContentCode.includes("পণ্যের বিস্তারিত বিবরণ ও স্বাস্থ্য উপকারিতা") ||
        pdpContentCode.includes("পণ্যের বিস্তারিত বিবরণ ও উপকারিতা"),
      "Must retain Bengali section header for details & health benefits"
    );
    assert.ok(
      pdpContentCode.includes("product.fullDescriptionBn"),
      "Must render full Bengali product description"
    );
    assert.ok(
      pdpContentCode.includes("সংগ্রহের উৎস:"),
      "Must retain Bengali 'সংগ্রহের উৎস:'"
    );
    assert.ok(
      pdpContentCode.includes("উপাদানসমূহ:"),
      "Must retain Bengali 'উপাদানসমূহ:'"
    );
    assert.ok(
      pdpContentCode.includes("সংরক্ষণ"),
      "Must retain Bengali storage & usage information"
    );
  });
});
