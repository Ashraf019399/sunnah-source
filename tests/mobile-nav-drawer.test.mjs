import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Luxury Mobile Navigation Drawer (Hamburger Menu) Suite", async (t) => {
  const drawerFilePath = path.join(
    process.cwd(),
    "src",
    "components",
    "layout",
    "mobile-nav-drawer.tsx"
  );
  const headerFilePath = path.join(
    process.cwd(),
    "src",
    "components",
    "layout",
    "header.tsx"
  );

  await t.test("1. Mobile Navigation Drawer component exists and is marked as client component", () => {
    assert.ok(fs.existsSync(drawerFilePath), "mobile-nav-drawer.tsx must exist");
    const content = fs.readFileSync(drawerFilePath, "utf-8");
    assert.ok(content.startsWith('"use client"') || content.startsWith("'use client'"), "Must be a client component");
  });

  await t.test("2. Slide-over Left Drawer Architecture adheres to position, backdrop and animations", () => {
    const content = fs.readFileSync(drawerFilePath, "utf-8");

    // Position check
    assert.ok(
      content.includes("fixed left-0 top-0 bottom-0 w-[82%] max-w-[340px] z-50 bg-white shadow-2xl flex flex-col"),
      "Must have position fixed left-0 top-0 bottom-0 w-[82%] max-w-[340px] z-50 bg-white shadow-2xl flex flex-col"
    );

    // Backdrop check
    assert.ok(
      content.includes("fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity"),
      "Must have backdrop fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity"
    );

    // Smooth entrance/exit animations
    assert.ok(
      content.includes("translate-x-0") && content.includes("-translate-x-full"),
      "Must support slide transitions between translate-x-0 and -translate-x-full"
    );
    assert.ok(
      content.includes("transition-transform duration-300 ease-out"),
      "Must use smooth cubic transition timing for drawer entrance/exit"
    );
  });

  await t.test("3. Top Branded User Header implements emerald gradient, greeting, profile circle, user links and circular close button", () => {
    const content = fs.readFileSync(drawerFilePath, "utf-8");

    // Gradient banner
    assert.ok(
      content.includes("from-brand-900 via-brand-800 to-brand-700 p-5 text-white"),
      "Must use rich Sunnah Source emerald gradient banner 'from-brand-900 via-brand-800 to-brand-700 p-5 text-white'"
    );

    // Greeting
    assert.ok(
      content.includes("আসসালামু আলাইকুম!"),
      "Must include Islamic greeting 'আসসালামু আলাইকুম!'"
    );

    // User auth link
    assert.ok(
      content.includes("সাইন ইন / রেজিস্টার করুন"),
      "Must include 'সাইন ইন / রেজিস্টার করুন →' for guest users"
    );

    // Profile circle icon
    assert.ok(
      content.includes("rounded-full bg-white/15 border border-white/25"),
      "Must include profile circle icon container"
    );

    // Close button with circular hover effect
    assert.ok(
      content.includes("rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white/90 hover:text-white"),
      "Close button must feature circular hover effect"
    );
  });

  await t.test("4. Main Category Section contains all 6 required items with micro-interactions", () => {
    const content = fs.readFileSync(drawerFilePath, "utf-8");

    // Container style
    assert.ok(
      content.includes("bg-stone-50/70 border border-stone-200/60 rounded-2xl p-2 mx-4"),
      "Must use grouped clean rounded card container"
    );

    // 1. Raw Honey
    assert.ok(content.includes("🍯"), "Must have honey emoji");
    assert.ok(content.includes("প্রাকৃতিক মধু"), "Must have 'প্রাকৃতিক মধু'");
    assert.ok(content.includes("/category/honey"), "Must link to /category/honey");

    // 2. Ghee & Oils
    assert.ok(content.includes("🧈"), "Must have ghee emoji");
    assert.ok(content.includes("গাওয়া ঘি ও তেল"), "Must have 'গাওয়া ঘি ও তেল'");
    assert.ok(content.includes("/category/ghee-oil"), "Must link to /category/ghee-oil");

    // 3. Premium Dates
    assert.ok(content.includes("🌴"), "Must have dates emoji");
    assert.ok(content.includes("প্রিমিয়াম খেজুর"), "Must have 'প্রিমিয়াম খেজুর'");
    assert.ok(content.includes("/category/dates"), "Must link to /category/dates");

    // 4. Organic Seeds
    assert.ok(content.includes("🌱"), "Must have organic seeds emoji");
    assert.ok(content.includes("অর্গানিক বীজ"), "Must have 'অর্গানিক বীজ'");
    assert.ok(content.includes("/category/organic-seeds"), "Must link to /category/organic-seeds");

    // 5. Sunnah Combos
    assert.ok(content.includes("🎁"), "Must have combo emoji");
    assert.ok(content.includes("সুন্নাহ কম্বো"), "Must have 'সুন্নাহ কম্বো'");
    assert.ok(content.includes("/combos"), "Must link to /combos");

    // 6. Offer Zone
    assert.ok(content.includes("🔥"), "Must have offer zone fire emoji");
    assert.ok(content.includes("অফার জোন"), "Must have 'অফার জোন'");
    assert.ok(content.includes("/shop?filter=offer"), "Must link to /shop?filter=offer");

    // Micro-interactions: Chevron & soft emerald hover/active tint
    assert.ok(
      content.includes("ChevronRight") &&
      content.includes("text-stone-400 group-hover:text-brand-700"),
      "Must have subtle chevron with group-hover text-brand-700"
    );
    assert.ok(
      content.includes("active:bg-brand-100/60 hover:bg-brand-50 transition-all rounded-xl px-3 py-2.5"),
      "Must have soft emerald tap / hover feedback"
    );
  });

  await t.test("5. Quick Links Section contains dedicated card with all 4 required links", () => {
    const content = fs.readFileSync(drawerFilePath, "utf-8");

    // 1. Order Track
    assert.ok(content.includes("📦"), "Must have package emoji");
    assert.ok(content.includes("অর্ডার ট্র্যাক করুন"), "Must have 'অর্ডার ট্র্যাক করুন'");
    assert.ok(content.includes("/track-order"), "Must link to /track-order");

    // 2. Wishlist
    assert.ok(content.includes("❤️"), "Must have heart emoji");
    assert.ok(content.includes("পছন্দের তালিকা"), "Must have 'পছন্দের তালিকা'");
    assert.ok(content.includes("/wishlist"), "Must link to /wishlist");

    // 3. About Us
    assert.ok(content.includes("ℹ️"), "Must have info emoji");
    assert.ok(content.includes("আমাদের সম্পর্কে"), "Must have 'আমাদের সম্পর্কে'");
    assert.ok(content.includes("/about"), "Must link to /about");

    // 4. Hotline
    assert.ok(content.includes("📞"), "Must have phone emoji");
    assert.ok(content.includes("হটলাইন যোগাযোগ"), "Must have 'হটলাইন যোগাযোগ'");
    assert.ok(content.includes("01914-612007") || content.includes("01914612007"), "Must have hotline number 01914-612007");
    assert.ok(content.includes("tel:01914612007") || content.includes("tel:+8801914612007"), "Must link to telephone protocol");
  });

  await t.test("6. Header seamlessly imports and mounts MobileNavDrawer", () => {
    const headerContent = fs.readFileSync(headerFilePath, "utf-8");
    assert.ok(
      headerContent.includes('import { MobileNavDrawer } from "./mobile-nav-drawer";') ||
      headerContent.includes("from './mobile-nav-drawer'") ||
      headerContent.includes('from "@/components/layout/mobile-nav-drawer"'),
      "Header must import MobileNavDrawer"
    );
    assert.ok(
      headerContent.includes("<MobileNavDrawer"),
      "Header must render <MobileNavDrawer"
    );
  });
});
