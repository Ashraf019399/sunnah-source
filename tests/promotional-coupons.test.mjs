import { test, describe } from "node:test";
import assert from "node:assert/strict";

// We import the compiled or define the promotional coupons and validateCoupon helper
import { PROMOTIONAL_COUPONS, validateCoupon } from "../src/lib/services/coupons.ts";

describe("Promotional Coupon System Verification", () => {
  test("PROMOTIONAL_COUPONS defines SUNNAH10, WELCOME50, and FREESHIP", () => {
    assert.equal(PROMOTIONAL_COUPONS.length, 3);

    const sunnah10 = PROMOTIONAL_COUPONS.find((c) => c.code === "SUNNAH10");
    assert.ok(sunnah10, "SUNNAH10 must be defined");
    assert.equal(sunnah10.discountType, "percentage");
    assert.equal(sunnah10.discountValue, 10);
    assert.equal(sunnah10.minOrderAmount, 0);
    assert.equal(sunnah10.isActive, true);
    assert.equal(sunnah10.description, "১০% বিশেষ মূল্যছাড়");

    const welcome50 = PROMOTIONAL_COUPONS.find((c) => c.code === "WELCOME50");
    assert.ok(welcome50, "WELCOME50 must be defined");
    assert.equal(welcome50.discountType, "fixed");
    assert.equal(welcome50.discountValue, 50);
    assert.equal(welcome50.minOrderAmount, 500);
    assert.equal(welcome50.isActive, true);
    assert.equal(welcome50.description, "৳৫০ স্বাগতম ডিসকাউন্ট");

    const freeship = PROMOTIONAL_COUPONS.find((c) => c.code === "FREESHIP");
    assert.ok(freeship, "FREESHIP must be defined");
    assert.equal(freeship.discountType, "free_shipping");
    assert.equal(freeship.discountValue, 100);
    assert.equal(freeship.isActive, true);
  });

  test("SUNNAH10 gives 10% discount without min order", () => {
    // ৳1000 subtotal -> 10% = ৳100
    const res1 = validateCoupon("SUNNAH10", 1000);
    assert.equal(res1.isValid, true);
    assert.equal(res1.discountAmount, 100);
    assert.equal(res1.isFreeShipping, false);
    assert.ok(res1.message.includes("১০% ছাড়"));

    // Case insensitivity: 'sunnah10'
    const res2 = validateCoupon("sunnah10", 450);
    assert.equal(res2.isValid, true);
    assert.equal(res2.discountAmount, 45); // 10% of 450 = 45
    assert.equal(res2.isFreeShipping, false);
  });

  test("WELCOME50 enforces ৳500 minimum order and gives ৳50 flat discount", () => {
    // Under minimum order ৳500 -> Invalid
    const resUnder = validateCoupon("WELCOME50", 400);
    assert.equal(resUnder.isValid, false);
    assert.equal(resUnder.discountAmount, 0);
    assert.equal(resUnder.message, "কুপন কোডটি সঠিক নয় বা মেয়াদোত্তীর্ণ।");

    // Equal to ৳500 -> Valid with ৳50 discount
    const resEqual = validateCoupon("welcome50", 500);
    assert.equal(resEqual.isValid, true);
    assert.equal(resEqual.discountAmount, 50);
    assert.equal(resEqual.isFreeShipping, false);
    assert.ok(resEqual.message.includes("৳৫০ ছাড়"));

    // Above ৳500 -> Valid with ৳50 discount
    const resAbove = validateCoupon("WELCOME50", 1200);
    assert.equal(resAbove.isValid, true);
    assert.equal(resAbove.discountAmount, 50);
  });

  test("FREESHIP waives 100% of delivery fee", () => {
    // Inside Dhaka (deliveryFee = 70)
    const resDhaka = validateCoupon("FREESHIP", 600, 70);
    assert.equal(resDhaka.isValid, true);
    assert.equal(resDhaka.isFreeShipping, true);
    assert.equal(resDhaka.discountAmount, 70);
    assert.ok(resDhaka.message.includes("ফ্রি ডেলিভারি"));

    // Outside Dhaka (deliveryFee = 130)
    const resOutside = validateCoupon("freeship", 600, 130);
    assert.equal(resOutside.isValid, true);
    assert.equal(resOutside.isFreeShipping, true);
    assert.equal(resOutside.discountAmount, 130);
  });

  test("Invalid codes and edge cases are rejected with standard message", () => {
    const invalidRes = validateCoupon("INVALID_CODE", 1000);
    assert.equal(invalidRes.isValid, false);
    assert.equal(invalidRes.discountAmount, 0);
    assert.equal(invalidRes.message, "কুপন কোডটি সঠিক নয় বা মেয়াদোত্তীর্ণ।");

    const emptyRes = validateCoupon("", 1000);
    assert.equal(emptyRes.isValid, false);
    assert.equal(emptyRes.message, "কুপন কোডটি সঠিক নয় বা মেয়াদোত্তীর্ণ।");

    const zeroSubtotal = validateCoupon("SUNNAH10", 0);
    assert.equal(zeroSubtotal.isValid, false);

    const negativeSubtotal = validateCoupon("SUNNAH10", -100);
    assert.equal(negativeSubtotal.isValid, false);
  });
});
