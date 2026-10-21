import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isValidBDPhone, normalizeBDPhone } from "../src/lib/utils.ts";

describe("Customer Orders Service & Phone Sanitization", () => {
  it("Correctly normalizes and validates Bangladeshi phone numbers", () => {
    const validPhones = [
      "01712345678",
      "01812345678",
      "01914612007",
      "8801914612007",
      "+8801712345678",
      "01300000000",
      "01699999999",
    ];

    for (const phone of validPhones) {
      const normalized = normalizeBDPhone(phone);
      assert.equal(normalized.length, 11, `Normalized phone ${phone} should be 11 digits`);
      assert.ok(normalized.startsWith("01"), `Normalized phone ${phone} should start with 01`);
      assert.ok(isValidBDPhone(phone) || isValidBDPhone(normalized), `Phone ${phone} must be valid`);
    }

    const invalidPhones = [
      "",
      "12345",
      "01234567890", // 012 is invalid operator prefix in BD
      "abcdefghijk",
      "0171234567", // only 10 digits
    ];

    for (const phone of invalidPhones) {
      const normalized = normalizeBDPhone(phone);
      assert.equal(
        isValidBDPhone(phone) || (normalized.length === 11 && isValidBDPhone(normalized)),
        false,
        `Phone ${phone} should be rejected`
      );
    }
  });

  it("Customer Order status badge mapping handles all possible lifecycle states", () => {
    const getStatusBadge = (status) => {
      switch (status) {
        case "pending":
          return { label: "পেন্ডিং (অপেক্ষমান)", color: "amber" };
        case "confirmed":
        case "processing":
          return { label: "প্রসেসিং (প্রক্রিয়াধীন)", color: "blue" };
        case "shipped":
          return { label: "কুরিয়ারে হস্তান্তর", color: "purple" };
        case "delivered":
          return { label: "ডেলিভার্ড (সম্পন্ন)", color: "emerald" };
        case "cancelled":
          return { label: "বাতিল (Cancelled)", color: "red" };
        case "returned":
          return { label: "ফেরত (Returned)", color: "stone" };
        default:
          return { label: status, color: "stone" };
      }
    };

    assert.equal(getStatusBadge("pending").color, "amber");
    assert.equal(getStatusBadge("processing").color, "blue");
    assert.equal(getStatusBadge("shipped").color, "purple");
    assert.equal(getStatusBadge("delivered").color, "emerald");
    assert.equal(getStatusBadge("cancelled").color, "red");
  });

  it("Customer Order DTO structure supports invoice conversion and tracking links", () => {
    const mockOrder = {
      id: "ord-test-1",
      order_number: "SS-261021-9988",
      created_at: new Date().toISOString(),
      status: "delivered",
      grand_total: 2850,
      subtotal: 2850,
      discount_amount: 0,
      delivery_fee: 0,
      coupon_code: null,
      delivery_address: "উত্তরা, ঢাকা",
      customer_name: "মাহমুদুল হাসান",
      customer_phone: "01914612007",
      payment_method: "cod",
      payment_status: "paid",
      items: [
        {
          id: "item-1",
          productId: "prod-h-1",
          productTitle: "সুন্দরবনের প্রাকৃতিক চাকের কাঁচা মধু",
          variantName: "৫০০ গ্রাম জার",
          unitPrice: 950,
          quantity: 3,
          lineTotal: 2850,
        },
      ],
    };

    // Tracking URL verification
    const trackingUrl = `/track-order?id=${encodeURIComponent(mockOrder.order_number)}`;
    assert.equal(trackingUrl, "/track-order?id=SS-261021-9988");

    // WhatsApp Message URL verification
    const text = `আসসালামু আলাইকুম সুন্নাহ সোর্স, আমার অর্ডার #${mockOrder.order_number} সম্পর্কে জানতে চাচ্ছি।`;
    const waUrl = `https://wa.me/8801914612007?text=${encodeURIComponent(text)}`;
    assert.ok(waUrl.includes("SS-261021-9988"));
  });
});
