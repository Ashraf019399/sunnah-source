import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Header Search Bar Single-Border Focus Verification Suite", async (t) => {
  const headerPath = path.join(
    process.cwd(),
    "src",
    "components",
    "layout",
    "header.tsx"
  );

  assert.ok(fs.existsSync(headerPath), "header.tsx must exist");
  const headerCode = fs.readFileSync(headerPath, "utf-8");

  await t.test("1. Outer search container controls border and focus state using focus-within", () => {
    assert.ok(
      headerCode.includes("focus-within:border-brand-700"),
      "Outer container must illuminate brand-700 on focus-within"
    );
    assert.ok(
      headerCode.includes("focus-within:ring-2 focus-within:ring-brand-700/15"),
      "Outer container must apply single elegant focus ring"
    );
    assert.ok(
      headerCode.includes("focus-within:bg-white"),
      "Outer container must transition to white background on focus-within"
    );
    assert.ok(
      headerCode.includes("bg-stone-50/80 border border-stone-200"),
      "Outer container must have neutral stone background and border"
    );
  });

  await t.test("2. Inner search input element strips all internal borders and outlines", () => {
    // Locate the search input within desktopSearch form
    const searchFormBlock = headerCode.substring(
      headerCode.indexOf('role="search"'),
      headerCode.indexOf("{renderSearchDropdown()}")
    );

    assert.ok(
      searchFormBlock.includes("border-0 outline-none focus:outline-none focus:ring-0 ring-0 shadow-none bg-transparent"),
      "Inner input must completely strip internal borders, outlines, rings, and shadows"
    );
  });
});

