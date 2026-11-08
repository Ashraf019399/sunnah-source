import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { toBanglaDigits } from "../src/lib/utils.ts";

test("Testimonials Section - Hind Siliguri Font & Scroll Count-Up Animation Suite", async (t) => {
  const filePath = path.join(
    process.cwd(),
    "src",
    "components",
    "home",
    "testimonials-section.tsx"
  );

  assert.ok(fs.existsSync(filePath), "testimonials-section.tsx must exist");
  const content = fs.readFileSync(filePath, "utf-8");

  await t.test("1. Stat numbers strictly use Hind Siliguri font and bold styling", () => {
    // Stat numbers must use the exact requested classes
    assert.ok(
      content.includes("font-bold text-3xl sm:text-4xl text-stone-900 leading-tight tracking-normal"),
      "Stat numbers must have 'font-bold text-3xl sm:text-4xl text-stone-900 leading-tight tracking-normal'"
    );

    // Font Hind Siliguri must be present
    assert.ok(
      content.includes("Hind_Siliguri") || content.includes("font-bengali"),
      "Must apply Hind Siliguri font family"
    );

    // font-mono should not be used on the stat numbers
    assert.ok(
      !content.includes("text-stone-900 tracking-tight font-mono"),
      "Must not use font-mono on stat numbers"
    );
  });

  await t.test("2. IntersectionObserver with threshold 0.2 and one-time execution", () => {
    // Check for IntersectionObserver usage
    assert.ok(
      content.includes("IntersectionObserver"),
      "Must implement IntersectionObserver"
    );

    // Check threshold 0.2
    assert.ok(
      content.includes("threshold: 0.2") || content.includes("threshold:0.2"),
      "IntersectionObserver must use threshold: 0.2"
    );

    // Check disconnect to run cleanly once
    assert.ok(
      content.includes("observer.disconnect()"),
      "Observer must disconnect on first trigger to avoid glitches on minor scrolls"
    );
  });

  await t.test("3. Smooth count-up animation over 1.5 seconds with easing curve", () => {
    // Check 1.5s (1500ms) duration
    assert.ok(
      content.includes("1500"),
      "Animation duration must be 1.5 seconds (1500ms)"
    );

    // Check easing curve (easeOutCubic or easeOutQuad)
    assert.ok(
      content.includes("easeOutCubic") ||
        content.includes("Math.pow(1 - rawProgress, 3)") ||
        content.includes("Math.pow(1 - progress, 3)") ||
        content.includes("easeOutQuad"),
      "Must implement smooth easeOut curve"
    );

    // Check requestAnimationFrame usage
    assert.ok(
      content.includes("requestAnimationFrame"),
      "Must use requestAnimationFrame for fluid frame updates"
    );
  });

  await t.test("4. Accurate target values and Bengali digit formatting", () => {
    // Check target values
    assert.ok(content.includes("১০,০০০+"), "Target 1 must be '১০,০০০+'");
    assert.ok(content.includes("৪.৯ / ৫.০"), "Target 2 must be '৪.৯ / ৫.০'");
    assert.ok(content.includes("৯৯.২%"), "Target 3 must be '৯৯.২%'");
    assert.ok(content.includes("১০০%"), "Target 4 must be '১০০%'");

    // Verify Bengali digits conversion helper works identically
    assert.strictEqual(toBanglaDigits("10,000") + "+", "১০,০০০+");
    assert.strictEqual(toBanglaDigits("4.9") + " / ৫.০", "৪.৯ / ৫.০");
    assert.strictEqual(toBanglaDigits("99.2") + "%", "৯৯.২%");
    assert.strictEqual(toBanglaDigits(100) + "%", "১০০%");
  });

  await t.test("5. Card layout maintains clean 4-card grid and required styling", () => {
    // Required card styling
    assert.ok(
      content.includes("rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xs hover:shadow-md transition-shadow"),
      "Must use 'rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xs hover:shadow-md transition-shadow'"
    );

    // All 4 Bengali labels must be present
    assert.ok(content.includes("সন্তুষ্ট পরিবার"), "Must include label 'সন্তুষ্ট পরিবার'");
    assert.ok(content.includes("গড় কাস্টমার রেটিং"), "Must include label 'গড় কাস্টমার রেটিং'");
    assert.ok(content.includes("পজিティブ রিভিউ"), "Must include label 'পজিティブ রিভিউ'");
    assert.ok(content.includes("মানি-ব্যাক নিশ্চয়তা"), "Must include label 'মানি-ব্যাক নিশ্চয়তা'");
  });
});

