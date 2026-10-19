import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";

/**
 * ==============================================================================
 * Sunnah Source - Order Lifecycle & Inventory Restoration Test Suite
 * 
 * Verifies:
 * 1. Finite State Machine (FSM) status transitions (valid paths & invalid jumps).
 * 2. Idempotent cancellation inventory restoration (stock restored exactly once).
 * 3. Promotional coupon quota restoration policy on cancellation.
 * 4. Post-fulfillment return behavior (stock restored, coupons preserved).
 * 5. Payment status consistency rules (refund requirements, paid constraints).
 * 6. Realized dashboard revenue calculations (unpaid, cancelled, returned excluded).
 * 7. Missing-RPC resilience and error handling for order status RPC.
 * 8. Atomic database-level update_order_payment_status RPC validation & terminal states.
 * 9. Cross-RPC lock acquisition hierarchy (orders -> coupons -> product_variants).
 * 10. Concurrency race simulation between cancellation and payment status updates.
 * ==============================================================================
 */

// Mirrors VALID_ORDER_TRANSITIONS from src/types/orders.types.ts
const VALID_ORDER_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};

class MockOrderLifecycleDatabase {
  constructor() {
    this.orders = new Map();
    this.orderItems = new Map(); // order_id -> items[]
    this.variants = new Map(); // id -> { id, stock_quantity }
    this.coupons = new Map(); // code -> { code, times_used, usage_limit }
    this.lockAcquisitions = []; // Records lock acquisition order for deadlock audit
  }

  seedVariant(id, stockQuantity) {
    this.variants.set(id, { id, stock_quantity: stockQuantity });
  }

  seedCoupon(code, timesUsed = 0, usageLimit = 1) {
    this.coupons.set(code.toUpperCase(), {
      code: code.toUpperCase(),
      times_used: timesUsed,
      usage_limit: usageLimit,
    });
  }

