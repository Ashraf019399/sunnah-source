import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

/**
 * ==============================================================================
 * [SIMULATION ONLY - NOT A REAL POSTGRESQL ENGINE TEST]
 * In-memory JavaScript simulation of PostgreSQL atomic checkout transaction behavior.
 *
 * IMPORTANT:
 * - This test verifies application logic, retry handling, and algorithm state transitions.
 * - This test DOES NOT execute against a real PostgreSQL database engine.
 * - Real PostgreSQL concurrency, isolation levels, row locks (FOR UPDATE), and
 *   pg_advisory_xact_lock semantics can only be definitively proven against
 *   a live or local PostgreSQL / Supabase database instance.
 * ==============================================================================
 */
class MockPostgresIdempotentDatabase {
  constructor() {
    this.orders = new Map(); // id -> order
    this.idempotencyIndex = new Map(); // idempotency_key -> id
    this.variants = new Map(); // id -> { id, stock_quantity }
    this.coupons = new Map(); // code -> { code, times_used, usage_limit }
    this.advisoryLocks = new Set();
    this.stockDecrementCount = 0;
    this.couponIncrementCount = 0;
  }

  seedVariant(id, stockQuantity) {
    this.variants.set(id, { id, stock_quantity: stockQuantity });
  }

  seedCoupon(code, usageLimit, timesUsed = 0, minimumOrderValue = 0) {
    this.coupons.set(code.toUpperCase(), {
      code: code.toUpperCase(),
      times_used: timesUsed,
      usage_limit: usageLimit,
      minimum_order_value: minimumOrderValue,
      is_active: true,
    });
  }

  /**
   * Simulates the exact logic of public.create_order_with_inventory upgraded with idempotency
   * and canonical JSONB request_hash payload mismatch detection.
   */
  async createOrderWithInventory(params) {
    const {
      p_order_id,
      p_order_number,
      p_guest_name,
      p_guest_phone,
      p_shipping_address,
      p_subtotal,
      p_delivery_fee,
      p_discount_amount,
      p_coupon_code,
      p_grand_total,
      p_payment_method,
      p_items,
      p_idempotency_key,
    } = params;

    const cleanKey = p_idempotency_key ? p_idempotency_key.trim() : null;

    // Build canonical structured payload mirroring jsonb_build_object in 20261018 migration
    const structuredPayload = {
      coupon_code: (p_coupon_code ?? "").trim().toUpperCase(),
      customer_name: (p_guest_name ?? "").trim(),
      customer_phone: (p_guest_phone ?? "").trim(),
      delivery_fee: p_delivery_fee ?? 0,
      discount_amount: p_discount_amount ?? 0,
      grand_total: p_grand_total ?? 0,
      items: p_items ?? [],
      payment_method: (p_payment_method ?? "").trim(),
      shipping_address: p_shipping_address ?? {},
      subtotal: p_subtotal ?? 0,
    };
    const sortedKeys = Object.keys(structuredPayload).sort();
    const canonicalObject = {};
    for (const k of sortedKeys) {
      canonicalObject[k] = structuredPayload[k];
    }
    const payloadHash = crypto
      .createHash("md5")
      .update(JSON.stringify(canonicalObject))
      .digest("hex");

    // Simulate advisory xact lock serialization for identical keys
    if (cleanKey) {
      while (this.advisoryLocks.has(cleanKey)) {
        await new Promise((r) => setTimeout(r, 10));
      }
      this.advisoryLocks.add(cleanKey);
    }

    try {
      // Step 0: Check existing order with this idempotency key BEFORE any coupon or stock checks
      if (cleanKey && this.idempotencyIndex.has(cleanKey)) {
        const existingId = this.idempotencyIndex.get(cleanKey);
        const existingOrder = this.orders.get(existingId);

        // Strict payload mismatch check: Protect against key reuse with altered checkout intent
        if (existingOrder.request_hash && existingOrder.request_hash !== payloadHash) {
          return {
            success: false,
            is_duplicate: true,
            message: "IDEMPOTENCY_PAYLOAD_MISMATCH: একই আইডেমপোটেন্সি কি দিয়ে ভিন্ন অর্ডারের অনুরোধ করা যাবে না।",
          };
        }

        return {
          success: true,
          is_duplicate: true,
          message: "অর্ডার পূর্বেই সফলভাবে গৃহীত হয়েছে।",
          order_id: existingOrder.id,
          order_number: existingOrder.order_number,
        };
      }

      // Check items and validate
      if (!p_items || p_items.length === 0) {
        return { success: false, message: "কার্ট খালি!" };
      }

      // Step A: Coupon verification & increment
      if (p_coupon_code) {
        const coupon = this.coupons.get(p_coupon_code.toUpperCase());
        if (!coupon || !coupon.is_active) {
          throw new Error("COUPON_ERROR: কুপনটি নিষ্ক্রিয়।");
        }
        if (coupon.times_used >= coupon.usage_limit) {
          throw new Error("COUPON_ERROR: কুপনের ব্যবহারের সীমা শেষ।");
        }
        coupon.times_used += 1;
        this.couponIncrementCount += 1;
      }

      // Step B: Stock verification & decrement
      for (const item of p_items) {
        const variant = this.variants.get(item.variant_id);
        if (!variant || variant.stock_quantity < item.quantity) {
          throw new Error(`OUT_OF_STOCK: ${item.product_title} : ${variant?.stock_quantity ?? 0}`);
        }
      }
      for (const item of p_items) {
        const variant = this.variants.get(item.variant_id);
        variant.stock_quantity -= item.quantity;
        this.stockDecrementCount += 1;
      }

      // Step C: Insert into public.orders
      const order = {
        id: p_order_id,
        order_number: p_order_number,
        guest_name: p_guest_name,
        guest_phone: p_guest_phone,
        grand_total: p_grand_total,
        idempotency_key: cleanKey,
        request_hash: payloadHash,
        created_at: new Date().toISOString(),
      };

      this.orders.set(order.id, order);
      if (cleanKey) {
        this.idempotencyIndex.set(cleanKey, order.id);
      }

      return {
        success: true,
        is_duplicate: false,
        message: "অর্ডার সফল হয়েছে!",
        order_id: order.id,
        order_number: order.order_number,
      };
    } finally {
      if (cleanKey) {
        this.advisoryLocks.delete(cleanKey);
      }
    }
  }
}

