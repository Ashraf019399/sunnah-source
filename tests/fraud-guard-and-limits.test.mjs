import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateHoneypot,
  validateBangladeshiPhone,
  validateCustomerName,
  validateCustomerAddress,
} from "../src/lib/services/fake-order-guard.ts";

describe("Fraud Guard & Spam Prevention Suite", () => {
  describe("Honeypot Trap Validation", () => {
    it("accepts empty or null honeypot from legitimate customers", () => {
      assert.equal(validateHoneypot(""), true);
      assert.equal(validateHoneypot(null), true);
      assert.equal(validateHoneypot(undefined), true);
      assert.equal(validateHoneypot("   "), true);
    });

    it("rejects filled honeypot from spam bots", () => {
      assert.equal(validateHoneypot("http://spam-link.com"), false);
      assert.equal(validateHoneypot("bot-payload"), false);
    });
  });

  describe("Bangladeshi Phone Number Validation & Dummy Rejection", () => {
    it("accepts legitimate 11-digit Bangladeshi mobile numbers", () => {
      const validNumbers = [
        "01715482931",
        "01898765432",
        "01914612007",
        "01311239845",
        "01422334455",
        "01519876512",
        "01688776655",
        "+8801715482931",
      ];

      for (const num of validNumbers) {
        const result = validateBangladeshiPhone(num);
        assert.equal(result.isValid, true, `Should accept valid number: ${num}`);
        assert.equal(result.cleanPhone.length, 11);
      }
    });

    it("rejects numbers with invalid lengths or non-BD prefixes", () => {
      assert.equal(validateBangladeshiPhone("017123456").isValid, false); // Too short
      assert.equal(validateBangladeshiPhone("01234567891").isValid, false); // 012 is invalid prefix
      assert.equal(validateBangladeshiPhone("01112345678").isValid, false); // 011 is Citycell (deprecated)
    });

    it("rejects known dummy and repeating numbers (ফেক অর্ডার গার্ড)", () => {
      assert.equal(validateBangladeshiPhone("01700000000").isValid, false);
      assert.equal(validateBangladeshiPhone("01711111111").isValid, false);
      assert.equal(validateBangladeshiPhone("01888888888").isValid, false);
      assert.equal(validateBangladeshiPhone("01999999999").isValid, false);
      assert.equal(validateBangladeshiPhone("01715482931").isValid, true); // normal legitimate
    });

    it("rejects sequential dummy numbers", () => {
      assert.equal(validateBangladeshiPhone("01712345678").isValid, false); // 12345678
      assert.equal(validateBangladeshiPhone("01987654321").isValid, false); // 87654321
      assert.equal(validateBangladeshiPhone("01715482931").isValid, true);
    });
  });

  describe("Customer Name & Address Quality Guard", () => {
    it("validates legitimate names", () => {
      assert.equal(validateCustomerName("মোহাম্মদ আব্দুল্লাহ").isValid, true);
      assert.equal(validateCustomerName("Tanvir Ahmed").isValid, true);
    });

    it("rejects spam dummy names", () => {
      assert.equal(validateCustomerName("").isValid, false);
      assert.equal(validateCustomerName("a").isValid, false);
      assert.equal(validateCustomerName("test").isValid, false);
      assert.equal(validateCustomerName("asdf").isValid, false);
      assert.equal(validateCustomerName("123456").isValid, false);
    });

    it("validates legitimate addresses", () => {
      assert.equal(
        validateCustomerAddress("হাউজ #১২, রোড #৪, ধানমন্ডি, ঢাকা").isValid,
        true
      );
      assert.equal(
        validateCustomerAddress("Mirpur 10, Block D, Dhaka").isValid,
        true
      );
    });

    it("rejects meaningless or one-word spam addresses", () => {
      assert.equal(validateCustomerAddress("").isValid, false);
      assert.equal(validateCustomerAddress("abc").isValid, false);
      assert.equal(validateCustomerAddress("test").isValid, false);
      assert.equal(validateCustomerAddress("asdf").isValid, false);
    });
  });
});
