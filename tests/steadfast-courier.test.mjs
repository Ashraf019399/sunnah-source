import test from "node:test";
import assert from "node:assert/strict";
import {
  getSteadfastTrackingUrl,
  STEADFAST_BASE_URL,
} from "../src/lib/services/steadfast.ts";
import { DEFAULT_COURIER_SETTINGS } from "../src/types/settings.types.ts";

test("Steadfast Courier Integration Suite", async (t) => {
  await t.test("1. Base URL & Defaults adhere to official Steadfast specifications", () => {
    assert.equal(STEADFAST_BASE_URL, "https://portal.steadfast.com.bd/api/v1");
    assert.equal(DEFAULT_COURIER_SETTINGS.provider, "steadfast");
    assert.equal(DEFAULT_COURIER_SETTINGS.baseUrl, "https://portal.steadfast.com.bd/api/v1");
    assert.equal(DEFAULT_COURIER_SETTINGS.isConfigured, false);
  });

  await t.test("2. getSteadfastTrackingUrl formats direct tracking URLs to https://steadfast.com.bd/t/{code}", () => {
    const code = "241029A841B9";
    const url = getSteadfastTrackingUrl(code);
    assert.equal(url, "https://steadfast.com.bd/t/241029A841B9");

    // Tests whitespace trimming
    const paddedCode = "  STDF987654  ";
    const paddedUrl = getSteadfastTrackingUrl(paddedCode);
    assert.equal(paddedUrl, "https://steadfast.com.bd/t/STDF987654");

    // Tests URI encoding
    const specialCode = "ABC 123/XYZ";
    const specialUrl = getSteadfastTrackingUrl(specialCode);
    assert.equal(specialUrl, "https://steadfast.com.bd/t/ABC%20123%2FXYZ");
  });

  await t.test("3. Missing credentials trigger graceful Bengali error in testSteadfastConnection", async () => {
    const { testSteadfastConnection } = await import("../src/lib/services/steadfast.ts");
    const result = await testSteadfastConnection("", "");
    assert.equal(result.success, false);
    assert.ok(result.message.includes("Steadfast API Key"));
  });

  await t.test("4. Missing required payload fields trigger validation error in createSteadfastOrder", async () => {
    const { createSteadfastOrder } = await import("../src/lib/services/steadfast.ts");
    
    // Missing phone & address
    const result = await createSteadfastOrder(
      {
        invoice: "SS-123456",
        recipient_name: "Customer",
        recipient_phone: "",
        recipient_address: "",
        cod_amount: 500,
      },
      {
        apiKey: "dummy-key",
        secretKey: "dummy-secret",
      }
    );

    assert.equal(result.success, false);
    assert.ok(result.message.includes("আবশ্যক"));
  });

  await t.test("5. Missing consignment ID in getSteadfastDeliveryStatus triggers error", async () => {
    const { getSteadfastDeliveryStatus } = await import("../src/lib/services/steadfast.ts");
    const result = await getSteadfastDeliveryStatus("", {
      apiKey: "dummy-key",
      secretKey: "dummy-secret",
    });
    assert.equal(result.success, false);
    assert.ok(result.message.includes("আইডি আবশ্যক"));
  });
});