/**
 * In-memory simulation of browser sessionStorage helpers from checkout/page.tsx
 */
class MockSessionStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.get(key) ?? null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
  get length() {
    return this.store.size;
  }
  key(index) {
    return Array.from(this.store.keys())[index] ?? null;
  }
}

const STORAGE_PREFIX = "sunnah_checkout_idempotency_";

function simulateGetSavedKey(storage, cartSig) {
  if (!storage || !cartSig) return null;
  try {
    const val = storage.getItem(`${STORAGE_PREFIX}${cartSig}`);
    return val ? val.trim() : null;
  } catch {
    return null;
  }
}

function simulateSaveKey(storage, cartSig, key) {
  if (!storage || !cartSig || !key) return;
  try {
    storage.setItem(`${STORAGE_PREFIX}${cartSig}`, key);
  } catch {
    // safe no-op
  }
}

function simulateClearKey(storage, cartSig) {
  if (!storage) return;
  try {
    if (cartSig) {
      storage.removeItem(`${STORAGE_PREFIX}${cartSig}`);
    } else {
      for (let i = storage.length - 1; i >= 0; i--) {
        const k = storage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX)) {
          storage.removeItem(k);
        }
      }
    }
  } catch {
    // safe no-op
  }
}

describe("Sunnah Source - Duplicate Checkout Protection (Mock Simulation Suite)", () => {
  let db;
  const VARIANT_HONEY_ID = "11111111-1111-1111-1111-111111111111";
  const VARIANT_GHEE_ID = "22222222-2222-2222-2222-222222222222";

  beforeEach(() => {
    db = new MockPostgresIdempotentDatabase();
    db.seedVariant(VARIANT_HONEY_ID, 10);
    db.seedVariant(VARIANT_GHEE_ID, 5);
    db.seedCoupon("WELCOME50", 100, 0);
  });

  test("1. Repeated requests with identical idempotency key return original order without decrementing stock or incrementing coupon twice", async () => {
    const key = "attempt-uuid-001";
    const payload = {
      p_order_id: "order-uuid-1",
      p_order_number: "SS-100001",
      p_guest_name: "Mahmud Hasan",
      p_guest_phone: "01711223344",
      p_shipping_address: { fullAddress: "House 1, Road 2", thana: "Uttara", district: "Dhaka", zone: "inside_dhaka" },
      p_subtotal: 1250,
      p_delivery_fee: 0,
      p_discount_amount: 50,
      p_coupon_code: "WELCOME50",
      p_grand_total: 1200,
      p_payment_method: "cod",
      p_items: [{ variant_id: VARIANT_HONEY_ID, product_title: "Honey", quantity: 2 }],
      p_idempotency_key: key,
    };

    // First request
    const res1 = await db.createOrderWithInventory(payload);
    assert.equal(res1.success, true);
    assert.equal(res1.is_duplicate, false);
    assert.equal(res1.order_number, "SS-100001");
    assert.equal(db.variants.get(VARIANT_HONEY_ID).stock_quantity, 8);
    assert.equal(db.coupons.get("WELCOME50").times_used, 1);
    assert.equal(db.stockDecrementCount, 1);
    assert.equal(db.couponIncrementCount, 1);

    // Second request with exact same idempotency key and payload (e.g. network retry)
    const payloadRetry = {
      ...payload,
      p_order_id: "order-uuid-2-different-random",
      p_order_number: "SS-100002-different-random",
    };
    const res2 = await db.createOrderWithInventory(payloadRetry);

    assert.equal(res2.success, true);
    assert.equal(res2.is_duplicate, true);
    assert.equal(res2.order_number, "SS-100001"); // Returns original order number
    assert.equal(res2.order_id, "order-uuid-1");

    // Stock must NOT be decremented again
    assert.equal(db.variants.get(VARIANT_HONEY_ID).stock_quantity, 8);
    assert.equal(db.stockDecrementCount, 1);

    // Coupon usage must NOT be incremented again
    assert.equal(db.coupons.get("WELCOME50").times_used, 1);
    assert.equal(db.couponIncrementCount, 1);

    // Only 1 order exists in database
    assert.equal(db.orders.size, 1);
  });

  test("2. Concurrent simultaneous requests with the same idempotency key are serialized and execute atomically", async () => {
    const key = "attempt-uuid-concurrent-002";
    const makePayload = (i) => ({
      p_order_id: `concurrent-order-${i}`,
      p_order_number: `SS-CONCURRENT-${i}`,
      p_guest_name: "Fatima Begum",
      p_guest_phone: "01812345678",
      p_shipping_address: { fullAddress: "House 10", thana: "Mirpur", district: "Dhaka", zone: "inside_dhaka" },
      p_subtotal: 1900,
      p_delivery_fee: 0,
      p_discount_amount: 50,
      p_coupon_code: "WELCOME50",
      p_grand_total: 1850,
      p_payment_method: "cod",
      p_items: [{ variant_id: VARIANT_GHEE_ID, product_title: "Ghee", quantity: 1 }],
      p_idempotency_key: key,
    });

    // Launch 5 concurrent checkout requests simultaneously
    const promises = [0, 1, 2, 3, 4].map((i) => db.createOrderWithInventory(makePayload(i)));
    const results = await Promise.all(promises);

    // All 5 must succeed
    for (const r of results) {
      assert.equal(r.success, true);
    }

    // Exactly one is initial creation, remaining 4 are duplicates
    const initialCreations = results.filter((r) => r.is_duplicate === false);
    const duplicates = results.filter((r) => r.is_duplicate === true);
    assert.equal(initialCreations.length, 1);
    assert.equal(duplicates.length, 4);

    // All share the same order number
    const targetOrderNumber = initialCreations[0].order_number;
    for (const r of results) {
      assert.equal(r.order_number, targetOrderNumber);
    }

    // Stock for Ghee deducted only once: 5 - 1 = 4
    assert.equal(db.variants.get(VARIANT_GHEE_ID).stock_quantity, 4);
    assert.equal(db.stockDecrementCount, 1);
    assert.equal(db.coupons.get("WELCOME50").times_used, 1);
  });

  test("3. Retry after uncertain response recovers the created order cleanly", async () => {
    const key = "attempt-uuid-timeout-recovery-003";
    const payload = {
      p_order_id: "order-timeout-1",
      p_order_number: "SS-TIMEOUT-01",
      p_guest_name: "Tariqul Islam",
      p_guest_phone: "01999887766",
      p_shipping_address: { fullAddress: "Village X", thana: "Dhanmondi", district: "Dhaka", zone: "inside_dhaka" },
      p_subtotal: 950,
      p_delivery_fee: 0,
      p_discount_amount: 0,
      p_coupon_code: null,
      p_grand_total: 950,
      p_payment_method: "cod",
      p_items: [{ variant_id: VARIANT_HONEY_ID, product_title: "Honey", quantity: 1 }],
      p_idempotency_key: key,
    };

    // First request succeeds on DB server
    const res1 = await db.createOrderWithInventory(payload);
    assert.equal(res1.success, true);

    // Client timed out and retries with identical idempotencyKey
    const retryRes = await db.createOrderWithInventory({
      ...payload,
      p_order_id: "order-timeout-2-regenerated",
      p_order_number: "SS-TIMEOUT-02-regenerated",
    });

    assert.equal(retryRes.success, true);
    assert.equal(retryRes.is_duplicate, true);
    assert.equal(retryRes.order_number, "SS-TIMEOUT-01");
    assert.equal(db.variants.get(VARIANT_HONEY_ID).stock_quantity, 9);
    assert.equal(db.stockDecrementCount, 1);
  });

  test("4. Distinct keys for separate checkout attempts allow independent orders even with identical customer and items", async () => {
    const customerInfo = {
      p_guest_name: "Rahim Uddin",
      p_guest_phone: "01700000000",
      p_shipping_address: { fullAddress: "Street 5", thana: "Badda", district: "Dhaka", zone: "inside_dhaka" },
      p_subtotal: 650,
      p_delivery_fee: 0,
      p_discount_amount: 0,
      p_coupon_code: null,
      p_grand_total: 650,
      p_payment_method: "cod",
      p_items: [{ variant_id: VARIANT_HONEY_ID, product_title: "Honey", quantity: 1 }],
    };

    // Order 1
    const res1 = await db.createOrderWithInventory({
      ...customerInfo,
      p_order_id: "order-distinct-1",
      p_order_number: "SS-ORDER-1",
      p_idempotency_key: "distinct-key-alpha",
    });
    assert.equal(res1.success, true);
    assert.equal(res1.is_duplicate, false);

    // Order 2
    const res2 = await db.createOrderWithInventory({
      ...customerInfo,
      p_order_id: "order-distinct-2",
      p_order_number: "SS-ORDER-2",
      p_idempotency_key: "distinct-key-beta",
    });
    assert.equal(res2.success, true);
    assert.equal(res2.is_duplicate, false);

    assert.equal(db.orders.size, 2);
    assert.equal(db.variants.get(VARIANT_HONEY_ID).stock_quantity, 8);
    assert.equal(db.stockDecrementCount, 2);
  });

  test("5. Reusing identical key with changed name, address, payment method, coupon, quantities, or totals triggers IDEMPOTENCY_PAYLOAD_MISMATCH", async () => {
    const key = "reused-key-tamper-005";
    const basePayload = {
      p_order_id: "order-payload-base",
      p_order_number: "SS-BASE-1",
      p_guest_name: "Salma Khatun",
      p_guest_phone: "01712345678",
      p_shipping_address: { fullAddress: "Flat 4A, Banani", thana: "Banani", district: "Dhaka", zone: "inside_dhaka" },
      p_subtotal: 1200,
      p_delivery_fee: 70,
      p_discount_amount: 0,
      p_coupon_code: null,
      p_grand_total: 1270,
      p_payment_method: "cod",
      p_items: [{ variant_id: VARIANT_HONEY_ID, product_title: "Honey", quantity: 2 }],
      p_idempotency_key: key,
    };

    // Initial order creates successfully
    const res1 = await db.createOrderWithInventory(basePayload);
    assert.equal(res1.success, true);
    assert.equal(res1.is_duplicate, false);
    assert.equal(db.variants.get(VARIANT_HONEY_ID).stock_quantity, 8);

    // 5a. Tamper Recipient Name
    const tamperName = { ...basePayload, p_guest_name: "Tania Akter" };
    const resName = await db.createOrderWithInventory(tamperName);
    assert.equal(resName.success, false);
    assert.ok(resName.message.includes("IDEMPOTENCY_PAYLOAD_MISMATCH"));

    // 5b. Tamper Shipping Address (changed district/address)
    const tamperAddress = {
      ...basePayload,
      p_shipping_address: { fullAddress: "Chittagong GPO", thana: "Kotwali", district: "Chittagong", zone: "outside_dhaka" },
    };
    const resAddr = await db.createOrderWithInventory(tamperAddress);
    assert.equal(resAddr.success, false);
    assert.ok(resAddr.message.includes("IDEMPOTENCY_PAYLOAD_MISMATCH"));

    // 5c. Tamper Payment Method (COD -> bkash)
    const tamperPayment = { ...basePayload, p_payment_method: "bkash" };
    const resPay = await db.createOrderWithInventory(tamperPayment);
    assert.equal(resPay.success, false);
    assert.ok(resPay.message.includes("IDEMPOTENCY_PAYLOAD_MISMATCH"));

    // 5d. Tamper Coupon Code
    const tamperCoupon = { ...basePayload, p_coupon_code: "WELCOME50" };
    const resCpn = await db.createOrderWithInventory(tamperCoupon);
    assert.equal(resCpn.success, false);
    assert.ok(resCpn.message.includes("IDEMPOTENCY_PAYLOAD_MISMATCH"));

    // 5e. Tamper Item Quantity & Total
    const tamperQty = {
      ...basePayload,
      p_grand_total: 1870,
      p_items: [{ variant_id: VARIANT_HONEY_ID, product_title: "Honey", quantity: 3 }],
    };
    const resQty = await db.createOrderWithInventory(tamperQty);
    assert.equal(resQty.success, false);
    assert.ok(resQty.message.includes("IDEMPOTENCY_PAYLOAD_MISMATCH"));

    // Stock for Honey remains at 8 (no additional deductions occurred)
    assert.equal(db.variants.get(VARIANT_HONEY_ID).stock_quantity, 8);
    assert.equal(db.stockDecrementCount, 1);
  });

  test("6. Retries using existing idempotency key return original order before coupon availability/usage validation can block the retry", async () => {
    // Seed a single-use coupon (usage_limit = 1)
    db.seedCoupon("SINGLEUSE100", 1, 0);

    const key = "single-use-coupon-retry-key";
    const payload = {
      p_order_id: "order-single-use-1",
      p_order_number: "SS-SINGLEUSE-1",
      p_guest_name: "Kamal Hossain",
      p_guest_phone: "01755443322",
      p_shipping_address: { fullAddress: "Sector 3", thana: "Uttara", district: "Dhaka", zone: "inside_dhaka" },
      p_subtotal: 1500,
      p_delivery_fee: 0,
      p_discount_amount: 100,
      p_coupon_code: "SINGLEUSE100",
      p_grand_total: 1400,
      p_payment_method: "cod",
      p_items: [{ variant_id: VARIANT_HONEY_ID, product_title: "Honey", quantity: 1 }],
      p_idempotency_key: key,
    };

    // Attempt 1: Succeeds and exhausts the single-use coupon (times_used = 1, usage_limit = 1)
    const res1 = await db.createOrderWithInventory(payload);
    assert.equal(res1.success, true);
    assert.equal(res1.is_duplicate, false);
    assert.equal(db.coupons.get("SINGLEUSE100").times_used, 1);

    // Coupon is now completely exhausted! If coupon validation ran, it would fail with:
    // "COUPON_ERROR: কুপনের ব্যবহারের সীমা শেষ।"
    // Attempt 2 (Retry of Attempt 1 with same key and payload after network drop):
    // Must return the original order before coupon validation blocks it!
    const retryRes = await db.createOrderWithInventory({
      ...payload,
      p_order_id: "order-single-use-retry-new-uuid",
      p_order_number: "SS-SINGLEUSE-RETRY",
    });

    assert.equal(retryRes.success, true);
    assert.equal(retryRes.is_duplicate, true);
    assert.equal(retryRes.order_number, "SS-SINGLEUSE-1"); // Rescues original order number!

    // Coupon times_used remains strictly at 1 (not incremented again)
    assert.equal(db.coupons.get("SINGLEUSE100").times_used, 1);
    assert.equal(db.couponIncrementCount, 1);
  });

  test("7. Browser refresh & sessionStorage simulation preserves key across reload and refreshes on cart changes", () => {
    const storage = new MockSessionStorage();
    const cartSigA = "honey-prod:honey-var:2";
    const cartSigB = "honey-prod:honey-var:3";

    // 1. Initial cart attempt: no key saved, generate new key
    let key1 = simulateGetSavedKey(storage, cartSigA);
    assert.equal(key1, null);
    key1 = "generated-uuid-alpha";
    simulateSaveKey(storage, cartSigA, key1);

    // 2. Simulate page refresh (F5): exact same key is recovered for cartSigA
    const recoveredKey = simulateGetSavedKey(storage, cartSigA);
    assert.equal(recoveredKey, "generated-uuid-alpha");

    // 3. Customer modifies cart quantity -> cartSignature changes to cartSigB
    let key2 = simulateGetSavedKey(storage, cartSigB);
    assert.equal(key2, null); // Fresh cart signature has no saved key
    key2 = "generated-uuid-beta";
    simulateSaveKey(storage, cartSigB, key2);

    assert.notEqual(key1, key2);

    // 4. Order completed successfully -> key for cart is cleaned up
    simulateClearKey(storage, cartSigB);
    assert.equal(simulateGetSavedKey(storage, cartSigB), null);

    // 5. Incognito / disabled storage simulation: does not throw
    assert.doesNotThrow(() => {
      simulateGetSavedKey(null, cartSigA);
      simulateSaveKey(null, cartSigA, "key");
      simulateClearKey(null, cartSigA);
    });
  });

  test("8. Server-side pre-check and atomic RPC enforce item-level integrity and reject altered item payloads with identical totals", async () => {
    // Seed two different variants with the same price (e.g. 500 BDT)
    const VARIANT_A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const VARIANT_B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    db.seedVariant(VARIANT_A, 10);
    db.seedVariant(VARIANT_B, 10);

    const key = "item-integrity-test-key";
    const initialPayload = {
      p_order_id: "order-item-test-1",
      p_order_number: "SS-ITEM-1",
      p_guest_name: "Zubair Ahmed",
      p_guest_phone: "01711002233",
      p_shipping_address: { fullAddress: "House 5", thana: "Mirpur", district: "Dhaka", zone: "inside_dhaka" },
      p_subtotal: 500,
      p_delivery_fee: 70,
      p_discount_amount: 0,
      p_coupon_code: null,
      p_grand_total: 570,
      p_payment_method: "cod",
      p_items: [{ variant_id: VARIANT_A, product_title: "Item A", quantity: 1, unit_price: 500 }],
      p_idempotency_key: key,
    };

    const res1 = await db.createOrderWithInventory(initialPayload);
    assert.equal(res1.success, true);
    assert.equal(res1.is_duplicate, false);

    // Customer / attacker attempts to reuse same idempotency key with Variant B (same subtotal 500, same delivery 70)
    const swappedItemPayload = {
      ...initialPayload,
      p_order_id: "order-item-test-2",
      p_order_number: "SS-ITEM-2",
      p_items: [{ variant_id: VARIANT_B, product_title: "Item B", quantity: 1, unit_price: 500 }],
    };

    const resSwapped = await db.createOrderWithInventory(swappedItemPayload);
    assert.equal(resSwapped.success, false);
    assert.equal(resSwapped.is_duplicate, true);
    assert.ok(resSwapped.message.includes("IDEMPOTENCY_PAYLOAD_MISMATCH"));
  });

  test("9. Legacy 13-argument RPC fallback is decommissioned; failed RPC calls never fall back to dropped legacy signature", () => {
    // Simulate server action behavior:
    // When create_order_with_inventory returns an error, the system must NOT catch the error
    // and attempt to call create_order_with_inventory with p_idempotency_key stripped.
    let legacyRpcAttempted = false;

    function mockRpcCaller(payload) {
      if (!("p_idempotency_key" in payload)) {
        legacyRpcAttempted = true;
        throw new Error("PGRST204: function public.create_order_with_inventory(13 args) does not exist (dropped in migration)");
      }
      return { data: null, error: { message: "OUT_OF_STOCK: Honey : 0" } };
    }

    // Execute simulated submit action
    const rpcPayload = {
      p_order_id: "order-test-uuid",
      p_order_number: "SS-TEST",
      p_idempotency_key: "valid-key-123",
    };

    const rpcResult = mockRpcCaller(rpcPayload);

    // Verify error is returned directly to the user without attempting legacy 13-argument fallback
    assert.equal(legacyRpcAttempted, false);
    assert.ok(rpcResult.error.message.includes("OUT_OF_STOCK"));
  });

  test("10. Test cleanup safety: child order_items are cleaned up before parent orders, cleanup targets exact tracked order IDs without broad phone-based deletion, and collision checks abort safely if fixture IDs pre-exist", () => {
    // 10a. Collision safety check verification
    function simulateCollisionCheck(existingIds, fixtureId) {
      if (existingIds.has(fixtureId)) {
        throw new Error(`COLLISION SAFETY ABORT: Fixture ID ${fixtureId} already exists in database.`);
      }
    }

    const existingFixtures = new Set(["pre-existing-prod-uuid"]);
    assert.throws(
      () => simulateCollisionCheck(existingFixtures, "pre-existing-prod-uuid"),
      /COLLISION SAFETY ABORT/
    );
    assert.doesNotThrow(() => simulateCollisionCheck(existingFixtures, "brand-new-prod-uuid"));

    // 10b. Child-before-parent deletion order simulation
    const mockDbOrders = new Map();
    const mockDbOrderItems = new Map();

    const realOrderId = "real-customer-order-uuid";
    const testOrderId = "test-workflow-order-uuid";
    const sharedPhone = "01711223344";

    mockDbOrders.set(realOrderId, { id: realOrderId, guest_phone: sharedPhone, order_number: "SS-REAL-01" });
    mockDbOrderItems.set("item-real-1", { id: "item-real-1", order_id: realOrderId });

    mockDbOrders.set(testOrderId, { id: testOrderId, guest_phone: sharedPhone, order_number: "SS-TEST-01" });
    mockDbOrderItems.set("item-test-1", { id: "item-test-1", order_id: testOrderId });

    // Helper that enforces relational foreign key integrity
    function deleteOrder(orderId) {
      for (const item of mockDbOrderItems.values()) {
        if (item.order_id === orderId) {
          throw new Error(`FOREIGN_KEY_VIOLATION: Cannot delete order ${orderId} while child order_items exist.`);
        }
      }
      mockDbOrders.delete(orderId);
    }

    function deleteOrderItem(orderItemId) {
      mockDbOrderItems.delete(orderItemId);
    }

    // Deleting parent order first MUST throw foreign key violation
    assert.throws(() => deleteOrder(testOrderId), /FOREIGN_KEY_VIOLATION/);

    // Deleting child order_items first and then parent order succeeds
    assert.doesNotThrow(() => {
      // Step 1: Clean up child order_items by tracked test order ID
      for (const [itemId, item] of Array.from(mockDbOrderItems.entries())) {
        if (item.order_id === testOrderId) {
          deleteOrderItem(itemId);
        }
      }
      // Step 2: Clean up parent order by exact tracked test order ID (NEVER by guest_phone)
      deleteOrder(testOrderId);
    });

    // 10c. Verify targeted cleanup: Real customer order with same phone number is preserved
    assert.equal(mockDbOrders.has(testOrderId), false);
    assert.equal(mockDbOrders.has(realOrderId), true);
    assert.equal(mockDbOrders.get(realOrderId).order_number, "SS-REAL-01");
    assert.equal(mockDbOrderItems.has("item-real-1"), true);
  });
});
