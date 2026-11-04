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
  const isMenuActive =
    pathname?.startsWith("/category") || pathname === "/combos";
  const isAccountActive =
    pathname === "/account" ||
    pathname?.startsWith("/account") ||
    pathname === "/login";

  return (
    <>
      <nav
        aria-label="Mobile Bottom Navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-md border-t border-stone-200/70 shadow-[0_-2px_12px_rgba(0,0,0,0.03)] pb-safe pb-[env(safe-area-inset-bottom,0px)]"
      >
        {/* 5 Evenly Spaced, Flush and Flat Navigation Items */}
        <div className="grid grid-cols-5 h-14 max-w-md mx-auto items-center px-1 pt-1.5 pb-1">
          {/* 1. Home -> "/" */}
          <Link
            href="/"
            prefetch={true}
            className={cn(
              "group flex flex-col items-center justify-center flex-1 h-full transition-colors relative",
              isHomeActive
                ? "text-brand-900 font-bold"
                : "text-stone-500 hover:text-stone-700"
            )}
            aria-label="Home"
          >
            <Home
              strokeWidth={1.8}
              className={cn(
                "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                isHomeActive
                  ? "text-brand-900"
                  : "text-stone-500 group-hover:text-stone-700"
              )}
            />
            <span
              className={cn(
                "text-[10px] tracking-tight font-medium mt-0.5 leading-none transition-colors",
                isHomeActive
                  ? "text-brand-900 font-bold"
                  : "text-stone-500 hover:text-stone-700"
              )}
            >
              Home
            </span>
          </Link>

          {/* 2. Products -> "/shop" */}
          <Link
            href="/shop"
            prefetch={true}
            className={cn(
              "group flex flex-col items-center justify-center flex-1 h-full transition-colors relative",
              isProductsActive
                ? "text-brand-900 font-bold"
                : "text-stone-500 hover:text-stone-700"
            )}
            aria-label="Products"
          >
            <Grid
              strokeWidth={1.8}
              className={cn(
                "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                isProductsActive
                  ? "text-brand-900"
                  : "text-stone-500 group-hover:text-stone-700"
              )}
            />
            <span
              className={cn(
                "text-[10px] tracking-tight font-medium mt-0.5 leading-none transition-colors",
                isProductsActive
                  ? "text-brand-900 font-bold"
                  : "text-stone-500 hover:text-stone-700"
              )}
            >
              Products
            </span>
          </Link>

          {/* 3. Cart -> Opens Cart Drawer */}
          <button
            type="button"
            onClick={openDrawer}
            className="group flex flex-col items-center justify-center flex-1 h-full relative text-stone-500 hover:text-stone-700 transition-colors active:scale-95 cursor-pointer"
            aria-label="Cart"
          >
            <div className="relative">
              <ShoppingBag
                strokeWidth={1.8}
                className="w-5 h-5 transition-transform duration-200 group-hover:scale-110 text-stone-500 group-hover:text-stone-700"
              />
              {displayCartCount > 0 && (
                <span className="absolute -top-1 -right-1.5 min-w-[15px] h-3.5 text-[9px] px-1 rounded-full bg-accent-amber text-white font-bold flex items-center justify-center shadow-2xs">
                  {displayCartCount > 99 ? "99+" : displayCartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight font-medium mt-0.5 leading-none text-stone-500 group-hover:text-stone-700">
              Cart
            </span>
          </button>

          {/* 4. Menu -> Opens Mobile Nav Drawer */}
          <button
            type="button"
            onClick={openMenu}
            className={cn(
              "group flex flex-col items-center justify-center flex-1 h-full transition-colors relative cursor-pointer active:scale-95",
              isMenuActive
                ? "text-brand-900 font-bold"
                : "text-stone-500 hover:text-stone-700"
            )}
            aria-label="Menu"
          >
            <Layers
              strokeWidth={1.8}
              className={cn(
                "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                isMenuActive
                  ? "text-brand-900"
                  : "text-stone-500 group-hover:text-stone-700"
              )}
            />
            <span
              className={cn(
                "text-[10px] tracking-tight font-medium mt-0.5 leading-none transition-colors",
                isMenuActive
                  ? "text-brand-900 font-bold"
                  : "text-stone-500 hover:text-stone-700"
              )}
            >
              Menu
            </span>
          </button>

          {/* 5. Account -> "/account" */}
          <Link
            href="/account"
            prefetch={true}
            className={cn(
              "group flex flex-col items-center justify-center flex-1 h-full transition-colors relative",
              isAccountActive
                ? "text-brand-900 font-bold"
                : "text-stone-500 hover:text-stone-700"
            )}
            aria-label="Account"
          >
            <User
              strokeWidth={1.8}
              className={cn(
                "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                isAccountActive
                  ? "text-brand-900"
                  : "text-stone-500 group-hover:text-stone-700"
              )}
            />
            <span
              className={cn(
                "text-[10px] tracking-tight font-medium mt-0.5 leading-none transition-colors",
                isAccountActive
                  ? "text-brand-900 font-bold"
                  : "text-stone-500 hover:text-stone-700"
              )}
            >
              Account
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