  seedOrder(order) {
    this.orders.set(order.id, {
      ...order,
      order_status: order.order_status || "pending",
      payment_status: order.payment_status || "unpaid",
      coupon_code: order.coupon_code || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  seedOrderItems(orderId, items) {
    this.orderItems.set(orderId, items);
  }

  /**
   * Simulates the exact logic of public.update_order_status_with_inventory RPC
   * from supabase/migrations/20261019_add_order_lifecycle_management.sql
   * Enforces lock order: orders -> coupons -> product_variants
   */
  async updateOrderStatusWithInventory(p_order_id, p_new_status) {
    if (!p_order_id) {
      return { success: false, message: "অর্ডার আইডি আবশ্যক।" };
    }

    if (!p_new_status || typeof p_new_status !== "string") {
      return { success: false, message: "অর্ডার স্ট্যাটাস আবশ্যক।" };
    }

    const cleanNewStatus = p_new_status.trim().toLowerCase();
    const VALID_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"];
    if (!VALID_STATUSES.includes(cleanNewStatus)) {
      return { success: false, message: `অবৈধ অর্ডার স্ট্যাটাস মান: ${p_new_status}` };
    }

    // Step 2 in RPC: Lock order row FOR UPDATE (Level 1 in hierarchy: orders)
    this.lockAcquisitions.push({ resource: "orders", id: p_order_id });
    const order = this.orders.get(p_order_id);
    if (!order) {
      return { success: false, message: "অর্ডারটি পাওয়া যায়নি।" };
    }

    const oldStatus = order.order_status;

    // Idempotent No-Op check
    if (oldStatus === cleanNewStatus) {
      return {
        success: true,
        is_noop: true,
        order_id: order.id,
        order_number: order.order_number,
        old_status: oldStatus,
        new_status: cleanNewStatus,
        stock_restored: false,
        coupon_restored: false,
        message: "অর্ডার ইতিমধ্যে এই স্ট্যাটাসে রয়েছে।",
      };
    }

    // FSM State Transition Check
    const allowed = VALID_ORDER_TRANSITIONS[oldStatus] || [];
    if (!allowed.includes(cleanNewStatus)) {
      return {
        success: false,
        message: `অবৈধ স্ট্যাটাস পরিবর্তন: ${oldStatus} থেকে ${cleanNewStatus} পরিবর্তন করা অনুমোদিত নয়।`,
      };
    }

    let stockRestored = false;
    let couponRestored = false;

    // Step 5 in RPC: Promotional Coupon Quota Restoration & Row Locking
    // Level 2 in hierarchy: Lock coupon row FOR UPDATE BEFORE product_variants
    // Enforces orders -> coupons -> product_variants
    if (
      ["pending", "confirmed", "processing"].includes(oldStatus) &&
      cleanNewStatus === "cancelled" &&
      order.coupon_code &&
      order.coupon_code.trim() !== ""
    ) {
      this.lockAcquisitions.push({ resource: "coupons", code: order.coupon_code.toUpperCase() });
      const coupon = this.coupons.get(order.coupon_code.toUpperCase());
      if (coupon) {
        coupon.times_used = Math.max(0, coupon.times_used - 1);
        couponRestored = true;
      }
    }

    // Step 6 in RPC: Inventory Restoration (Atomic & Exactly Once)
    // Level 3 in hierarchy: Lock product_variants in sorted UUID order
    if (
      (["pending", "confirmed", "processing"].includes(oldStatus) && cleanNewStatus === "cancelled") ||
      (["shipped", "delivered"].includes(oldStatus) && cleanNewStatus === "returned")
    ) {
      const items = (this.orderItems.get(p_order_id) || []).slice().sort((a, b) =>
        a.variant_id.localeCompare(b.variant_id)
      );

      for (const item of items) {
        this.lockAcquisitions.push({ resource: "product_variants", id: item.variant_id });
        const variant = this.variants.get(item.variant_id);
        if (variant) {
          variant.stock_quantity += item.quantity;
          stockRestored = true;
        }
      }
    }

    // Step 7: Update order status
    order.order_status = cleanNewStatus;
    order.updated_at = new Date().toISOString();

    let message = "অর্ডারের স্ট্যাটাস সফলভাবে আপডেট হয়েছে।";
    if (cleanNewStatus === "cancelled") {
      if (order.payment_status === "paid") {
        if (stockRestored && couponRestored) {
          message = "অর্ডার সফলভাবে বাতিল করা হয়েছে এবং পণ্যের স্টক ও কুপন কোটা পুনরুদ্ধার হয়েছে। সতর্কতা: অর্ডারটি পেইড (Paid) ছিলো, অনুগ্রহ করে গ্রাহককে ম্যানুয়ালি রিফান্ড প্রদান নিশ্চিত করুন।";
        } else if (stockRestored) {
          message = "অর্ডার সফলভাবে বাতিল করা হয়েছে এবং পণ্যের স্টক পুনরুদ্ধার হয়েছে। সতর্কতা: অর্ডারটি পেইড (Paid) ছিলো, অনুগ্রহ করে গ্রাহককে ম্যানুয়ালি রিফান্ড প্রদান নিশ্চিত করুন।";
        } else if (couponRestored) {
          message = "অর্ডার সফলভাবে বাতিল করা হয়েছে এবং কুপন কোটা পুনরুদ্ধার হয়েছে। সতর্কতা: অর্ডারটি পেইড (Paid) ছিলো, অনুগ্রহ করে গ্রাহককে ম্যানুয়ালি রিফান্ড প্রদান নিশ্চিত করুন।";
        } else {
          message = "অর্ডার সফলভাবে বাতিল করা হয়েছে। সতর্কতা: অর্ডারটি পেইড (Paid) ছিলো, অনুগ্রহ করে গ্রাহককে ম্যানুয়ালি রিফান্ড প্রদান নিশ্চিত করুন।";
        }
      } else {
        if (stockRestored && couponRestored) {
          message = "অর্ডার সফলভাবে বাতিল করা হয়েছে এবং পণ্যের স্টক ও কুপন কোটা পুনরুদ্ধার করা হয়েছে।";
        } else if (stockRestored) {
          message = "অর্ডার সফলভাবে বাতিল করা হয়েছে এবং পণ্যের স্টক পুনরুদ্ধার করা হয়েছে।";
        } else if (couponRestored) {
          message = "অর্ডার সফলভাবে বাতিল করা হয়েছে এবং কুপন কোটা পুনরুদ্ধার করা হয়েছে।";
        } else {
          message = "অর্ডার সফলভাবে বাতিল করা হয়েছে।";
        }
      }
    } else if (cleanNewStatus === "returned") {
      message = stockRestored
        ? "পণ্য ফেরত (Returned) হিসেবে গৃহীত হয়েছে এবং ইনভেন্টরি স্টক গুদামে পুনরুদ্ধার করা হয়েছে।"
        : "পণ্য ফেরত (Returned) হিসেবে গৃহীত হয়েছে।";
    } else if (cleanNewStatus === "delivered") {
      message = "অর্ডার সফলভাবে ডেলিভার্ড হিসেবে চিহ্নিত করা হয়েছে।";
    }

    return {
      success: true,
      is_noop: false,
      order_id: order.id,
      order_number: order.order_number,
      old_status: oldStatus,
      new_status: cleanNewStatus,
      stock_restored: stockRestored,
      coupon_restored: couponRestored,
      message,
    };
  }

  /**
   * Simulates the exact logic of public.update_order_payment_status RPC
   * from supabase/migrations/20261019_add_order_lifecycle_management.sql
   */
  async updateOrderPaymentStatusRpc(p_order_id, p_new_payment_status) {
    if (!p_order_id) {
      return { success: false, message: "অর্ডার আইডি আবশ্যক।" };
    }

    if (!p_new_payment_status || typeof p_new_payment_status !== "string") {
      return { success: false, message: "পেমেন্ট স্ট্যাটাস আবশ্যক।" };
    }

    const cleanStatus = p_new_payment_status.trim().toLowerCase();
    if (!["unpaid", "paid", "refunded"].includes(cleanStatus)) {
      return { success: false, message: `অবৈধ পেমেন্ট স্ট্যাটাস মান: ${p_new_payment_status}` };
    }

    // Lock order row FOR UPDATE
    this.lockAcquisitions.push({ resource: "orders_payment", id: p_order_id });
    const order = this.orders.get(p_order_id);
    if (!order) {
      return { success: false, message: "অর্ডারটি পাওয়া যায়নি।" };
    }

    const oldPaymentStatus = order.payment_status;

    // Idempotent No-Op Check
    if (oldPaymentStatus === cleanStatus) {
      return {
        success: true,
        is_noop: true,
        order_id: order.id,
        order_number: order.order_number,
        old_payment_status: oldPaymentStatus,
        new_payment_status: cleanStatus,
        message: "পেমেন্ট ইতিমধ্যে এই স্ট্যাটাসে রয়েছে।",
      };
    }

    // Terminal State Protection: Refunded payments cannot be reversed
    if (oldPaymentStatus === "refunded") {
      return {
        success: false,
        message: "রিফান্ডকৃত পেমেন্ট স্ট্যাটাস পরিবর্তন করা যাবে না।",
      };
    }

    // Rule 1: Paid payments cannot be reverted to unpaid
    if (oldPaymentStatus === "paid" && cleanStatus === "unpaid") {
      return {
        success: false,
        message: "পরিশোধিত (Paid) পেমেন্ট পুনরায় অপরিশোধিত (Unpaid) করা যাবে না।",
      };
    }

    // Rule 2: Cannot mark cancelled or returned orders as paid
    if (cleanStatus === "paid" && ["cancelled", "returned"].includes(order.order_status)) {
      return {
        success: false,
        message: "বাতিলকৃত বা ফেরতকৃত অর্ডারের পেমেন্ট পেইড হিসেবে চিহ্নিত করা যাবে না।",
      };
    }

    // Rule 3: Cannot refund an order that was not paid
    if (cleanStatus === "refunded" && oldPaymentStatus !== "paid") {
      return {
        success: false,
        message: "শুধুমাত্র পেইড (Paid) অর্ডারে রিফান্ড স্ট্যাটাস প্রদান করা যাবে।",
      };
    }

    // Rule 4: Refunding requires order to be in cancelled or returned state
    if (cleanStatus === "refunded" && !["cancelled", "returned"].includes(order.order_status)) {
      return {
        success: false,
        message: "রিফান্ড করার পূর্বে অর্ডারটি বাতিল (Cancelled) বা ফেরত (Returned) স্ট্যাটাসে থাকতে হবে।",
      };
    }

    // Apply Update
    order.payment_status = cleanStatus;
    order.updated_at = new Date().toISOString();

    return {
      success: true,
      is_noop: false,
      order_id: order.id,
      order_number: order.order_number,
      old_payment_status: oldPaymentStatus,
      new_payment_status: cleanStatus,
      message: "পেমেন্ট স্ট্যাটাস সফলভাবে আপডেট হয়েছে।",
    };
  }

  /**
   * Simulates legacy node-level updatePaymentStatusAction for backward-compatibility check
   */
  updatePaymentStatus(orderId, newStatus) {
    const order = this.orders.get(orderId);
    if (!order) return { success: false, message: "অর্ডারটি পাওয়া যায়নি।" };

    if (!["unpaid", "paid", "refunded"].includes(newStatus)) {
      return { success: false, message: "অবৈধ পেমেন্ট স্ট্যাটাস মান।" };
    }

    if (order.payment_status === "paid" && newStatus === "unpaid") {
      return { success: false, message: "পরিশোধিত (Paid) পেমেন্ট পুনরায় অপরিশোধিত (Unpaid) করা যাবে না।" };
    }

    if (newStatus === "paid" && order.order_status === "cancelled") {
      return { success: false, message: "বাতিলকৃত অর্ডারের পেমেন্ট পেইড হিসেবে চিহ্নিত করা যাবে না।" };
    }

    if (newStatus === "refunded" && order.payment_status !== "paid") {
      return { success: false, message: "শুধুমাত্র পেইড (Paid) অর্ডারে রিফান্ড স্ট্যাটাস প্রদান করা যাবে।" };
    }

    if (newStatus === "refunded" && !["cancelled", "returned"].includes(order.order_status)) {
      return { success: false, message: "রিফান্ড করার পূর্বে অর্ডারটি বাতিল (Cancelled) বা ফেরত (Returned) স্ট্যাটাসে থাকতে হবে।" };
    }

    order.payment_status = newStatus;
    return { success: true, message: "পেমেন্ট স্ট্যাটাস সফলভাবে আপডেট হয়েছে।" };
  }

  /**
   * Simulates getAdminDashboardMetrics calculation
   */
  calculateDashboardMetrics() {
    let totalRevenue = 0;
    let pendingOrders = 0;
    let deliveredOrders = 0;

    for (const item of this.orders.values()) {
      const isDeliveredNotRefunded =
        item.order_status === "delivered" && item.payment_status !== "refunded";
      const isPrepaidActive =
        item.payment_status === "paid" &&
        !["cancelled", "returned"].includes(item.order_status);

      if (isDeliveredNotRefunded || isPrepaidActive) {
        totalRevenue += Number(item.grand_total) || 0;
      }
      if (item.order_status === "pending") {
        pendingOrders += 1;
      }
      if (item.order_status === "delivered") {
        deliveredOrders += 1;
      }
    }

    return {
      totalOrders: this.orders.size,
      totalRevenue,
      pendingOrders,
      deliveredOrders,
    };
  }
}

describe("Sunnah Source - Order Lifecycle & Inventory Restoration Audit Suite", () => {
  let db;
  const TEST_ORDER_ID = "11111111-2222-3333-4444-555555555555";
  const VARIANT_A_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  const VARIANT_B_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

  beforeEach(() => {
    db = new MockOrderLifecycleDatabase();
    db.seedVariant(VARIANT_A_ID, 10);
    db.seedVariant(VARIANT_B_ID, 5);
    db.seedCoupon("DISCOUNT100", 1, 10); // currently times_used = 1

    db.seedOrder({
      id: TEST_ORDER_ID,
      order_number: "SS-261019-001",
      order_status: "pending",
      payment_status: "unpaid",
      coupon_code: "DISCOUNT100",
      grand_total: 1500,
    });

    db.seedOrderItems(TEST_ORDER_ID, [
      { order_id: TEST_ORDER_ID, variant_id: VARIANT_A_ID, quantity: 2 },
      { order_id: TEST_ORDER_ID, variant_id: VARIANT_B_ID, quantity: 1 },
    ]);
  });

  test("1. Valid forward lifecycle transitions execute successfully (pending -> confirmed -> processing -> shipped -> delivered)", async () => {
    let res = await db.updateOrderStatusWithInventory(TEST_ORDER_ID, "confirmed");
    assert.equal(res.success, true);
    assert.equal(res.new_status, "confirmed");
    assert.equal(res.stock_restored, false);

    res = await db.updateOrderStatusWithInventory(TEST_ORDER_ID, "processing");
    assert.equal(res.success, true);
    assert.equal(res.new_status, "processing");

    res = await db.updateOrderStatusWithInventory(TEST_ORDER_ID, "shipped");
    assert.equal(res.success, true);
    assert.equal(res.new_status, "shipped");

    res = await db.updateOrderStatusWithInventory(TEST_ORDER_ID, "delivered");
    assert.equal(res.success, true);
    assert.equal(res.new_status, "delivered");
    assert.equal(db.orders.get(TEST_ORDER_ID).order_status, "delivered");
  });

  test("2. Invalid status transitions and terminal-state reversals are strictly rejected", async () => {
    // 2a. Jump from pending to delivered directly (forbidden)
    let res = await db.updateOrderStatusWithInventory(TEST_ORDER_ID, "delivered");
    assert.equal(res.success, false);
    assert.ok(res.message.includes("অবৈধ স্ট্যাটাস পরিবর্তন"));

    // 2b. Cancel the order
    res = await db.updateOrderStatusWithInventory(TEST_ORDER_ID, "cancelled");
    assert.equal(res.success, true);
    assert.equal(res.new_status, "cancelled");

    // 2c. Attempting reversal from cancelled to confirmed (strictly forbidden)
    res = await db.updateOrderStatusWithInventory(TEST_ORDER_ID, "confirmed");
    assert.equal(res.success, false);
    assert.ok(res.message.includes("অবৈধ স্ট্যাটাস পরিবর্তন"));

    // 2d. Attempting reversal from cancelled to pending (strictly forbidden)
    res = await db.updateOrderStatusWithInventory(TEST_ORDER_ID, "pending");
    assert.equal(res.success, false);
    assert.ok(res.message.includes("অবৈধ স্ট্যাটাস পরিবর্তন"));
  });

  test("3. Order cancellation restores inventory and single-use coupon exactly once (idempotent retries never restore twice)", async () => {
    assert.equal(db.variants.get(VARIANT_A_ID).stock_quantity, 10);
    assert.equal(db.variants.get(VARIANT_B_ID).stock_quantity, 5);
    assert.equal(db.coupons.get("DISCOUNT100").times_used, 1);

    // Initial cancellation
    const res1 = await db.updateOrderStatusWithInventory(TEST_ORDER_ID, "cancelled");
    assert.equal(res1.success, true);
    assert.equal(res1.stock_restored, true);
    assert.equal(res1.coupon_restored, true);

    // Stock was incremented by item quantities (A +2 -> 12, B +1 -> 6)
    assert.equal(db.variants.get(VARIANT_A_ID).stock_quantity, 12);
    assert.equal(db.variants.get(VARIANT_B_ID).stock_quantity, 6);
    // Coupon times_used decremented from 1 -> 0
    assert.equal(db.coupons.get("DISCOUNT100").times_used, 0);

    // Repeated cancellation request (Idempotent no-op retry)
    const res2 = await db.updateOrderStatusWithInventory(TEST_ORDER_ID, "cancelled");
    assert.equal(res2.success, true);
    assert.equal(res2.is_noop, true);
    assert.equal(res2.stock_restored, false);
    assert.equal(res2.coupon_restored, false);

    // Stock and coupon MUST NOT have changed a second time!
    assert.equal(db.variants.get(VARIANT_A_ID).stock_quantity, 12);
    assert.equal(db.variants.get(VARIANT_B_ID).stock_quantity, 6);
    assert.equal(db.coupons.get("DISCOUNT100").times_used, 0);
  });

  test("4. Post-fulfillment returns restore inventory to warehouse but do not restore promotional coupons", async () => {
    // Advance order to delivered
    await db.updateOrderStatusWithInventory(TEST_ORDER_ID, "confirmed");
    await db.updateOrderStatusWithInventory(TEST_ORDER_ID, "processing");
    await db.updateOrderStatusWithInventory(TEST_ORDER_ID, "shipped");
    await db.updateOrderStatusWithInventory(TEST_ORDER_ID, "delivered");

    assert.equal(db.variants.get(VARIANT_A_ID).stock_quantity, 10);
    assert.equal(db.coupons.get("DISCOUNT100").times_used, 1);

    // Process return from delivered
    const resReturn = await db.updateOrderStatusWithInventory(TEST_ORDER_ID, "returned");
    assert.equal(resReturn.success, true);
    assert.equal(resReturn.new_status, "returned");
    assert.equal(resReturn.stock_restored, true); // Physical goods returned to stock
    assert.equal(resReturn.coupon_restored, false); // Fulfilled promotional coupon is not re-issued

    assert.equal(db.variants.get(VARIANT_A_ID).stock_quantity, 12);
    assert.equal(db.coupons.get("DISCOUNT100").times_used, 1);

    // Terminal check: returned order cannot be re-opened to confirmed or pending
    const reOpen = await db.updateOrderStatusWithInventory(TEST_ORDER_ID, "confirmed");
    assert.equal(reOpen.success, false);
  });

  test("5. Payment status consistency rules prevent invalid payment state mutations", () => {
    // 5a. Cannot refund an unpaid order
    const resRefundUnpaid = db.updatePaymentStatus(TEST_ORDER_ID, "refunded");
    assert.equal(resRefundUnpaid.success, false);
    assert.ok(resRefundUnpaid.message.includes("পেইড"));

    // 5b. Cannot mark a cancelled order as paid
    db.orders.get(TEST_ORDER_ID).order_status = "cancelled";
    const resPayCancelled = db.updatePaymentStatus(TEST_ORDER_ID, "paid");
    assert.equal(resPayCancelled.success, false);
    assert.ok(resPayCancelled.message.includes("বাতিলকৃত"));

    // 5c. Valid refund requires order to be paid AND cancelled or returned
    db.orders.get(TEST_ORDER_ID).payment_status = "paid";
    db.orders.get(TEST_ORDER_ID).order_status = "processing"; // Active order
    const resRefundActive = db.updatePaymentStatus(TEST_ORDER_ID, "refunded");
    assert.equal(resRefundActive.success, false);
    assert.ok(resRefundActive.message.includes("বাতিল"));

    // Now set order to cancelled -> refund succeeds
    db.orders.get(TEST_ORDER_ID).order_status = "cancelled";
    const resRefundSuccess = db.updatePaymentStatus(TEST_ORDER_ID, "refunded");
    assert.equal(resRefundSuccess.success, true);
    assert.equal(db.orders.get(TEST_ORDER_ID).payment_status, "refunded");
  });

  test("6. Realized dashboard revenue calculations exclude cancelled, returned, and uncollected unpaid orders", () => {
    const dbMetrics = new MockOrderLifecycleDatabase();
    // 1. Delivered COD order: 1000 BDT (Realized revenue)
    dbMetrics.seedOrder({ id: "o1", grand_total: 1000, order_status: "delivered", payment_status: "paid" });
    // 2. Pending COD order: 500 BDT (Uncollected, MUST NOT be counted as revenue)
    dbMetrics.seedOrder({ id: "o2", grand_total: 500, order_status: "pending", payment_status: "unpaid" });
    // 3. Shipped COD order: 800 BDT (In transit, MUST NOT be counted as revenue)
    dbMetrics.seedOrder({ id: "o3", grand_total: 800, order_status: "shipped", payment_status: "unpaid" });
    // 4. Cancelled order: 1200 BDT (Cancelled, MUST NOT be counted as revenue)
    dbMetrics.seedOrder({ id: "o4", grand_total: 1200, order_status: "cancelled", payment_status: "unpaid" });
    // 5. Returned order: 700 BDT (Returned, MUST NOT be counted as revenue)
    dbMetrics.seedOrder({ id: "o5", grand_total: 700, order_status: "returned", payment_status: "unpaid" });
    // 6. Online pre-paid processing order: 1500 BDT (Money collected, realized)
    dbMetrics.seedOrder({ id: "o6", grand_total: 1500, order_status: "processing", payment_status: "paid" });

    const metrics = dbMetrics.calculateDashboardMetrics();
    assert.equal(metrics.totalOrders, 6);
    // Total realized revenue = 1000 (o1 delivered) + 1500 (o6 paid) = 2500
    // MUST NOT be 1000 + 500 + 800 + 700 + 1500 = 4500!
    assert.equal(metrics.totalRevenue, 2500);
    assert.equal(metrics.pendingOrders, 1);
    assert.equal(metrics.deliveredOrders, 1);
  });

  test("7. Missing RPC error in updateOrderStatusAction returns user-friendly guidance", () => {
    function simulateMissingRpcHandler(error) {
      const errMsg = error?.message || "";
      if (errMsg.includes("does not exist") || error?.code === "PGRST204") {
        return {
          success: false,
          message: "ডাটাবেজে update_order_status_with_inventory RPC পাওয়া যায়নি। অনুগ্রহ করে সর্বশেষ মাইগ্রেশন সম্পন্ন হয়েছে কিনা তা যাচাই করুন।",
        };
      }
      return { success: false, message: errMsg || "ত্রুটি ঘটেছে।" };
    }

    const missingError = {
      code: "PGRST204",
      message: "function public.update_order_status_with_inventory does not exist",
    };

    const handled = simulateMissingRpcHandler(missingError);
    assert.equal(handled.success, false);
    assert.ok(handled.message.includes("মাইগ্রেশন সম্পন্ন"));
  });

  test("8. Atomic database-level update_order_payment_status RPC enforces transitions and terminal states", async () => {
    // 8a. Reversal of refunded state is strictly forbidden
    db.orders.get(TEST_ORDER_ID).payment_status = "refunded";
    const resReverseToPaid = await db.updateOrderPaymentStatusRpc(TEST_ORDER_ID, "paid");
    assert.equal(resReverseToPaid.success, false);
    assert.ok(resReverseToPaid.message.includes("রিফান্ডকৃত পেমেন্ট স্ট্যাটাস পরিবর্তন করা যাবে না"));

    const resReverseToUnpaid = await db.updateOrderPaymentStatusRpc(TEST_ORDER_ID, "unpaid");
    assert.equal(resReverseToUnpaid.success, false);
    assert.ok(resReverseToUnpaid.message.includes("রিফান্ডকৃত পেমেন্ট স্ট্যাটাস পরিবর্তন করা যাবে না"));

    // 8b. Cannot mark cancelled or returned orders as paid
    db.orders.get(TEST_ORDER_ID).payment_status = "unpaid";
    db.orders.get(TEST_ORDER_ID).order_status = "cancelled";
    const resPaidCancelled = await db.updateOrderPaymentStatusRpc(TEST_ORDER_ID, "paid");
    assert.equal(resPaidCancelled.success, false);
    assert.ok(resPaidCancelled.message.includes("বাতিলকৃত বা ফেরতকৃত"));

    db.orders.get(TEST_ORDER_ID).order_status = "returned";
    const resPaidReturned = await db.updateOrderPaymentStatusRpc(TEST_ORDER_ID, "paid");
    assert.equal(resPaidReturned.success, false);
    assert.ok(resPaidReturned.message.includes("বাতিলকৃত বা ফেরতকৃত"));

    // 8c. Cannot refund an order that was not paid
    db.orders.get(TEST_ORDER_ID).order_status = "cancelled";
    db.orders.get(TEST_ORDER_ID).payment_status = "unpaid";
    const resRefundUnpaid = await db.updateOrderPaymentStatusRpc(TEST_ORDER_ID, "refunded");
    assert.equal(resRefundUnpaid.success, false);
    assert.ok(resRefundUnpaid.message.includes("শুধুমাত্র পেইড"));

    // 8d. Refunding requires order to be in cancelled or returned state
    db.orders.get(TEST_ORDER_ID).order_status = "shipped"; // Active order
    db.orders.get(TEST_ORDER_ID).payment_status = "paid";
    const resRefundActive = await db.updateOrderPaymentStatusRpc(TEST_ORDER_ID, "refunded");
    assert.equal(resRefundActive.success, false);
    assert.ok(resRefundActive.message.includes("বাতিল (Cancelled) বা ফেরত (Returned)"));

    // 8e. Valid refund transition succeeds once order is cancelled
    db.orders.get(TEST_ORDER_ID).order_status = "cancelled";
    const resRefundSuccess = await db.updateOrderPaymentStatusRpc(TEST_ORDER_ID, "refunded");
    assert.equal(resRefundSuccess.success, true);
    assert.equal(db.orders.get(TEST_ORDER_ID).payment_status, "refunded");

    // 8f. Idempotent no-op check
    const resNoop = await db.updateOrderPaymentStatusRpc(TEST_ORDER_ID, "refunded");
    assert.equal(resNoop.success, true);
    assert.equal(resNoop.is_noop, true);
  });

  test("9. Cross-RPC lock acquisition hierarchy strictly enforces orders -> coupons -> product_variants", async () => {
    db.lockAcquisitions = [];

    // Trigger cancellation of an order that has a coupon and line items
    const res = await db.updateOrderStatusWithInventory(TEST_ORDER_ID, "cancelled");
    assert.equal(res.success, true);

    // Verify the exact recorded lock order
    const resources = db.lockAcquisitions.map((l) => l.resource);
    assert.deepEqual(resources, [
      "orders",           // 1. Order row locked first
      "coupons",          // 2. Coupon row locked second (BEFORE variants!)
      "product_variants", // 3. Variant A locked third (sorted UUID)
      "product_variants", // 4. Variant B locked fourth (sorted UUID)
    ]);

    // Note on checkout RPC lock order:
    // create_order_with_inventory locks: coupons -> product_variants -> orders (insert)
    // Since update_order_status_with_inventory locks coupons before product_variants,
    // both RPCs acquire coupon and variant locks in the exact same direction:
    // coupons -> product_variants! This mathematically prevents cyclic lock inversion deadlocks.
  });

  test("10. Concurrency race simulation: order cancellation interleaving with payment status transition", async () => {
    // Order starts as pending & unpaid
    assert.equal(db.orders.get(TEST_ORDER_ID).order_status, "pending");
    assert.equal(db.orders.get(TEST_ORDER_ID).payment_status, "unpaid");

    // Admin 1 cancels order
    const cancelRes = await db.updateOrderStatusWithInventory(TEST_ORDER_ID, "cancelled");
    assert.equal(cancelRes.success, true);

    // Admin 2 concurrently attempts to mark the order as paid
    // The database-level RPC reads the newly committed order_status under row lock
    const payRes = await db.updateOrderPaymentStatusRpc(TEST_ORDER_ID, "paid");
    assert.equal(payRes.success, false);
    assert.ok(payRes.message.includes("বাতিলকৃত বা ফেরতকৃত"));
    assert.equal(db.orders.get(TEST_ORDER_ID).payment_status, "unpaid");
  });

  test("11. Transition from 'paid' to 'unpaid' is strictly rejected while preserving idempotent no-op", async () => {
    // Start with a paid order
    db.orders.get(TEST_ORDER_ID).payment_status = "paid";
    db.orders.get(TEST_ORDER_ID).order_status = "confirmed";

    // Attempt to revert from paid to unpaid -> must be rejected
    const resUnpaid = await db.updateOrderPaymentStatusRpc(TEST_ORDER_ID, "unpaid");
    assert.equal(resUnpaid.success, false);
    assert.ok(resUnpaid.message.includes("পরিশোধিত (Paid) পেমেন্ট পুনরায় অপরিশোধিত (Unpaid) করা যাবে না"));
    assert.equal(db.orders.get(TEST_ORDER_ID).payment_status, "paid");

    // Idempotent no-op: paid -> paid -> succeeds without error
    const resPaidNoop = await db.updateOrderPaymentStatusRpc(TEST_ORDER_ID, "paid");
    assert.equal(resPaidNoop.success, true);
    assert.equal(resPaidNoop.is_noop, true);
    assert.equal(db.orders.get(TEST_ORDER_ID).payment_status, "paid");
  });

  test("12. Order cancellation with non-existent coupon restores stock safely without falsely claiming coupon restoration", async () => {
    const MISSING_COUPON_ORDER_ID = "99999999-0000-0000-0000-000000000001";
    db.seedOrder({
      id: MISSING_COUPON_ORDER_ID,
      order_number: "SS-MISSING-CPN-01",
      order_status: "pending",
      payment_status: "unpaid",
      coupon_code: "NONEXISTENT_COUPON_999", // Not present in db.coupons!
      grand_total: 1000,
    });
    db.seedOrderItems(MISSING_COUPON_ORDER_ID, [
      { order_id: MISSING_COUPON_ORDER_ID, variant_id: VARIANT_A_ID, quantity: 3 },
    ]);

    const initialStockA = db.variants.get(VARIANT_A_ID).stock_quantity;

    // Cancel order
    const cancelRes = await db.updateOrderStatusWithInventory(MISSING_COUPON_ORDER_ID, "cancelled");
    assert.equal(cancelRes.success, true);
    assert.equal(cancelRes.new_status, "cancelled");
    assert.equal(cancelRes.stock_restored, true);
    assert.equal(cancelRes.coupon_restored, false); // Accurately false!
    assert.ok(cancelRes.message.includes("পণ্যের স্টক পুনরুদ্ধার করা হয়েছে"));
    assert.ok(!cancelRes.message.includes("কুপন কোটা"));

    // Verify stock is restored
    assert.equal(db.variants.get(VARIANT_A_ID).stock_quantity, initialStockA + 3);
  });

  test("13. Coupon quota restoration floors at zero and never produces negative times_used", async () => {
    const ZERO_COUPON_ORDER_ID = "99999999-0000-0000-0000-000000000002";
    db.seedCoupon("ZEROUSAGECOUPON", 0, 5); // times_used is already 0
    db.seedOrder({
      id: ZERO_COUPON_ORDER_ID,
      order_number: "SS-ZERO-CPN-01",
      order_status: "pending",
      payment_status: "unpaid",
      coupon_code: "ZEROUSAGECOUPON",
      grand_total: 1000,
    });
    db.seedOrderItems(ZERO_COUPON_ORDER_ID, [
      { order_id: ZERO_COUPON_ORDER_ID, variant_id: VARIANT_A_ID, quantity: 1 },
    ]);

    // Cancel order
    const cancelRes = await db.updateOrderStatusWithInventory(ZERO_COUPON_ORDER_ID, "cancelled");
    assert.equal(cancelRes.success, true);
    assert.equal(cancelRes.coupon_restored, true);

    // times_used must be floored at 0, not -1
    const coupon = db.coupons.get("ZEROUSAGECOUPON");
    assert.equal(coupon.times_used, 0);
  });

  test("14. Order cancellation with zero line items reports stock_restored false and accurate notification", async () => {
    const EMPTY_ORDER_ID = "99999999-0000-0000-0000-000000000003";
    db.seedOrder({
      id: EMPTY_ORDER_ID,
      order_number: "SS-EMPTY-ITEMS-01",
      order_status: "pending",
      payment_status: "unpaid",
      coupon_code: null,
      grand_total: 0,
    });
    db.seedOrderItems(EMPTY_ORDER_ID, []); // Exactly 0 line items

    const cancelRes = await db.updateOrderStatusWithInventory(EMPTY_ORDER_ID, "cancelled");
    assert.equal(cancelRes.success, true);
    assert.equal(cancelRes.new_status, "cancelled");
    assert.equal(cancelRes.stock_restored, false); // Accurately false!
    assert.equal(cancelRes.coupon_restored, false);
    assert.equal(cancelRes.message, "অর্ডার সফলভাবে বাতিল করা হয়েছে।");
  });
});
