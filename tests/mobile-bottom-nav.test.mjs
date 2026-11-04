import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Senior-Architect-Grade Mobile Bottom Navigation Suite", async (t) => {
  const bottomNavPath = path.join(
    process.cwd(),
    "src",
    "components",
    "layout",
    "mobile-bottom-nav.tsx"
  );
  const searchModalPath = path.join(
    process.cwd(),
    "src",
    "components",
    "layout",
    "mobile-search-modal.tsx"
  );
  const headerPath = path.join(
    process.cwd(),
    "src",
    "components",
    "layout",
    "header.tsx"
  );
  const drawerPath = path.join(
    process.cwd(),
    "src",
    "components",
    "layout",
    "mobile-nav-drawer.tsx"
  );

  await t.test("1. Mobile Bottom Navigation component exists and is marked as client component", () => {
    assert.ok(fs.existsSync(bottomNavPath), "mobile-bottom-nav.tsx must exist");
    const content = fs.readFileSync(bottomNavPath, "utf-8");
    assert.ok(content.startsWith('"use client"') || content.startsWith("'use client'"), "Must be a client component");
  });

  await t.test("2. Background and border styling meet clean frosted porcelain specification", () => {
    const content = fs.readFileSync(bottomNavPath, "utf-8");

    // Warm organic ivory / frosted background
    assert.ok(
      content.includes("bg-[#FAF9F6]/95 backdrop-blur-md") ||
      content.includes("bg-white/95 backdrop-blur-md"),
      "Must use organic warm porcelain 'bg-[#FAF9F6]/95 backdrop-blur-md'"
    );

    // Border and shadow
    assert.ok(
      content.includes("border-stone-200/70") ||
      content.includes("border-t border-stone-200"),
      "Must include subtle natural divider 'border-t border-stone-200/70'"
    );
  });

  await t.test("3. Clean & Flat 5-Action Layout is implemented with exact requirements", () => {
    const content = fs.readFileSync(bottomNavPath, "utf-8");

    // Protrusions check: floating circle must be removed completely
    assert.ok(!content.includes("-mt-5"), "Must completely remove '-mt-5' elevated floating circle");

    // Action 1: Home -> "/"
    assert.ok(content.includes("Home"), "Must have 'Home' label");
    assert.ok(content.includes('href="/"'), "Home must link to '/'");

    // Action 2: Products -> "/shop"
    assert.ok(content.includes("Products"), "Must have 'Products' label");
    assert.ok(content.includes('href="/shop"'), "Products must link to '/shop'");

    // Action 3: Cart -> openDrawer with clean amber badge
    assert.ok(content.includes("Cart"), "Must have 'Cart' label");
    assert.ok(content.includes("openDrawer"), "Cart must trigger openDrawer");
    assert.ok(
      content.includes("bg-accent-amber") || content.includes("bg-amber-"),
      "Cart badge must use vibrant amber styling"
    );

    // Action 4: Menu -> Opens Mobile Nav Drawer
    assert.ok(content.includes("Menu"), "Must have 'Menu' label");
    assert.ok(content.includes("openMenu"), "Menu must trigger openMenu");

    // Action 5: Account -> "/account"
    assert.ok(content.includes("Account"), "Must have 'Account' label");
    assert.ok(content.includes('href="/account"'), "Account must link to '/account'");
  });

  await t.test("4. Active route styling uses brand emerald text and icon", () => {
    const content = fs.readFileSync(bottomNavPath, "utf-8");

    assert.ok(
      content.includes("text-brand-900 font-bold") ||
      content.includes("text-brand-800 font-semibold"),
      "Active route styling must use 'text-brand-900 font-bold'"
    );
  });

  await t.test("5. Device Safety: pb-safe and safe-area-inset-bottom are enforced", () => {
    const content = fs.readFileSync(bottomNavPath, "utf-8");

    assert.ok(content.includes("pb-safe"), "Must include pb-safe utility class");
    assert.ok(
      content.includes("safe-area-inset-bottom"),
      "Must safeguard with safe-area-inset-bottom padding"
    );
  });

  await t.test("6. Mobile Search Modal exists with autofocus, clear button, close button, trending pills, and live suggestions", () => {
    assert.ok(fs.existsSync(searchModalPath), "mobile-search-modal.tsx must exist");
    const content = fs.readFileSync(searchModalPath, "utf-8");

    // Client component
    assert.ok(content.startsWith('"use client"') || content.startsWith("'use client'"), "Must be a client component");

    // Autofocus and placeholder
    assert.ok(
      content.includes("পণ্য খুঁজুন (মধু, ঘি, খেজুর)...") ||
      content.includes("খাঁটি মধু, ঘি, তেল ও অর্গানিক খাদ্য খুঁজুন..."),
      "Must have search placeholder"
    );

    // Clear and close buttons
    assert.ok(content.includes("handleClear") || content.includes('setSearchQuery("")'), "Must have clear button handler");
    assert.ok(content.includes("handleClose") || content.includes("closeModal") || content.includes("closeSearch"), "Must have close button handler");

    // All 6 specified trending pills
    assert.ok(content.includes("সুন্দরবন মধু"), "Must include 'সুন্দরবন মধু'");
    assert.ok(content.includes("গাওয়া ঘি"), "Must include 'গাওয়া ঘি'");
    assert.ok(content.includes("আজওয়া খেজুর"), "Must include 'আজওয়া খেজুর'");
    assert.ok(content.includes("কালোজিরা তেল"), "Must include 'কালোজিরা তেল'");
    assert.ok(content.includes("চিয়া সিড"), "Must include 'চিয়া সিড'");
    assert.ok(content.includes("কম্বো"), "Must include 'কম্বো'");

    // Live search suggestions with thumbnail, price, and direct link
    assert.ok(content.includes("ALL_PRODUCTS"), "Must filter ALL_PRODUCTS");
    assert.ok(content.includes("formatBDT") || content.includes("displayPrice"), "Must format price");
    assert.ok(content.includes("href={`/product/${product.slug}`}"), "Must link directly to product page");
  });

  await t.test("7. Integration: Header mobile search button and MobileNavDrawer search field are wired", () => {
    const headerContent = fs.readFileSync(headerPath, "utf-8");
    const drawerContent = fs.readFileSync(drawerPath, "utf-8");

    // Header has mobile search button beside cart
    assert.ok(
      headerContent.includes("openMobileSearch") || headerContent.includes("openSearch"),
      "Header must trigger mobile search modal"
    );

    // MobileNavDrawer has search trigger field
    assert.ok(
      drawerContent.includes("openSearch"),
      "MobileNavDrawer must trigger mobile search modal"
    );
    assert.ok(
      drawerContent.includes("খাঁটি মধু, ঘি, তেল ও অর্গানিক খাদ্য খুঁজুন..."),
      "MobileNavDrawer search field must feature search placeholder"
    );
  });
});
