import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { formatBanglaBDT, toBanglaDigits, isValidBDPhone, formatVariantWeightLabel } from "../src/lib/utils.ts";

test("Product Detail Page (PDP) Naturo & Ghorer-Bazar Upgrade Suite", async (t) => {
  const productInfoPath = path.join(process.cwd(), "src", "components", "product", "product-info.tsx");
  const modalPath = path.join(process.cwd(), "src", "components", "product", "express-checkout-modal.tsx");
  const stickyBarPath = path.join(process.cwd(), "src", "components", "product", "sticky-mobile-product-bar.tsx");
  const pdpContentPath = path.join(process.cwd(), "src", "app", "product", "[slug]", "product-details-content.tsx");
  const orderSuccessPath = path.join(process.cwd(), "src", "app", "order-success", "page.tsx");

  await t.test("1. Utility: formatBanglaBDT and Bengali digit conversions", () => {
    assert.equal(formatBanglaBDT(1890), "৳১,৮৯০", "1890 must format to ৳১,৮৯০");
    assert.equal(formatBanglaBDT(2090), "৳২,০৯০", "2090 must format to ৳২,০৯০");
    assert.equal(formatBanglaBDT(200), "৳২০০", "200 must format to ৳২০০");
    assert.equal(formatBanglaBDT(60), "৳৬০", "60 must format to ৳৬০");
    assert.equal(formatBanglaBDT(120), "৳১২০", "120 must format to ৳১২০");
    assert.equal(formatBanglaBDT(0), "৳০", "0 must format to ৳০");
    assert.equal(toBanglaDigits("01712345678"), "০১৭১২৩৪৫৬৭৮", "Converts digits cleanly");
  });

  await t.test("2. Utility: formatVariantWeightLabel converts weights into clean Bengali labels", () => {
    assert.equal(
      formatVariantWeightLabel({ weightValue: 250, weightUnit: "g", displayName: "২৫০ গ্রাম জার" }),
      "২৫০ গ্রাম"
    );
    assert.equal(
      formatVariantWeightLabel({ weightValue: 500, weightUnit: "g", displayName: "৫০০ গ্রাম জার" }),
      "৫০০ গ্রাম"
    );
    assert.equal(
      formatVariantWeightLabel({ weightValue: 1000, weightUnit: "g", displayName: "১ কেজি ফ্যামিলি প্যাক" }),
      "১ কেজি"
    );
    assert.equal(
      formatVariantWeightLabel({ weightValue: 400, weightUnit: "g", displayName: "৪০০ গ্রাম কাঁচের জার" }),
      "৪০০ গ্রাম"
    );
    assert.equal(
      formatVariantWeightLabel({ weightValue: 1000, weightUnit: "ml", displayName: "১ লিটার বোতল" }),
      "১ লিটার"
    );
    assert.equal(
      formatVariantWeightLabel({ weightValue: 5000, weightUnit: "ml", displayName: "৫ লিটার ক্যান" }),
      "৫ লিটার"
    );
  });

  await t.test("3. ProductInfo component exists, client-side, and features Naturo pills & Ghorer-Bazar savings badge", () => {
    assert.ok(fs.existsSync(productInfoPath), "product-info.tsx must exist");
    const content = fs.readFileSync(productInfoPath, "utf-8");

    assert.ok(content.includes('"use client"'), "Must be a client component");

    // Naturo-Style Active Variant Pill Styling
    assert.ok(
      content.includes("border-2 border-brand-800 bg-brand-50/70 text-brand-900 font-bold shadow-xs scale-[1.02]"),
      "Must have emerald active variant pill styling"
    );

    // Naturo-Style Inactive Variant Pill Styling
    assert.ok(
      content.includes("border border-stone-200 bg-white text-stone-700 hover:border-brand-300"),
      "Must have inactive variant pill styling"
    );

    // Ghorer-Bazar Style Savings Badge
    assert.ok(
      content.includes("bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full"),
      "Must have amber savings badge styling"
    );
    // Savings Badge (Supports both English 'Save ৳' and Bengali 'সাশ্রয়!')
    assert.ok(
      content.includes("Save") || content.includes("সাশ্রয়!"),
      "Must display savings badge text"
    );

    // 1-Click CTA button (Supports modernized 'BUY NOW' and 'এখনই অর্ডার করুন')
    assert.ok(
      content.includes("BUY NOW") || content.includes("এখনই অর্ডার করুন"),
      "Must have Buy Now CTA"
    );
    assert.ok(content.includes("onOrderNow"), "Must accept and call onOrderNow handler");
  });

  await t.test("4. 1-Click Express Cash on Delivery Modal implements all required UX and form fields", () => {
    assert.ok(fs.existsSync(modalPath), "express-checkout-modal.tsx must exist");
    const content = fs.readFileSync(modalPath, "utf-8");

    assert.ok(content.includes('"use client"'), "Must be client component");
    assert.ok(content.includes("createPortal"), "Must use createPortal for high-fidelity drawer/modal");

    // Top Summary
    assert.ok(content.includes("selectedVariant"), "Displays variant details");
    assert.ok(content.includes("quantity"), "Supports quantity selector");
    assert.ok(content.includes("Minus"), "Has minus button");
    assert.ok(content.includes("Plus"), "Has plus button");

    // Delivery Area Selector with ৳৬০ and ৳১২০
    assert.ok(content.includes("ঢাকার ভেতরে"), "Has inside Dhaka option");
    assert.ok(content.includes("ঢাকার বাইরে"), "Has outside Dhaka option");
    assert.ok(content.includes("৬০"), "Has 60 BDT inside Dhaka fee");
    assert.ok(content.includes("১২০"), "Has 120 BDT outside Dhaka fee");

    // Ultra-Simple Form
    assert.ok(content.includes("আপনার নাম"), "Has Full Name field");
    assert.ok(content.includes("মোবাইল নম্বর"), "Has Phone Number field");
    assert.ok(content.includes("সম্পূর্ণ ঠিকানা"), "Has Delivery Address field");

    // COD Trust Notice
    assert.ok(
      content.includes("পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন (ক্যাশ অন ডেলিভারি)"),
      "Has COD trust guarantee banner"
    );

    // Big CTA Button with Emerald Gradient
    assert.ok(
      content.includes("ক্যাশ অন ডেলিভারিতে অর্ডার নিশ্চিত করুন"),
      "Has COD order confirmation button"
    );
    assert.ok(
      content.includes("from-brand-700 via-brand-800 to-brand-900") ||
      content.includes("from-brand-700 to-brand-800"),
      "Has emerald gradient styling"
    );
    assert.ok(content.includes("Loader2"), "Includes loading spinner");

    // Meta Pixel Purchase tracking
    assert.ok(content.includes("fbPurchase"), "Tracks Meta Pixel Purchase event");
  });

  await t.test("5. Mobile Sticky Product Bar reflects active variant price and connects to Express Checkout Modal", () => {
    assert.ok(fs.existsSync(stickyBarPath), "sticky-mobile-product-bar.tsx must exist");
    const content = fs.readFileSync(stickyBarPath, "utf-8");

    assert.ok(content.includes('"use client"'), "Must be client component");
    assert.ok(content.includes("lg:hidden fixed bottom-0"), "Fixed at bottom on mobile");
    assert.ok(content.includes("formatBanglaBDT"), "Formats prices in Bengali");
    assert.ok(content.includes("এখনই অর্ডার করুন"), "Has 'এখনই অর্ডার করুন' button");
    assert.ok(content.includes("onOrderNow"), "Calls onOrderNow prop on tap");
  });

  await t.test("6. ProductDetailsContent seamlessly integrates ProductInfo, StickyBar, and Modal", () => {
    assert.ok(fs.existsSync(pdpContentPath), "product-details-content.tsx must exist");
    const content = fs.readFileSync(pdpContentPath, "utf-8");

    assert.ok(content.includes("ProductInfo"), "Integrates ProductInfo component");
    assert.ok(content.includes("StickyMobileProductBar"), "Integrates StickyMobileProductBar component");
    assert.ok(content.includes("ExpressCheckoutModal"), "Integrates ExpressCheckoutModal component");
    assert.ok(content.includes("isExpressModalOpen"), "Maintains modal open state");
  });

  await t.test("7. Order Success dedicated route exists for direct redirects and confirmation", () => {
    assert.ok(fs.existsSync(orderSuccessPath), "order-success/page.tsx must exist");
    const content = fs.readFileSync(orderSuccessPath, "utf-8");

    assert.ok(content.includes("orderNumber"), "Handles orderNumber param");
    assert.ok(content.includes("আলহামদুলিল্লাহ"), "Shows friendly Bangladeshi confirmation");
    assert.ok(content.includes("ক্যাশ অন ডেলিভারি"), "Shows COD reminder");
    assert.ok(content.includes("/track-order"), "Links to order tracking");
  });
});
