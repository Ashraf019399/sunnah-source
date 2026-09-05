"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid, ShoppingBag, Heart, Layers } from "lucide-react";
import { useCartStore } from "@/store/use-cart-store";
import { useWishlistStore } from "@/store/use-wishlist-store";
import { cn } from "@/lib/utils";

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  const openDrawer = useCartStore((state) => state.openDrawer);
  const cartItemCount = useCartStore((state) =>
    typeof state.getItemCount === "function"
      ? state.getItemCount()
      : state.items?.reduce((total, item) => total + item.quantity, 0) ?? 0
  );
  const wishlistCount = useWishlistStore((state) => state.items?.length ?? 0);

  // Avoid hydration mismatch between SSR and localStorage-persisted stores
  useEffect(() => {
    setMounted(true);
  }, []);

  const displayCartCount = mounted ? cartItemCount : 0;
  const displayWishlistCount = mounted ? wishlistCount : 0;

  // Do not render bottom nav on checkout flow
  if (pathname?.startsWith("/checkout")) {
    return null;
  }

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-surface-border shadow-drawer font-bengali pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="flex items-center justify-around h-14 px-1 max-w-md mx-auto">
        {/* 1. Home */}
        <Link
          href="/"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors",
            pathname === "/" ? "text-brand-800 font-bold" : "text-charcoal-700 hover:text-brand-700"
          )}
          aria-label="হোম"
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-1 leading-none">হোম</span>
        </Link>

        {/* 2. Products Anchor */}
        <Link
          href="/#products"
          className="flex flex-col items-center justify-center flex-1 h-full py-1 text-charcoal-700 hover:text-brand-700 transition-colors"
          aria-label="পণ্যসমূহ"
        >
          <Grid className="w-5 h-5" />
          <span className="text-[10px] mt-1 leading-none">পণ্যসমূহ</span>
        </Link>

        {/* 3. Cart Drawer Trigger */}
        <button
          type="button"
          onClick={openDrawer}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 relative text-brand-700 hover:text-brand-800 transition-colors"
          aria-label="কার্ট খুলুন"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {displayCartCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-brand-700 text-white font-mono text-[10px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center shadow-xs">
                {displayCartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 leading-none font-bold">কার্ট</span>
        </button>

        {/* 4. Categories Anchor */}
        <Link
          href="/#categories"
          className="flex flex-col items-center justify-center flex-1 h-full py-1 text-charcoal-700 hover:text-brand-700 transition-colors"
          aria-label="ক্যাটাগরি"
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] mt-1 leading-none">ক্যাটাগরি</span>
        </Link>

        {/* 5. Wishlist Indicator */}
        <Link
          href="/#products"
          className="flex flex-col items-center justify-center flex-1 h-full py-1 relative text-charcoal-700 hover:text-brand-700 transition-colors"
          aria-label="পছন্দের তালিকা"
        >
          <div className="relative">
            <Heart className="w-5 h-5" />
            {displayWishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-accent-amber text-white font-mono text-[10px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center shadow-xs">
                {displayWishlistCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 leading-none">পছন্দ</span>
        </Link>
      </div>
    </nav>
  );
};
