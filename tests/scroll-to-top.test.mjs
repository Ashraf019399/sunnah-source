import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("ScrollToTop Floating Button Suite", async (t) => {
  const componentPath = path.join(
    process.cwd(),
    "src",
    "components",
    "common",
    "scroll-to-top.tsx"
  );
  const layoutPath = path.join(
    process.cwd(),
    "src",
    "app",
    "layout.tsx"
  );

  await t.test("1. Component file exists and is marked as client component", async () => {
    assert.ok(fs.existsSync(componentPath), "Component file must exist at src/components/common/scroll-to-top.tsx");
    const content = fs.readFileSync(componentPath, "utf-8");
    assert.ok(content.includes('"use client"') || content.includes("'use client'"), "Must be a client component");
    assert.ok(content.includes("export function ScrollToTop") || content.includes("export const ScrollToTop"), "Exports ScrollToTop");
  });

  await t.test("2. Implements passive/throttled scroll listener with 300px threshold", async () => {
    const content = fs.readFileSync(componentPath, "utf-8");
    assert.ok(content.includes("addEventListener"), "Listens to scroll events");
    assert.ok(content.includes("passive: true"), "Uses passive event listener for scroll performance");
    assert.ok(content.includes("removeEventListener"), "Cleans up scroll listener on unmount");
    assert.ok(content.includes("300"), "Uses 300px threshold for visibility trigger");
    assert.ok(
      content.includes("requestAnimationFrame") || content.includes("throttle"),
      "Throttles scroll event checks"
    );
  });

  await t.test("3. Triggers smooth window scroll to top on click", async () => {
    const content = fs.readFileSync(componentPath, "utf-8");
    assert.ok(content.includes("window.scrollTo"), "Calls window.scrollTo");
    assert.ok(content.includes('top: 0') || content.includes("top:0"), "Scrolls to top: 0");
    assert.ok(content.includes('behavior: "smooth"') || content.includes("behavior: 'smooth'"), "Smooth scrolling behavior configured");
  });

  await t.test("4. Styled in Sunnah Source luxury emerald (#1B4D2E) with warm amber (#D48B28) accents", async () => {
    const content = fs.readFileSync(componentPath, "utf-8");
    assert.ok(content.includes("#1B4D2E"), "Features Sunnah Source signature luxury emerald #1B4D2E");
    assert.ok(content.includes("#D48B28") || content.includes("accent-amber"), "Features warm amber accent #D48B28");
    assert.ok(content.includes("ArrowUp"), "Uses Lucide ArrowUp icon");
    assert.ok(content.includes("rounded-2xl") || content.includes("rounded-full"), "Squircle / round shape applied");
  });

  await t.test("5. Incorporates hover micro-interactions and mobile-safe collision avoidance", async () => {
    const content = fs.readFileSync(componentPath, "utf-8");
    assert.ok(content.includes("hover:-translate-y-1") || content.includes("-translate-y"), "Hover micro-interaction lift");
    assert.ok(content.includes("hover:shadow") || content.includes("shadow-"), "Hover glow shadow");
    assert.ok(content.includes("z-40"), "Safe z-index stacking");
    assert.ok(content.includes("print:hidden"), "Hidden in print media");
  });

  await t.test("6. Globally mounted in src/app/layout.tsx inside <body> alongside FloatingWhatsApp", async () => {
    const content = fs.readFileSync(layoutPath, "utf-8");
    assert.ok(content.includes("ScrollToTop"), "ScrollToTop imported in root layout");
    assert.ok(content.includes("<ScrollToTop />") || content.includes("<ScrollToTop/>"), "Mounted in root layout JSX");
    assert.ok(content.includes("<FloatingWhatsApp />"), "Mounted alongside FloatingWhatsApp");
  });
});

