import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Product Card Streamline Suite (Clean Title + English Stock Status)", async (t) => {
  const cardPath = path.join(
    process.cwd(),
    "src",
    "components",
    "commerce",
    "product-card.tsx"
  );
  const reExportPath = path.join(
    process.cwd(),
    "src",
    "components",
    "product",
    "product-card.tsx"
  );

  assert.ok(fs.existsSync(cardPath), "src/components/commerce/product-card.tsx must exist");
  assert.ok(fs.existsSync(reExportPath), "src/components/product/product-card.tsx must exist");

  const cardCode = fs.readFileSync(cardPath, "utf-8");

  await t.test("1. Subtitle & packaging descriptor beneath title is removed", () => {
    // Should NOT render activeVariant.displayName or product.subtitle directly below title
    assert.ok(
      !cardCode.includes("{activeVariant?.displayName && ("),
      "Packaging descriptor/subtitle line beneath title must be removed"
    );
    assert.ok(
      !cardCode.includes("product.subtitle"),
      "Product subtitle line must not be present in product card"
    );

    // Title connects directly into variant selector pills
    assert.ok(
      cardCode.includes("{product.titleBn}"),
      "Product Bengali title is preserved"
    );
    assert.ok(
      cardCode.includes("{product.variants && product.variants.length > 1 && ("),
      "Variant pills follow cleanly after title block"
    );
  });

  await t.test("2. Stock status badge uses sleek English 'In Stock' badge", () => {
    // Bengali 'স্টকে আছে' badge removed
    assert.ok(
      !cardCode.includes("স্টকে আছে"),
      "Bengali 'স্টকে আছে' text badge must be replaced"
    );

    // English 'In Stock' badge present
    assert.ok(
      cardCode.includes("In Stock"),
      "Must display 'In Stock' in English"
    );
    assert.ok(
      cardCode.includes("bg-emerald-50 text-emerald-700 border border-emerald-200/80"),
      "Must use sleek emerald pill styling for In Stock badge"
    );
    assert.ok(
      cardCode.includes("text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full"),
      "Must use font-semibold rounded-full styling for In Stock badge"
    );
  });

  await t.test("3. Out of stock status badge uses sleek English 'Out of Stock' badge", () => {
    // English 'Out of Stock' badge present
    assert.ok(
      cardCode.includes("Out of Stock"),
      "Must display 'Out of Stock' in English"
    );
    assert.ok(
      cardCode.includes("bg-stone-100 text-stone-500 border border-stone-200"),
      "Must use stone pill styling for Out of Stock badge"
    );
  });
});

