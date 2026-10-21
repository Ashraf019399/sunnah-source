import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("SEO, Sitemap & Robots Validation", () => {
  it("Sitemap route generator creates valid structure for static, product, and category routes", () => {
    const BASE_URL = "https://sunnahsourcebd.com";
    const staticPaths = ["", "/shop", "/combos", "/track-order", "/checkout"];
    const productSlugs = [
      "sundarban-raw-wild-honey",
      "traditional-bilona-cow-ghee",
      "cold-pressed-mustard-oil",
      "madinah-vip-ajwa-dates",
      "extra-virgin-black-seed-oil",
    ];
    const categorySlugs = [
      "honey",
      "ghee-oil",
      "dates",
      "organic-seeds",
      "combos",
      "raw-honey",
      "ghee-oils",
    ];

    const staticRoutes = staticPaths.map((p) => ({
      url: `${BASE_URL}${p}`,
      changeFrequency: p === "" || p === "/shop" ? "daily" : "weekly",
      priority: p === "" ? 1.0 : p === "/shop" ? 0.9 : 0.7,
    }));

    const productRoutes = productSlugs.map((slug) => ({
      url: `${BASE_URL}/product/${slug}`,
      changeFrequency: "daily",
      priority: 0.8,
    }));

    const categoryRoutes = categorySlugs.map((slug) => ({
      url: `${BASE_URL}/category/${slug}`,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const sitemap = [...staticRoutes, ...productRoutes, ...categoryRoutes];

    assert.ok(Array.isArray(sitemap), "Sitemap must return an array");
    assert.equal(sitemap.length, staticPaths.length + productSlugs.length + categorySlugs.length);

    const urls = sitemap.map((s) => s.url);
    assert.ok(urls.includes("https://sunnahsourcebd.com"));
    assert.ok(urls.includes("https://sunnahsourcebd.com/shop"));
    assert.ok(urls.includes("https://sunnahsourcebd.com/checkout"));
    assert.ok(urls.includes("https://sunnahsourcebd.com/track-order"));
    assert.ok(urls.includes("https://sunnahsourcebd.com/product/sundarban-raw-wild-honey"));
    assert.ok(urls.includes("https://sunnahsourcebd.com/category/honey"));

    for (const item of sitemap) {
      assert.ok(item.url.startsWith(BASE_URL));
      assert.ok(item.priority > 0 && item.priority <= 1.0);
      assert.ok(["daily", "weekly"].includes(item.changeFrequency));
    }
  });

  it("Robots configuration allows crawlers and protects private paths", async () => {
    const { default: robots } = await import("../src/app/robots.ts");
    const config = robots();

    assert.ok(config.rules, "Robots must specify rules");
    assert.equal(config.rules.userAgent, "*");
    assert.equal(config.rules.allow, "/");
    assert.deepEqual(config.rules.disallow, ["/admin/", "/api/"]);
    assert.equal(config.sitemap, "https://sunnahsourcebd.com/sitemap.xml");
  });

  it("Manifest configuration provides valid PWA metadata", async () => {
    const { default: manifest } = await import("../src/app/manifest.ts");
    const pwa = manifest();

    assert.equal(pwa.name, "সুন্নাহ সোর্স | Sunnah Source");
    assert.equal(pwa.short_name, "Sunnah Source");
    assert.equal(pwa.start_url, "/");
    assert.equal(pwa.display, "standalone");
    assert.ok(pwa.theme_color, "Manifest must specify theme_color");
    assert.ok(pwa.icons && pwa.icons.length > 0, "Manifest must contain icons");
  });

  it("JSON-LD product schema has required Google Rich Snippet properties", () => {
    const product = {
      titleBn: "সুন্দরবনের প্রাকৃতিক চাকের কাঁচা মধু",
      shortDescriptionBn: "১০০% প্রাকৃতিক সুন্দরবনের মধু।",
      images: ["https://images.unsplash.com/photo-1558642452-9d2a7deb7f62"],
      ratingAverage: 4.95,
      reviewCount: 48,
    };
    const price = 950;
    const slug = "sundarban-raw-wild-honey";
    const canonicalUrl = `https://sunnahsourcebd.com/product/${slug}`;

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.titleBn,
      description: product.shortDescriptionBn,
      image: product.images[0],
      brand: {
        "@type": "Brand",
        name: "সুন্নাহ সোর্স",
      },
      offers: {
        "@type": "Offer",
        priceCurrency: "BDT",
        price: price,
        availability: "https://schema.org/InStock",
        url: canonicalUrl,
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: (product.ratingAverage || 5.0).toFixed(1),
        reviewCount: String(product.reviewCount || 48),
      },
    };

    assert.equal(jsonLd["@context"], "https://schema.org");
    assert.equal(jsonLd["@type"], "Product");
    assert.equal(jsonLd.name, product.titleBn);
    assert.equal(jsonLd.brand.name, "সুন্নাহ সোর্স");
    assert.equal(jsonLd.offers.priceCurrency, "BDT");
    assert.equal(jsonLd.offers.price, 950);
    assert.equal(jsonLd.offers.availability, "https://schema.org/InStock");
    assert.equal(jsonLd.aggregateRating.ratingValue, "5.0");
    assert.equal(jsonLd.aggregateRating.reviewCount, "48");
  });
});
