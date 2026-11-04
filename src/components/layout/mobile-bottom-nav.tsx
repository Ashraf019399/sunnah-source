"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid, ShoppingBag, Layers, User } from "lucide-react";
import { useCartStore } from "@/store/use-cart-store";
import { useMobileMenuStore } from "@/store/use-mobile-menu-store";
import { MobileSearchModal } from "./mobile-search-modal";
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

  const openMenu = useMobileMenuStore((state) => state.openMenu);

  // Avoid hydration mismatch between SSR and localStorage-persisted stores
  useEffect(() => {
    setMounted(true);
  }, []);

  const displayCartCount = mounted ? cartItemCount : 0;

  // Do not render bottom nav on checkout or admin flows
  if (pathname?.startsWith("/checkout") || pathname?.startsWith("/admin")) {
    return null;
  }

  const isHomeActive = pathname === "/";
  const isProductsActive =
    pathname === "/shop" ||
    pathname?.startsWith("/shop") ||
    pathname?.startsWith("/product");
  const isCategoryActive =
    pathname?.startsWith("/category") || pathname === "/combos";
  const isAccountActive =
    pathname === "/account" ||
    pathname?.startsWith("/account") ||
    pathname === "/login";

  return (
    <>
      <nav
        aria-label="Mobile Bottom Navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-sm font-bengali pb-safe pb-[env(safe-area-inset-bottom,0px)]"
      >
        {/* 5 Evenly Spaced, Flush and Flat Navigation Items */}
        <div className="grid grid-cols-5 h-14 max-w-md mx-auto items-center px-1">
          {/* 1. হোম (Home) -> "/" */}
          <Link
            href="/"
            prefetch={true}
            className={cn(
              "group flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors relative",
              isHomeActive
                ? "text-brand-800 font-semibold"
                : "text-charcoal-700 hover:text-brand-700"
            )}
            aria-label="হোম"
          >
            <Home
              className={cn(
                "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                isHomeActive ? "text-brand-800 stroke-[2.2]" : "text-charcoal-700 group-hover:text-brand-700"
              )}
            />
            <span
              className={cn(
                "text-[10px] mt-1 leading-none transition-colors",
                isHomeActive ? "text-brand-800 font-semibold" : "text-charcoal-700 group-hover:text-brand-700"
              )}
            >
              হোম
            </span>
          </Link>

          {/* 2. পণ্যসমূহ (Products) -> "/shop" */}
          <Link
            href="/shop"
            prefetch={true}
            className={cn(
              "group flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors relative",
              isProductsActive
                ? "text-brand-800 font-semibold"
                : "text-charcoal-700 hover:text-brand-700"
            )}
            aria-label="পণ্যসমূহ"
          >
            <Grid
              className={cn(
                "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                isProductsActive ? "text-brand-800 stroke-[2.2]" : "text-charcoal-700 group-hover:text-brand-700"
              )}
            />
            <span
              className={cn(
                "text-[10px] mt-1 leading-none transition-colors",
                isProductsActive ? "text-brand-800 font-semibold" : "text-charcoal-700 group-hover:text-brand-700"
              )}
            >
              পণ্যসমূহ
            </span>
          </Link>

          {/* 3. কার্ট (Cart) -> Opens Cart Drawer with clean amber count badge */}
          <button
            type="button"
            onClick={openDrawer}
            className="group flex flex-col items-center justify-center flex-1 h-full py-1 relative text-charcoal-700 hover:text-brand-700 transition-colors active:scale-95 cursor-pointer"
            aria-label="কার্ট খুলুন"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 transition-transform duration-200 group-hover:scale-110 text-charcoal-700 group-hover:text-brand-700" />
              {displayCartCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-accent-amber text-white font-mono text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center shadow-xs">
                  {displayCartCount > 99 ? "99+" : displayCartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 leading-none font-medium text-charcoal-700 group-hover:text-brand-700">
              কার্ট
            </span>
          </button>

          {/* 4. ক্যাটাগরি (Category) -> Opens Mobile Nav Drawer */}
          <button
            type="button"
            onClick={openMenu}
            className={cn(
              "group flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors relative cursor-pointer active:scale-95",
              isCategoryActive
                ? "text-brand-800 font-semibold"
                : "text-charcoal-700 hover:text-brand-700"
            )}
            aria-label="ক্যাটাগরি"
          >
            <Layers
              className={cn(
                "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                isCategoryActive ? "text-brand-800 stroke-[2.2]" : "text-charcoal-700 group-hover:text-brand-700"
              )}
            />
            <span
              className={cn(
                "text-[10px] mt-1 leading-none transition-colors",
                isCategoryActive ? "text-brand-800 font-semibold" : "text-charcoal-700 group-hover:text-brand-700"
              )}
            >
              ক্যাটাগরি
            </span>
          </button>

          {/* 5. অ্যাকাউন্ট (Account) -> "/account" */}
          <Link
            href="/account"
            prefetch={true}
            className={cn(
              "group flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors relative",
              isAccountActive
                ? "text-brand-800 font-semibold"
                : "text-charcoal-700 hover:text-brand-700"
            )}
            aria-label="অ্যাকাউন্ট"
          >
            <User
              className={cn(
                "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                isAccountActive ? "text-brand-800 stroke-[2.2]" : "text-charcoal-700 group-hover:text-brand-700"
              )}
            />
            <span
              className={cn(
                "text-[10px] mt-1 leading-none transition-colors",
                isAccountActive ? "text-brand-800 font-semibold" : "text-charcoal-700 group-hover:text-brand-700"
              )}
            >
              অ্যাকাউন্ট
            </span>
          </Link>
        </div>
      </nav>

      {/* Instant Mobile Search Modal */}
      <MobileSearchModal />
    </>
  );
};

export default MobileBottomNav;
