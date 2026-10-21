import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Wishlist State & Business Logic", () => {
  it("Correctly handles toggleWishlist adding and removing products", () => {
    let items = [];

    const toggleWishlist = (product) => {
      const exists = items.some((p) => p.id === product.id);
      if (exists) {
        items = items.filter((p) => p.id !== product.id);
      } else {
        items = [...items, product];
      }
    };

    const isInWishlist = (id) => items.some((p) => p.id === id);

    const mockProduct1 = {
      id: "prod-1",
      slug: "sundarban-raw-wild-honey",
      titleBn: "সুন্দরবনের প্রাকৃতিক চাকের কাঁচা মধু",
    };

    const mockProduct2 = {
      id: "prod-2",
      slug: "traditional-bilona-cow-ghee",
      titleBn: "প্রথাগত বিলোনা গাওয়া ঘি",
    };

    // Initially empty
    assert.equal(isInWishlist("prod-1"), false);
    assert.equal(items.length, 0);

    // Toggle 1st product: should add
    toggleWishlist(mockProduct1);
    assert.equal(isInWishlist("prod-1"), true);
    assert.equal(items.length, 1);

    // Toggle 2nd product: should add
    toggleWishlist(mockProduct2);
    assert.equal(isInWishlist("prod-2"), true);
    assert.equal(items.length, 2);

    // Toggle 1st product again: should remove
    toggleWishlist(mockProduct1);
    assert.equal(isInWishlist("prod-1"), false);
    assert.equal(isInWishlist("prod-2"), true);
    assert.equal(items.length, 1);
  });

  it("Correctly removes products and clears wishlist", () => {
    let items = [
      { id: "p1", titleBn: "মধু" },
      { id: "p2", titleBn: "ঘি" },
      { id: "p3", titleBn: "তেল" },
    ];

    const removeFromWishlist = (id) => {
      items = items.filter((p) => p.id !== id);
    };

    const clearWishlist = () => {
      items = [];
    };

    removeFromWishlist("p2");
    assert.equal(items.length, 2);
    assert.ok(!items.some((p) => p.id === "p2"));

    clearWishlist();
    assert.equal(items.length, 0);
  });

  it("Builds valid CartItem payload from wishlisted product default variant", () => {
    const product = {
      id: "prod-1",
      titleEn: "Sundarban Raw Wild Honey",
      titleBn: "সুন্দরবনের কাঁচা মধু",
      images: ["/images/honey.png"],
      variants: [
        {
          id: "var-1",
          displayName: "৫০০ গ্রাম জার",
          weightValue: 500,
          weightUnit: "g",
          regularPrice: 1050,
          salePrice: 950,
          stockQuantity: 25,
          isDefault: true,
        },
      ],
    };

    const variant = product.variants.find((v) => v.isDefault) || product.variants[0];
    const hasDiscount = variant.salePrice !== undefined && variant.salePrice < variant.regularPrice;
    const price = hasDiscount ? variant.salePrice : variant.regularPrice;

    const cartItem = {
      id: `${product.id}-${variant.id}`,
      productId: product.id,
      variantId: variant.id,
      title: product.titleEn,
      titleBn: product.titleBn,
      variantName: variant.displayName,
      unitPrice: price,
      originalPrice: hasDiscount ? variant.regularPrice : undefined,
      image: product.images[0],
      weightLabel: `${variant.weightValue} ${variant.weightUnit}`,
      quantity: 1,
      maxStock: variant.stockQuantity,
    };

    assert.equal(cartItem.id, "prod-1-var-1");
    assert.equal(cartItem.unitPrice, 950);
    assert.equal(cartItem.originalPrice, 1050);
    assert.equal(cartItem.maxStock, 25);
  });
});
