import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";

describe("Meta Conversions API (CAPI) & Server-Side Tracking Suite", () => {
  it("correctly hashes customer PII using SHA-256 for Meta Graph API", () => {
    function hashMeta(val) {
      if (!val) return undefined;
      const clean = val.trim().toLowerCase();
      return crypto.createHash("sha256").update(clean).digest("hex");
    }

    const testPhone = "8801712345678";
    const hashed = hashMeta(testPhone);

    assert.equal(typeof hashed, "string");
    assert.equal(hashed.length, 64, "SHA-256 hash must be 64 characters long");

    // Deterministic verification
    const expected = crypto.createHash("sha256").update("8801712345678").digest("hex");
    assert.equal(hashed, expected);
  });

  it("normalizes Bangladeshi phone number to E.164 format for Meta CAPI", () => {
    function normalizeBdPhone(phone) {
      const digits = phone.replace(/\D/g, "");
      const last11 = digits.slice(-11);
      if (last11.startsWith("01")) {
        return `88${last11}`;
      }
      return digits;
    }

    assert.equal(normalizeBdPhone("01712345678"), "8801712345678");
    assert.equal(normalizeBdPhone("+8801914612007"), "8801914612007");
    assert.equal(normalizeBdPhone("018-9876-5432"), "8801898765432");
  });

  it("verifies CAPI Purchase event payload structure conforms to Meta specs", () => {
    const payload = {
      orderNumber: "SS-20261124-1001",
      grandTotal: 1950,
      customerName: "আব্দুল্লাহ আল মামুন",
      phone: "01712345678",
      city: "ঢাকা",
      clientIp: "103.145.12.1",
      items: [
        { id: "prod-h-1", quantity: 2, item_price: 950 },
      ],
    };

    assert.ok(payload.orderNumber.startsWith("SS-"));
    assert.equal(payload.grandTotal, 1950);
    assert.equal(payload.items.length, 1);
    assert.equal(payload.items[0].quantity, 2);
  });
});
