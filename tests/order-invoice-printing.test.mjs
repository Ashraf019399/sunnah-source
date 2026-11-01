import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Order Invoice & Packing Slip Printing Suite", async (t) => {
  await t.test("1. order-invoice-printable.tsx file exists and exports required components", async () => {
    const filePath = path.join(
      process.cwd(),
      "src",
      "components",
      "admin",
      "orders",
      "order-invoice-printable.tsx"
    );
    assert.ok(fs.existsSync(filePath), "Component file must exist");

    const content = fs.readFileSync(filePath, "utf-8");
    assert.ok(content.includes("OrderInvoicePrintable"), "Exports OrderInvoicePrintable");
    assert.ok(content.includes("OrderInvoiceModal"), "Exports OrderInvoiceModal");
    assert.ok(content.includes("OrderInvoiceModalButton"), "Exports OrderInvoiceModalButton");
  });

  await t.test("2. Invoice includes required brand header, tagline and contact details", async () => {
    const filePath = path.join(
      process.cwd(),
      "src",
      "components",
      "admin",
      "orders",
      "order-invoice-printable.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    // Brand and tagline
    assert.ok(content.includes("সুন্নাহ সোর্স"), "Brand Bengali name");
    assert.ok(content.includes("Sunnah Source"), "Brand English name");
    assert.ok(content.includes("প্রকৃতির ছোঁয়ায় খাঁটি পুষ্টি"), "Official brand tagline");

    // Contact info
    assert.ok(content.includes("sunnahsourcebd.com"), "Website domain");
    assert.ok(content.includes("01914-612007"), "Official hotline");
  });

  await t.test("3. Invoice includes Steadfast Courier logistics and COD badge specifications", async () => {
    const filePath = path.join(
      process.cwd(),
      "src",
      "components",
      "admin",
      "orders",
      "order-invoice-printable.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    // Courier partner
    assert.ok(content.includes("স্টিডফাস্ট কুরিয়ার"), "Steadfast Courier reference");
    assert.ok(content.includes("Consignment ID") || content.includes("consignmentId"), "Consignment ID support");

    // High-visibility COD badge
    assert.ok(
      content.includes("কুরিয়ারে আদায়যোগ্য মোট টাকা (Total Cash on Delivery)"),
      "High-visibility COD badge"
    );

    // Customer instructions & gratitude in footer
    assert.ok(
      content.includes("পণ্য গ্রহণের সময় ডেলিভারিম্যানের সামনে চেক করে মূল্য পরিশোধ করুন।"),
      "Footer inspection notice"
    );
    assert.ok(
      content.includes("সুন্নাহ সোর্স-এর পাশে থাকার জন্য আন্তরিক জাযাকাল্লাহু খাইরান।"),
      "Footer Islamic gratitude note"
    );
  });

  await t.test("4. Print Styles (@media print) cleanly isolate the invoice and hide all admin chrome", async () => {
    const filePath = path.join(
      process.cwd(),
      "src",
      "components",
      "admin",
      "orders",
      "order-invoice-printable.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    assert.ok(content.includes("@media print"), "Has @media print styles");
    assert.ok(content.includes("#printable-invoice-container"), "Targets dedicated invoice container");
    assert.ok(content.includes("visibility: hidden"), "Hides surrounding content");
    assert.ok(content.includes("visibility: visible"), "Preserves printable invoice");
    assert.ok(content.includes("size: A4 portrait"), "Configured for standard A4 / Half-A4 envelopes");
  });

  await t.test("5. Orders Table integrates 1-Click Print Slip button beside each order", async () => {
    const tablePath = path.join(
      process.cwd(),
      "src",
      "components",
      "admin",
      "orders",
      "orders-table.tsx"
    );
    const content = fs.readFileSync(tablePath, "utf-8");

    assert.ok(
      content.includes("OrderInvoiceModalButton"),
      "OrdersTable must import and render OrderInvoiceModalButton"
    );
    assert.ok(content.includes("variant=\"compact\""), "Renders compact variant for row action");
  });
});

