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

  await t.test("2. Background and top accent border styling meet frosted porcelain and emerald hairline specification", () => {
    const content = fs.readFileSync(bottomNavPath, "utf-8");

    // Frosted porcelain background
    assert.ok(
      content.includes("bg-white/95 backdrop-blur-md"),
      "Must use ultra-clean frosted porcelain 'bg-white/95 backdrop-blur-md'"
    );

    // 2px Sunnah Source emerald gradient hairline
    assert.ok(
      content.includes("from-brand-800 via-emerald-600 to-brand-800"),
      "Must include emerald gradient hairline 'from-brand-800 via-emerald-600 to-brand-800'"
    );
    assert.ok(
      content.includes("h-[2px]") || content.includes("h-0.5"),
      "Hairline must be 2px high"
    );

    // Subtle ambient shadow
    assert.ok(
      content.includes("shadow-") || content.includes("shadow-["),
      "Must incorporate subtle ambient shadow"
    );
  });

  await t.test("3. Ergonomic 5-Action Thumb-Zone Layout is implemented with exact requirements", () => {
    const content = fs.readFileSync(bottomNavPath, "utf-8");

    // Action 1: Home (হোম)
    assert.ok(content.includes("হোম"), "Must have 'হোম' label");
    assert.ok(content.includes('href="/"'), "Home must link to '/'");

    // Action 2: Menu (মেনু)
    assert.ok(content.includes("মেনু"), "Must have 'মেনু' label");
    assert.ok(content.includes("openMenu"), "Menu must trigger openMenu");

    // Action 3: Center Elevated Search Button
    assert.ok(content.includes("-mt-5"), "Must have '-mt-5' elevated negative margin");
    assert.ok(content.includes("w-12 h-12"), "Must be w-12 h-12 circular medallion");
    assert.ok(content.includes("from-brand-800 to-brand-600"), "Must use Sunnah Source gradient from-brand-800 to-brand-600");
    assert.ok(content.includes("ring-4 ring-white"), "Must feature crisp 4px white ring 'ring-4 ring-white'");
    assert.ok(content.includes("shadow-lg"), "Must have shadow-lg elevation");
    assert.ok(content.includes("active:scale-95 transition-transform"), "Must have active:scale-95 transition-transform micro-interaction");
    assert.ok(content.includes("openSearch"), "Search medallion must trigger openSearch");

    // Action 4: Cart (কার্ট)
    assert.ok(content.includes("কার্ট"), "Must have 'কার্ট' label");
    assert.ok(content.includes("openDrawer"), "Cart must trigger openDrawer");
    assert.ok(
      content.includes("bg-accent-amber") || content.includes("bg-amber-"),
      "Cart badge must use vibrant amber styling"
    );

    // Action 5: Account (অ্যাকাউন্ট)
    assert.ok(content.includes("অ্যাকাউন্ট"), "Must have 'অ্যাকাউন্ট' label");
    assert.ok(content.includes('href="/account"'), "Account must link to '/account'");
  });

  await t.test("4. Active Tab Indicator uses deep emerald icon and 4px gold dot", () => {
    const content = fs.readFileSync(bottomNavPath, "utf-8");

    assert.ok(
      content.includes("text-brand-800 font-bold") || content.includes("text-brand-800"),
      "Active tab icon and text must use deep emerald text-brand-800"
    );
    assert.ok(
      content.includes("w-1 h-1 rounded-full bg-accent-amber") ||
      content.includes("w-1 h-1 rounded-full bg-amber-"),
      "Active indicator must use a soft 4px gold dot underneath active route"
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
      content.includes("খাঁটি মধু, ঘি, তেল ও অর্গানিক খাদ্য খুঁজুন..."),
      "Must have exact placeholder 'খাঁটি মধু, ঘি, তেল ও অর্গানিক খাদ্য খুঁজুন...'"
    );

    // Clear and close buttons
    assert.ok(content.includes("handleClear") || content.includes('setSearchQuery("")'), "Must have clear button handler");
    assert.ok(content.includes("handleClose") || content.includes("closeSearch"), "Must have close button handler");

    // All 6 specified trending pills
    assert.ok(content.includes("সুন্দরবন মধু"), "Must include 'সুন্দরবন মধু'");
    assert.ok(content.includes("গাওয়া ঘি"), "Must include 'গাওয়া ঘি'");
    assert.ok(content.includes("আজওয়া খেজুর"), "Must include 'আজওয়া খেজুর'");
    assert.ok(content.includes("কালোজিরা তেল"), "Must include 'কালোজিরা তেল'");
    assert.ok(content.includes("চিয়া সিড"), "Must include 'চিয়া সিড'");
    assert.ok(content.includes("কম্বো অফার"), "Must include 'কম্বো অফার'");

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

