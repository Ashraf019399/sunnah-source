import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  FACEBOOK_PIXEL_ID,
  fbPageView,
  fbViewContent,
  fbAddToCart,
  fbInitiateCheckout,
  fbPurchase,
} from "../src/lib/services/facebook-pixel.ts";
import {
  FB_PIXEL_ID,
  pageview,
  event as fbEvent,
} from "../src/lib/fpixel.ts";

describe("Facebook Pixel Service Tracking", () => {
  let trackedEvents = [];

  beforeEach(() => {
    trackedEvents = [];
    // Mock window.fbq
    globalThis.window = {
      fbq: (action, eventName, payload) => {
        trackedEvents.push({ action, eventName, payload });
      },
    };
  });

  it("exports valid Pixel ID", () => {
    assert.ok(FACEBOOK_PIXEL_ID, "Pixel ID should be defined");
    assert.equal(typeof FACEBOOK_PIXEL_ID, "string");
  });

  it("fbPageView triggers PageView track event", () => {
    fbPageView();
    assert.equal(trackedEvents.length, 1);
    assert.equal(trackedEvents[0].action, "track");
    assert.equal(trackedEvents[0].eventName, "PageView");
    assert.equal(trackedEvents[0].payload, undefined);
  });

  it("fbViewContent triggers ViewContent with correct product parameters", () => {
    fbViewContent({
      id: "prod-h-1",
      name: "সুন্দরবনের প্রাকৃতিক চাকের কাঁচা মধু",
      category: "মধু",
      price: 950,
    });

    assert.equal(trackedEvents.length, 1);
    assert.equal(trackedEvents[0].action, "track");
    assert.equal(trackedEvents[0].eventName, "ViewContent");
    assert.deepEqual(trackedEvents[0].payload, {
      content_name: "সুন্দরবনের প্রাকৃতিক চাকের কাঁচা মধু",
      content_category: "মধু",
      content_ids: ["prod-h-1"],
      value: 950,
      currency: "BDT",
    });
  });

  it("fbAddToCart triggers AddToCart with content_name, content_ids, value, and currency BDT", () => {
    fbAddToCart({
      id: "prod-o-2",
      name: "কোল্ড প্রেসড খাঁটি কালোজিরা তেল",
      price: 340,
      quantity: 2,
    });

    assert.equal(trackedEvents.length, 1);
    assert.equal(trackedEvents[0].action, "track");
    assert.equal(trackedEvents[0].eventName, "AddToCart");
    assert.deepEqual(trackedEvents[0].payload, {
      content_name: "কোল্ড প্রেসড খাঁটি কালোজিরা তেল",
      content_ids: ["prod-o-2"],
      value: 340,
      currency: "BDT",
    });
  });

  it("fbInitiateCheckout triggers InitiateCheckout with calculated num_items and subtotal", () => {
    const items = [
      { id: "prod-h-1", name: "কাঁচা মধু", price: 950, quantity: 2 },
      { id: "prod-g-1", name: "বিলোনা ঘি", price: 880, quantity: 1 },
    ];

    fbInitiateCheckout(items, 2780);

    assert.equal(trackedEvents.length, 1);
    assert.equal(trackedEvents[0].action, "track");
    assert.equal(trackedEvents[0].eventName, "InitiateCheckout");
    assert.deepEqual(trackedEvents[0].payload, {
      content_ids: ["prod-h-1", "prod-g-1"],
      num_items: 3,
      value: 2780,
      currency: "BDT",
    });
  });

  it("fbPurchase triggers Purchase with order number, items, and total amount", () => {
    fbPurchase({
      orderId: "SS-20261021-9999",
      total: 2850,
      numItems: 3,
      items: [
        { id: "prod-h-1", name: "কাঁচা মধু" },
        { id: "prod-g-1", name: "বিলোনা ঘি" },
      ],
    });

    assert.equal(trackedEvents.length, 1);
    assert.equal(trackedEvents[0].action, "track");
    assert.equal(trackedEvents[0].eventName, "Purchase");
    assert.deepEqual(trackedEvents[0].payload, {
      content_name: "Order #SS-20261021-9999",
      content_ids: ["prod-h-1", "prod-g-1"],
      value: 2850,
      currency: "BDT",
      num_items: 3,
    });
  });

  it("Gracefully handles ad-blockers where window.fbq is undefined or blocked", () => {
    // Simulate window without fbq
    globalThis.window = {};

    assert.doesNotThrow(() => {
      fbPageView();
      fbViewContent({ id: "1", name: "Test", price: 100 });
      fbAddToCart({ id: "1", name: "Test", price: 100 });
      fbInitiateCheckout([], 0);
      fbPurchase({ orderId: "1", total: 100, numItems: 1 });
      pageview();
      fbEvent("CustomEvent", { key: "value" });
    });
  });

  it("fpixel helper functions work correctly", () => {
    assert.equal(FB_PIXEL_ID, "2675229749603202");

    pageview();
    assert.equal(trackedEvents.length, 1);
    assert.equal(trackedEvents[0].action, "track");
    assert.equal(trackedEvents[0].eventName, "PageView");

    fbEvent("AddToCart", { content_name: "Honey", value: 950, currency: "BDT" });
    assert.equal(trackedEvents.length, 2);
    assert.equal(trackedEvents[1].action, "track");
    assert.equal(trackedEvents[1].eventName, "AddToCart");
    assert.deepEqual(trackedEvents[1].payload, { content_name: "Honey", value: 950, currency: "BDT" });
  });
});
