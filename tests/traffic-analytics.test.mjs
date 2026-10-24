import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getStoreTrafficMetrics } from "../src/lib/services/traffic-analytics.ts";

describe("Store Traffic Analytics Service", () => {
  it("returns all 4 timeframe-aware metrics", async () => {
    const metrics = await getStoreTrafficMetrics(10);

    assert.ok(metrics.timeframes, "timeframes object must exist");
    assert.ok(metrics.timeframes.today, "today timeframe must exist");
    assert.ok(metrics.timeframes.last7days, "last7days timeframe must exist");
    assert.ok(metrics.timeframes.thisMonth, "thisMonth timeframe must exist");
    assert.ok(metrics.timeframes.allTime, "allTime timeframe must exist");

    // Check timeframe labels
    assert.equal(metrics.timeframes.today.badgeLabel, "আজ");
    assert.equal(metrics.timeframes.last7days.badgeLabel, "গত ৭ দিন");
    assert.equal(metrics.timeframes.thisMonth.badgeLabel, "এই মাস");
    assert.equal(metrics.timeframes.allTime.badgeLabel, "সর্বমোট");
  });

  it("includes a valid 7-day daily breakdown array with Bengali day names", async () => {
    const metrics = await getStoreTrafficMetrics(15);
    const breakdown = metrics.dailyBreakdown;

    assert.ok(Array.isArray(breakdown), "dailyBreakdown must be an array");
    assert.equal(breakdown.length, 7, "dailyBreakdown must contain exactly 7 days");

    const validBanglaDays = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"];
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    for (const item of breakdown) {
      assert.ok(dateRegex.test(item.date), `Date ${item.date} should match YYYY-MM-DD format`);
      assert.ok(
        validBanglaDays.includes(item.dayName),
        `Day name ${item.dayName} must be a valid Bengali day abbreviation`
      );
      assert.equal(typeof item.views, "number");
      assert.equal(typeof item.carts, "number");
      assert.equal(typeof item.orders, "number");
      assert.ok(item.views >= 0, "views must be non-negative");
      assert.ok(item.carts >= 0, "carts must be non-negative");
      assert.ok(item.orders >= 0, "orders must be non-negative");
    }
  });

  it("todayViews matches the last entry in dailyBreakdown and today timeframe", async () => {
    const metrics = await getStoreTrafficMetrics(8);
    const todayBreakdown = metrics.dailyBreakdown[metrics.dailyBreakdown.length - 1];

    assert.equal(metrics.todayViews, todayBreakdown.views);
    assert.equal(metrics.timeframes.today.totalPageViews, todayBreakdown.views);
    assert.equal(metrics.timeframes.today.addToCartCount, todayBreakdown.carts);
    assert.equal(metrics.timeframes.today.totalOrders, todayBreakdown.orders);
  });

  it("calculates realistic funnel conversion rates", async () => {
    const metrics = await getStoreTrafficMetrics(12);

    for (const tf of ["today", "last7days", "thisMonth", "allTime"]) {
      const data = metrics.timeframes[tf];
      assert.ok(data.conversionRate >= 0, `${tf} conversionRate must be non-negative`);
      assert.ok(data.checkoutConversionRate >= 0, `${tf} checkoutConversionRate must be non-negative`);
      assert.ok(data.cartToCheckoutRate >= 0, `${tf} cartToCheckoutRate must be non-negative`);
    }
  });

  it("gracefully handles zero total orders with positive baseline traffic", async () => {
    const metrics = await getStoreTrafficMetrics(0);

    assert.ok(metrics.todayViews > 0, "Baseline today views should be positive");
    assert.ok(metrics.totalPageViews > 0, "Baseline last 7 days views should be positive");
    assert.ok(metrics.timeframes.allTime.totalPageViews > 0, "Baseline all time views should be positive");
    assert.equal(metrics.timeframes.allTime.totalOrders, 0);
  });
});
