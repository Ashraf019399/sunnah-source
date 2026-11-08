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
  const globalsCssPath = path.join(
    process.cwd(),
    "src",
    "app",
    "globals.css"
  );

  assert.ok(fs.existsSync(headerPath), "header.tsx must exist");
  assert.ok(fs.existsSync(globalsCssPath), "globals.css must exist");

  const headerCode = fs.readFileSync(headerPath, "utf-8");
  const globalsCss = fs.readFileSync(globalsCssPath, "utf-8");

  await t.test("1. Outer search container uses single-border with zero rings/shadows", () => {
    assert.ok(
      headerCode.includes("focus-within:border-brand-700"),
      "Outer container must illuminate single brand-700 border on focus-within"
    );
    assert.ok(
      !headerCode.includes("focus-within:ring-"),
      "Outer container must NEVER have ring- classes (which cause double-line artifact)"
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
    const searchFormBlock = headerCode.substring(
      headerCode.indexOf('role="search"'),
      headerCode.indexOf("{renderSearchDropdown()}")
    );

    assert.ok(
      searchFormBlock.includes("border-0 outline-none focus:outline-none focus:ring-0 ring-0 shadow-none bg-transparent"),
      "Inner input must completely strip internal borders, outlines, rings, and shadows"
    );
  });

  await t.test("3. Global CSS excludes inputs from blanket :focus-visible outlines", () => {
    assert.ok(
      globalsCss.includes(":focus-visible:not(input):not(textarea):not(select)"),
      "globals.css must exempt inputs/textareas from global outline ring"
    );
    assert.ok(
      globalsCss.includes("input:focus-visible") && globalsCss.includes("outline: none !important"),
      "globals.css must explicitly suppress outline on inputs to prevent double-border glitches"
    );
  });
});
