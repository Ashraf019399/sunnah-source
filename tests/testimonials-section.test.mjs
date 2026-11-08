import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { toBanglaDigits } from "../src/lib/utils.ts";

test("Testimonials Section & Hind Siliguri Font Loading Suite", async (t) => {
  const testimonialsPath = path.join(
    process.cwd(),
    "src",
    "components",
    "home",
    "testimonials-section.tsx"
  );
  const layoutPath = path.join(process.cwd(), "src", "app", "layout.tsx");
  const tailwindPath = path.join(process.cwd(), "tailwind.config.ts");

  assert.ok(fs.existsSync(testimonialsPath), "testimonials-section.tsx must exist");
  assert.ok(fs.existsSync(layoutPath), "layout.tsx must exist");
  assert.ok(fs.existsSync(tailwindPath), "tailwind.config.ts must exist");

  const testimonialsCode = fs.readFileSync(testimonialsPath, "utf-8");
  const layoutCode = fs.readFileSync(layoutPath, "utf-8");
  const tailwindCode = fs.readFileSync(tailwindPath, "utf-8");

  await t.test("1. Google Font Hind_Siliguri is properly imported and loaded in layout.tsx", () => {
    assert.ok(
      layoutCode.includes("from \"next/font/google\"") || layoutCode.includes("from 'next/font/google'"),
      "layout.tsx must import from next/font/google"
    );
    assert.ok(
      layoutCode.includes("Hind_Siliguri"),
      "layout.tsx must import Hind_Siliguri"
    );
    assert.ok(
      layoutCode.includes("--font-hind-siliguri"),
      "layout.tsx must configure '--font-hind-siliguri' variable"
    );
    assert.ok(
      layoutCode.includes("hindSiliguri.variable"),
      "layout.tsx must add hindSiliguri.variable to body"
    );
  });

  await t.test("2. tailwind.config.ts maps font-hind to var(--font-hind-siliguri)", () => {
    assert.ok(
      tailwindCode.includes("hind:"),
      "tailwind.config.ts must define font family 'hind'"
    );
    assert.ok(
      tailwindCode.includes("--font-hind-siliguri"),
      "tailwind.config.ts must reference '--font-hind-siliguri'"
    );
  });

  await t.test("3. No broken letter-spacing in testimonials-section.tsx (tracking-normal enforced)", () => {
    // Stat labels must not have tracking-wide, tracking-wider, or tracking-widest which breaks Bengali ligatures
    assert.ok(
      !testimonialsCode.includes("tracking-wide"),
      "Must not include tracking-wide on Bengali text"
    );
    assert.ok(
      !testimonialsCode.includes("tracking-wider"),
      "Must not include tracking-wider on Bengali text"
    );
    assert.ok(
      !testimonialsCode.includes("tracking-widest"),
      "Must not include tracking-widest on Bengali text"
    );

    // Ensure tracking-normal is explicitly used on labels and numbers
    assert.ok(
      testimonialsCode.includes("tracking-normal"),
      "Must enforce tracking-normal on Bengali text"
    );

    // Verify cohesive Bengali conjuncts in labels
    assert.ok(
      testimonialsCode.includes("পজিটিভ রিভিউ"),
      "Label 'পজিটিভ রিভিউ' must be rendered cohesively without separated letters"
    );
    assert.ok(
      testimonialsCode.includes("সন্তুষ্ট পরিবার"),
      "Label 'সন্তুষ্ট পরিবার' must be intact"
    );
    assert.ok(
      testimonialsCode.includes("গড় কাস্টমার রেটিং"),
      "Label 'গড় কাস্টমার রেটিং' must be intact"
    );
    assert.ok(
      testimonialsCode.includes("মানি-ব্যাক নিশ্চয়তা"),
      "Label 'মানি-ব্যাক নিশ্চয়তা' must be intact"
    );
  });

  await t.test("4. Stat numbers and cards strictly use font-hind and bold styling", () => {
    assert.ok(
      testimonialsCode.includes("font-hind"),
      "Must use font-hind in testimonials section"
    );
    assert.ok(
      testimonialsCode.includes("font-bold text-3xl sm:text-4xl text-stone-900 leading-tight tracking-normal font-hind"),
      "Stat numbers must have 'font-bold text-3xl sm:text-4xl text-stone-900 leading-tight tracking-normal font-hind'"
    );
    assert.ok(
      !testimonialsCode.includes("text-stone-900 tracking-tight font-mono"),
      "Must not use font-mono on stat numbers"
    );
  });

  await t.test("5. IntersectionObserver with threshold 0.2 and 1.5s easeOut count-up animation", () => {
    assert.ok(
      testimonialsCode.includes("IntersectionObserver"),
      "Must implement IntersectionObserver"
    );
    assert.ok(
      testimonialsCode.includes("threshold: 0.2") || testimonialsCode.includes("threshold:0.2"),
      "IntersectionObserver must use threshold: 0.2"
    );
    assert.ok(
      testimonialsCode.includes("observer.disconnect()"),
      "Observer must disconnect on first trigger to run cleanly once"
    );
    assert.ok(
      testimonialsCode.includes("1500"),
      "Animation duration must be 1.5 seconds (1500ms)"
    );
    assert.ok(
      testimonialsCode.includes("requestAnimationFrame"),
      "Must use requestAnimationFrame"
    );

    // Accurate target values
    assert.ok(testimonialsCode.includes("১০,০০০+"), "Target 1 must be '১০,০০০+'");
    assert.ok(testimonialsCode.includes("৪.৯ / ৫.০"), "Target 2 must be '৪.৯ / ৫.০'");
    assert.ok(testimonialsCode.includes("৯৯.২%"), "Target 3 must be '৯৯.২%'");
    assert.ok(testimonialsCode.includes("১০০%"), "Target 4 must be '১০০%'");

    // Bengali digits helper verification
    assert.strictEqual(toBanglaDigits("10,000") + "+", "১০,০০০+");
    assert.strictEqual(toBanglaDigits("4.9") + " / ৫.০", "৪.৯ / ৫.০");
    assert.strictEqual(toBanglaDigits("99.2") + "%", "৯৯.২%");
    assert.strictEqual(toBanglaDigits(100) + "%", "১০০%");
  });

  await t.test("6. Card layout maintains clean 4-card grid and polish classes", () => {
    assert.ok(
      testimonialsCode.includes("rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xs hover:shadow-md transition-shadow"),
      "Must use 'rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xs hover:shadow-md transition-shadow'"
    );
  });
});
