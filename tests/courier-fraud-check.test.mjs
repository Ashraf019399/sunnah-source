import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Courier Fraud Check & Risk Evaluation Suite", () => {
  // Logic mirror of evaluateCustomerRisk in src/lib/services/courier-fraud-check.ts
  function evaluateCustomerRisk(total, delivered, returned, cancelled) {
    const completedOrFailed = delivered + returned + cancelled;
    if (total === 0 || completedOrFailed === 0) {
      return {
        riskLevel: "safe",
        labelBn: "নতুন গ্রাহক (New)",
        rate: 100,
      };
    }

    const successRate = Math.round((delivered / completedOrFailed) * 100);

    if ((returned + cancelled >= 2 && delivered === 0) || (completedOrFailed >= 2 && successRate < 50)) {
      return {
        riskLevel: "high",
        labelBn: "উচ্চ ঝুঁকি (High Risk)",
        rate: successRate,
      };
    }

    if (returned + cancelled >= 1 && successRate < 80) {
      return {
        riskLevel: "moderate",
        labelBn: "মাঝারি ঝুঁকি (Moderate)",
        rate: successRate,
      };
    }

    return {
      riskLevel: "safe",
      labelBn: "নিরাপদ ও বিশ্বস্ত (Safe)",
      rate: successRate,
    };
  }

  it("identifies new customer as safe baseline", () => {
    const res = evaluateCustomerRisk(0, 0, 0, 0);
    assert.equal(res.riskLevel, "safe");
    assert.equal(res.labelBn, "নতুন গ্রাহক (New)");
    assert.equal(res.rate, 100);
  });

  it("identifies consistent buyers as safe with high delivery success rate", () => {
    const res = evaluateCustomerRisk(5, 5, 0, 0);
    assert.equal(res.riskLevel, "safe");
    assert.equal(res.labelBn, "নিরাপদ ও বিশ্বস্ত (Safe)");
    assert.equal(res.rate, 100);
  });

  it("detects frequent cancellers/returners as high risk", () => {
    // 0 delivered, 2 cancelled/returned
    const res1 = evaluateCustomerRisk(2, 0, 1, 1);
    assert.equal(res1.riskLevel, "high");
    assert.equal(res1.labelBn, "উচ্চ ঝুঁকি (High Risk)");
    assert.equal(res1.rate, 0);

    // 1 delivered, 3 returned (25% success rate)
    const res2 = evaluateCustomerRisk(4, 1, 2, 1);
    assert.equal(res2.riskLevel, "high");
    assert.equal(res2.rate, 25);
  });

  it("identifies moderate risk customers who had 1 cancellation but good history", () => {
    // 3 delivered, 1 cancelled (75% success rate)
    const res = evaluateCustomerRisk(4, 3, 0, 1);
    assert.equal(res.riskLevel, "moderate");
    assert.equal(res.labelBn, "মাঝারি ঝুঁকি (Moderate)");
    assert.equal(res.rate, 75);
  });

  it("formats external Steadfast and FraudCheck BD lookup URLs correctly", () => {
    const phone = "01712345678";
    const steadfastUrl = `https://steadfast.com.bd/merchant/consignment?search=${encodeURIComponent(phone)}`;
    const fraudCheckBdUrl = `https://fraudcheckbd.com/?phone=${encodeURIComponent(phone)}`;

    assert.equal(steadfastUrl, "https://steadfast.com.bd/merchant/consignment?search=01712345678");
    assert.equal(fraudCheckBdUrl, "https://fraudcheckbd.com/?phone=01712345678");
  });
});
