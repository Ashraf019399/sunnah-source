"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Menu, Search, ShoppingBag, User } from "lucide-react";
import { useCartStore } from "@/store/use-cart-store";
import { useMobileMenuStore } from "@/store/use-mobile-menu-store";
import { useMobileSearchStore } from "@/store/use-mobile-search-store";
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
  const openSearch = useMobileSearchStore((state) => state.openSearch);

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
  const isAccountActive = pathname === "/account" || pathname?.startsWith("/account");

  return (
    <>
      <nav
        aria-label="Mobile Bottom Navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.06)] font-bengali pb-safe pb-[env(safe-area-inset-bottom,0px)]"
      >
        {/* Top Accent Border: Elegant 2px Sunnah Source emerald gradient hairline with subtle ambient shadow */}
        <div
          className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-brand-800 via-emerald-600 to-brand-800"
          aria-hidden="true"
        />

        {/* 5-Action Ergonomic Thumb-Zone Layout */}
        <div className="grid grid-cols-5 h-14 max-w-md mx-auto items-center px-1">
          {/* 1. হোম (Home) */}
          <Link
            href="/"
            className={cn(
              "group flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors relative",
              isHomeActive
                ? "text-brand-800 font-bold"
                : "text-charcoal-700 hover:text-brand-700"
            )}
            aria-label="হোম"
          >
            <Home
              className={cn(
                "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                isHomeActive ? "text-brand-800 stroke-[2.4]" : "text-charcoal-700"
              )}
            />
            <span
              className={cn(
                "text-[10px] mt-0.5 leading-none transition-colors",
                isHomeActive ? "text-brand-800 font-bold" : "text-charcoal-700"
              )}
            >
              হোম
            </span>
            {/* Active Tab Indicator: Soft 4px gold dot */}
            {isHomeActive && (
              <span
                className="w-1 h-1 rounded-full bg-accent-amber mt-0.5 animate-in fade-in zoom-in duration-200"
                aria-hidden="true"
              />
            )}
          </Link>

          {/* 2. মেনু (Menu) -> Opens Mobile Nav Drawer */}
          <button
            type="button"
            onClick={openMenu}
            className="group flex flex-col items-center justify-center flex-1 h-full py-1 text-charcoal-700 hover:text-brand-700 transition-colors active:scale-95 cursor-pointer"
            aria-label="মেনু খুলুন"
          >
            <Menu className="w-5 h-5 transition-transform duration-200 group-hover:scale-110 text-charcoal-700 group-hover:text-brand-700" />
            <span className="text-[10px] mt-0.5 leading-none text-charcoal-700 group-hover:text-brand-700">
              মেনু
            </span>
          </button>

          {/* 3. [CENTER ELEVATED SEARCH BUTTON] */}
          <div className="flex flex-col items-center justify-center flex-1 h-full relative">
            <button
              type="button"
              onClick={() => openSearch()}
              aria-label="পণ্য খুঁজুন"
              className="-mt-5 w-12 h-12 rounded-full bg-gradient-to-br from-brand-800 to-brand-600 text-white flex items-center justify-center ring-4 ring-white shadow-lg shadow-amber-900/20 active:scale-95 transition-transform cursor-pointer"
            >
              <Search className="w-5 h-5 text-white" />
            </button>
            <span className="text-[10px] mt-0.5 leading-none text-charcoal-700 font-medium">
              সার্চ
            </span>
          </div>

          {/* 4. কার্ট (Cart) -> Opens Cart Drawer with vibrant amber badge */}
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
            <span className="text-[10px] mt-0.5 leading-none font-bold text-charcoal-700 group-hover:text-brand-700">
              কার্ট
            </span>
          </button>

          {/* 5. অ্যাকাউন্ট (Account) -> Links to /account */}
          <Link
            href="/account"
            className={cn(
              "group flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors relative",
              isAccountActive
                ? "text-brand-800 font-bold"
                : "text-charcoal-700 hover:text-brand-700"
            )}
            aria-label="অ্যাকাউন্ট"
          >
            <User
              className={cn(
                "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                isAccountActive ? "text-brand-800 stroke-[2.4]" : "text-charcoal-700"
              )}
            />
            <span
              className={cn(
                "text-[10px] mt-0.5 leading-none transition-colors",
                isAccountActive ? "text-brand-800 font-bold" : "text-charcoal-700"
              )}
            >
              অ্যাকাউন্ট
            </span>
            {/* Active Tab Indicator: Soft 4px gold dot */}
            {isAccountActive && (
              <span
                className="w-1 h-1 rounded-full bg-accent-amber mt-0.5 animate-in fade-in zoom-in duration-200"
                aria-hidden="true"
              />
            )}
          </Link>
        </div>
      </nav>

      {/* Instant Mobile Search Modal */}
      <MobileSearchModal />
    </>
  );
};

export default MobileBottomNav;
