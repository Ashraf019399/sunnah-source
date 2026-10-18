import { createClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";

/**
 * ==============================================================================
 * Real PostgreSQL / Supabase Integration Test Suite for Checkout Idempotency
 *
 * STRICT PRODUCTION SAFEGUARD:
 * - This script will REFUSE to execute if pointed at Production Supabase (fgfucwholpkizwlvlfrp).
 * - Requires explicit TEST_SUPABASE_URL and TEST_SUPABASE_SERVICE_ROLE_KEY environment variables.
 * ==============================================================================
 */

const testUrl = process.env.TEST_SUPABASE_URL;
const testServiceKey = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY;

// 1. Production Safeguard
if (!testUrl || !testServiceKey) {
  console.error("======================================================================");
  console.error("TEST ENVIRONMENT NOT CONFIGURED:");
  console.error("Please provide TEST_SUPABASE_URL and TEST_SUPABASE_SERVICE_ROLE_KEY.");
  console.error("Never set these to production credentials.");
  console.error("======================================================================");
  process.exit(1);
}

const FORBIDDEN_PROJECT_REFS = ["fgfucwholpkizwlvlfrp", "sunnahsourcebd.com"];
for (const forbidden of FORBIDDEN_PROJECT_REFS) {
  if (testUrl.toLowerCase().includes(forbidden) || testServiceKey.toLowerCase().includes(forbidden)) {
    console.error("======================================================================");
    console.error("FATAL SAFETY ABORT: Attempted to run test against PRODUCTION database credentials!");
    console.error("Target configuration matches forbidden production reference pattern.");
    console.error("Integration tests must ONLY run against a local or staging database.");
    console.error("======================================================================");
    process.exit(1);
  }
}

const client = createClient(testUrl, testServiceKey);

async function runLiveIdempotencyIntegrationTests() {
  console.log("----------------------------------------------------------------------");
  console.log("Connected to Test Database (Sanitized):", testUrl.replace(/\/\/[^@]+@/, "//***@"));
  console.log("Starting Live PostgreSQL Idempotency Concurrency & Integration Tests...");
  console.log("----------------------------------------------------------------------");

  const testProdId = "99999999-9999-9999-9999-999999999999";
  const testVarId = "88888888-8888-8888-8888-888888888888";
  const testCouponCode = "LIVEIDEM100";

  // Collision check: abort safely if test fixture IDs or codes already exist
  const { data: existingProd } = await client
    .from("products")
    .select("id")
    .eq("id", testProdId)
    .maybeSingle();
  if (existingProd) {
    throw new Error(`COLLISION SAFETY ABORT: Product fixture ID ${testProdId} already exists in database.`);
  }

  const { data: existingVar } = await client
    .from("product_variants")
    .select("id")
    .eq("id", testVarId)
    .maybeSingle();
  if (existingVar) {
    throw new Error(`COLLISION SAFETY ABORT: Variant fixture ID ${testVarId} already exists in database.`);
  }

  const { data: existingVarSku } = await client
    .from("product_variants")
    .select("id")
    .eq("sku", "LIVE-TEST-VAR-01")
    .maybeSingle();
  if (existingVarSku) {
    throw new Error("COLLISION SAFETY ABORT: Variant fixture SKU LIVE-TEST-VAR-01 already exists in database.");
  }

  const { data: existingCoupon } = await client
    .from("coupons")
    .select("id")
    .eq("code", testCouponCode)
    .maybeSingle();
  if (existingCoupon) {
    throw new Error(`COLLISION SAFETY ABORT: Coupon fixture code ${testCouponCode} already exists in database.`);
  }

  const { data: existingProdSlug } = await client
    .from("products")
    .select("id")
    .eq("slug", "live-test-product-idem")
    .maybeSingle();
  if (existingProdSlug) {
    throw new Error("COLLISION SAFETY ABORT: Product fixture slug live-test-product-idem already exists in database.");
  }

  // Look up or resolve category fixture ID safely (handles seeded fixture or pre-existing category)
  const { data: catRecord } = await client
    .from("categories")
    .select("id, slug")
    .eq("slug", "honey")
    .maybeSingle();

  const testCatId = catRecord?.id;
  const testCatSlug = catRecord?.slug ?? "honey";
  if (!testCatId) {
    throw new Error("COLLISION / PREREQUISITE ABORT: Category 'honey' was not found in public.categories. Ensure base schema seed ran.");
  }

  // Setup fixtures
  await client.from("products").insert({
    id: testProdId,
    category_id: testCatId,
    category_slug: testCatSlug,
    title_en: "Live Test Product",
    title_bn: "লাইভ টেস্ট পণ্য",
    slug: "live-test-product-idem",
    is_active: true,
  });

  await client.from("product_variants").insert({
    id: testVarId,
    product_id: testProdId,
    sku: "LIVE-TEST-VAR-01",
    display_name: "Standard",
    regular_price: 500,
    sale_price: 500,
    stock_quantity: 20,
  });

  await client.from("coupons").insert({
    code: testCouponCode,
    discount_type: "fixed_amount",
    discount_value: 100,
    minimum_order_value: 500,
    usage_limit: 1, // Single use coupon!
    times_used: 0,
    is_active: true,
  });

  const trackedOrderIds = new Set();

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Simultaneous Concurrent Requests (Advisory Lock Concurrency Test)
    // -------------------------------------------------------------------------
    console.log("Running Test 1: 5 simultaneous concurrent checkout requests with identical key...");
    const concurrentKey = `concurrent-test-key-${Date.now()}`;
    const makePayload = (index) => {
      const orderId = crypto.randomUUID();
      trackedOrderIds.add(orderId);
      return {
        p_order_id: orderId,
        p_order_number: `SS-CONCURRENT-${index}-${Date.now().toString().slice(-4)}`,
        p_guest_name: "Concurrent Test Customer",
        p_guest_phone: "01711223344",
        p_shipping_address: { fullAddress: "House 10", thana: "Mirpur", district: "Dhaka", zone: "inside_dhaka" },
        p_subtotal: 1000,
        p_delivery_fee: 70,
        p_discount_amount: 100,
        p_coupon_code: testCouponCode,
        p_grand_total: 970,
        p_payment_method: "cod",
        p_payment_status: "unpaid",
        p_items: [
          {
            product_id: testProdId,
            variant_id: testVarId,
            product_title: "লাইভ টেস্ট পণ্য",
            variant_name: "Standard",
            unit_price: 500,
            quantity: 2,
            line_total: 1000,
          },
        ],
        p_idempotency_key: concurrentKey,
      };
    };

    // Fire 5 simultaneous requests concurrently
    const promises = [1, 2, 3, 4, 5].map((i) =>
      client.rpc("create_order_with_inventory", makePayload(i))
    );
    const results = await Promise.all(promises);

    for (const r of results) {
      assert.equal(r.error, null, `RPC returned error: ${r.error?.message}`);
      assert.equal(r.data.success, true);
    }

    const initialOrders = results.filter((r) => r.data.is_duplicate === false);
    const duplicateOrders = results.filter((r) => r.data.is_duplicate === true);

    assert.equal(initialOrders.length, 1, `Expected exactly 1 initial creation, got ${initialOrders.length}`);
    assert.equal(duplicateOrders.length, 4, `Expected exactly 4 duplicates, got ${duplicateOrders.length}`);

    const masterOrderNumber = initialOrders[0].data.order_number;
    for (const d of duplicateOrders) {
      assert.equal(d.data.order_number, masterOrderNumber, "Duplicate requests must return the original order number");
    }

    // Check stock was decremented ONCE: 20 - 2 = 18
    const { data: variantRecord } = await client
      .from("product_variants")
      .select("stock_quantity")
      .eq("id", testVarId)
      .single();
    assert.equal(variantRecord.stock_quantity, 18, `Stock must be 18, found: ${variantRecord.stock_quantity}`);

    // Check single-use coupon was incremented ONCE: 0 + 1 = 1 (now exhausted)
    const { data: couponRecord } = await client
      .from("coupons")
      .select("times_used, usage_limit")
      .eq("code", testCouponCode)
      .single();
    assert.equal(couponRecord.times_used, 1, `Coupon times_used must be 1, found: ${couponRecord.times_used}`);

    console.log("✓ Test 1 Passed: PostgreSQL advisory lock cleanly serialized concurrent requests!");

    // -------------------------------------------------------------------------
    // TEST 2: Exhausted Coupon Retry
    // -------------------------------------------------------------------------
    console.log("Running Test 2: Retry with exhausted single-use coupon recovers original order...");
    const retryRes = await client.rpc("create_order_with_inventory", {
      ...makePayload(99),
      p_idempotency_key: concurrentKey,
    });
    assert.equal(retryRes.error, null);
    assert.equal(retryRes.data.success, true);
    assert.equal(retryRes.data.is_duplicate, true);
    assert.equal(retryRes.data.order_number, masterOrderNumber);
    console.log("✓ Test 2 Passed: Exhausted coupon did not block original order recovery!");

    // -------------------------------------------------------------------------
    // TEST 3: Payload Mismatch Detection
    // -------------------------------------------------------------------------
    console.log("Running Test 3: Altered payload with same idempotency key is rejected...");
    const tamperedRes = await client.rpc("create_order_with_inventory", {
      ...makePayload(100),
      p_guest_name: "Tampered Attacker Name", // Changed name
      p_idempotency_key: concurrentKey,
    });
    assert.equal(tamperedRes.data.success, false);
    assert.ok(
      tamperedRes.data.message.includes("IDEMPOTENCY_PAYLOAD_MISMATCH"),
      `Expected IDEMPOTENCY_PAYLOAD_MISMATCH, got: ${tamperedRes.data.message}`
    );
    console.log("✓ Test 3 Passed: Tampered payload rejected as IDEMPOTENCY_PAYLOAD_MISMATCH!");

    console.log("----------------------------------------------------------------------");
    console.log("ALL REAL POSTGRESQL IDEMPOTENCY INTEGRATION TESTS PASSED!");
    console.log("----------------------------------------------------------------------");
  } finally {
    // Safe targeted cleanup:
    // 1. Delete child order_items FIRST for all tracked order IDs
    // 2. Delete parent orders by exact tracked order IDs (NEVER broadly by phone)
    // 3. Delete fixtures by exact IDs
    const orderIdList = Array.from(trackedOrderIds);
    if (orderIdList.length > 0) {
      await client.from("order_items").delete().in("order_id", orderIdList);
      await client.from("orders").delete().in("id", orderIdList);
    }
    await client.from("coupons").delete().eq("code", testCouponCode);
    await client.from("product_variants").delete().eq("id", testVarId);
    await client.from("products").delete().eq("id", testProdId);
  }
}

runLiveIdempotencyIntegrationTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
